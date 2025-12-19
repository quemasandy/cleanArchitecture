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
 * - Intención: Exponer operaciones de usuario via Lambda.
 * - Misión: Manejar el ciclo completo de la petición HTTP.
 *
 * MÉTODOS DISPONIBLES:
 * - register: Registro de nuevos usuarios (POST /users)
 * - login: Autenticación de usuarios (POST /users/login)
 * - logout: Cierre de sesión (POST /users/logout)
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

  /**
   * Handler para registro de usuarios.
   * 
   * FLUJO:
   * 1. Parsear request de API Gateway → RegisterUserDto
   * 2. Validar datos de entrada (validación de presentación)
   * 3. Delegar al UserService.registerUser()
   * 4. Serializar respuesta y renderizar éxito/error
   */
  async register(event: any): Promise<ApiGatewayResponse> {
    console.log("\n--- [Controller] Recibiendo solicitud de registro ---");
    this.view.reset();

    try {
      // 1. Deserializar evento API Gateway a DTO
      const request = ApiGatewayRequestMapper.toRegisterUserDto(event);

      // 2. Validación básica de entrada (capa de presentación)
      // NOTA: Esta es validación de formato, NO reglas de negocio
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

  /**
   * Handler para login de usuarios.
   * 
   * FLUJO:
   * 1. Parsear request de API Gateway → LoginUserDto
   * 2. Validar datos de entrada
   * 3. Delegar al UserService.loginUser()
   * 4. Retornar usuario serializado + token
   */
  async login(event: any): Promise<ApiGatewayResponse> {
    console.log("\n--- [Controller] Recibiendo solicitud de login ---");
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

  /**
   * Handler para logout de usuarios.
   * 
   * FLUJO:
   * 1. Parsear request de API Gateway → LogoutUserDto
   * 2. Validar que el token esté presente
   * 3. Delegar al UserService.logoutUser()
   * 4. Retornar mensaje de éxito
   * 
   * IDEMPOTENCIA:
   * - Múltiples llamadas con el mismo token no causan errores.
   * - Si la sesión ya fue cerrada, simplemente retorna éxito.
   */
  async logout(event: any): Promise<ApiGatewayResponse> {
    console.log("\n--- [Controller] Recibiendo solicitud de logout ---");
    this.view.reset();

    try {
      // 1. Deserializar evento API Gateway a DTO
      const request = ApiGatewayRequestMapper.toLogoutUserDto(event);

      // 2. Validación básica de entrada
      if (!request.token) {
        throw new Error("Bad Request: Token requerido");
      }

      // 3. Delegación al Servicio de Dominio
      console.log("[UserController][logout] Delegando al Servicio de Dominio...")
      await this.userService.logoutUser(request.token);

      // 4. Respuesta exitosa
      this.view.renderSuccess({ message: "Sesión cerrada exitosamente" });

    } catch (error: any) {
      console.error("[UserController][logout] Error:", error);
      this.view.renderError(error.message || "Internal Server Error");
    }

    return this.view.getResponse();
  }
}

