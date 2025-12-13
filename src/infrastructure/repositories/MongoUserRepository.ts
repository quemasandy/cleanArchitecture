/**
 * Archivo: MongoUserRepository.ts
 * UBICACIÓN: Capa de Infraestructura / Repositories
 *
 * - Para quién trabaja: Dominio (IUserRepository).
 * - Intención: Persistir usuarios en MongoDB.
 * - Misión: Mapear entidades a BSON y ejecutar operaciones en la colección 'users'.
 */
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { User } from '../../domain/entities/User';
import { UserDocument } from '../dtos/UserDocument';
import { MongoUserMapper } from '../mappers/MongoUserMapper';

export class MongoUserRepository implements IUserRepository {
  
  // Simulamos el Driver de MongoDB (como si fuera 'mongoose' o 'mongodb native driver')
  private db = {
    collection: (name: string) => ({
      insertOne: async (doc: any): Promise<any> => {
        console.log(`[Mongo Driver] db.${name}.insertOne(${JSON.stringify(doc)})`);
        return { acknowledged: true, insertedId: doc._id };
      },
      findOne: async (query: any): Promise<any> => {
        console.log(`[Mongo Driver] db.${name}.findOne(${JSON.stringify(query)})`);
        
        // SIMULACIÓN: Si buscamos por ID 123, devolvemos algo, si no null
        if (query._id === 'user_123' || query['$or']) { // Hack simple para simulacion
           return null; // Simulamos no encontrado por defecto para el ejemplo
        }
        
        if (query.email === 'andyexist@gmail.com') {
          return {
            _id: 'user_123',
            email: 'andyExist@gmail.com',
            password_hash: 'secret_hash',
            is_active: true,
            created_at: '2025-12-13T18:14:09.000Z',
            version: 1
          };
        } 

        return null;
      }
    })
  };

  async save(user: User): Promise<User> {
    // 1. Dominio -> Documento BSON (DTO)
    const userDoc = MongoUserMapper.toPersistence(user);

    // 2. Persistencia (Infraestructura Pura)
    // Mongo usa upsert o insertOne/updateOne. Aquí simulamos insert.
    await this.db.collection('users').insertOne(userDoc);

    return user;
  }

  async update(user: User): Promise<void> {
    const userDoc = MongoUserMapper.toPersistence(user);
    
    // OPTIMISTIC LOCKING:
    // "Actualiza SOLO SI el id coincide Y la versión es la que yo leí al principio"
    // Además, incrementamos la versión en 1 automatícamente al guardar.
    // En Mongo esto es atómico.
    
    // Simulamos la operación atómica:
    // db.users.updateOne({ _id: ..., version: ... }, { $set: { ..., version: version + 1 } })
    
    console.log(`[Mongo Driver] db.collections('users').updateOne({ _id: '${user.id}', version: ${user.version} }, { $set: ... })`);

    // LÓGICA DE SIMULACIÓN (Ya que no hay BD real)
    // Para la demo, vamos a simular que si el mail es "conflict@optimistic.com", fallamos.
    // O mejor, dependemos de lo que tengamos en memoria o una bandera en el demo.
    // Pero para ser fiel al repositorio, aquí debería "intentar" y si falla tirar error.
    
    // Simularemos éxito por defecto:
    const simulatedMatchedCount = 1; // Si fuera 0, significaría que la versión cambió.
    
    // PERO, para probar el fallo, necesitamos que el demo pueda inyectar comportamiento o fallar.
    // Como esto es un ejercicio, voy a lanzar un error si la versión que me pasan es antigua.
    // ... pero ¿contra qué comparo? No tengo estado persistente real aquí más que mock.
    
    // TRUCO DIDÁCTICO:
    // Vamos a asumir que en la "Base de Datos" (simulada aquí) la versión siempre avanza.
    // Si el usuario me pasa version 1, y yo (simulación) digo que la actual es 2, fallo.
    
    // Vamos a usar una propiedad estática para simular el estado global de la BD para este ejemplo
    if ((MongoUserRepository as any)._SIMULATED_DB_VERSION && (MongoUserRepository as any)._SIMULATED_DB_VERSION > user.version) {
       throw new Error("Concurrency Error: The record has been modified by another transaction.");
    }
    
    // Si pasa, actualizamos la "DB"
    (MongoUserRepository as any)._SIMULATED_DB_VERSION = user.version + 1;
    console.log(`[Mongo Driver] UPDATE SUCCESS. New Version in DB: ${(MongoUserRepository as any)._SIMULATED_DB_VERSION}`);
  }

  async findByEmail(email: string): Promise<User | null> {
    // 1. Consulta BSON
    const doc = await this.db.collection('users').findOne({ email: email });

    // 2. Si no hay documento, retornamos null
    if (!doc) return null;

    // 3. Reconstitución (BSON -> User Entity)
    return MongoUserMapper.toDomain(doc as UserDocument);
  }

  async findById(id: string): Promise<User | null> {
    // 1. Consulta BSON por _id
    // Nota: en la vida real user._id puede ser ObjectId, aquí usamos string
    console.log(`[Mongo Driver] db.users.findOne({ _id: '${id}' })`);

    // SIMULACIÓN DE RETORNO DE DRIVER
    const mockDoc: UserDocument = {
      _id: id,
      email: "found@mongo.com",
      password_hash: "secret_hash_mongo",
      is_active: true, // Boolean nativo
      created_at: new Date(),
      version: (MongoUserRepository as any)._SIMULATED_DB_VERSION || 1
    };

    // 2. Transformación
    return MongoUserMapper.toDomain(mockDoc);
  }
}
