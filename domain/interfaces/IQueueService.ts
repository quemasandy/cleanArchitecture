/**
 * Archivo: IQueueService.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * Contrato para enviar mensajes a colas.
 * El dominio no sabe si se usa AWS SQS, RabbitMQ o Kafka.
 *
 * - Para quién trabaja: Servicio de Dominio (OrderService).
 * - Intención: Abstraer la mensajería asíncrona.
 * - Misión: Permitir al dominio publicar eventos sin conocer el bus de mensajes.
 */

export interface IQueueService {
  publishMessage(queueName: string, message: any): Promise<void>;
}
