/**
 * Archivo: LoginUserDto.ts
 * UBICACIÓN: Capa de Presentación / DTOs
 *
 * Estructura de datos para iniciar sesión.
 *
 * - Para quién trabaja: UserController.
 * - Intención: Transportar los datos necesarios para iniciar sesión.
 * - Misión: Validar la forma del payload JSON recibido en el body del request.
 */

export interface LoginUserDto {
  email: string;
  password: string;
}
