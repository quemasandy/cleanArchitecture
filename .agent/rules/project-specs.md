---
trigger: always_on
---

# Clean Architecture Project Specs

## Propósito del Proyecto

> **IMPORTANTE**: Este proyecto es un **laboratorio de aprendizaje** de Clean Architecture.
> El objetivo principal es aprender Clean Architecture de la forma más pura y didáctica posible.
> Priorizamos la claridad y el valor educativo sobre la brevedad o la optimización prematura.

---

## Regla 1: Comentarios Didácticos Obligatorios

**Todo código generado DEBE ser explicado didácticamente con comentarios.**

### Formato de Cabecera de Archivo
Cada archivo DEBE incluir una cabecera explicativa:

```typescript
/**
 * Archivo: NombreArchivo.ts
 * UBICACIÓN: Capa de [Domain|Infrastructure|Presentation] / [Subcarpeta]
 *
 * ¿QUÉ ES [TIPO DE COMPONENTE]?
 * - Explicación del patrón o concepto.
 * - Responsabilidades principales.
 *
 * - Para quién trabaja: [Consumidor del componente].
 * - Intención: [Qué problema resuelve].
 * - Misión: [Responsabilidad específica].
 */
```

### Comentarios en Código
- Explicar el "por qué", no solo el "qué"
- Identificar patrones de Clean Architecture aplicados
- Marcar reglas de negocio con `// REGLA DE NEGOCIO:`
- Numerar pasos en flujos secuenciales: `// 1.`, `// 2.`, etc.

---

## Regla 2: Estructura de Capas

### Arquitectura del Proyecto

```
src/
├── domain/           # Núcleo de la aplicación (NO depende de nada externo)
│   ├── entities/     # Objetos con identidad (User, Order)
│   ├── value-objects/# Objetos por valor, inmutables (Email, Money)
│   ├── interfaces/   # Puertos/Contratos (IUserRepository, IEmailService)
│   └── services/     # Lógica de negocio (UserService, OrderService)
│
├── infrastructure/   # Implementaciones concretas (depende de Domain)
│   ├── repositories/ # Adaptadores de persistencia (DynamoDB, Mongo, SQL)
│   ├── mappers/      # Transformación Domain ↔ Persistencia
│   ├── dtos/         # Estructuras de datos para persistencia
│   ├── email/        # Implementaciones de IEmailService
│   ├── payment/      # Implementaciones de IPaymentGateway
│   └── queue/        # Implementaciones de IQueueService
│
├── presentation/     # Entrada/Salida HTTP (depende de Domain)
│   ├── controllers/  # Orquestan el flujo de la petición
│   ├── views/        # Formatean respuestas de salida
│   ├── serializers/  # Transforman Domain → Output y Input → DTO
│   └── dtos/         # Estructuras de datos para entrada
│
└── main.ts           # Composition Root (ensambla el grafo de dependencias)
```

---

## Regla 3: Reglas de Dependencia (Dependency Rule)

```
Presentation → Domain ← Infrastructure
```

| Capa | Puede Importar | NO Puede Importar |
|------|----------------|-------------------|
| **Domain** | Solo sus propios módulos | Infrastructure, Presentation |
| **Infrastructure** | Domain (interfaces, entities) | Presentation |
| **Presentation** | Domain (services, entities) | Infrastructure directamente* |

*La inyección de implementaciones se hace en `main.ts` (Composition Root).

---

## Regla 4: Responsabilidades por Componente

| Componente | ✅ HACE | ❌ NO HACE |
|------------|---------|------------|
| **Entity** | Encapsula estado + comportamiento de negocio | Acceso a DB, HTTP, frameworks |
| **Value Object** | Valida e inmutabiliza valores simples | Lógica de negocio compleja |
| **Interface (Puerto)** | Define contratos abstractos | Implementar lógica |
| **Service** | Orquesta casos de uso, aplica reglas de negocio | Persistencia directa, formateo HTTP |
| **Repository** | CRUD y queries de persistencia | Lógica de negocio |
| **Mapper** | Transforma entre Domain ↔ Persistencia | Validaciones de negocio |
| **Controller** | Orquesta flujo HTTP, valida inputs básicos | Persistencia, lógica de negocio |
| **View** | Formatea respuestas de salida | Parsear inputs |
| **Serializer** | Transforma Domain → Output format | Lógica de negocio |
| **RequestMapper** | Deserializa Input → DTO | Validaciones de negocio |

---

## Regla 5: Patrones Obligatorios

### Inyección de Dependencias
```typescript
// ✅ CORRECTO: Depender de abstracciones
constructor(
  private readonly userRepository: IUserRepository,  // Interface
  private readonly emailService: IEmailService       // Interface
) {}

// ❌ INCORRECTO: Depender de implementaciones
constructor(
  private readonly userRepository: DynamoDbUserRepository  // Implementación concreta
) {}
```

### Inmutabilidad en Entities
```typescript
// ✅ CORRECTO: Retornar nueva instancia
deactivate(): User {
  return new User(this.id, this.email, this.passwordHash, false, this.version);
}

// ❌ INCORRECTO: Mutar estado
deactivate(): void {
  this.isActive = false;
}
```

### Value Objects Auto-Validados
```typescript
// ✅ CORRECTO: Validar en constructor
constructor(value: string) {
  if (!value.includes('@')) {
    throw new Error("Email inválido");
  }
  this.value = value;
}
```

---

## Configuración de Ambientes (CDK)

| Propiedad | Valor |
|-----------|-------|
| **Variable** | `env` |
| **Valores** | `local`, `dev`, `stg`, `prd` |
| **Default** | `dev` |
| **Ubicación** | `cdk/lib/clean-arch-stack.ts` |

### Comandos de Deploy

```bash
# DEV (default)
npx cdk deploy

# Ambiente específico
npx cdk deploy -c env=stg
npx cdk deploy -c env=prd
```

### Naming Convention

| Recurso | Patrón | Ejemplos |
|---------|--------|----------|
| Lambda | `{función}-{env}` | `register-user-dev`, `create-order-prd` |
| DynamoDB | `{tabla}-{env}` | `users-dev`, `users-prd` |
