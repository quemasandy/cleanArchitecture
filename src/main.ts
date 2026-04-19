/**
 * Archivo: main.ts
 * UBICACIÓN: Raíz (Composition Root para AWS Lambda)
 *
 * ¿QUÉ ES EL COMPOSITION ROOT?
 * - Es el ÚNICO lugar donde se ensamblan las dependencias.
 * - Aquí se crean las implementaciones concretas y se inyectan.
 * - Es el punto de entrada de la aplicación.
 *
 * PRINCIPIO DE INVERSIÓN DE DEPENDENCIAS (DIP):
 * - El dominio define interfaces (puertos).
 * - La infraestructura provee implementaciones (adaptadores).
 * - La aplicación define use cases que usan esos puertos.
 * - El Composition Root "conecta" todo.
 *
 * GRAFO DE DEPENDENCIAS (de adentro hacia afuera):
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                        DOMINIO                                 │
 * │  Entities, Value Objects, Interfaces (Puertos), Domain Services│
 * ├─────────────────────────────────────────────────────────────────┤
 * │                      APLICACIÓN                                │
 * │  Use Cases: RegisterUser, LoginUser, LogoutUser, CreateOrder   │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                    INFRAESTRUCTURA                              │
 * │  DynamoDB, SMTP, Cybersource, SQS (adaptadores)               │
 * ├─────────────────────────────────────────────────────────────────┤
 * │                     PRESENTACIÓN                               │
 * │  Controllers, Views, Serializers, DTOs                         │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * HANDLERS EXPORTADOS:
 * - registerUserHandler: POST /users → Registro de usuarios
 * - loginUserHandler: POST /users/login → Autenticación
 * - logoutUserHandler: POST /users/logout → Cierre de sesión
 * - createOrderHandler: POST /orders → Creación de órdenes
 */

// --- IMPORTACIONES (siguiendo el orden del grafo) ---

// Importamos Views (Presentación)
import { LambdaView } from './presentation/views/LambdaView';

// Importamos Interfaces / Puertos (Dominio)
import { IUserRepository } from './domain/interfaces/IUserRepository';
import { ISessionRepository } from './domain/interfaces/ISessionRepository';
import { IEmailService } from './domain/interfaces/IEmailService';
import { IPaymentGateway } from './domain/interfaces/IPaymentGateway';
import { IQueueService } from './domain/interfaces/IQueueService';

// Importamos Implementaciones / Adaptadores (Infraestructura)
import { SmtpEmailClient } from './infrastructure/email/SmtpEmailClient'; 
import { CybersourcePaymentGateway } from './infrastructure/payment/CybersourcePaymentGateway';
import { AwsSqsClient } from './infrastructure/queue/AwsSqsClient';
import { DynamoDbUserRepository } from './infrastructure/repositories/DynamoDbUserRepository';
import { DynamoDbSessionRepository } from './infrastructure/repositories/DynamoDbSessionRepository';

// Domain Services (lógica de negocio pura, sin dependencias externas)
import { UserPolicyService } from './domain/services/UserPolicyService';

// Use Cases (Aplicación — orquestadores que coordinan dominio + puertos)
import { RegisterUser } from './application/use-cases/RegisterUser';
import { LoginUser } from './application/use-cases/LoginUser';
import { LogoutUser } from './application/use-cases/LogoutUser';
import { CreateOrder } from './application/use-cases/CreateOrder';

// Controladores de Presentación
import { UserController } from './presentation/controllers/UserController';
import { OrderController } from './presentation/controllers/OrderController';

// --- COMPOSICIÓN DEL GRAFO (Singleton fuera del handler para reutilización) ---

// 1. Configuración - Validar variables de entorno requeridas
const usersTable = process.env.USERS_TABLE;
if (!usersTable) {
    throw new Error("USERS_TABLE environment variable is not set. DynamoDbUserRepository requires a table name.");
}

// 2. Infraestructura - Instanciar implementaciones concretas (Adaptadores)
//    Estas son las únicas líneas del proyecto que mencionan tecnologías concretas.
//    Si mañana cambiamos DynamoDB por PostgreSQL, solo tocamos ESTAS líneas.
const userRepo: IUserRepository = new DynamoDbUserRepository(usersTable); 
// SINGLE-TABLE DESIGN: Sesiones y usuarios comparten la misma tabla
const sessionRepo: ISessionRepository = new DynamoDbSessionRepository(usersTable);
const emailService: IEmailService = new SmtpEmailClient();
const paymentGateway: IPaymentGateway = new CybersourcePaymentGateway(); 
const queueService: IQueueService = new AwsSqsClient();

// 3. Dominio - Domain services puros (sin dependencias de infraestructura)
//    A diferencia de los use cases, estos NO reciben puertos.
//    Solo contienen reglas de negocio puras.
const userPolicy = new UserPolicyService();

// 4. Aplicación - Use cases con dependencias inyectadas
//    Cada use case recibe EXACTAMENTE los puertos que necesita.
//    RegisterUser necesita repo + email + policy.
//    LogoutUser solo necesita sessionRepo.
//    Esto es el Principio de Segregación de Interfaces (ISP) en acción.
const registerUser = new RegisterUser(userRepo, emailService, userPolicy);
const loginUser = new LoginUser(userRepo, sessionRepo, userPolicy);
const logoutUser = new LogoutUser(sessionRepo);
const createOrder = new CreateOrder(paymentGateway, queueService, emailService);

// 5. Presentación - Controladores con use cases inyectados
//    Los controllers ya NO conocen "UserService" ni "OrderService".
//    Solo conocen use cases granulares.
const view = new LambdaView();
const userController = new UserController(registerUser, loginUser, logoutUser, view);
const orderController = new OrderController(createOrder, view);

// --- HANDLERS EXPORTADOS ---

/**
 * Handler para registrar usuarios via API Gateway
 * Event: POST /users
 */
export const registerUserHandler = async (event: any) => userController.register(event);

/**
 * Handler para iniciar sesión de usuarios via API Gateway
 * Event: POST /users/login
 */
export const loginUserHandler = async (event: any) => userController.login(event);

/**
 * Handler para cerrar sesión de usuarios via API Gateway
 * Event: POST /users/logout
 *
 * FLUJO:
 * 1. Recibe token en el body
 * 2. UserController.logout() → LogoutUser.execute()
 * 3. Elimina la sesión de DynamoDB
 * 4. Retorna mensaje de éxito
 */
export const logoutUserHandler = async (event: any) => userController.logout(event);

/**
 * Handler para crear órdenes via API Gateway
 * Event: POST /orders
 */
export const createOrderHandler = async (event: any) => orderController.handleCreateOrder(event);

// Test improvements - código con problemas intencionales para que autofix-pr los arregle
import { LambdaView as UnusedView } from './presentation/views/LambdaView'
const debugVar: any = "unused"
function testFunction( ){return null}
