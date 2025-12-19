/**
 * Script para probar el handler de logout localmente.
 * 
 * FLUJO:
 * 1. Simula un evento de API Gateway con un token
 * 2. Ejecuta logoutUserHandler
 * 3. Muestra la respuesta
 * 
 * NOTA: Primero debes hacer login para obtener un token válido.
 * El token se guarda en DynamoDB con pk="SESSION#<token>"
 */

import { logoutUserHandler } from '../src/main';

// IMPORTANTE: Reemplaza este token con uno obtenido de loginUser
const mockEvent = {
    body: JSON.stringify({
        // Token obtenido del login
        token: "token_1766119149744_1766119285462_aaiq12jfsku"
    }),
    httpMethod: "POST",
    path: "/users/logout",
    headers: { "Content-Type": "application/json" }
};

(async () => {
    console.log("🚀 Ejecutando Lambda de Logout en local...\n");
    console.log("📥 Evento de entrada:", JSON.stringify(JSON.parse(mockEvent.body), null, 2), "\n");
    
    try {
        const response = await logoutUserHandler(mockEvent);
        console.log("\n✅ Respuesta:");
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("\n❌ Error:", error);
    }
})();
