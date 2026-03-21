/**
 * Archivo: IPaymentGateway.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * ¿QUÉ ES UN PUERTO (PORT)?
 * - Es un contrato que define QUÉ necesita el sistema para funcionar.
 * - Vive en DOMINIO para respetar la Dependency Rule, pero es
 *   CONSUMIDO por los Use Cases (capa de Aplicación).
 *
 * Contrato para procesar pagos.
 * El dominio no sabe si se usa Stripe, PayPal, Cybersource o Lyra.
 *
 * - Para quién trabaja: Use Case CreateOrder en la capa de Aplicación.
 * - Intención: Abstraer el procesamiento de pagos.
 * - Misión: Definir el contrato para cobrar dinero sin atarse a un proveedor.
 */

export interface IPaymentGateway {
  processPayment(amount: number, currency: string, source: string): Promise<boolean>;
}
