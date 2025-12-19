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
 * - El Composition Root "conecta" todo.
 *
 * HANDLERS EXPORTADOS:
 * - registerUserHandler: POST /users → Registro de usuarios
 * - loginUserHandler: POST /users/login → Autenticación
 * - logoutUserHandler: POST /users/logout → Cierre de sesión
 * - createOrderHandler: POST /orders → Creación de órdenes
 */

// Importamos Views
import { LambdaView } from './presentation/views/LambdaView';

// Importamos Interfaces (Puertos del Dominio)
import { IUserRepository } from './domain/interfaces/IUserRepository';
import { ISessionRepository } from './domain/interfaces/ISessionRepository';
import { IEmailService } from './domain/interfaces/IEmailService';
import { IPaymentGateway } from './domain/interfaces/IPaymentGateway';
import { IQueueService } from './domain/interfaces/IQueueService';

// Importamos Implementaciones (Adaptadores de Infraestructura)
import { SmtpEmailClient } from './infrastructure/email/SmtpEmailClient'; 
import { CybersourcePaymentGateway } from './infrastructure/payment/CybersourcePaymentGateway';
import { AwsSqsClient } from './infrastructure/queue/AwsSqsClient';
import { DynamoDbUserRepository } from './infrastructure/repositories/DynamoDbUserRepository';
import { DynamoDbSessionRepository } from './infrastructure/repositories/DynamoDbSessionRepository';

// Servicios de Dominio
import { UserService } from './domain/services/UserService';
import { OrderService } from './domain/services/OrderService';

// Controladores de Presentación
import { UserController } from './presentation/controllers/UserController';
import { OrderController } from './presentation/controllers/OrderController';

// --- COMPOSICIÓN DEL GRAFO (Singleton fuera del handler para reutilización) ---

// 1. Configuración - Validar variables de entorno requeridas
const usersTable = process.env.USERS_TABLE;
if (!usersTable) {
    throw new Error("USERS_TABLE environment variable is not set. DynamoDbUserRepository requires a table name.");
}

// 2. Infraestructura - Instanciar implementaciones concretas
const userRepo: IUserRepository = new DynamoDbUserRepository(usersTable); 
// SINGLE-TABLE DESIGN: Sesiones y usuarios comparten la misma tabla
const sessionRepo: ISessionRepository = new DynamoDbSessionRepository(usersTable);
const emailService: IEmailService = new SmtpEmailClient();
const paymentGateway: IPaymentGateway = new CybersourcePaymentGateway(); 
const queueService: IQueueService = new AwsSqsClient();

// 3. Dominio - Servicios con dependencias inyectadas
const userService = new UserService(userRepo, emailService, sessionRepo);
const orderService = new OrderService(paymentGateway, queueService, emailService);

// 4. Presentación - Controladores con servicios inyectados
const view = new LambdaView();
const userController = new UserController(userService, view);
const orderController = new OrderController(orderService, view);

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
 * 2. UserController.logout() → UserService.logoutUser()
 * 3. Elimina la sesión de DynamoDB
 * 4. Retorna mensaje de éxito
 */
export const logoutUserHandler = async (event: any) => userController.logout(event);

/**
 * Handler para crear órdenes via API Gateway
 * Event: POST /orders
 */
export const createOrderHandler = async (event: any) => orderController.createOrder(event);

