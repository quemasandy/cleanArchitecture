# Enhanced Layered Architecture (afterV2)

This directory contains a comprehensive, didactic example of **Clean Architecture**.

It demonstrates how to separate concerns into **Presentation**, **Domain**, and **Infrastructure** layers, with specific examples for payment gateways, queues, and databases.

## Directory Structure

The project is organized as follows:

```
afterV2/
├── domain/                  # 🧠 The Brain (Pure Business Logic)
│   ├── entities/            # User, Order
│   ├── interfaces/          # Ports (IUserRepository, IPaymentGateway...)
│   └── services/            # UserService, OrderService
├── infrastructure/          # 🔌 The Plugs (External Tools)
│   ├── repositories/        # MongoUserRepository, SqlUserRepository
│   ├── dtos/                # UserPersistenceDTO, UserDocument
│   ├── mappers/             # UserMapper, MongoUserMapper
│   ├── email/               # SmtpEmailClient
│   ├── payment/             # Cybersource, Lyra
│   └── queue/               # AwsSqs, RabbitMq
├── presentation/            # 🗣️ The Voice (IO)
│   ├── controllers/         # UserController, OrderController
│   ├── dtos/                # RegisterUserDto, CreateOrderDto
│   ├── serializers/         # UserSerializer
│   └── views/               # ConsoleView
└── main.ts                  # 🏗️ The Builder (Composition Root)
```

## Key Concepts Demonstrated

### 1. Dependency Inversion
The **Domain** layer defines interfaces (Ports) like `IPaymentGateway`. The **Infrastructure** layer implements them (`CybersourcePaymentGateway`). The domain *never* imports from infrastructure.

### 2. Dependency Injection
In `main.ts`, we wire everything together. This allows us to swap implementations easily:

```typescript
// main.ts
// Switching databases is as easy as changing one line!
// const userRepo = new SqlUserRepository();
const userRepo = new MongoUserRepository();

// Switching payment providers
const paymentGateway = new LyraPaymentGateway();
```

### 3. Rich Domain Model
Entities like `User` and `Order` contain business logic (e.g., `markAsPaid()`, `deactivate()`), not just data.

## How to Run

You can run the example using `ts-node`:

```bash
npx ts-node src/01-fundamentals/01-exercises/07-srp/07-layers-example/afterV2/main.ts
```

### Expected Output
You will see logs indicating the flow through the layers:
1.  **Controller** receives request.
2.  **Domain Service** executes logic.
3.  **Infrastructure** performs external actions (SQL, Mongo, API calls).
4.  **View** renders the result.

## 🐛 Debugging

### Opción 1: TypeScript Directo (Recomendado) ⚡

El método más rápido para desarrollo diario:

1. Inicia DynamoDB Local (si no está corriendo):
   ```bash
   npm run local:start
   ```

2. Pon un **breakpoint** en cualquier archivo `.ts`

3. Presiona **F5** → selecciona **"TS: Debug Local (Sin Docker)"**

4. El script `scripts/local-run.ts` se ejecutará con el debugger conectado

**Ventaja**: No necesitas Docker para SAM ni regenerar `template.yaml`.

---

### Opción 2: SAM + Docker (Más realista)

Para probar en un entorno más parecido a AWS Lambda:

```bash
cd cdk
sam local invoke RegisterUserLambda -t template.yaml -e ../events/event-register.json -d 5858
```

Luego en VS Code:
1. Pon un breakpoint en tu código (`src/main.ts`)
2. Presiona **F5** → selecciona **"SAM: Debug Lambda"**
3. VS Code se conectará al contenedor Docker

---

## 🗄️ DynamoDB Local

### Comandos disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run local:setup` | Inicia DynamoDB Local y crea las tablas |
| `npm run local` | Ejecuta la Lambda localmente |
| `npm run local:start` | Solo inicia DynamoDB Local |
| `npm run local:stop` | Detiene DynamoDB Local |

### Verificar tablas

```bash
aws dynamodb list-tables --endpoint-url http://localhost:8000
aws dynamodb scan --table-name local-users-table --endpoint-url http://localhost:8000
```