---
trigger: always_on
---

# Clean Architecture Project Specs

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

### Naming Convention de Lambdas

Patrón: `{función}-{env}`

| Ambiente | Ejemplos |
|----------|----------|
| `dev` | `register-user-dev`, `create-order-dev` |
| `stg` | `register-user-stg`, `create-order-stg` |
| `prd` | `register-user-prd`, `create-order-prd` |

---

## Reglas de Clean Architecture

> **IMPORTANTE**: Este proyecto DEBE respetar las normas de Clean Architecture.

### Capas y Responsabilidades

| Capa | Responsabilidad | Ejemplos |
|------|----------------|----------|
| **Domain** | Lógica de negocio pura | Entities, Services, Interfaces, Value Objects |
| **Infrastructure** | Implementaciones concretas | Repositories, Email Clients, Payment Gateways |
| **Presentation** | Entrada/salida HTTP | Controllers, Views, Serializers, DTOs |

### Reglas de Dependencia

- **Domain** NO depende de nada externo
- **Infrastructure** implementa interfaces de Domain
- **Presentation** usa servicios de Domain

### Responsabilidades

| Componente | Hace | NO Hace |
|------------|------|---------|
| **View** | Formatear respuestas | Parsear inputs |
| **RequestMapper** | Deserializar inputs a DTOs | Lógica de negocio |
| **Controller** | Orquestar flujo | Persistencia directa |
| **Service** | Lógica de negocio | Acceso directo a DB |
| **Repository** | Persistencia | Lógica de negocio |
