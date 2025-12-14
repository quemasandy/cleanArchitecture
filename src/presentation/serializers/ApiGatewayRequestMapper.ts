/**
 * Archivo: ApiGatewayRequestMapper.ts
 * UBICACIÓN: Capa de Presentación / Serializers
 *
 * Mapper para transformar eventos de API Gateway a DTOs.
 * AWS envía el body como string JSON, este mapper lo convierte a objetos tipados.
 *
 * - Para quién trabaja: Controladores Lambda.
 * - Intención: Deserializar el input de API Gateway.
 * - Misión: Transformar eventos crudos de AWS en DTOs utilizables.
 */

import { RegisterUserDto } from '../dtos/RegisterUserDto';
import { CreateOrderDto } from '../dtos/CreateOrderDto';

export class ApiGatewayRequestMapper {
    /**
     * Extrae y parsea el body de un evento API Gateway.
     */
    static parseBody<T>(event: any): T {
        console.log("Incoming Event Body:", event?.body);
        const body = typeof event?.body === 'string' 
            ? JSON.parse(event.body) 
            : event?.body || {};
        return body as T;
    }

    /**
     * Convierte un evento API Gateway a RegisterUserDto.
     */
    static toRegisterUserDto(event: any): RegisterUserDto {
        return this.parseBody<RegisterUserDto>(event);
    }

    /**
     * Convierte un evento API Gateway a CreateOrderDto.
     */
    static toCreateOrderDto(event: any): CreateOrderDto {
        return this.parseBody<CreateOrderDto>(event);
    }
}
