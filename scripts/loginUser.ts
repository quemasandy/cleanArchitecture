import { loginUserHandler } from '../src/main';

const mockEvent = {
    body: JSON.stringify({
        email: "susy@gmail.com",
        password: "superSecret"
    }),
    httpMethod: "POST",
    path: "/users/login",
    headers: { "Content-Type": "application/json" }
};

(async () => {
    console.log("🚀 Ejecutando Lambda en local (sin Docker)...\n");
    console.log("📥 Evento de entrada:", JSON.stringify(JSON.parse(mockEvent.body), null, 2), "\n");
    
    try {
        const response = await loginUserHandler(mockEvent);
        console.log("\n✅ Respuesta:");
        console.log(JSON.stringify(response, null, 2));
    } catch (error) {
        console.error("\n❌ Error:", error);
    }
})();
