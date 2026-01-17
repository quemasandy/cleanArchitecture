/**
 * Archivo: DynamoSessionItem.ts
 * UBICACIÓN: Capa de Infraestructura / DTOs
 *
 * ¿QUÉ ES UN DTO DE PERSISTENCIA?
 * - Es la estructura "cruda" de datos tal como se almacena en la base de datos.
 * - NO contiene lógica de negocio, solo la forma de los datos.
 * - Actúa como contrato entre el código y la estructura de DynamoDB.
 *
 * - Para quién trabaja: DynamoDbSessionRepository y DynamoSessionMapper.
 * - Intención: Definir la forma exacta del item en DynamoDB.
 * - Misión: Tipado fuerte para operaciones de lectura/escritura en DynamoDB.
 *
 * SINGLE-TABLE DESIGN (Patrón Óptimo PK/SK):
 * - pk: "USER#{userId}" - Mismo pk que el usuario (agrupación)
 * - sk: "SESSION#{token}" - Identifica que este item es una sesión
 * 
 * BENEFICIOS:
 * - Una sola query puede obtener usuario + todas sus sesiones
 * - Permite invalidar todas las sesiones de un usuario eficientemente
 */
export interface DynamoSessionItem {
  /**
   * Partition Key en DynamoDB.
   * Formato: "USER#{userId}"
   * 
   * SINGLE-TABLE DESIGN:
   * Usamos el MISMO pk que el usuario para agrupar sesiones con su dueño.
   * Esto permite queries como "dame el usuario y todas sus sesiones".
   */
  pk: string;

  /**
   * Sort Key en DynamoDB.
   * Formato: "SESSION#{token}"
   * 
   * Diferencia las sesiones del perfil del usuario (sk="PROFILE").
   * Un usuario puede tener múltiples sesiones activas.
   */
  sk: string;

  /**
   * ID del usuario propietario de esta sesión.
   * Guardado explícitamente para facilitar queries y logs.
   */
  userId: string;

  /**
   * Token de sesión "limpio" (sin el prefijo SESSION#).
   * Indexado en GSI "TokenIndex" para búsquedas por token en logout.
   */
  token: string;

  /**
   * Timestamp de creación de la sesión (epoch milliseconds).
   * Útil para implementar expiración (TTL) en el futuro.
   */
  createdAt: number;
}
