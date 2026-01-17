# Clean Architecture con AWS Lambda 🏗️

Laboratorio de aprendizaje de **Clean Architecture** con AWS Lambda + DynamoDB.

> **Objetivo**: Aprender Clean Architecture de forma didáctica, priorizando claridad sobre optimización.

## 📁 Estructura del Proyecto

```
src/
├── domain/                  # 🧠 Núcleo (NO depende de nada externo)
│   ├── entities/            # User, Order
│   ├── interfaces/          # Puertos: IUserRepository, IPaymentGateway...
│   ├── services/            # UserService, OrderService
│   └── value-objects/       # Email, Money
│
├── infrastructure/          # 🔌 Adaptadores (implementan los puertos)
│   ├── repositories/        # DynamoDbUserRepository, InMemoryUserRepository
│   ├── mappers/             # Transformación Domain ↔ Persistencia
│   ├── dtos/                # Estructuras de datos para persistencia
│   ├── email/               # SmtpEmailClient
│   ├── payment/             # Cybersource, Lyra
│   └── queue/               # AwsSqs, RabbitMq
│
├── presentation/            # 🗣️ Entrada/Salida HTTP
│   ├── controllers/         # UserController, OrderController
│   ├── dtos/                # RegisterUserDto, LoginUserDto
│   ├── serializers/         # UserSerializer
│   └── views/               # LambdaView, ConsoleView
│
└── main.ts                  # 🏗️ Composition Root (ensambla dependencias)
```

## 🚀 Cómo Correr en Local

### Opción A: Sin Docker (Recomendado para aprender)

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar demo completo (usa InMemoryRepository)
npm run local
```

### Opción B: Con DynamoDB Local (Docker)

```bash
# 1. Levantar DynamoDB Local
npm run local:start

# 2. Crear tablas
npx tsx --env-file=.env scripts/createTable.ts

# 3. Registrar usuario
npx tsx --env-file=.env scripts/registerUser.ts

# 4. Login
npx tsx --env-file=.env scripts/loginUser.ts

# 5. Logout
npx tsx --env-file=.env scripts/logoutUser.ts

# 6. (Opcional) Ver tablas en UI web
npm run local:dynamodb-admin
# Abre http://localhost:8001

# 7. Apagar Docker
npm run local:stop
```

## 📋 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run local` | Demo completo en memoria (sin Docker) |
| `npm run local:start` | Levanta DynamoDB en Docker |
| `npm run local:setup` | Crea tablas en DynamoDB Local |
| `npm run local:stop` | Apaga el contenedor Docker |
| `npm run local:dynamodb-admin` | UI web para ver la DB |

## 🔧 Variables de Ambiente

Archivo `.env` para desarrollo local:

```bash
USERS_TABLE=users-local
DYNAMODB_ENDPOINT=http://localhost:8000
AWS_REGION=us-east-1
```

## 🐛 Debugging

### TypeScript Directo (Recomendado)

1. Inicia DynamoDB Local:
   ```bash
   npm run local:start
   ```

2. Pon un **breakpoint** en cualquier archivo `.ts`

3. Presiona **F5** → selecciona **"TS: Debug Local (Sin Docker)"**

### SAM + Docker (Más realista)

```bash
cd cdk
sam local invoke RegisterUserLambda -t template.yaml -e ../events/event-register.json -d 5858
```

## ☁️ Deploy a AWS

```bash
cd cdk

# DEV (default)
npx cdk deploy

# Staging
npx cdk deploy -c env=stg

# Producción
npx cdk deploy -c env=prd
```

## 🎯 Conceptos Clave

### Dependency Inversion
El **Domain** define interfaces (Puertos). La **Infrastructure** las implementa (Adaptadores). El dominio *nunca* importa de infraestructura.

### Dependency Injection
En `main.ts` ensamblamos todo. Cambiar implementaciones es cambiar una línea:

```typescript
// Cambiar base de datos
const userRepo = new DynamoDbUserRepository(tableName);
// const userRepo = new MongoUserRepository();

// Cambiar proveedor de pagos
const paymentGateway = new CybersourcePaymentGateway();
// const paymentGateway = new LyraPaymentGateway();
```

## 📚 Handlers Lambda Exportados

| Handler | Endpoint | Descripción |
|---------|----------|-------------|
| `registerUserHandler` | POST /users | Registro de usuarios |
| `loginUserHandler` | POST /users/login | Autenticación |
| `logoutUserHandler` | POST /users/logout | Cierre de sesión |
| `createOrderHandler` | POST /orders | Creación de órdenes |