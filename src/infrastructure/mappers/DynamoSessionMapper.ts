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
 * - Misión: Manejar el prefijo "SESSION#" y otras transformaciones.
 *
 * ¿POR QUÉ ES IMPORTANTE?
 * - El Dominio NO debe conocer que usamos prefijos como "SESSION#".
 * - Si cambiamos la estrategia de almacenamiento, solo cambiamos este mapper.
 * - Mantiene limpia la separación entre capas.
 */

import { Session } from '../../domain/interfaces/ISessionRepository';
import { DynamoSessionItem } from '../dtos/DynamoSessionItem';

/**
 * Prefijo usado para diferenciar sesiones de usuarios en Single-Table Design.
 * 
 * SINGLE-TABLE DESIGN EN DYNAMODB:
 * En lugar de tener una tabla separada para sesiones, usamos la misma tabla
 * de usuarios pero con un prefijo diferente en la partition key.
 * 
 * Ventajas:
 * - Menos tablas que gestionar
 * - Costos reducidos (una sola tabla = menos WCU/RCU base)
 * - Patrón común en arquitecturas serverless
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
      // Removemos el prefijo "SESSION#" para obtener el token limpio
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
      // Agregamos el prefijo "SESSION#" para el pk
      pk: `${SESSION_PREFIX}${session.token}`,
      token: session.token,
      userId: session.userId,
      createdAt: session.createdAt,
    };
  }

  /**
   * Genera la partition key de DynamoDB a partir de un token.
   * 
   * Útil para operaciones de búsqueda y eliminación donde solo tenemos el token.
   * 
   * @param token - El token de sesión limpio
   * @returns La pk formateada para DynamoDB: "SESSION#<token>"
   */
  static buildPk(token: string): string {
    return `${SESSION_PREFIX}${token}`;
  }
}
