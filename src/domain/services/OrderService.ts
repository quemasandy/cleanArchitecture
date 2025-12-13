/**
 * Archivo: OrderService.ts
 * UBICACIÓN: Capa de Dominio / Servicios
 *
 * Servicio para gestionar órdenes de compra.
 * Orquesta pagos, colas y notificaciones.
 *
 * - Para quién trabaja: La Capa de Presentación (Controladores).
 * - Intención: Gestionar el flujo de creación y procesamiento de órdenes.
 * - Misión: Validar stock, procesar pagos y persistir órdenes.
 */

import { Order } from '../entities/Order';
import { IPaymentGateway } from '../interfaces/IPaymentGateway';
import { IQueueService } from '../interfaces/IQueueService';
import { IEmailService } from '../interfaces/IEmailService';
import { Money } from '../value-objects/Money';

export class OrderService {
  constructor(
    private readonly paymentGateway: IPaymentGateway,
    private readonly queueService: IQueueService,
    private readonly emailService: IEmailService
  ) {}

  async createOrder(userId: string, items: Array<{productId: string, price: number, quantity: number}>, paymentSource: string): Promise<Order> {
    console.log(`[Dominio] Creando orden para usuario ${userId} con ${items.length} items...`);

    // 1. Crear la orden en estado PENDING (El agregado nace vacío)
    let order = new Order(Date.now().toString(), userId);

    // 2. Hidratar el agregado (Aquí se validan invariantes de cada item)
    for (const item of items) {
      // Creamos Value Object Money aquí
      const priceVO = new Money(item.price, 'USD'); // Asumimos USD para simplificar
      order.addItem(item.productId, priceVO, item.quantity);
    }
    
    // Invariante del Agregado: ¿Orden vacía?
    if (order.totalAmount.amount <= 0) { // Accedemos al valor primitivo para chequear
      throw new Error("La orden debe tener al menos un item con valor.");
    }

    const totalAmount = order.totalAmount;

    try {
      // 3. Procesar pago (usando el puerto de pago)
      // Nota: El dominio le pide al agregado "dame tu total" para cobrar. 
      // El puerto espera primitivos (number), así que desempaquetamos el VO.
      const paymentSuccess = await this.paymentGateway.processPayment(totalAmount.amount, totalAmount.currency, paymentSource);

      if (paymentSuccess) {
        // 4. Si el pago es exitoso, marcar como pagada (Mutación de estado del agregado)
        order = order.markAsPaid();
        
        // 5. Publicar evento de integración (Side Effect)
        await this.queueService.publishMessage('orders_queue', {
          type: 'ORDER_PAID',
          orderId: order.id,
          amount: totalAmount.amount,
          currency: totalAmount.currency
        });

        // 6. Enviar confirmación por email
        await this.emailService.sendOrderConfirmation("user@example.com", order.id); 
        
        console.log(`[Dominio] Orden ${order.id} procesada exitosamente. Total: ${totalAmount.toString()}`);
      } else {
        // Pago rechazado
        order = order.markAsFailed();
        console.warn(`[Dominio] Pago rechazado para orden ${order.id}.`);
      }

    } catch (error) {
      console.error(`[Dominio] Error procesando orden: ${error}`);
      order = order.markAsFailed();
    }

    return order;
  }
}
