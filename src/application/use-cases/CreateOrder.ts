/**
 * Archivo: CreateOrder.ts
 * UBICACIÓN: Capa de Application / Use Cases
 *
 * ¿QUÉ ES UN USE CASE (CASO DE USO)?
 * - Orquesta un flujo de negocio completo, coordinando el aggregate root
 *   Order con los puertos de pago, cola y email.
 * - NO contiene reglas de negocio (esas viven en Order y sus invariantes).
 * - NO conoce HTTP, Lambda, ni frameworks (eso es presentación).
 *
 * - Para quién trabaja: La Capa de Presentación (Controllers).
 * - Intención: Orquestar el flujo completo de creación de una orden.
 * - Misión: Coordinar aggregate, pago, eventos y notificaciones.
 *
 * ANALOGÍA DEL RESTAURANTE:
 * Este use case es el "jefe de cocina" que coordina:
 * - Recibe la orden (input)
 * - Le pide a la cocina (Order aggregate) que prepare los items
 * - Le pide a la caja (IPaymentGateway) que cobre
 * - Le avisa al mesero (IQueueService) que la orden está lista
 * - Le manda un recibo (IEmailService) al cliente
 *
 * Pero el jefe de cocina NO SABE la receta (reglas de negocio).
 * Eso lo sabe el cocinero (la entidad Order).
 *
 * FLUJO:
 * 1. Crear Order aggregate en estado PENDING
 * 2. Hidratar con items (el aggregate valida sus invariantes)
 * 3. Procesar pago vía gateway
 * 4. Si pago exitoso → marcar como PAID, publicar evento, enviar email
 * 5. Si pago falla → marcar como FAILED
 */

import { Order } from '../../domain/entities/Order';
import { Money } from '../../domain/value-objects/Money';
import { IPaymentGateway } from '../../domain/interfaces/IPaymentGateway';
import { IQueueService } from '../../domain/interfaces/IQueueService';
import { IEmailService } from '../../domain/interfaces/IEmailService';

export class CreateOrder {
  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly queueService: IQueueService,
    private readonly emailService: IEmailService
  ) {}

  /**
   * Ejecuta el caso de uso de creación de orden.
   *
   * PARÁMETROS:
   * - userId: ID del usuario que crea la orden
   * - items: Array de items con datos primitivos (price en number)
   * - paymentSource: Identificador del método de pago (token de tarjeta, etc.)
   *
   * ¿POR QUÉ RECIBE PRIMITIVOS Y NO VALUE OBJECTS?
   * Los use cases son la frontera entre presentación y dominio.
   * Reciben datos crudos y los transforman en objetos de dominio (VOs, entities).
   * Esto mantiene la presentación libre de conocimiento del dominio.
   */
  async execute(
    userId: string,
    items: Array<{productId: string, price: number, quantity: number}>,
    paymentSource: string
  ): Promise<Order> {
    // 1. Crear el aggregate root en estado PENDING
    //    El Order nace vacío y se hidrata con items luego.
    let order = new Order(Date.now().toString(), userId);

    // 2. Hidratar el aggregate con items
    //    AQUÍ EL DOMINIO DECIDE: el aggregate Order valida sus invariantes.
    //    Si status !== 'PENDING' → lanza error.
    //    Si quantity <= 0 → OrderItem lanza error.
    //    Si price < 0 → Money VO lanza error.
    //    El use case NO repite estas validaciones, confía en el dominio.
    for (const item of items) {
      const priceVO = new Money(item.price, 'USD');
      order = order.addItem(item.productId, priceVO, item.quantity);
    }

    // Invariante del Aggregate: la orden debe tener valor positivo
    if (order.totalAmount.amount <= 0) {
      throw new Error("La orden debe tener al menos un item con valor.");
    }

    const totalAmount = order.totalAmount;

    try {
      // 3. COORDINACIÓN: Procesar pago vía puerto de pago
      //    El use case le pide al aggregate "dame tu total" (dominio decide el monto)
      //    y luego coordina el cobro con el gateway (efecto externo).
      const paymentSuccess = await this.paymentGateway.processPayment(
        totalAmount.amount,
        totalAmount.currency,
        paymentSource
      );

      if (paymentSuccess) {
        // 4. COORDINACIÓN: Pago exitoso → transicionar estado + side effects
        //    markAsPaid() es DOMINIO (transición de estado del aggregate).
        //    publishMessage() y sendOrderConfirmation() son SIDE EFFECTS.
        order = order.markAsPaid();

        // 5. Publicar evento de integración (side effect)
        await this.queueService.publishMessage('orders_queue', {
          type: 'ORDER_PAID',
          orderId: order.id,
          amount: totalAmount.amount,
          currency: totalAmount.currency
        });

        // 6. Enviar confirmación por email (side effect)
        await this.emailService.sendOrderConfirmation("user@example.com", order.id);
      } else {
        // Pago rechazado → transicionar a FAILED (dominio decide la transición)
        order = order.markAsFailed();
      }

    } catch (error) {
      // Error inesperado → marcar como fallido
      //    El use case MANEJA errores del flujo; el dominio no sabe de errores de red.
      order = order.markAsFailed();
    }

    return order;
  }
}
