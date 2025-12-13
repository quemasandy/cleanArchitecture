/**
 * Archivo: IUserRepository.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * ¿QUÉ ES UN PUERTO (PORT)?
 * - Es un contrato que define QUÉ necesita el dominio para funcionar.
 * - NO dice CÓMO se hace (eso es problema de la infraestructura).
 * - Permite desacoplar el dominio de la base de datos.
 *
 * - Para quién trabaja: Servicios de Dominio (UserService).
 * - Intención: Abstraer la persistencia de usuarios.
 * - Misión: Definir las operaciones necesarias para guardar y recuperar usuarios.
 */

import { User } from '../entities/User';

export interface IUserRepository {
  save(user: User): Promise<User>;
  update(user: User): Promise<void>; // Para demostración de Optimistic Locking
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}
