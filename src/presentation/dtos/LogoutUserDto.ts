/**
 * Archivo: LogoutUserDto.ts
 * UBICACIÓN: Capa de Presentación / DTOs
 *
 * ¿QUÉ ES UN DTO (Data Transfer Object)?
 * - Es una estructura simple para transferir datos entre capas.
 * - NO contiene lógica de negocio, solo datos.
 * - Actúa como "contrato" entre el cliente HTTP y el controlador.
 *
 * - Para quién trabaja: ApiGatewayRequestMapper y UserController.
 * - Intención: Definir la forma de los datos de entrada para logout.
 * - Misión: Tipado fuerte para la solicitud de cierre de sesión.
 *
 * ¿POR QUÉ ESTÁ EN PRESENTATION Y NO EN DOMAIN?
 * - Los DTOs de entrada/salida HTTP pertenecen a la capa de Presentación.
 * - El Dominio no debe conocer el formato de las peticiones HTTP.
 * - Si cambiamos de REST a GraphQL, solo cambiamos los DTOs de Presentación.
 */
export interface LogoutUserDto {
  /**
   * Token de sesión a invalidar.
   * 
   * Este token fue entregado al cliente durante el login.
   * Al hacer logout, el cliente envía este token para que el servidor
   * lo elimine del almacenamiento de sesiones.
   * 
   * SEGURIDAD:
   * - El token típicamente viene en el header Authorization: Bearer <token>
   * - O puede venir en el body para simplicidad didáctica
   */
  token: string;
}
