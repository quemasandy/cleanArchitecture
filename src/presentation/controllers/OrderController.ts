/**
 * Archivo: OrderController.ts
 * UBICACIÓN: Capa de Presentación / Controladores
 *
 * Controlador para gestionar órdenes.
 *
 * - Para quién trabaja: Cliente HTTP / API Consumer.
 * - Intención: Exponer la funcionalidad de órdenes a través de una API.
 * - Misión: Validar requests, invocar OrderService y devolver respuestas formateadas.
 */

import { OrderService } from '../../domain/services/OrderService';
import { CreateOrderDto } from '../dtos/CreateOrderDto';
import { ConsoleView } from '../views/ConsoleView';

export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly view: ConsoleView
  ) {}

  async createOrder(request: CreateOrderDto): Promise<void> {
    console.log("\n--- [Controller] Recibiendo solicitud de orden ---");

    try {
      // 1. Validación (Ahora validamos la lista de items)
      if (!request.items || !Array.isArray(request.items) || request.items.length === 0) {
        throw new Error("Bad Request: La orden debe tener items.");
      }

      // 2. Delegación
      const order = await this.orderService.createOrder(
        request.userId, 
        request.items, 
        request.paymentSource
      );

      // 3. Respuesta
      this.view.renderSuccess(order);

    } catch (error: any) {
      this.view.renderError(error.message);
    }
  }
}
