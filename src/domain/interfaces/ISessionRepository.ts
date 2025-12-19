/**
 * Archivo: ISessionRepository.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * ¿QUÉ ES UN PUERTO (PORT)?
 * - Es un contrato que define QUÉ necesita el dominio para funcionar.
 * - NO dice CÓMO se hace (eso es problema de la infraestructura).
 * - Permite desacoplar el dominio del mecanismo de almacenamiento de sesiones.
 *
 * - Para quién trabaja: Servicios de Dominio (UserService).
 * - Intención: Abstraer la gestión de sesiones de usuario.
 * - Misión: Definir las operaciones para crear, buscar e invalidar sesiones.
 *
 * ¿POR QUÉ NECESITAMOS UN REPOSITORIO DE SESIONES?
 * - El login crea un token que representa la "sesión" del usuario.
 * - Para hacer logout, necesitamos poder invalidar ese token.
 * - Sin persistencia de sesiones, no podemos verificar si un token es válido.
 *
 * REGLA DE DEPENDENCIA (Dependency Rule):
 * - Esta interface vive en DOMINIO, pero será IMPLEMENTADA en Infraestructura.
 * - El Dominio NO conoce DynamoDB, Redis, ni ninguna tecnología específica.
 */

/**
 * Representa una sesión de usuario activa.
 * 
 * Estructura simple para propósitos didácticos:
 * - token: Identificador único de la sesión (PK en DynamoDB)
 * - userId: ID del usuario al que pertenece la sesión
 * - createdAt: Timestamp de creación (útil para TTL/expiración)
 */
export interface Session {
  token: string;
  userId: string;
  createdAt: number;
}

/**
 * Puerto (Interface) para la gestión de sesiones.
 * 
 * OPERACIONES DEL PUERTO:
 * - save: Persiste una nueva sesión (usado por login)
 * - findByToken: Busca una sesión activa por su token
 * - delete: Elimina una sesión (usado por logout)
 */
export interface ISessionRepository {
  /**
   * Guarda una nueva sesión en el almacenamiento.
   * 
   * @param session - La sesión a persistir
   * @returns La sesión guardada (confirmación)
   * 
   * CASO DE USO: Llamado después de un login exitoso.
   */
  save(session: Session): Promise<Session>;

  /**
   * Busca una sesión activa por su token.
   * 
   * @param token - El token de sesión a buscar
   * @returns La sesión si existe, null si no se encuentra o está expirada
   * 
   * CASO DE USO: Validar si un usuario tiene una sesión activa.
   */
  findByToken(token: string): Promise<Session | null>;

  /**
   * Elimina (invalida) una sesión.
   * 
   * @param token - El token de la sesión a invalidar
   * 
   * CASO DE USO: Logout - el token ya no será válido después de esta operación.
   */
  delete(token: string): Promise<void>;
}
