/**
 * Archivo: UserPersistenceDTO.ts
 * UBICACIÓN: Capa de Infraestructura / DTOs
 *
 * ¿QUÉ ES UN DTO DE PERSISTENCIA?
 * - Representa CÓMO están guardados los datos en la base de datos realmente.
 * - Suele usar tipos primitivos (string, number, boolean) y nombres de columnas (snake_case).
 * - NO tiene lógica de negocio. Es solo una bolsa de datos.
 *
 * - Para quién trabaja: SqlUserRepository y UserMapper.
 * - Intención: Definir la fila de base de datos SQL.
 * - Misión: Representar fielmente el esquema de la tabla 'users'.
 */

export interface UserPersistenceDTO {
  user_id: string;       // En DB suele ser 'id' o 'user_id' -> snake_case
  email_address: string; // Imaginemos que la columna se llama 'email_address'
  password_hash: string; // Columna 'password_hash'
  is_active: number;     // En SQL a veces los booleanos son 0 o 1 (TINYINT)
  created_at: string;    // Fecha como string ISO o timestamp
  version: number;       // Optimistic Locking
}
