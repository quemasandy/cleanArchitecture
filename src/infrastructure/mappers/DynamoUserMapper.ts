/**
 * Archivo: DynamoUserMapper.ts
 * UBICACIÓN: Capa de Infraestructura / Mappers
 *
 * ¿QUÉ HACE UN MAPPER?
 * - Transforma objetos entre diferentes representaciones.
 * - En este caso: User (Dominio) ↔ DynamoUserItem (Persistencia).
 * - Aísla el dominio de los detalles de almacenamiento.
 *
 * - Para quién trabaja: DynamoDbUserRepository.
 * - Intención: Convertir entre el modelo de dominio y el formato de DynamoDB.
 * - Misión: Manejar el prefijo "USER#" y el sk "PROFILE".
 *
 * ¿POR QUÉ ES IMPORTANTE?
 * - El Dominio NO debe conocer que usamos prefijos como "USER#".
 * - Si cambiamos la estrategia de almacenamiento, solo cambiamos este mapper.
 * - Mantiene limpia la separación entre capas.
 *
 * SINGLE-TABLE DESIGN:
 * - pk: "USER#{userId}" - Permite agrupar con sesiones del mismo usuario
 * - sk: "PROFILE" - Identifica este item como el perfil del usuario
 */

import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { DynamoUserItem } from '../dtos/DynamoUserItem';

/**
 * Prefijo usado para la partition key de usuarios.
 * Permite diferenciar usuarios de otros tipos de entidad en Single-Table Design.
 */
const USER_PREFIX = 'USER#';

/**
 * Sort Key constante para items de perfil de usuario.
 * Diferencia el perfil de las sesiones (SESSION#token).
 */
const PROFILE_SK = 'PROFILE';

export class DynamoUserMapper {
  /**
   * Convierte un item de DynamoDB al modelo de dominio User.
   * 
   * FLUJO:
   * DynamoDB Item → Mapper → User (Dominio)
   * 
   * @param item - El item tal como viene de DynamoDB
   * @returns User - El objeto de dominio limpio (sin prefijos)
   */
  static toDomain(item: DynamoUserItem): User {
    // Extraemos el userId removiendo el prefijo "USER#"
    // Ejemplo: "USER#12345" → "12345"
    const userId = item.pk.replace(USER_PREFIX, '');
    
    return new User(
      userId,
      new Email(item.email),
      item.passwordHash,
      item.isActive,
      item.version
    );
  }

  /**
   * Convierte un objeto de dominio User al formato de DynamoDB.
   * 
   * FLUJO:
   * User (Dominio) → Mapper → DynamoDB Item
   * 
   * @param user - El objeto de dominio
   * @returns DynamoUserItem - El item listo para guardar en DynamoDB
   */
  static toPersistence(user: User): DynamoUserItem {
    return {
      // Agregamos el prefijo "USER#" para el pk
      // Ejemplo: "12345" → "USER#12345"
      pk: `${USER_PREFIX}${user.id}`,
      // sk fijo para perfiles de usuario
      sk: PROFILE_SK,
      email: user.email.getValue(),
      passwordHash: user.passwordHash,
      isActive: user.isActive,
      version: user.version,
    };
  }

  /**
   * Genera la partition key de DynamoDB a partir de un userId.
   * 
   * Útil para operaciones de búsqueda donde solo tenemos el userId.
   * 
   * @param userId - El ID del usuario limpio
   * @returns La pk formateada para DynamoDB: "USER#{userId}"
   */
  static buildPk(userId: string): string {
    return `${USER_PREFIX}${userId}`;
  }

  /**
   * Retorna el Sort Key constante para perfiles de usuario.
   * 
   * @returns "PROFILE"
   */
  static getProfileSk(): string {
    return PROFILE_SK;
  }
}
