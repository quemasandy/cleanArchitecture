/**
 * Archivo: RegisterUser.ts
 * UBICACIÓN: Capa de Application / Use Cases
 *
 * ¿QUÉ ES UN USE CASE (CASO DE USO)?
 * - Es un orquestador: coordina el flujo de un escenario de negocio completo.
 * - Recibe datos primitivos, invoca comportamiento de dominio, llama puertos,
 *   y retorna resultados.
 * - NO contiene reglas de negocio (esas viven en entidades y domain services).
 * - NO conoce HTTP, Lambda, ni frameworks (eso es presentación).
 *
 * PRINCIPIO CLAVE: "El dominio decide, la aplicación coordina."
 *
 * - Para quién trabaja: La Capa de Presentación (Controllers).
 * - Intención: Orquestar el registro completo de un usuario nuevo.
 * - Misión: Coordinar la secuencia de pasos sin mezclar reglas de negocio con efectos externos.
 *
 * FLUJO:
 * 1. Validar email (Value Object se auto-valida)
 * 2. Verificar unicidad via repositorio
 * 3. Consultar reglas de negocio via domain service
 * 4. Crear entidad User
 * 5. Persistir
 * 6. Enviar email de bienvenida (side effect)
 */

import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IEmailService } from '../../domain/interfaces/IEmailService';
import { UserPolicyService } from '../../domain/services/UserPolicyService';

export class RegisterUser {
  /**
   * INYECCIÓN DE DEPENDENCIAS:
   * El use case depende de:
   * - Puertos (interfaces) para efectos externos → IUserRepository, IEmailService
   * - Domain service para reglas de negocio → UserPolicyService
   *
   * ¿POR QUÉ NO DEPENDE DE DynamoDB O SMTP DIRECTAMENTE?
   * Porque el Composition Root (main.ts) es quien "conecta" las implementaciones.
   * El use case solo conoce CONTRATOS (interfaces).
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly userPolicy: UserPolicyService
  ) {}

  /**
   * Ejecuta el caso de uso de registro.
   *
   * NOTA SOBRE EL MÉTODO execute():
   * En Clean Architecture, cada use case tiene UN SOLO método público.
   * Esto fuerza la cohesión: un use case = una intención de negocio.
   */
  async execute(email: string, passwordPlain: string): Promise<User> {
    // 1. Crear Value Object Email (se auto-valida en el constructor)
    //    Si el email es inválido, el VO lanzará una excepción ANTES de
    //    tocar la base de datos. Esto es "fail fast" de dominio.
    const emailVO = new Email(email);

    // 2. COORDINACIÓN: Verificar unicidad via repositorio (puerto)
    //    Esta es una verificación de APLICACIÓN, no de negocio.
    //    El dominio no sabe qué es un repositorio; la aplicación sí.
    const existingUser = await this.userRepository.findByEmail(emailVO.getValue());
    if (existingUser) {
      throw new Error("El usuario ya está registrado.");
    }

    // 3. REGLA DE NEGOCIO: Consultar al domain service
    //    El use case NO implementa la regla; DELEGA al domain service.
    //    Si mañana la política cambia (ej: bloquear más dominios), solo
    //    se modifica UserPolicyService, no este use case.
    this.userPolicy.validateEmailAllowed(emailVO);

    // 4. Crear la entidad (el hash es simplificado para fines didácticos)
    //    NOTA: En producción, el hashing usaría bcrypt o argon2 a través
    //    de un puerto IPasswordHasher inyectado aquí.
    const passwordHash = `hashed_${passwordPlain}`;
    const newUser = new User(
      Date.now().toString(),
      emailVO,
      passwordHash
    );

    // 5. COORDINACIÓN: Persistir usando el puerto de repositorio
    const savedUser = await this.userRepository.save(newUser);

    // 6. SIDE EFFECT: Enviar email de bienvenida usando el puerto de email
    //    Este es un efecto secundario que el DOMINIO no debería conocer.
    //    Es responsabilidad de la APLICACIÓN decidir cuándo notificar.
    await this.emailService.sendWelcomeEmail(savedUser.email.getValue(), "Nuevo Usuario");

    return savedUser;
  }
}
