/**
 * Archivo: CreateOrderDto.ts
 * UBICACIÓN: Capa de Presentación / DTOs
 *
 * Estructura de datos para crear una orden.
 *
 * - Para quién trabaja: OrderController.
 * - Intención: Transportar los datos necesarios para crear una orden.
 * - Misión: Validar la forma del payload JSON recibido en el body del request.
 */

export interface CreateOrderDto {
  userId: string;
  items: Array<{
    productId: string;
    price: number;
    quantity: number;
  }>;
  paymentSource: string; // Token de tarjeta, ID de cuenta, etc.
}
