/**
 * Archivo: concurrency_demo.ts
 * INTENCIÓN: Demostrar las diferencias entre Optimistic y Pessimistic Locking.
 * 
 * EJECUCIÓN: npx ts-node src/01-fundamentals/01-exercises/07-srp/07-layers-example/afterV2/concurrency_demo.ts
 */

import { User } from './domain/entities/User';
import { IUserRepository } from './domain/interfaces/IUserRepository';
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { PessimisticSqlUserRepository } from './infrastructure/repositories/PessimisticSqlUserRepository';

async function runOptimisticDemo() {
  console.log("\n--- DEMO 1: OPTIMISTIC LOCKING (MongoUserRepository) ---");
  const repo = new MongoUserRepository();

  // 1. Dos usuarios (A y B) leen el MISMO registro al mismo tiempo.
  const userA = await repo.findById("user_123");
  const userB = await repo.findById("user_123");

  if (!userA || !userB) throw new Error("User not found");

  console.log(`\n[Lector A] Lee versión: ${userA.version}`);
  console.log(`[Lector B] Lee versión: ${userB.version}`);

  // 2. El usuario A modifica y guarda PRIMERO.
  console.log(`\n[Escritor A] Modificando y guardando...`);
  await repo.update(userA); 
  // Ahora la BD tiene versión 2.

  // 3. El usuario B intenta guardar su copia (que tiene versión 1).
  console.log(`\n[Escritor B] Intentando guardar (con versión ${userB.version})...`);
  try {
    await repo.update(userB);
  } catch (error: any) {
    console.error(`\n❌ [Escritor B] Error capturado: "${error.message}"`);
    console.log("👉 Esto es Optimistic Locking: Prevenimos la sobreescritura silenciosa.");
  }

  // 4. Estrategia de Reintento (Retry)
  console.log(`\n🔄 [Escritor B] Iniciando estrategia de Reintento...`);
  const userB_Reloaded = await repo.findById("user_123"); // Lee versión 2
  if (userB_Reloaded) {
    console.log(`[Escritor B] Re-leyó versión: ${userB_Reloaded.version}. Re-aplicando cambios...`);
    await repo.update(userB_Reloaded); // Guarda y pasa a versión 3
    console.log(`✅ [Escritor B] Guardado exitoso tras reintento.`);
  }
}

async function runPessimisticDemo() {
  console.log("\n\n--- DEMO 2: PESSIMISTIC LOCKING (PessimisticSqlUserRepository) ---");
  const repo = new PessimisticSqlUserRepository();

  // Simulamos que la Transacción A empieza y bloquea
  console.log(`\n[Transacción A] Iniciando (Bloqueo)...`);
  
  // Nota: En un entorno real nodejs single-thread, es difícil demostrar paralelismo real sin workers,
  // pero el repositorio simula el bloqueo con 'await waitForLock'.
  
  // Iniciamos Transacción A (sin await para que no bloquee el hilo principal de Node todavía, 
  // pero el repo marcará el lock)
  const transactionA = async () => {
    const user = await repo.findById("user_123"); // Adquiere lock
    if (user) {
      console.log(`[Transacción A] Trabajando (simulado 2s)...`);
      await new Promise(r => setTimeout(r, 2000));
      await repo.update(user); // Libera lock
      console.log(`[Transacción A] Terminó.`);
    }
  };

  const transactionB = async () => {
    // Le damos un pequeño delay a B para asegurar que A llegue primero al lock
    await new Promise(r => setTimeout(r, 100)); 
    console.log(`[Transacción B] Intentando leer...`);
    const user = await repo.findById("user_123"); // Debería esperar
    if (user) {
        console.log(`[Transacción B] Logró leer y adquirir lock!`);
        await repo.update(user);
        console.log(`[Transacción B] Terminó.`);
    }
  };

  // Ejecutamos "casi" en paralelo
  await Promise.all([transactionA(), transactionB()]);
}

async function main() {
  await runOptimisticDemo();
  await runPessimisticDemo();
}

main().catch(console.error);
