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
 * DISEÑO SINGLE-TABLE:
 * Usamos la misma tabla de usuarios con un patrón de clave diferente:
 * - pk: "SESSION#<token>" (partition key)
 * - Esto permite consultas eficientes por token.
 */
export interface DynamoSessionItem {
  /**
   * Partition Key en DynamoDB.
   * Formato: "SESSION#<token>" para diferenciar de usuarios.
   * 
   * SINGLE-TABLE DESIGN:
   * Al prefijar con "SESSION#", podemos almacenar sesiones y usuarios
   * en la misma tabla sin colisiones de claves.
   */
  pk: string;

  /**
   * ID del usuario propietario de esta sesión.
   * Permite saber a quién pertenece el token.
   */
  userId: string;

  /**
   * Token de sesión "limpio" (sin el prefijo SESSION#).
   * Útil para operaciones que necesitan el token original.
   */
  token: string;

  /**
   * Timestamp de creación de la sesión.
   * Útil para implementar expiración (TTL) en el futuro.
   */
  createdAt: number;
}
