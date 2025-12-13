/**
 * Archivo: PessimisticSqlUserRepository.ts
 * UBICACIÓN: Capa de Infraestructura / Repositories
 *
 * - Concepto: PESSIMISTIC LOCKING (Bloqueo Pesimista)
 * - "No confío en nadie. Bloqueo la fila para mí solo."
 */
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserPersistenceDTO } from '../dtos/UserPersistenceDTO';
import { UserMapper } from '../mappers/UserMapper';

export class PessimisticSqlUserRepository implements IUserRepository {
  
  // SIMULACIÓN DE BLOQUEOS DE BASE DE DATOS
  // En una BD real, esto lo hace el motor (InnoDB, Postgres) con "SELECT ... FOR UPDATE"
  private static lockedRows = new Set<string>();

  private db = {
    query: async (sql: string, params: any[]): Promise<any[]> => {
      console.log(`[SQL Driver] Executing: ${sql}`);
      return [];
    }
  };

  /**
   * PESSIMISTIC READ: "SELECT ... FOR UPDATE"
   * Cuando leo el dato, inmediatamente lo bloqueo.
   */
  async findById(id: string): Promise<User | null> {
    console.log(`[Pessimistic Repo] Intentando adquirir candado para User ID: ${id}...`);

    // 1. Simular espera si está bloqueado (Spin-lock simple para demo)
    await this.waitForLock(id);

    // 2. Adquirir candado
    this.acquireLock(id);

    // 3. Ejecutar Query (Simulada)
    // SQL Real: SELECT * FROM users WHERE id = ? FOR UPDATE;
    console.log(`[Pessimistic Repo] Candado adquirido. Leyendo datos...`);
    
    // Simular retorno de datos
    const mockDbRow: UserPersistenceDTO = {
      user_id: id,
      email_address: "safe@pessimistic.com",
      password_hash: "secret",
      is_active: 1,
      created_at: "2023-01-01T00:00:00Z",
      version: 1 // Incluso en pesimista puede haber version, pero el candado es lo que manda
    };

    return UserMapper.toDomain(mockDbRow);
  }

  async findByEmail(email: string): Promise<User | null> {
    return null; // Implementación omitida para brevedad
  }

  async save(user: User): Promise<User> {
    console.log(`[Pessimistic Repo] Guardando (INSERT)...`);
    return user;
  }

  /**
   * Al hacer update, liberamos el candado al final de la transacción.
   */
  async update(user: User): Promise<void> {
    console.log(`[Pessimistic Repo] Realizando UPDATE seguro...`);
    
    // Simular tiempo de procesamiento (User thinking time o proceso pesado)
    await new Promise(r => setTimeout(r, 500)); 

    // SQL Real: UPDATE users SET ... WHERE id = ?
    // El commit de la transacción liberaría el candado.
    
    console.log(`[Pessimistic Repo] Update terminado. Liberando candado.`);
    this.releaseLock(user.id);
  }

  // --- MÉTODOS DE AYUDA PARA SIMULAR DB LOCKING ---

  private async waitForLock(id: string) {
    let retries = 0;
    while (PessimisticSqlUserRepository.lockedRows.has(id)) {
      if (retries > 5) throw new Error("Timeout waiting for lock");
      console.log(`[DB Block] El recurso ${id} está bloqueado por otra transacción. Esperando...`);
      await new Promise(r => setTimeout(r, 1000)); // Espera 1 segundo
      retries++;
    }
  }

  private acquireLock(id: string) {
    if (PessimisticSqlUserRepository.lockedRows.has(id)) {
      throw new Error("Deadlock detected or Race Condition in simulation");
    }
    PessimisticSqlUserRepository.lockedRows.add(id);
  }

  private releaseLock(id: string) {
    PessimisticSqlUserRepository.lockedRows.delete(id);
  }
}
