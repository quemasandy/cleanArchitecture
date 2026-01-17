/**
 * Archivo: DynamoUserItem.ts
 * UBICACIÓN: Capa de Infraestructura / DTOs
 *
 * ¿QUÉ ES UN DTO DE PERSISTENCIA?
 * - Es la estructura "cruda" de datos tal como se almacena en la base de datos.
 * - NO contiene lógica de negocio, solo la forma de los datos.
 * - Actúa como contrato entre el código y la estructura de DynamoDB.
 *
 * - Para quién trabaja: DynamoDbUserRepository y DynamoUserMapper.
 * - Intención: Definir la forma exacta del item en DynamoDB.
 * - Misión: Tipado fuerte para operaciones de lectura/escritura en DynamoDB.
 *
 * SINGLE-TABLE DESIGN (Patrón Óptimo PK/SK):
 * - pk: "USER#{userId}" - Agrupa todas las entidades del usuario
 * - sk: "PROFILE" - Identifica que este item es el perfil del usuario
 */
export interface DynamoUserItem {
  /**
   * Partition Key en DynamoDB.
   * Formato: "USER#{userId}"
   * 
   * SINGLE-TABLE DESIGN:
   * Al prefijar con "USER#", podemos agrupar usuarios y sus sesiones
   * bajo la misma partition key, permitiendo queries eficientes.
   */
  pk: string;

  /**
   * Sort Key en DynamoDB.
   * Valor fijo: "PROFILE" para identificar items de usuario.
   * 
   * Otras entidades del mismo usuario usarán diferentes sk:
   * - Sesiones: "SESSION#{token}"
   * - Órdenes (futuro): "ORDER#{orderId}"
   */
  sk: string;

  /**
   * Email del usuario.
   * Indexado en GSI "EmailIndex" para búsquedas por email.
   */
  email: string;

  /**
   * Hash de la contraseña (bcrypt).
   * NUNCA almacenamos contraseñas en texto plano.
   */
  passwordHash: string;

  /**
   * Estado del usuario (activo/inactivo).
   */
  isActive: boolean;

  /**
   * Versión para Optimistic Locking.
   * Incrementa en cada actualización para prevenir conflictos.
   */
  version: number;
}
