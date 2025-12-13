/**
 * Archivo: SqlUserRepository.ts
 * UBICACIÓN: Capa de Infraestructura / Repositories
 *
 * - Para quién trabaja: Dominio (IUserRepository).
 * - Intención: Persistir usuarios en base de datos Relacional (SQL).
 * - Misión: Mapear entidades a registros en tablas y ejecutar sentencias SQL.
 */
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserPersistenceDTO } from '../dtos/UserPersistenceDTO';
import { UserMapper } from '../mappers/UserMapper';

export class SqlUserRepository implements IUserRepository {
  
  // Simulamos un "Pool de Conexiones" o Driver de Base de Datos
  private db = {
    query: async (sql: string, params: any[]): Promise<any[]> => {
      console.log(`[DB Driver] Executing SQL: ${sql} | Params: ${JSON.stringify(params)}`);
      // Esto retornaría datos 'raw' de la BD (JSON o filas)
      return []; 
    }
  };

  async save(user: User): Promise<User> {
    // 1. Dominio -> Datos de Persistencia (DTO)
    // El repositorio convierte la entidad limpia en datos sucios/planos
    const persistenceData = UserMapper.toPersistence(user);

    // 2. Ejecutar Query (Infraestructura Pura)
    const sql = `
      INSERT INTO users (id, email, password_hash, is_active, created_at)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      email = VALUES(email), 
      is_active = VALUES(is_active)
    `;
    
    await this.db.query(sql, [
      persistenceData.user_id,
      persistenceData.email_address,
      persistenceData.password_hash,
      persistenceData.is_active,
      persistenceData.created_at
    ]);

    return user;
  }

  async update(user: User): Promise<void> {
    // Implementación estándar (Last Write Wins) o sin checks de concurrencia
    const persistenceData = UserMapper.toPersistence(user);
    const sql = `UPDATE users SET email = ?, is_active = ?, version = ? WHERE id = ?`;
    await this.db.query(sql, [
      persistenceData.email_address, 
      persistenceData.is_active, 
      persistenceData.version,
      persistenceData.user_id
    ]);
  }

  async findByEmail(email: string): Promise<User | null> {
    // 1. Query a la BD
    const sql = "SELECT * FROM users WHERE email_address = ? LIMIT 1";
    const rows = await this.db.query(sql, [email]);

    // Simulamos que la BD no encontró nada
    if (rows.length === 0) {
      // Nota: Aquí podríamos devolver datos hardcodeados para probar si quieres
      return null; 
    }

    // 2. Datos Crudos (DTO) -> Recibidos del driver
    const rawUser: UserPersistenceDTO = rows[0];

    // 3. Reconstitución (Infra -> Dominio)
    // Usamos el Mapper para crear la entidad mágicamente
    return UserMapper.toDomain(rawUser);
  }

  async findById(id: string): Promise<User | null> {
    const sql = "SELECT * FROM users WHERE id = ? LIMIT 1";
    // SIMULACIÓN: Vamos a fingir que la BD SÍ encontró al usuario para el ejemplo
    console.log(`[DB Driver] Executing SQL: ${sql} | Params: ["${id}"]`);

    // DATO CRUDO SIMULADO (Lo que devolvería el driver de MySQL/Postgres)
    const mockDbRow: UserPersistenceDTO = {
      user_id: id,
      email_address: "found@sql.com",
      password_hash: "hashed_secret_123",
      is_active: 1, // ¡Fíjate! Es un número, no un boolean
      created_at: "2023-01-01T10:00:00Z",
      version: 1,
    };

    // Mapeo: DTO -> Entity
    return UserMapper.toDomain(mockDbRow);
  }
}
