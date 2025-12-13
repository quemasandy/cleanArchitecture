/**
 * Archivo: UserMapper.ts
 * UBICACIÓN: Capa de Infraestructura / Mappers
 *
 * ¿QUÉ ES UN MAPPER?
 * - Es el traductor entre el mundo de la Base de Datos (DTO) y el mundo del Dominio (Entidad).
 * - Mantiene limpia la Entidad: ella no sabe que en la DB el campo se llama 'is_active'.
 * - Mantiene limpia la DB: no le importa las reglas de negocio de la Entidad.
 *
 * - Para quién trabaja: SqlUserRepository (Infraestructura).
 * - Intención: Adaptar el modelo de dominio al esquema relacional de SQL.
 * - Misión: Mapear Entidades a filas de tablas, manejando discrepancias de tipos (bool vs 1/0).
 */

import { User } from '../../domain/entities/User';
import { UserPersistenceDTO } from '../dtos/UserPersistenceDTO';
import { Email } from '../../domain/value-objects/Email';

export class UserMapper {
  
  /**
   * Convierte de DTO (Base de Datos) -> Entidad (Dominio)
   */
  static toDomain(raw: UserPersistenceDTO): User {
    // 1. Convertimos el 0/1 de SQL a boolean real
    const isActiveBoolean = raw.is_active === 1;

    // 1. Reconstruimos Value Objects
    // OJO: Aquí confiamos en la BD, o podríamos try/catch si la BD está corrupta
    const emailVO = new Email(raw.email_address);

    // 2. Creamos la entidad
    return new User(
      raw.user_id,
      emailVO, // Pasamos el VO
      raw.password_hash,
      isActiveBoolean,
      raw.version
    );
  }

  /**
   * Convierte de Entidad (Dominio) -> DTO (Base de Datos)
   * Prepara los datos para ser guardados.
   */
  static toPersistence(user: User): UserPersistenceDTO {
    return {
      user_id: user.id,
      email_address: user.email.getValue(), // Extraemos el valor primitivo
      password_hash: user.passwordHash,
      is_active: user.isActive ? 1 : 0, // Convertimos boolean a TINYINT
      created_at: new Date().toISOString(), // Dato de auditoría (ejemplo)
      version: user.version
    };
  }
}
