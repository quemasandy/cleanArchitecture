/**
 * Archivo: IEmailService.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * Contrato para enviar correos electrónicos.
 * El dominio no sabe si se usa SendGrid, AWS SES o SMTP local.
 *
 * - Para quién trabaja: Servicios de Dominio (UserService, OrderService).
 * - Intención: Abstraer el envío de emails.
 * - Misión: Definir cómo el dominio solicita el envío de notificaciones.
 */

export interface IEmailService {
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendOrderConfirmation(email: string, orderId: string): Promise<void>;
}
