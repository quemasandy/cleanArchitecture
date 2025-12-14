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
