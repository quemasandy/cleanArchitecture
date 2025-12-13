/**
 * Archivo: UserSerializer.ts
 * UBICACIÓN: Capa de Presentación / Serializers
 *
 * ¿QUÉ HACE UN SERIALIZER?
 * - Transforma objetos de dominio en respuestas para el cliente.
 * - Oculta datos sensibles (como passwordHash).
 * - Formatea fechas, monedas, etc.
 *
 * - Para quién trabaja: Controladores (Presentación).
 * - Intención: Adaptar el modelo de dominio a un formato de transporte seguro.
 * - Misión: Convertir Entities a JSON/DTOs sin exponer datos sensibles.
 */

import { User } from '../../domain/entities/User';

export class UserSerializer {
  static serialize(user: User): any {
    console.log('[UserSerializer][serialize][user]', user.id);
    return {
      id: user.id,
      email: user.email,
      status: user.isActive ? 'Active' : 'Inactive',
      // NO devolvemos passwordHash
    };
  }
}
