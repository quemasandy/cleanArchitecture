/**
 * Archivo: DynamoDbUserRepository.ts
 * INTENCIÓN: Implementación de IUserRepository usando AWS DynamoDB.
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { DynamoUserMapper } from '../mappers/DynamoUserMapper';
import { DynamoUserItem } from '../dtos/DynamoUserItem';

export class DynamoDbUserRepository implements IUserRepository {
  private readonly docClient: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(tableName: string) {
    // Inicializamos el cliente. En Lambda, la región se infiere del entorno.
    const client = new DynamoDBClient({});
    this.docClient = DynamoDBDocumentClient.from(client, {
      marshallOptions: { removeUndefinedValues: true }
    });
    this.tableName = tableName;
  }

  async save(user: User): Promise<User> {
    const item = DynamoUserMapper.toPersistence(user);

    // Usamos PutCommand. Si ya existe, lo sobrescribe.
    // Para asegurar que no sobrescribimos uno existente si es "creación",
    // podríamos agregar una ConditionExpression (attribute_not_exists(pk)).
    // Pero la interfaz save() suele ser upsert en muchos contextos.
    // Asumiremos UPSERT por simplicidad, o podríamos chequear si user.version === 1.
    
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: item
    }));

    return user;
  }

  async update(user: User): Promise<User> {
    const item = DynamoUserMapper.toPersistence(user);
    const newVersion = user.version + 1;
    
    // Actualizamos version en el item a guardar
    const itemToSave = { ...item, version: newVersion };

    try {
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: itemToSave,
        // Optimistic Locking: Solo actualizar si la version en DB coincide con la que leímos
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

  async findByEmail(email: string): Promise<User | null> {
    // Usamos el GSI 'EmailIndex'
    const result = await this.docClient.send(new QueryCommand({
      TableName: this.tableName,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      },
      Limit: 1
    }));

    if (!result.Items || result.Items.length === 0) {
      return null;
    }

    return DynamoUserMapper.toDomain(result.Items[0] as DynamoUserItem);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { pk: id }
    }));

    if (!result.Item) {
      return null;
    }

    return DynamoUserMapper.toDomain(result.Item as DynamoUserItem);
  }
}
