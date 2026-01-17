/**
 * Archivo: DynamoSessionMapper.ts
 * UBICACIÓN: Capa de Infraestructura / Mappers
 *
 * ¿QUÉ HACE UN MAPPER?
 * - Transforma objetos entre diferentes representaciones.
 * - En este caso: Session (Dominio) ↔ DynamoSessionItem (Persistencia).
 * - Aísla el dominio de los detalles de almacenamiento.
 *
 * - Para quién trabaja: DynamoDbSessionRepository.
 * - Intención: Convertir entre el modelo de dominio y el formato de DynamoDB.
 * - Misión: Manejar el prefijo "USER#" para pk y "SESSION#" para sk.
 *
 * ¿POR QUÉ ES IMPORTANTE?
 * - El Dominio NO debe conocer que usamos prefijos como "USER#" o "SESSION#".
 * - Si cambiamos la estrategia de almacenamiento, solo cambiamos este mapper.
 * - Mantiene limpia la separación entre capas.
 *
 * SINGLE-TABLE DESIGN (Patrón Óptimo):
 * - pk: "USER#{userId}" - Agrupa sesiones con su usuario
 * - sk: "SESSION#{token}" - Diferencia sesiones del perfil
 * 
 * Esto permite:
 * - Query única para obtener usuario + todas sus sesiones
 * - Invalidar todas las sesiones de un usuario con una sola operación
 */

import { Session } from '../../domain/interfaces/ISessionRepository';
import { DynamoSessionItem } from '../dtos/DynamoSessionItem';

/**
 * Prefijo compartido con usuarios para la partition key.
 * Permite que sesiones y usuarios compartan el mismo pk (agrupación).
 */
const USER_PREFIX = 'USER#';

/**
 * Prefijo usado para el sort key de sesiones.
 * Diferencia sesiones del perfil del usuario (sk="PROFILE").
 */
const SESSION_PREFIX = 'SESSION#';

export class DynamoSessionMapper {
  /**
   * Convierte un item de DynamoDB al modelo de dominio Session.
   * 
   * FLUJO:
   * DynamoDB Item → Mapper → Session (Dominio)
   * 
   * @param item - El item tal como viene de DynamoDB
   * @returns Session - El objeto de dominio limpio
   */
  static toDomain(item: DynamoSessionItem): Session {
    return {
      // El token ya viene limpio en el item (sin prefijo)
      token: item.token,
      userId: item.userId,
      createdAt: item.createdAt,
    };
  }

  /**
   * Convierte un objeto de dominio Session al formato de DynamoDB.
   * 
   * FLUJO:
   * Session (Dominio) → Mapper → DynamoDB Item
   * 
   * @param session - El objeto de dominio
   * @returns DynamoSessionItem - El item listo para guardar en DynamoDB
   */
  static toPersistence(session: Session): DynamoSessionItem {
    return {
      // pk: Mismo prefijo que el usuario para agrupación
      // Ejemplo: "USER#12345"
      pk: `${USER_PREFIX}${session.userId}`,
      // sk: Prefijo SESSION# + token
      // Ejemplo: "SESSION#token_abc123"
      sk: `${SESSION_PREFIX}${session.token}`,
      // Guardamos userId explícitamente para facilitar queries
      userId: session.userId,
      // Token limpio para el GSI TokenIndex
      token: session.token,
      createdAt: session.createdAt,
    };
  }

  /**
   * Genera las claves compuestas (pk + sk) para operaciones DynamoDB.
   * 
   * Útil para GetItem y DeleteItem donde necesitamos pk + sk.
   * 
   * @param userId - El ID del usuario
   * @param token - El token de sesión
   * @returns Objeto con pk y sk formateados para DynamoDB
   */
  static buildKey(userId: string, token: string): { pk: string; sk: string } {
    return {
      pk: `${USER_PREFIX}${userId}`,
      sk: `${SESSION_PREFIX}${token}`,
    };
  }

  /**
   * Genera solo la partition key a partir de un userId.
   * 
   * @param userId - El ID del usuario
   * @returns La pk formateada: "USER#{userId}"
   */
  static buildPk(userId: string): string {
    return `${USER_PREFIX}${userId}`;
  }

  /**
   * Genera solo la sort key a partir de un token.
   * 
   * @param token - El token de sesión
   * @returns La sk formateada: "SESSION#{token}"
   */
  static buildSk(token: string): string {
    return `${SESSION_PREFIX}${token}`;
  }
}
