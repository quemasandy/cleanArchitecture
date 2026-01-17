/**
 * Archivo: DynamoDbSessionRepository.ts
 * UBICACIÓN: Capa de Infraestructura / Repositories
 *
 * ¿QUÉ ES UN ADAPTADOR (ADAPTER)?
 * - Es la implementación CONCRETA de un puerto (interface) del dominio.
 * - Conecta el dominio con una tecnología específica (en este caso, DynamoDB).
 * - El dominio NO conoce esta clase, solo conoce ISessionRepository.
 *
 * - Para quién trabaja: UserService (a través de la interface ISessionRepository).
 * - Intención: Persistir sesiones en AWS DynamoDB.
 * - Misión: Implementar save, findByToken y delete usando el SDK de AWS.
 *
 * PATRÓN HEXAGONAL (Ports & Adapters):
 * - Puerto (Port): ISessionRepository (en Dominio)
 * - Adaptador (Adapter): DynamoDbSessionRepository (en Infraestructura)
 *
 * SINGLE-TABLE DESIGN (Patrón Óptimo PK/SK):
 * - pk: "USER#{userId}" - Agrupa sesiones con su usuario
 * - sk: "SESSION#{token}" - Diferencia sesiones del perfil
 * 
 * Beneficios:
 * - Una sola query puede obtener usuario + todas sus sesiones
 * - Permite invalidar todas las sesiones de un usuario eficientemente
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ISessionRepository, Session } from '../../domain/interfaces/ISessionRepository';
import { DynamoSessionMapper } from '../mappers/DynamoSessionMapper';
import { DynamoSessionItem } from '../dtos/DynamoSessionItem';

export class DynamoDbSessionRepository implements ISessionRepository {
  /**
   * Cliente de DynamoDB con marshalling automático.
   * DocumentClient convierte automáticamente entre tipos JS y DynamoDB.
   */
  private readonly docClient: DynamoDBDocumentClient;
  
  /**
   * Nombre de la tabla de DynamoDB.
   * En Single-Table Design, es la misma tabla de usuarios.
   */
  private readonly tableName: string;

  /**
   * Constructor que configura la conexión a DynamoDB.
   * 
   * INYECCIÓN DE DEPENDENCIAS:
   * - Recibe el nombre de la tabla como parámetro.
   * - Permite cambiar entre tablas de diferentes ambientes (dev, stg, prd).
   * 
   * @param tableName - Nombre de la tabla DynamoDB (ej: "users-dev")
   */
  constructor(tableName: string) {
    // Si DYNAMODB_ENDPOINT está definido, usamos DynamoDB Local para desarrollo
    const endpoint = process.env.DYNAMODB_ENDPOINT;
    
    const clientConfig = endpoint 
      ? { 
          endpoint, 
          region: 'us-east-1',
          // DynamoDB Local requiere credenciales (aunque sean dummy)
          credentials: {
            accessKeyId: 'local',
            secretAccessKey: 'local'
          }
        }
      : {};  // AWS: configuración automática (usa IAM Role de Lambda)
    
    const client = new DynamoDBClient(clientConfig);
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true }
    });
    this.tableName = tableName;
  }

  /**
   * Guarda una nueva sesión en DynamoDB.
   * 
   * FLUJO:
   * 1. Convertir Session (Dominio) → DynamoSessionItem (Persistencia)
   * 2. Ejecutar PutCommand para guardar el item
   * 3. Retornar la sesión original como confirmación
   * 
   * SINGLE-TABLE DESIGN:
   * - pk: "USER#{userId}" (mismo pk que el usuario)
   * - sk: "SESSION#{token}"
   * 
   * @param session - La sesión a persistir
   * @returns La sesión guardada
   */
  async save(session: Session): Promise<Session> {
    console.log(`[DynamoDbSessionRepository] Guardando sesión para usuario: ${session.userId}`);
    
    // 1. Transformamos de Dominio a Persistencia usando el Mapper
    const item = DynamoSessionMapper.toPersistence(session);

    // 2. Ejecutamos el comando de escritura en DynamoDB
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    console.log(`[DynamoDbSessionRepository] Sesión guardada con token: ${session.token.substring(0, 8)}...`);
    
    // 3. Retornamos la sesión original (la aplicación es la fuente de verdad)
    return session;
  }

  /**
   * Busca una sesión por su token usando el GSI TokenIndex.
   * 
   * FLUJO:
   * 1. Ejecutar Query en el GSI TokenIndex
   * 2. Si hay resultado, convertir DynamoSessionItem → Session
   * 3. Si no hay resultado, retornar null
   * 
   * ¿POR QUÉ USAMOS GSI?
   * En el patrón PK/SK, las sesiones tienen:
   * - pk: "USER#{userId}" (necesitaríamos el userId para buscar directamente)
   * - sk: "SESSION#{token}"
   * 
   * Pero en logout solo tenemos el token, no el userId.
   * El GSI TokenIndex permite buscar por token sin conocer el userId.
   * 
   * @param token - El token de sesión a buscar
   * @returns La sesión si existe, null si no se encuentra
   */
  async findByToken(token: string): Promise<Session | null> {
    console.log(`[DynamoDbSessionRepository] Buscando sesión por token: ${token.substring(0, 8)}...`);
    
    // 1. Ejecutamos Query en el GSI TokenIndex
    // El GSI tiene 'token' como partition key
    // NOTA: 'token' es palabra reservada en DynamoDB, usamos #token como alias
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TokenIndex',
      KeyConditionExpression: '#tokenAttr = :tokenVal',
      ExpressionAttributeNames: {
        '#tokenAttr': 'token'  // Alias para evitar conflicto con palabra reservada
      },
      ExpressionAttributeValues: {
        ':tokenVal': token
      },
      Limit: 1
    }));

    // 2. Si no hay items, la sesión no existe (o ya fue eliminada por logout)
    if (!result.Items || result.Items.length === 0) {
      console.log(`[DynamoDbSessionRepository] Sesión no encontrada`);
      return null;
    }

    console.log(`[DynamoDbSessionRepository] Sesión encontrada para usuario: ${result.Items[0].userId}`);
    
    // 3. Convertimos de Persistencia a Dominio
    return DynamoSessionMapper.toDomain(result.Items[0] as DynamoSessionItem);
  }

  /**
   * Elimina (invalida) una sesión - LOGOUT.
   * 
   * FLUJO:
   * 1. Buscar la sesión por token (usando GSI) para obtener pk y sk
   * 2. Usar pk + sk para eliminar el item
   * 
   * ¿POR QUÉ DOS PASOS?
   * En Single-Table Design con PK/SK, necesitamos ambas claves para eliminar.
   * Como en logout solo tenemos el token, primero buscamos para obtener las claves.
   * 
   * ALTERNATIVA:
   * Podríamos almacenar el userId en el cliente, pero eso es menos seguro.
   * 
   * IMPORTANTE:
   * - DeleteCommand es idempotente: si la sesión ya no existe, no lanza error.
   * 
   * @param token - El token de la sesión a invalidar
   */
  async delete(token: string): Promise<void> {
    console.log(`[DynamoDbSessionRepository] Eliminando sesión (logout): ${token.substring(0, 8)}...`);
    
    // 1. Primero buscamos la sesión para obtener pk y sk
    // Usamos el GSI TokenIndex porque solo tenemos el token
    // NOTA: 'token' es palabra reservada en DynamoDB, usamos #tokenAttr como alias
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'TokenIndex',
      KeyConditionExpression: '#tokenAttr = :tokenVal',
      ExpressionAttributeNames: {
        '#tokenAttr': 'token'  // Alias para evitar conflicto con palabra reservada
      },
      ExpressionAttributeValues: {
        ':tokenVal': token
      },
      Limit: 1
    }));

    // 2. Si no existe, no hay nada que eliminar (idempotente)
    if (!result.Items || result.Items.length === 0) {
      console.log(`[DynamoDbSessionRepository] Sesión no encontrada, nada que eliminar`);
      return;
    }

    // 3. Extraemos pk y sk del resultado
    const { pk, sk } = result.Items[0] as DynamoSessionItem;

    // 4. Ejecutamos la eliminación con las claves completas
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { pk, sk }
    }));

    console.log(`[DynamoDbSessionRepository] Sesión eliminada exitosamente`);
  }
}
