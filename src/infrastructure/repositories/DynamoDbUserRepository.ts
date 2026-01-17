/**
 * Archivo: DynamoDbUserRepository.ts
 * UBICACIÓN: Capa de Infraestructura / Repositories
 *
 * ¿QUÉ ES UN ADAPTADOR (ADAPTER)?
 * - Es la implementación CONCRETA de un puerto (interface) del dominio.
 * - Conecta el dominio con una tecnología específica (en este caso, DynamoDB).
 * - El dominio NO conoce esta clase, solo conoce IUserRepository.
 *
 * - Para quién trabaja: UserService (a través de la interface IUserRepository).
 * - Intención: Persistir usuarios en AWS DynamoDB.
 * - Misión: Implementar save, update, findByEmail y findById usando el SDK de AWS.
 *
 * PATRÓN HEXAGONAL (Ports & Adapters):
 * - Puerto (Port): IUserRepository (en Dominio)
 * - Adaptador (Adapter): DynamoDbUserRepository (en Infraestructura)
 *
 * SINGLE-TABLE DESIGN (Patrón Óptimo PK/SK):
 * - pk: "USER#{userId}" - Agrupa usuario con sus sesiones
 * - sk: "PROFILE" - Identifica el item como perfil de usuario
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { DynamoUserMapper } from '../mappers/DynamoUserMapper';
import { DynamoUserItem } from '../dtos/DynamoUserItem';

export class DynamoDbUserRepository implements IUserRepository {
  /**
   * Cliente de DynamoDB con marshalling automático.
   * DocumentClient convierte automáticamente entre tipos JS y DynamoDB.
   */
  private readonly docClient: DynamoDBDocumentClient;
  
  /**
   * Nombre de la tabla de DynamoDB.
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
   * Guarda un nuevo usuario en DynamoDB.
   * 
   * FLUJO:
   * 1. Convertir User (Dominio) → DynamoUserItem (Persistencia)
   * 2. Ejecutar PutCommand para guardar el item
   * 3. Retornar el usuario original como confirmación
   * 
   * SINGLE-TABLE DESIGN:
   * - pk: "USER#{userId}"
   * - sk: "PROFILE"
   * 
   * @param user - El usuario a persistir
   * @returns El usuario guardado
   */
  async save(user: User): Promise<User> {
    // 1. Transformamos de Dominio a Persistencia usando el Mapper
    const item = DynamoUserMapper.toPersistence(user);

    // 2. Ejecutamos el comando de escritura en DynamoDB
    // Usamos PutCommand. Si ya existe, lo sobrescribe (UPSERT).
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    // 3. La aplicación genera todos los datos (como el ID) antes de guardar,
    // actuando como la fuente de la verdad y haciendo redundante volver a leerlos.
    // Retornar el objeto en memoria evita una consulta extra a la base de datos.
    return user;
  }

  /**
   * Actualiza un usuario existente con Optimistic Locking.
   * 
   * FLUJO:
   * 1. Convertir User a DynamoUserItem
   * 2. Incrementar la versión
   * 3. Ejecutar PutCommand con ConditionExpression
   * 4. Si la versión no coincide, lanzar error
   * 
   * OPTIMISTIC LOCKING:
   * - Solo actualiza si nadie más modificó el registro mientras lo teníamos.
   * - Útil para prevenir condiciones de carrera en escrituras concurrentes.
   * 
   * @param user - El usuario a actualizar
   * @returns El usuario con versión incrementada
   * @throws Error si otro proceso modificó el usuario
   */
  async update(user: User): Promise<User> {
    const item = DynamoUserMapper.toPersistence(user);
    const newVersion = user.version + 1;
    
    // Actualizamos version en el item a guardar
    const itemToSave = { ...item, version: newVersion };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: itemToSave,
        // Optimistic Locking: Solo actualizar si la version en DB coincide
        ConditionExpression: 'version = :currentVersion',
        ExpressionAttributeValues: {
          ':currentVersion': user.version
        }
      }));
      
      // Retornamos la nueva instancia de usuario con la versión actualizada
      return new User(
        user.id,
        user.email,
        user.passwordHash,
        user.isActive,
        newVersion
      );
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new Error('Optimistic Locking Error: El usuario ha sido modificado por otro proceso.');
      }
      throw error;
    }
  }

  /**
   * Busca un usuario por su email usando el GSI EmailIndex.
   * 
   * FLUJO:
   * 1. Ejecutar Query en el GSI EmailIndex
   * 2. Si hay resultado, convertir DynamoUserItem → User
   * 3. Si no hay resultado, retornar null
   * 
   * NOTA: Usamos GSI porque el email no es parte de la clave primaria (pk/sk).
   * 
   * @param email - Email del usuario a buscar
   * @returns El usuario si existe, null si no se encuentra
   */
  async findByEmail(email: string): Promise<User | null> {
    console.log(`[DynamoDB] findByEmail: Buscando email=${email} en tabla=${this.tableName}, endpoint=${process.env.DYNAMODB_ENDPOINT}`);
    
    try {
      const result = await this.docClient.send(new QueryCommand({
        TableName: this.tableName,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email
        },
        Limit: 1
      }));

      console.log(`[DynamoDB] findByEmail: Resultado Items=${result.Items?.length || 0}`);
      
      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      return DynamoUserMapper.toDomain(result.Items[0] as DynamoUserItem);
    } catch (error: any) {
      console.error(`[DynamoDB] findByEmail ERROR:`, error.name, error.message);
      throw error;
    }
  }

  /**
   * Busca un usuario por su ID usando la clave primaria compuesta (pk + sk).
   * 
   * FLUJO:
   * 1. Construir pk = "USER#{id}" y sk = "PROFILE"
   * 2. Ejecutar GetCommand (operación más rápida, O(1))
   * 3. Si hay resultado, convertir DynamoUserItem → User
   * 4. Si no hay resultado, retornar null
   * 
   * SINGLE-TABLE DESIGN:
   * - Usamos GetItem con pk + sk para máxima eficiencia
   * 
   * @param id - ID del usuario a buscar
   * @returns El usuario si existe, null si no se encuentra
   */
  async findById(id: string): Promise<User | null> {
    // 1. Construimos las claves usando el mapper
    const pk = DynamoUserMapper.buildPk(id);
    const sk = DynamoUserMapper.getProfileSk();

    // 2. Ejecutamos GetItem (O(1) - más eficiente que Query)
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { pk, sk }
    }));

    // 3. Si no hay item, el usuario no existe
    if (!result.Item) {
      return null;
    }

    // 4. Convertimos de Persistencia a Dominio
    return DynamoUserMapper.toDomain(result.Item as DynamoUserItem);
  }
}
