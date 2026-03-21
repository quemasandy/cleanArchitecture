/**
 * Archivo: LogoutUser.ts
 * UBICACIÓN: Capa de Application / Use Cases
 *
 * ¿QUÉ ES UN USE CASE (CASO DE USO)?
 * - Orquesta un flujo de negocio completo.
 * - Coordina puertos de infraestructura para ejecutar la intención del usuario.
 *
 * - Para quién trabaja: La Capa de Presentación (Controllers).
 * - Intención: Orquestar el cierre de sesión de un usuario.
 * - Misión: Invalidar el token de sesión de forma idempotente.
 *
 * IDEMPOTENCIA:
 * - Llamar logout múltiples veces con el mismo token no causa errores.
 * - Si la sesión ya fue cerrada o expiró, simplemente no hace nada.
 * - Esto es importante para manejo de errores de red y reintentos.
 *
 * FLUJO:
 * 1. Buscar si la sesión existe
 * 2. Si existe → eliminarla
 * 3. Si no existe → retornar sin error (idempotente)
 */

import { ISessionRepository } from '../../domain/interfaces/ISessionRepository';

export class LogoutUser {
  constructor(
    private readonly sessionRepository: ISessionRepository
  ) {}

  /**
   * Ejecuta el caso de uso de logout.
   *
   * ¿POR QUÉ ES VOID?
   * El logout no necesita retornar datos. Su éxito se mide
   * por la AUSENCIA de errores, no por un valor de retorno.
   * El controller traduce este "void exitoso" a un HTTP 200.
   */
  async execute(token: string): Promise<void> {
    // 1. COORDINACIÓN: Verificar si la sesión existe vía repositorio
    //    Esto es opcional (podríamos ir directo al delete), pero es
    //    útil para logging y para confirmar que el token era válido.
    const session = await this.sessionRepository.findByToken(token);

    if (!session) {
      // La sesión ya no existe — logout es IDEMPOTENTE.
      // No lanzamos error porque reintentos del cliente no deben fallar.
      return;
    }

    // 2. COORDINACIÓN: Eliminar la sesión vía repositorio (puerto)
    await this.sessionRepository.delete(token);
  }
}
