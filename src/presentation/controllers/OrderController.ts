/**
 * Archivo: OrderController.ts
 * UBICACIÓN: Capa de Presentación / Controladores (Lambda)
 *
 * Controlador específico para AWS Lambda + API Gateway.
 * Recibe el evento completo de Lambda y maneja todo el ciclo:
 * - Parseo del body
 * - Validación de entrada
 * - Delegación al servicio
 * - Formateo de respuesta
 *
 * - Para quién trabaja: AWS API Gateway.
 * - Intención: Exponer la creación de órdenes via Lambda.
 * - Misión: Manejar el ciclo completo de la petición HTTP.
 */

import { OrderService } from '../../domain/services/OrderService';
import { ApiGatewayRequestMapper } from '../mappers/ApiGatewayRequestMapper';
import { LambdaView, ApiGatewayResponse } from '../views/LambdaView';

export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly view: LambdaView
  ) {}

  async createOrder(event: any): Promise<ApiGatewayResponse> {
    console.log("\n--- [Controller] Recibiendo solicitud de orden ---");
    this.view.reset();

    try {
      // 1. Deserializar evento API Gateway a DTO
      const request = ApiGatewayRequestMapper.toCreateOrderDto(event);

      // 2. Validación
      if (!request.items || !Array.isArray(request.items) || request.items.length === 0) {
        throw new Error("Bad Request: La orden debe tener items.");
      }

      // 3. Delegación
      const order = await this.orderService.createOrder(
        request.userId, 
        request.items, 
        request.paymentSource
      );

      // 4. Respuesta
      this.view.renderSuccess(order);

    } catch (error: any) {
      console.error("[OrderController][createOrder] Error:", error);
      this.view.renderError(error.message || "Internal Server Error");
    }

    return this.view.getResponse();
  }
}
