/**
 * Archivo: main.ts
 * UBICACIÓN: Raíz de la Aplicación (Composition Root)
 *
 * Aquí es donde ocurre la MAGIA de la Inyección de Dependencias.
 * Decidimos QUÉ implementaciones usar sin tocar el código de negocio.
 *
 * - Para quién trabaja: El equipo de Desarrollo / DevOps.
 * - Intención: Componer el grafo de dependencias de la aplicación.
 * - Misión: Inicializar e inyectar las dependencias correctas para el entorno actual.
 */

// Importamos Interfaces (Puertos)
import { IUserRepository } from './domain/interfaces/IUserRepository';
import { IEmailService } from './domain/interfaces/IEmailService';
import { IPaymentGateway } from './domain/interfaces/IPaymentGateway';
import { IQueueService } from './domain/interfaces/IQueueService';

// Importamos Implementaciones (Adaptadores)
import { SqlUserRepository } from './infrastructure/repositories/SqlUserRepository';
import { MongoUserRepository } from './infrastructure/repositories/MongoUserRepository';
import { SmtpEmailClient } from './infrastructure/email/SmtpEmailClient';
import { CybersourcePaymentGateway } from './infrastructure/payment/CybersourcePaymentGateway';
import { LyraPaymentGateway } from './infrastructure/payment/LyraPaymentGateway';
import { AwsSqsClient } from './infrastructure/queue/AwsSqsClient';
import { RabbitMqClient } from './infrastructure/queue/RabbitMqClient';

// Importamos Servicios de Dominio
import { UserService } from './domain/services/UserService';
import { OrderService } from './domain/services/OrderService';

// Importamos Controladores y Vistas
import { UserController } from './presentation/controllers/UserController';
import { OrderController } from './presentation/controllers/OrderController';
import { ConsoleView } from './presentation/views/ConsoleView';

async function main() {
  console.log("🚀 Iniciando Sistema con Arquitectura Limpia...\n");

  // 1. CAPA DE INFRAESTRUCTURA (Elegimos las herramientas)
  // Podemos cambiar estas líneas y TODO el sistema cambia de tecnología
  // sin tocar una sola línea de lógica de negocio.
  
  // const userRepo: IUserRepository = new SqlUserRepository(); // Opción A
  const userRepo: IUserRepository = new MongoUserRepository(); // Opción B

  const emailService: IEmailService = new SmtpEmailClient();
  
  // const paymentGateway: IPaymentGateway = new CybersourcePaymentGateway(); // Opción A
  const paymentGateway: IPaymentGateway = new LyraPaymentGateway(); // Opción B

  const queueService: IQueueService = new AwsSqsClient();
  // const queueService: IQueueService = new RabbitMqClient();

  // 2. CAPA DE DOMINIO (Inyectamos las herramientas)
  const userService = new UserService(userRepo, emailService);
  const orderService = new OrderService(paymentGateway, queueService, emailService);

  // 3. CAPA DE PRESENTACIÓN (Conectamos con el mundo exterior)
  const view = new ConsoleView();
  const userController = new UserController(userService, view);
  const orderController = new OrderController(orderService, view);

  // --- SIMULACIÓN DE USO ---

  // CASO 1: Registrar Usuario
  console.log("Llamo [userController.register]");
  await userController.register({ 
    email: "andy@gmail.com", 
    // email: "andy@evil.com", 
    password: "superSecurePassword" 
  });

  // CASO 2: Crear Orden con Items (Ejemplo de Agregado)
  await orderController.createOrder({
    userId: "user_123",
    items: [
      { productId: "p1", price: 50.00, quantity: 1 },
      { productId: "p2", price: 100.00, quantity: 1 } // Total should be 150.00
    ],
    paymentSource: "tok_visa_4242"
  });

  // CASO 3: Intento de registro fallido (Regla de Negocio)
  await userController.register({ 
    email: "hacker@evil.com", 
    password: "123" 
  });
}

main().catch(console.error);
