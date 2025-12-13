/**
 * Archivo: IPaymentGateway.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * Contrato para procesar pagos.
 * El dominio no sabe si se usa Stripe, PayPal, Cybersource o Lyra.
 *
 * - Para quién trabaja: Servicio de Dominio (OrderService).
 * - Intención: Abstraer el procesamiento de pagos.
 * - Misión: Definir el contrato para cobrar dinero sin atarse a un proveedor.
 */

export interface IPaymentGateway {
  processPayment(amount: number, currency: string, source: string): Promise<boolean>;
}
