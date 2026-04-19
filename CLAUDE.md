# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run demo with in-memory repo (no Docker required)
npm run local

# Run with local DynamoDB (Docker required)
npm run local:start      # start DynamoDB container
npm run local:setup      # create tables
npm run local:stop       # stop containers

# Run individual scripts against local DynamoDB
npx tsx --env-file=.env scripts/createTable.ts
npx tsx --env-file=.env scripts/registerUser.ts
npx tsx --env-file=.env scripts/loginUser.ts
npx tsx --env-file=.env scripts/logoutUser.ts

# Deploy to AWS
npx cdk deploy                  # DEV
npx cdk deploy -c env=stg       # Staging
npx cdk deploy -c env=prd       # Production
```

Required `.env` variables for local DynamoDB:
```
USERS_TABLE=users-local
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
```

There is no test suite configured yet.

## Architecture

This is a didactic Clean Architecture (Ports & Adapters / Hexagonal) project deployed as AWS Lambda functions backed by DynamoDB. Code comments are in Spanish.

### Dependency Rule

Dependencies flow inward only: `Presentation → Application → Domain ← Infrastructure`

Domain never imports from Application, Infrastructure, or Presentation.

### Layers

**Domain** (`src/domain/`) — No external dependencies. Pure business logic.
- `entities/` — `User` (identity-based) and `Order` (aggregate root). Both are immutable: mutating methods return new instances.
- `value-objects/` — `Email` (self-validating, normalizes to lowercase) and `Money` (amount + ISO 4217 currency). Throw on invalid construction.
- `interfaces/` — Port interfaces: `IUserRepository`, `ISessionRepository`, `IEmailService`, `IPaymentGateway`, `IQueueService`.
- `services/UserPolicyService.ts` — Pure business rules (no ports, no async).

**Application** (`src/application/use-cases/`) — Orchestrates flows using domain ports.
- Each use case has exactly one `execute()` method: `RegisterUser`, `LoginUser`, `LogoutUser`, `CreateOrder`.

**Infrastructure** (`src/infrastructure/`) — Concrete port implementations.
- `repositories/` — `DynamoDbUserRepository` and `DynamoDbSessionRepository` (single-table design, optimistic locking via `version` field + `ConditionExpression`), plus `InMemoryUserRepository` for local dev.
- `mappers/` — Convert domain entities to/from persistence DTOs.
- `email/`, `payment/`, `queue/` — Swappable adapters (SMTP, Cybersource/Lyra, SQS/RabbitMQ).

**Presentation** (`src/presentation/`) — Lambda/HTTP boundary.
- `controllers/` — Format-level validation only; delegates business logic to use cases.
- `views/LambdaView.ts` — Builds API Gateway responses.
- `mappers/ApiGatewayRequestMapper.ts` — Parses Lambda `event` into typed DTOs.
- `serializers/` — Convert domain entities to safe API response shapes (e.g., strips `passwordHash`).

### Composition Root

`src/main.ts` is the only place where concrete implementations are wired to interfaces. Switching a database or payment provider means changing one line here. It exports four Lambda handlers: `registerUserHandler`, `loginUserHandler`, `logoutUserHandler`, `createOrderHandler`.

### DynamoDB Single-Table Design

Users and Sessions share one table with composite keys:
- User: `pk = USER#{userId}`, `sk = PROFILE`
- Session: `pk = USER#{userId}`, `sk = SESSION#{token}`
- Email lookups use a `EmailIndex` GSI.
