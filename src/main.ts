import 'dotenv/config'; // Carga variables de .env si existe (útil para local)
/**
 * Archivo: main.ts
 * UBICACIÓN: Raíz (Composition Root para AWS Lambda)
 * 
 * Este archivo es el punto de entrada principal para AWS Lambda.
 * Su responsabilidad es componer el grafo de dependencias y exportar los handlers.
 */

import { ApiGatewayAdapter } from './presentation/lambda/ApiGatewayAdapter';
import { CapturingView } from './presentation/lambda/CapturingView';

// Importamos Interfaces
import { IUserRepository } from './domain/interfaces/IUserRepository';
import { IEmailService } from './domain/interfaces/IEmailService';
import { IPaymentGateway } from './domain/interfaces/IPaymentGateway';
import { IQueueService } from './domain/interfaces/IQueueService';

// Importamos Implementaciones (Mocks para Lambda/Pruebas)
import { InMemoryUserRepository } from './infrastructure/repositories/InMemoryUserRepository';
// Podemos reutilizar implementaciones reales o mocks según la config
import { SmtpEmailClient } from './infrastructure/email/SmtpEmailClient'; 
import { CybersourcePaymentGateway } from './infrastructure/payment/CybersourcePaymentGateway';
import { AwsSqsClient } from './infrastructure/queue/AwsSqsClient';

// Servicios
import { UserService } from './domain/services/UserService';
import { OrderService } from './domain/services/OrderService';

// Controladores
import { UserController } from './presentation/controllers/UserController';
import { OrderController } from './presentation/controllers/OrderController';

// --- COMPOSICIÓN DEL GRAFO (Singleton fuera del handler para reutilización) ---

// 1. Infraestructura
// NOTA: Usamos InMemory para probar que la Lambda funciona sin depender de DB externa por ahora.
// En producción, aquí instanciarías MongoUserRepository o DynamoDBUserRepository
import { DynamoDbUserRepository } from './infrastructure/repositories/DynamoDbUserRepository';

// 1. Infraestructura
const usersTable = process.env.USERS_TABLE;
if (!usersTable) {
    throw new Error("USERS_TABLE environment variable is not set. DynamoDbUserRepository requires a table name.");
}
const userRepo: IUserRepository = new DynamoDbUserRepository(usersTable); 
const emailService: IEmailService = new SmtpEmailClient();
// Nota: Puedes crear versiones Mock de Payment y Queue si no quieres credenciales reales aun
const paymentGateway: IPaymentGateway = new CybersourcePaymentGateway(); 
const queueService: IQueueService = new AwsSqsClient();

// 2. Dominio
const userService = new UserService(userRepo, emailService);
const orderService = new OrderService(paymentGateway, queueService, emailService);

// 3. Presentación
// Usamos CapturingView para poder devolver la respuesta HTTP
const view = new CapturingView();
const userController = new UserController(userService, view);
const orderController = new OrderController(orderService, view);

// --- HANDLERS EXPORTADOS ---

/**
 * Handler para registrar usuarios via API Gateway
 * Event: POST /users
 */
export const registerUserHandler = async (event: any) => {
    return ApiGatewayAdapter.handle(async (body) => {
        view.reset();
        await userController.register(body);
        
        if (view.hasError) {
            throw new Error(view.lastError || "Unknown Error");
        }
        return view.lastSuccess;
    }, event);
};

/**
 * Handler para crear órdenes via API Gateway
 * Event: POST /orders
 */
export const createOrderHandler = async (event: any) => {
    return ApiGatewayAdapter.handle(async (body) => {
        view.reset();
        await orderController.createOrder(body);

        if (view.hasError) {
             throw new Error(view.lastError || "Unknown Error");
        }
        return view.lastSuccess;
    }, event);
};
