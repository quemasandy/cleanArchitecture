/**
 * Archivo: UserService.ts
 * UBICACIÓN: Capa de Dominio / Servicios
 *
 * ¿QUÉ HACE UN SERVICIO DE DOMINIO?
 * - Orquesta la lógica de negocio pura.
 * - Utiliza los puertos (interfaces) para interactuar con el mundo exterior.
 * - Implementa los casos de uso (ej. Registrar Usuario).
 *
 * - Para quién trabaja: La Capa de Presentación (Controladores) o Aplicación.
 * - Intención: Orquestar el proceso de gestión de usuarios.
 * - Misión: Coordinar repositorios y servicios externos para registrar y administrar usuarios.
 */

import { User } from '../entities/User';
import { IUserRepository } from '../interfaces/IUserRepository';
import { IEmailService } from '../interfaces/IEmailService';
import { Email } from '../value-objects/Email';

export class UserService {
  // Inyección de dependencias a través del constructor
  // Dependemos de abstracciones (Interfaces), NO de implementaciones concretas.
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly emailService: IEmailService
  ) {}

  async registerUser(email: string, passwordPlain: string): Promise<User> {
    console.log(`[Dominio] Iniciando registro para ${email}...`);

    const emailVO = new Email(email); // Invariantes se validan aquí

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
    // Instanciamos primero para asegurar que solo lo que es Válido y Consistente tenga el privilegio de tocar la persistencia.
    // Es nuestro filtro de seguridad definitivo.
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
}
