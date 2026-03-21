/**
 * Archivo: UserPolicyService.ts
 * UBICACIÓN: Capa de Dominio / Servicios
 *
 * ¿QUÉ ES UN DOMAIN SERVICE (SERVICIO DE DOMINIO PURO)?
 * - Contiene reglas de negocio que NO pertenecen a una sola entidad ni value object.
 * - NO coordina flujos, NO llama repositorios, NO envía emails.
 * - Solo DECIDE: evalúa condiciones y retorna resultados o lanza excepciones.
 *
 * DIFERENCIA CLAVE CON UN USE CASE:
 * ┌──────────────────────┬──────────────────────────────────────────────┐
 * │ Domain Service       │ Use Case (Application Service)              │
 * ├──────────────────────┼──────────────────────────────────────────────┤
 * │ Decide               │ Coordina                                    │
 * │ Sin dependencias     │ Depende de puertos (repos, email, queue)    │
 * │ Puro, sincrónico     │ Asíncrono (await repos, gateways)           │
 * │ Reglas de negocio    │ Secuencia de pasos                          │
 * │ Altamente testeable  │ Requiere mocks para testear                 │
 * └──────────────────────┴──────────────────────────────────────────────┘
 *
 * ANALOGÍA:
 * Si el dominio es un restaurante:
 * - Las ENTIDADES son los cocineros (saben preparar sus platos).
 * - Los VALUE OBJECTS son los ingredientes (se auto-validan: huevo fresco, no podrido).
 * - El DOMAIN SERVICE es el "manual de política" que dice:
 *   "No aceptamos pedidos de clientes vetados", "No servimos después de las 10pm".
 *   El manual no cocina, no cobra, no sirve mesa. Solo ESTABLECE REGLAS.
 *
 * - Para quién trabaja: Los Use Cases (Application Layer).
 * - Intención: Encapsular políticas de negocio sobre usuarios.
 * - Misión: Decidir qué usuarios son válidos según las reglas del negocio.
 */

import { Email } from '../value-objects/Email';

export class UserPolicyService {
  /**
   * REGLA DE NEGOCIO: Dominios de email prohibidos.
   *
   * ¿POR QUÉ VIVE AQUÍ Y NO EN EL VALUE OBJECT Email?
   * - El VO Email valida SINTAXIS (tiene @, no está vacío).
   * - El domain service valida POLÍTICA DE NEGOCIO (evil.com está prohibido).
   * - Son dos preocupaciones diferentes:
   *   - Sintaxis → pertenece al VO (siempre debe cumplirse)
   *   - Política → pertenece al domain service (puede cambiar según el negocio)
   *
   * ¿POR QUÉ NO VIVE EN LA ENTIDAD User?
   * - La entidad User encapsula el estado y comportamiento de UN usuario.
   * - La política de "qué dominios están prohibidos" no pertenece a un usuario
   *   individual; es una regla TRANSVERSAL del sistema.
   * - Si mañana prohibimos @spam.net también, no deberíamos modificar User.
   *
   * REGLA DE NEGOCIO: No se permiten registros desde dominios prohibidos.
   */
  validateEmailAllowed(email: Email): void {
    // Lista de dominios prohibidos por política del negocio
    const forbiddenDomains = ['evil.com'];

    const emailValue = email.getValue();
    for (const domain of forbiddenDomains) {
      if (emailValue.endsWith(`@${domain}`)) {
        throw new Error(`Regla de Negocio: No se permiten usuarios de ${domain}`);
      }
    }
  }
}
