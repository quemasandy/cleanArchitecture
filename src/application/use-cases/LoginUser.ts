/**
 * Archivo: LoginUser.ts
 * UBICACIÓN: Capa de Application / Use Cases
 *
 * ¿QUÉ ES UN USE CASE (CASO DE USO)?
 * - Orquesta un flujo de negocio completo, coordinando entidades,
 *   value objects, domain services y puertos de infraestructura.
 * - NO contiene reglas de negocio (esas viven en el dominio).
 * - NO conoce HTTP, Lambda, ni frameworks (eso es presentación).
 *
 * - Para quién trabaja: La Capa de Presentación (Controllers).
 * - Intención: Orquestar la autenticación de un usuario existente.
 * - Misión: Coordinar verificación de credenciales y creación de sesión.
 *
 * FLUJO:
 * 1. Validar email (Value Object)
 * 2. Buscar usuario en repositorio
 * 3. Consultar reglas de negocio via domain service
 * 4. Verificar contraseña (comportamiento de la entidad)
 * 5. Generar y persistir sesión
 * 6. Retornar user + token
 */

import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ISessionRepository, Session } from '../../domain/interfaces/ISessionRepository';
import { UserPolicyService } from '../../domain/services/UserPolicyService';

export class LoginUser {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly userPolicy: UserPolicyService
  ) {}

  /**
   * Ejecuta el caso de uso de login.
   *
   * RETORNO: { user, token }
   * - user: La entidad de dominio (el controller se encargará de serializarla)
   * - token: El identificador de sesión para uso en requests futuros
   */
  async execute(email: string, loginPassword: string): Promise<{user: User, token: string}> {
    // 1. Crear Value Object Email (fail fast si es inválido)
    const emailVO = new Email(email);

    // 2. COORDINACIÓN: Buscar usuario vía repositorio (puerto)
    const existingUser = await this.userRepository.findByEmail(emailVO.getValue());
    if (!existingUser) {
      throw new Error("El usuario no está registrado.");
    }

    // 3. REGLA DE NEGOCIO: Consultar al domain service
    //    ¿El email está en un dominio prohibido?
    this.userPolicy.validateEmailAllowed(emailVO);

    // 4. REGLA DE NEGOCIO: Verificar contraseña
    //    Delegamos a la ENTIDAD, porque la verificación de contraseña
    //    es comportamiento propio del User (el User "sabe" su hash).
    const loginPasswordHash = `hashed_${loginPassword}`;
    if (!existingUser.passwordMatches(loginPasswordHash)) {
      throw new Error("Credenciales inválidas.");
    }

    // 5. COORDINACIÓN: Generar y persistir sesión
    //    La generación del token es lógica de aplicación, no de dominio.
    //    El dominio no se preocupa por tokens ni sesiones HTTP.
    const token = this.generateSessionToken(existingUser.id);
    const session: Session = {
      token,
      userId: existingUser.id,
      createdAt: Date.now()
    };
    await this.sessionRepository.save(session);

    return { user: existingUser, token };
  }

  /**
   * Genera un token de sesión único.
   *
   * NOTA DIDÁCTICA:
   * En producción usarías:
   * - JWT (JSON Web Tokens) para tokens stateless
   * - crypto.randomBytes() para tokens opacos
   * - O un puerto ITokenGenerator para abstraer la generación
   *
   * Para este ejemplo educativo, usamos una combinación simple.
   * Esto vive en el use case (no en dominio) porque generar tokens
   * es una PREOCUPACIÓN DE APLICACIÓN, no una regla de negocio.
   */
  private generateSessionToken(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `token_${userId}_${timestamp}_${random}`;
  }
}
