/**
 * Archivo: RabbitMqClient.ts
 * UBICACIÓN: Capa de Infraestructura / Queue
 *
 * Implementación concreta para RabbitMQ (u otro cloud).
 *
 * - Para quién trabaja: Servicios de Dominio (IQueueService).
 * - Intención: Publicar mensajes en RabbitMQ.
 * - Misión: Enviar eventos a exchanges/colas para procesamiento asíncrono.
 */

import { IQueueService } from '../../domain/interfaces/IQueueService';

export class RabbitMqClient implements IQueueService {
  async publishMessage(queueName: string, message: any): Promise<void> {
    console.log(`[Infra - RabbitMQ] Publicando en exchange 'events', routingKey '${queueName}'`);
    console.log(`[Infra - RabbitMQ] Payload: ${JSON.stringify(message)}`);
  }
}
