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
 * SINGLE-TABLE DESIGN:
 * Usamos la misma tabla de usuarios, diferenciando sesiones con pk="SESSION#<token>"
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
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
   * Busca una sesión por su token.
   * 
   * FLUJO:
   * 1. Construir la pk usando el prefijo SESSION#
   * 2. Ejecutar GetCommand para obtener el item
   * 3. Si existe, convertir DynamoSessionItem → Session
   * 4. Si no existe, retornar null
   * 
   * @param token - El token de sesión a buscar
   * @returns La sesión si existe, null si no se encuentra
   */
  async findByToken(token: string): Promise<Session | null> {
    console.log(`[DynamoDbSessionRepository] Buscando sesión por token: ${token.substring(0, 8)}...`);
    
    // 1. Construimos la pk con el prefijo SESSION#
    const pk = DynamoSessionMapper.buildPk(token);

    // 2. Ejecutamos la consulta
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { pk }
    }));

    // 3. Si no hay item, la sesión no existe (o ya fue eliminada por logout)
    if (!result.Item) {
      console.log(`[DynamoDbSessionRepository] Sesión no encontrada`);
      return null;
    }

    console.log(`[DynamoDbSessionRepository] Sesión encontrada para usuario: ${result.Item.userId}`);
    
    // 4. Convertimos de Persistencia a Dominio
    return DynamoSessionMapper.toDomain(result.Item as DynamoSessionItem);
  }

  /**
   * Elimina (invalida) una sesión - LOGOUT.
   * 
   * FLUJO:
   * 1. Construir la pk usando el prefijo SESSION#
   * 2. Ejecutar DeleteCommand para eliminar el item
   * 3. No retorna nada (void) - la sesión ya no existe
   * 
   * IMPORTANTE:
   * - DeleteCommand es idempotente: si la sesión ya no existe, no lanza error.
   * - Esto es útil porque no necesitamos verificar si la sesión existía antes.
   * 
   * @param token - El token de la sesión a invalidar
   */
  async delete(token: string): Promise<void> {
    console.log(`[DynamoDbSessionRepository] Eliminando sesión (logout): ${token.substring(0, 8)}...`);
    
    // 1. Construimos la pk con el prefijo SESSION#
    const pk = DynamoSessionMapper.buildPk(token);

    // 2. Ejecutamos la eliminación
    await this.docClient.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { pk }
    }));

    console.log(`[DynamoDbSessionRepository] Sesión eliminada exitosamente`);
  }
}
