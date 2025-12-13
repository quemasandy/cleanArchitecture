/**
 * Archivo: AwsSqsClient.ts
 * UBICACIÓN: Capa de Infraestructura / Queue
 *
 * Implementación concreta para AWS SQS.
 *
 * - Para quién trabaja: Servicios de Dominio (IQueueService).
 * - Intención: Publicar mensajes en colas SQS.
 * - Misión: Enviar eventos de dominio a la nube de AWS.
 */

import { IQueueService } from '../../domain/interfaces/IQueueService';

export class AwsSqsClient implements IQueueService {
  async publishMessage(queueName: string, message: any): Promise<void> {
    console.log(`[Infra - AWS SQS] Enviando mensaje a https://sqs.us-east-1.amazonaws.com/123/${queueName}`);
    console.log(`[Infra - AWS SQS] Body: ${JSON.stringify(message)}`);
  }
}
