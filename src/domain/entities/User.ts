/**
 * Archivo: User.ts
 * UBICACIÓN: Capa de Dominio / Entidades
 *
 * ¿QUÉ ES UNA ENTIDAD?
 * - Es un objeto de negocio con identidad única (ID).
 * - Contiene datos y comportamiento puro del negocio.
 * - NO depende de base de datos, frameworks ni UI.
 *
 * - Para quién trabaja: La lógica de negocio (Dominio).
 * - Intención: Representar a un usuario en el sistema con sus reglas de validación.
 * - Misión: Encapsular el estado y comportamiento de un usuario, asegurando su integridad.
 */

import { Email } from '../value-objects/Email';

export class User {
  // Propiedades privadas para encapsulamiento
  constructor(
    public readonly id: string,
    public readonly email: Email, // Value Object!
    public readonly passwordHash: string,
    public readonly isActive: boolean = true,
    public readonly version: number = 1 // Control de Concurrencia Optimista
  ) {}

  /**
   * REGLA DE NEGOCIO:
   * Un usuario puede desactivarse, pero solo si está activo.
   */
  deactivate(): User {
    if (!this.isActive) {
      throw new Error("El usuario ya está inactivo.");
    }
    // Retornamos una nueva instancia para inmutabilidad (opcional pero recomendado)
    return new User(this.id, this.email, this.passwordHash, false, this.version);
  }

  /**
   * REGLA DE NEGOCIO:
   * Validación de dominio simple.
   * (Ahora esto es redundante porque el VO Email ya se valida a sí mismo, pero lo mantenemos por compatibilidad o lógica extra)
   */
  hasValidEmail(): boolean {
    return this.email.getValue().includes('@');
  }
}
