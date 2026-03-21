/**
 * Archivo: IQueueService.ts
 * UBICACIÓN: Capa de Dominio / Interfaces (Puertos)
 *
 * ¿QUÉ ES UN PUERTO (PORT)?
 * - Es un contrato que define QUÉ necesita el sistema para funcionar.
 * - Vive en DOMINIO para respetar la Dependency Rule, pero es
 *   CONSUMIDO por los Use Cases (capa de Aplicación).
 *
 * Contrato para enviar mensajes a colas.
 * El dominio no sabe si se usa AWS SQS, RabbitMQ o Kafka.
 *
 * - Para quién trabaja: Use Case CreateOrder en la capa de Aplicación.
 * - Intención: Abstraer la mensajería asíncrona.
 * - Misión: Permitir a la aplicación publicar eventos sin conocer el bus de mensajes.
 */

export interface IQueueService {
  publishMessage(queueName: string, message: any): Promise<void>;
}
