/**
 * Script para ejecutar handlers de Lambda localmente sin Docker.
 * Útil para desarrollo rápido y debugging con VS Code.
 * 
 * Uso: npx tsx scripts/local-run.ts
 * 
 * NOTA: Las variables de entorno se cargan en src/main.ts desde:
 *   - .env.local (desarrollo local - DynamoDB Local)
 *   - .env (producción - AWS)
 */

import { registerUserHandler } from '../src/main';

// Evento simulado (Mock) - Cambia estos valores según lo que quieras probar
const mockEvent = {
    body: JSON.stringify({
        email: "roberto@gmail.com",
        password: "superSecret"
    }),
    httpMethod: "POST",
    path: "/users",
    headers: { "Content-Type": "application/json" }
};

// Ejecutar Lambda
(async () => {
    console.log("🚀 Ejecutando Lambda en local (sin Docker)...\n");
    console.log("📥 Evento de entrada:", JSON.stringify(JSON.parse(mockEvent.body), null, 2), "\n");
    
    try {
        const response = await registerUserHandler(mockEvent);
        console.log("\n✅ Respuesta:");
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("\n❌ Error:", error);
    }
})();
