/**
 * Archivo: UserService.ts
 * UBICACIÓN: Capa de Dominio / Servicios
 *
 * ¿QUÉ HACE UN SERVICIO DE DOMINIO?
 * - Orquesta la lógica de negocio pura.
 * - Utiliza los puertos (interfaces) para interactuar con el mundo exterior.
 * - Implementa los casos de uso (ej. Registrar Usuario, Login, Logout).
 *
 * - Para quién trabaja: La Capa de Presentación (Controladores) o Aplicación.
 * - Intención: Orquestar el proceso de gestión de usuarios.
 * - Misión: Coordinar repositorios y servicios externos para registrar y administrar usuarios.
 *
 * CASOS DE USO IMPLEMENTADOS:
 * 1. registerUser - Registro de nuevos usuarios
 * 2. loginUser - Autenticación y creación de sesión
 * 3. logoutUser - Cierre de sesión (invalidación de token)
 */

import { User } from '../entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IEmailService } from '../interfaces/IEmailService';
import { ISessionRepository, Session } from '../interfaces/ISessionRepository';
import { Email } from '../value-objects/Email';

export class UserService {
  /**
   * INYECCIÓN DE DEPENDENCIAS:
   * Dependemos de abstracciones (Interfaces), NO de implementaciones concretas.
   * 
   * Esto permite:
   * - Cambiar la base de datos sin modificar el servicio
   * - Hacer testing con mocks/stubs
   * - Seguir el Principio de Inversión de Dependencias (DIP)
   */
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService,
    private readonly sessionRepository: ISessionRepository
  ) {}

  /**
   * CASO DE USO: Registrar Usuario
   * 
   * FLUJO:
   * 1. Validar email (Value Object)
   * 2. Verificar que el usuario no exista
   * 3. Aplicar reglas de negocio
   * 4. Crear entidad User
   * 5. Persistir usuario
   * 6. Enviar email de bienvenida
   */
  async registerUser(email: string, passwordPlain: string): Promise<User> {
    console.log(`[Dominio] Iniciando registro para ${email}...`);

    // El Value Object Email se auto-valida en el constructor
    const emailVO = new Email(email);

    // 1. REGLA DE NEGOCIO: Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(emailVO.getValue());
    if (existingUser) {
      throw new Error("El usuario ya está registrado.");
    }

    // 2. REGLA DE NEGOCIO: Validar dominio prohibido (ejemplo didáctico)
    if (emailVO.getValue().endsWith('@evil.com')) {
      throw new Error("Regla de Negocio: No se permiten usuarios de evil.com");
    }

    // 3. Crear la entidad
    const passwordHash = `hashed_${passwordPlain}`;
    const newUser = new User(
      Date.now().toString(), // ID temporal
      emailVO,
      passwordHash
    );

    // 4. Persistir usando el puerto
    const savedUser = await this.userRepository.save(newUser);

    // 5. Efecto secundario: Enviar email de bienvenida
    await this.emailService.sendWelcomeEmail(savedUser.email.getValue(), "Nuevo Usuario");

    console.log(`[Dominio] Usuario registrado exitosamente: ${savedUser.id}`);
    return savedUser;
  }

  /**
   * CASO DE USO: Iniciar Sesión (Login)
   * 
   * IMPORTANTE: Este método retorna la entidad User y un token de sesión.
   * La transformación a DTO es responsabilidad de la capa de Presentación.
   * 
   * FLUJO:
   * 1. Validar email (Value Object)
   * 2. Buscar usuario en el repositorio
   * 3. Verificar contraseña
   * 4. Generar token de sesión
   * 5. Persistir sesión
   * 6. Retornar usuario y token
   */
  async loginUser(email: string, loginPassword: string): Promise<{user: User, token: string}> {
    console.log(`[Dominio] Iniciando inicio de sesión para ${email}...`);

    // El Value Object Email se auto-valida
    const emailVO = new Email(email);

    // 1. REGLA DE NEGOCIO: Verificar si el usuario existe
    const existingUser = await this.userRepository.findByEmail(emailVO.getValue());
    if (!existingUser) {
      throw new Error("El usuario no está registrado.");
    }

    // 2. REGLA DE NEGOCIO: Validar dominio prohibido
    if (emailVO.getValue().endsWith('@evil.com')) {
      throw new Error("Regla de Negocio: No se permiten usuarios de evil.com");
    }

    // 3. Verificar contraseña
    const loginPasswordHash = `hashed_${loginPassword}`;
    if (!existingUser.passwordMatches(loginPasswordHash)) {
      throw new Error("Credenciales inválidas.");
    }

    // 4. Generar token de sesión único
    // NOTA DIDÁCTICA: En producción usarías JWT o un generador criptográfico
    const token = this.generateSessionToken(existingUser.id);

    // 5. Persistir la sesión usando el puerto de sesiones
    const session: Session = {
      token,
      userId: existingUser.id,
      createdAt: Date.now()
    };
    await this.sessionRepository.save(session);
    
    console.log(`[Dominio] Usuario autenticado exitosamente: ${existingUser.id}`);
    return { user: existingUser, token };
  }

  /**
   * CASO DE USO: Cerrar Sesión (Logout)
   * 
   * FLUJO:
   * 1. Buscar la sesión por token
   * 2. Si existe, eliminarla
   * 3. Si no existe, no hacer nada (idempotente)
   * 
   * IDEMPOTENCIA:
   * - Llamar logout múltiples veces con el mismo token no causa errores.
   * - Esto es importante para manejo de errores de red y reintentos.
   */
  async logoutUser(token: string): Promise<void> {
    console.log(`[Dominio] Iniciando logout para token: ${token.substring(0, 8)}...`);

    // 1. Verificar si la sesión existe (opcional - útil para logging)
    const session = await this.sessionRepository.findByToken(token);
    
    if (!session) {
      // La sesión ya no existe - logout es idempotente
      console.log(`[Dominio] Sesión no encontrada (ya fue cerrada o expirada)`);
      return;
    }

    // 2. Eliminar la sesión
    await this.sessionRepository.delete(token);
    
    console.log(`[Dominio] Sesión cerrada exitosamente para usuario: ${session.userId}`);
  }

  /**
   * Genera un token de sesión único.
   * 
   * NOTA DIDÁCTICA:
   * En producción usarías:
   * - JWT (JSON Web Tokens) para tokens stateless
   * - crypto.randomBytes() para tokens opacos
   * 
   * Para este ejemplo educativo, usamos una combinación simple.
   */
  private generateSessionToken(userId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `token_${userId}_${timestamp}_${random}`;
  }
}

