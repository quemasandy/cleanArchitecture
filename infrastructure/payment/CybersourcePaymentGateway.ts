/**
 * Archivo: CybersourcePaymentGateway.ts
 * UBICACIÓN: Capa de Infraestructura / Payment
 *
 * Implementación concreta para Cybersource.
 *
 * - Para quién trabaja: Servicio de Órdenes (IPaymentGateway).
 * - Intención: Procesar pagos con Cybersource.
 * - Misión: Integrarse con la API de Cybersource para autorizar transacciones.
 */

import { IPaymentGateway } from '../../domain/interfaces/IPaymentGateway';

export class CybersourcePaymentGateway implements IPaymentGateway {
  async processPayment(amount: number, currency: string, source: string): Promise<boolean> {
    console.log(`[Infra - Cybersource] Iniciando transacción SOAP/REST...`);
    console.log(`[Infra - Cybersource] Cobrando ${amount} ${currency} a tarjeta ${source}`);
    return true; // Simula éxito
  }
}
