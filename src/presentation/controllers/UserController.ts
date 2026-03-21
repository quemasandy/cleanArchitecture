/**
 * Archivo: UserController.ts
 * UBICACIÓN: Capa de Presentación / Controladores (Lambda)
 *
 * ¿QUÉ HACE UN CONTROLLER EN CLEAN ARCHITECTURE?
 * - Es el ADAPTADOR de entrada: traduce el mundo HTTP al lenguaje de la aplicación.
 * - Parsea el body del request.
 * - Valida formato de entrada (validación de PRESENTACIÓN, no de negocio).
 * - DELEGA al use case correspondiente (NO al domain service).
 * - Serializa la respuesta de salida.
 *
 * ANTES vs AHORA:
 * ┌──────────────────────────────────────────────────────────────────┐
 * │ ANTES: Controller → UserService (fat domain service)           │
 * │ AHORA: Controller → RegisterUser / LoginUser / LogoutUser      │
 * │                     (use cases especializados)                  │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * ¿POR QUÉ INYECTAR 3 USE CASES EN VEZ DE 1 SERVICE?
 * - Cada use case tiene UNA SOLA responsabilidad (SRP).
 * - Facilita testing: mockear 1 use case es más simple que mockear
 *   un service gordo con 3 métodos y 3 dependencias.
 * - Facilita evolución: agregar un use case nuevo no toca los existentes.
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

import { RegisterUser } from '../../application/use-cases/RegisterUser';
import { LoginUser } from '../../application/use-cases/LoginUser';
import { LogoutUser } from '../../application/use-cases/LogoutUser';
import { UserSerializer } from '../serializers/UserSerializer';
import { ApiGatewayRequestMapper } from '../mappers/ApiGatewayRequestMapper';
import { LambdaView, ApiGatewayResponse } from '../views/LambdaView';

export class UserController {
  /**
   * INYECCIÓN DE DEPENDENCIAS:
   * Recibimos cada use case como dependencia separada.
   * El controller NO sabe cómo se construyen estos use cases;
   * eso lo decide el Composition Root (main.ts).
   */
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: LoginUser,
    private readonly logoutUser: LogoutUser,
    private readonly view: LambdaView
  ) {}

  /**
   * Handler para registro de usuarios.
   *
   * FLUJO:
   * 1. Parsear request de API Gateway → RegisterUserDto
   * 2. Validar datos de entrada (validación de presentación)
   * 3. Delegar al use case RegisterUser.execute()
   * 4. Serializar respuesta y renderizar éxito/error
   */
  async register(event: any): Promise<ApiGatewayResponse> {
    console.log("\n--- [Controller] Recibiendo solicitud de registro ---");
    this.view.reset();

    try {
      // 1. Deserializar evento API Gateway a DTO
      const request = ApiGatewayRequestMapper.toRegisterUserDto(event);

      // 2. Validación básica de entrada (capa de presentación)
      // NOTA: Esta es validación de FORMATO, NO reglas de negocio.
      // "¿El email tiene @?" → presentación (formato).
      // "¿El dominio está prohibido?" → dominio (regla de negocio).
      console.log("[UserController][register] Validando entrada...");
      if (!request.email || !request.email.includes('@')) {
        throw new Error("Bad Request: Email inválido");
      }
      if (!request.password || request.password.length < 6) {
        throw new Error("Bad Request: Password muy corto");
      }

      // 3. Delegación al Use Case (NO al domain service)
      console.log("[UserController][register] Delegando al Use Case RegisterUser...")
      const user = await this.registerUser.execute(request.email, request.password);

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
   * 3. Delegar al use case LoginUser.execute()
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

      // 3. Delegación al Use Case
      console.log("[UserController][login] Delegando al Use Case LoginUser...")
      const {user, token} = await this.loginUser.execute(request.email, request.password);

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
   * 3. Delegar al use case LogoutUser.execute()
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

      // 3. Delegación al Use Case
      console.log("[UserController][logout] Delegando al Use Case LogoutUser...")
      await this.logoutUser.execute(request.token);

      // 4. Respuesta exitosa
      this.view.renderSuccess({ message: "Sesión cerrada exitosamente" });

    } catch (error: any) {
      console.error("[UserController][logout] Error:", error);
      this.view.renderError(error.message || "Internal Server Error");
    }

    return this.view.getResponse();
  }
}
