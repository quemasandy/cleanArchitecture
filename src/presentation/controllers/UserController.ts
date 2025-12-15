/**
 * Archivo: UserController.ts
 * UBICACIÓN: Capa de Presentación / Controladores (Lambda)
 *
 * Controlador específico para AWS Lambda + API Gateway.
 * Recibe el evento completo de Lambda y maneja todo el ciclo:
 * - Parseo del body
 * - Validación de entrada
 * - Delegación al servicio
 * - Formateo de respuesta
 *
 * - Para quién trabaja: AWS API Gateway.
 * - Intención: Exponer el registro de usuarios via Lambda.
 * - Misión: Manejar el ciclo completo de la petición HTTP.
 */

import { UserService } from '../../domain/services/UserService';
import { UserSerializer } from '../serializers/UserSerializer';
import { ApiGatewayRequestMapper } from '../mappers/ApiGatewayRequestMapper';
import { LambdaView, ApiGatewayResponse } from '../views/LambdaView';

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly view: LambdaView
  ) {}

  async register(event: any): Promise<ApiGatewayResponse> {
    console.log("\n--- [Controller] Recibiendo solicitud de registro ---");
    this.view.reset();

    try {
      // 1. Deserializar evento API Gateway a DTO
      const request = ApiGatewayRequestMapper.toRegisterUserDto(event);

      // 2. Validación básica de entrada
      console.log("[UserController][register] Validando entrada...");
      if (!request.email || !request.email.includes('@')) {
        throw new Error("Bad Request: Email inválido");
      }
      if (!request.password || request.password.length < 6) {
        throw new Error("Bad Request: Password muy corto");
      }

      // 3. Delegación al Servicio de Dominio
      console.log("[UserController][register] Delegando al Servicio de Dominio...")
      const user = await this.userService.registerUser(request.email, request.password);

      // 4. Serialización y Respuesta
      const response = UserSerializer.serialize(user);
      this.view.renderSuccess(response);

    } catch (error: any) {
      console.error("[UserController][register] Error:", error);
      this.view.renderError(error.message || "Internal Server Error");
    }

    return this.view.getResponse();
  }

  async login(event: any): Promise<ApiGatewayResponse> {
    this.view.reset();

    try {
      const request = ApiGatewayRequestMapper.toLoginUserDto(event);

      if (!request.email || !request.email.includes('@')) {
        throw new Error("Bad Request: Invalid email");
      }
      if (!request.password || request.password.length < 6) {
        throw new Error("Bad Request: Invalid password");
      }

      // 3. Delegación al Servicio de Dominio
      console.log("[UserController][login] Delegando al Servicio de Dominio...")
      const {user, token} = await this.userService.loginUser(request.email, request.password);

      // 4. Serialización y Respuesta
      const userResponse = UserSerializer.serialize(user);
      this.view.renderSuccess({user: userResponse, token});

    } catch (error: any) {
      console.error("[UserController][login] Error:", error);
      this.view.renderError(error.message || "Internal Server Error");
    }

    return this.view.getResponse();
  }
}
