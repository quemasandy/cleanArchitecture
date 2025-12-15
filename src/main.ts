/**
 * Archivo: main.ts
 * UBICACIÓN: Raíz (Composition Root para AWS Lambda)
 * 
 * Este archivo es el punto de entrada principal para AWS Lambda.
 * Su responsabilidad es componer el grafo de dependencias y exportar los handlers.
 */

// Importamos Views
import { LambdaView } from './presentation/views/LambdaView';

// Importamos Interfaces
import { IUserRepository } from './domain/interfaces/IUserRepository';
import { IEmailService } from './domain/interfaces/IEmailService';
import { IPaymentGateway } from './domain/interfaces/IPaymentGateway';
import { IQueueService } from './domain/interfaces/IQueueService';

// Importamos Implementaciones
import { SmtpEmailClient } from './infrastructure/email/SmtpEmailClient'; 
import { CybersourcePaymentGateway } from './infrastructure/payment/CybersourcePaymentGateway';
import { AwsSqsClient } from './infrastructure/queue/AwsSqsClient';
import { DynamoDbUserRepository } from './infrastructure/repositories/DynamoDbUserRepository';

// Servicios
import { UserService } from './domain/services/UserService';
import { OrderService } from './domain/services/OrderService';

// Controladores
import { UserController } from './presentation/controllers/UserController';
import { OrderController } from './presentation/controllers/OrderController';

// --- COMPOSICIÓN DEL GRAFO (Singleton fuera del handler para reutilización) ---

// 1. Infraestructura
const usersTable = process.env.USERS_TABLE;
if (!usersTable) {
    throw new Error("USERS_TABLE environment variable is not set. DynamoDbUserRepository requires a table name.");
}
const userRepo: IUserRepository = new DynamoDbUserRepository(usersTable); 
const emailService: IEmailService = new SmtpEmailClient();
const paymentGateway: IPaymentGateway = new CybersourcePaymentGateway(); 
const queueService: IQueueService = new AwsSqsClient();

// 2. Dominio
const userService = new UserService(userRepo, emailService);
const orderService = new OrderService(paymentGateway, queueService, emailService);

// 3. Presentación - LambdaView devuelve directamente formato API Gateway
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
 * Handler para crear órdenes via API Gateway
 * Event: POST /orders
 */
export const createOrderHandler = async (event: any) => orderController.createOrder(event);
