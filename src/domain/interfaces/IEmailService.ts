/**
 * Archivo: IEmailService.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * ¿QUÉ ES UN PUERTO (PORT)?
 * - Es un contrato que define QUÉ necesita el sistema para funcionar.
 * - NO dice CÓMO se hace (eso es problema de la infraestructura).
 * - Vive en DOMINIO para respetar la Dependency Rule, pero es
 *   CONSUMIDO por los Use Cases (capa de Aplicación).
 *
 * Contrato para enviar correos electrónicos.
 * El dominio no sabe si se usa SendGrid, AWS SES o SMTP local.
 *
 * - Para quién trabaja: Use Cases (RegisterUser, CreateOrder) en la capa de Aplicación.
 * - Intención: Abstraer el envío de emails.
 * - Misión: Definir cómo la aplicación solicita el envío de notificaciones.
 */

export interface IEmailService {
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendOrderConfirmation(email: string, orderId: string): Promise<void>;
}
