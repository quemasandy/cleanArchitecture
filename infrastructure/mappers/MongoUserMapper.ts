/**
 * Archivo: MongoUserMapper.ts
 * UBICACIÓN: Capa de Infraestructura / Mappers
 *
 * Mapeo específico para MongoDB.
 * Maneja la idiosincrasia de Mongo (como el _id).
 *
 * - Para quién trabaja: MongoUserRepository (Infraestructura).
 * - Intención: Adaptar el modelo de dominio al esquema de documentos de MongoDB.
 * - Misión: Convertir Entidades a Documentos BSON y viceversa.
 */

import { User } from '../../domain/entities/User';
import { UserDocument } from '../dtos/UserDocument';
import { Email } from '../../domain/value-objects/Email';

export class MongoUserMapper {
  
  /**
   * BSON Document -> Domain Entity
   */
  static toDomain(doc: UserDocument): User {
    return new User(
      doc._id,           // Mapeamos _id -> id
      new Email(doc.email), // Reconstituir VO
      doc.password_hash,
      doc.is_active,
      doc.version
    );
  }

  /**
   * Domain Entity -> BSON Document
   */
  static toPersistence(user: User): UserDocument {
    return {
      _id: user.id,      // Mapeamos id -> _id
      email: user.email.getValue(),
      password_hash: user.passwordHash,
      is_active: user.isActive,
      created_at: new Date(), // Ojo: En un sistema real, mantendrías la fecha de creación original if exists
      version: user.version
    };
  }
}
