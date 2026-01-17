/**
 * Archivo: local-run.ts
 * UBICACIÓN: scripts/
 *
 * ¿QUÉ ES ESTE SCRIPT?
 * - Permite probar TODOS los handlers de Lambda localmente.
 * - Configura variables de entorno automáticamente.
 * - Usa InMemoryUserRepository para no requerir Docker ni DynamoDB.
 *
 * Uso: npm run local
 *      o: npx tsx scripts/local-run.ts
 */

// -----------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE VARIABLES DE ENTORNO (antes de importar main.ts)
// -----------------------------------------------------------------------------
process.env.USERS_TABLE = 'users-local';
process.env.AWS_REGION = 'us-east-1';
process.env.NODE_ENV = 'local';

// -----------------------------------------------------------------------------
// 2. IMPORTAR PRESENTACIÓN (Views) y DOMINIO (Interfaces y Servicios)
// -----------------------------------------------------------------------------
import { ConsoleView } from '../src/presentation/views/ConsoleView';
import { UserController } from '../src/presentation/controllers/UserController';
import { OrderController } from '../src/presentation/controllers/OrderController';
import { UserService } from '../src/domain/services/UserService';
import { OrderService } from '../src/domain/services/OrderService';

// -----------------------------------------------------------------------------
// 3. IMPORTAR INFRAESTRUCTURA (Implementaciones In-Memory para local)
// -----------------------------------------------------------------------------
import { InMemoryUserRepository } from '../src/infrastructure/repositories/InMemoryUserRepository';
import { SmtpEmailClient } from '../src/infrastructure/email/SmtpEmailClient';
import { CybersourcePaymentGateway } from '../src/infrastructure/payment/CybersourcePaymentGateway';
import { AwsSqsClient } from '../src/infrastructure/queue/AwsSqsClient';

// Para sesiones locales, necesitamos un mock
import { ISessionRepository, Session } from '../src/domain/interfaces/ISessionRepository';

// -----------------------------------------------------------------------------
// 4. MOCK DE SESSION REPOSITORY (In-Memory para desarrollo local)
// -----------------------------------------------------------------------------
class InMemorySessionRepository implements ISessionRepository {
  private sessions: Map<string, Session> = new Map();

  async save(session: Session): Promise<Session> {
    this.sessions.set(session.token, session);
    console.log(`   📝 [Session] Guardada sesión: ${session.token.slice(0, 20)}...`);
    return session;
  }

  async findByToken(token: string): Promise<Session | null> {
    const session = this.sessions.get(token);
    return session || null;
  }

  async delete(token: string): Promise<void> {
    this.sessions.delete(token);
    console.log(`   🗑️ [Session] Eliminada sesión: ${token.slice(0, 20)}...`);
  }
}

// -----------------------------------------------------------------------------
// 5. COMPOSITION ROOT LOCAL (Inyección de Dependencias para desarrollo)
// -----------------------------------------------------------------------------
const userRepo = new InMemoryUserRepository();
const sessionRepo = new InMemorySessionRepository();
const emailService = new SmtpEmailClient();
const paymentGateway = new CybersourcePaymentGateway();
const queueService = new AwsSqsClient();

// Servicios de dominio
const userService = new UserService(userRepo, emailService, sessionRepo);
const orderService = new OrderService(paymentGateway, queueService, emailService);

// Controladores (usamos ConsoleView para output legible en terminal)
const view = new ConsoleView();
const userController = new UserController(userService, view);
const orderController = new OrderController(orderService, view);

// -----------------------------------------------------------------------------
// 6. EVENTOS SIMULADOS (API Gateway Mock Events)
// -----------------------------------------------------------------------------
const registerEvent = {
  body: JSON.stringify({
    email: "test@example.com",
    password: "MySecurePassword123"
  }),
  httpMethod: "POST",
  path: "/users",
  headers: { "Content-Type": "application/json" }
};

const loginEvent = {
  body: JSON.stringify({
    email: "test@example.com",
    password: "MySecurePassword123"
  }),
  httpMethod: "POST",
  path: "/users/login",
  headers: { "Content-Type": "application/json" }
};

// -----------------------------------------------------------------------------
// 7. EJECUTAR FLUJO COMPLETO
// -----------------------------------------------------------------------------
async function runLocalDemo() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║         🏗️  CLEAN ARCHITECTURE - LOCAL DEMO                  ║");
  console.log("╠══════════════════════════════════════════════════════════════╣");
  console.log("║  Usando: InMemoryUserRepository (sin Docker ni DynamoDB)    ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  try {
    // PASO 1: Registrar usuario
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ 📝 PASO 1: REGISTRAR USUARIO                                │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(`   📥 Input: ${registerEvent.body}`);

    const registerResponse = await userController.register(registerEvent);
    console.log(`   📤 Output: ${JSON.stringify(registerResponse, null, 2)}\n`);

    // PASO 2: Login
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│ 🔐 PASO 2: LOGIN                                            │");
    console.log("└─────────────────────────────────────────────────────────────┘");
    console.log(`   📥 Input: ${loginEvent.body}`);

    const loginResponse = await userController.login(loginEvent);
    console.log(`   📤 Output: ${JSON.stringify(loginResponse, null, 2)}\n`);

    // PASO 3: Logout (usando el token del login)
    if (loginResponse.statusCode === 200) {
      const loginBody = JSON.parse(loginResponse.body);
      const token = loginBody.token;

      console.log("┌─────────────────────────────────────────────────────────────┐");
      console.log("│ 🚪 PASO 3: LOGOUT                                           │");
      console.log("└─────────────────────────────────────────────────────────────┘");

      const logoutEvent = {
        body: JSON.stringify({ token }),
        httpMethod: "POST",
        path: "/users/logout",
        headers: { "Content-Type": "application/json" }
      };
      console.log(`   📥 Input: { token: "${token.slice(0, 25)}..." }`);

      const logoutResponse = await userController.logout(logoutEvent);
      console.log(`   📤 Output: ${JSON.stringify(logoutResponse, null, 2)}\n`);
    }

    console.log("╔══════════════════════════════════════════════════════════════╗");
    console.log("║  ✅ DEMO COMPLETADO EXITOSAMENTE                              ║");
    console.log("╚══════════════════════════════════════════════════════════════╝");

  } catch (error) {
    console.error("\n❌ Error durante la ejecución:", error);
    process.exit(1);
  }
}

// Run!
runLocalDemo();
