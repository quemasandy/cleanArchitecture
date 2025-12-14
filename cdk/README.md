# 🏗️ CDK - Clean Architecture Infrastructure

Este directorio contiene la infraestructura como código (IaC) usando **AWS CDK** para el proyecto de Clean Architecture.

---

## 📋 Comandos Disponibles

### 🔧 Comandos Base

| Comando | Descripción |
|---------|-------------|
| `npm run build` | Compila TypeScript a JavaScript |
| `npm run watch` | Compila en modo watch (auto-recompila cambios) |
| `npm run test` | Ejecuta tests con Jest |
| `npm run cdk` | Ejecuta comandos CDK directamente |

---

### 📦 Synthesize (Genera CloudFormation Templates)

> **¿Qué hace `synth`?**  
> Convierte tu código CDK (TypeScript) en templates de CloudFormation (JSON/YAML).  
> Es como "compilar" tu infraestructura antes de desplegarla.

| Comando | Ambiente | Descripción |
|---------|----------|-------------|
| `npm run synth` | default | Genera template CloudFormation |
| `npm run synth:dev` | `dev` | Genera template para desarrollo |
| `npm run synth:stg` | `stg` | Genera template para staging |
| `npm run synth:prd` | `prd` | Genera template para producción |

**Ejemplo de uso:**
```bash
npm run synth:dev
# Output: cdk.out/CleanArchStack-dev.template.json
```

---

### 🚀 Deploy (Despliega a AWS)

> **¿Qué hace `deploy`?**  
> Toma el template de CloudFormation y lo despliega en tu cuenta de AWS.  
> Crea/actualiza todos los recursos definidos (Lambdas, DynamoDB, API Gateway, etc).

| Comando | Ambiente | Descripción |
|---------|----------|-------------|
| `npm run deploy` | default | Despliega a AWS (ambiente por defecto) |
| `npm run deploy:dev` | `dev` | Despliega a ambiente de desarrollo |
| `npm run deploy:stg` | `stg` | Despliega a ambiente de staging |
| `npm run deploy:prd` | `prd` | Despliega a producción (requiere aprobación manual) |

**Ejemplo de uso:**
```bash
# Despliega a desarrollo
npm run deploy:dev

# Para producción, CDK pedirá confirmación antes de cambios sensibles
npm run deploy:prd
```

> ⚠️ **Nota:** El deploy a `prd` tiene `--require-approval broadening` que pide confirmación para cambios que amplían permisos de seguridad.

---

### 🗑️ Destroy (Elimina Recursos de AWS)

> **¿Qué hace `destroy`?**  
> Elimina TODOS los recursos del stack de CloudFormation.  
> ⚠️ **CUIDADO:** Esto borra Lambdas, tablas DynamoDB, APIs, etc.

| Comando | Ambiente | Descripción |
|---------|----------|-------------|
| `npm run destroy` | default | Elimina el stack por defecto |
| `npm run destroy:dev` | `dev` | Elimina recursos de desarrollo |
| `npm run destroy:stg` | `stg` | Elimina recursos de staging |

> 🔒 **Nota:** No hay `destroy:prd` por seguridad. Si necesitas destruir producción, hazlo manualmente con `cdk destroy -c env=prd`.

**Ejemplo de uso:**
```bash
# Limpia ambiente de desarrollo
npm run destroy:dev
```

---

### 🖥️ SAM Local (Desarrollo Local con Docker)

> **¿Qué es SAM Local?**  
> AWS SAM CLI permite ejecutar tus Lambdas localmente en Docker, simulando el entorno de AWS.  
> Perfecto para desarrollo y debugging sin hacer deploy.

#### Prerrequisitos
1. Docker debe estar corriendo
2. SAM CLI instalado (`brew install aws-sam-cli`)
3. Ejecutar `npm run sam:synth` primero

| Comando | Descripción |
|---------|-------------|
| `npm run sam:synth` | Genera template para SAM local (env=local) |
| `npm run sam:api` | Levanta API Gateway local en `http://localhost:3000` |
| `npm run sam:api:debug` | Igual pero con logs de debug |

**Flujo típico de desarrollo local:**
```bash
# 1. Genera el template local
npm run sam:synth

# 2. Levanta el API Gateway local
npm run sam:api

# 3. En otra terminal, prueba tus endpoints
curl http://localhost:3000/users
```

#### Invocar Lambdas Individualmente

> **¿Cuándo usar invoke?**  
> Cuando quieres probar una Lambda específica sin levantar todo el API Gateway.  
> Útil para debugging y tests rápidos.

| Comando | Lambda | Descripción |
|---------|--------|-------------|
| `npm run sam:invoke:register` | RegisterUserFunction | Registra un nuevo usuario |
| `npm run sam:invoke:getuser` | GetUserFunction | Obtiene datos de un usuario |
| `npm run sam:invoke:createorder` | CreateOrderFunction | Crea una nueva orden |

**Ejemplo de uso:**
```bash
# Crea el archivo de evento primero
echo '{"body": "{\"email\": \"test@example.com\", \"password\": \"123456\"}"}' > events/register-user.json

# Invoca la Lambda
npm run sam:invoke:register
```

---

### 🔍 Diff (Comparar Cambios)

> **¿Qué hace `diff`?**  
> Compara tu código local con lo que está desplegado en AWS.  
> Muestra qué recursos se crearán, modificarán o eliminarán.

| Comando | Ambiente | Descripción |
|---------|----------|-------------|
| `npm run diff` | default | Compara con stack desplegado |
| `npm run diff:dev` | `dev` | Compara con stack de desarrollo |
| `npm run diff:stg` | `stg` | Compara con stack de staging |
| `npm run diff:prd` | `prd` | Compara con stack de producción |

**Ejemplo de uso:**
```bash
# Ver qué cambiaría si hago deploy a dev
npm run diff:dev
```

**Output típico:**
```
Stack CleanArchStack-dev
Resources
[+] AWS::Lambda::Function NewFunction
[~] AWS::DynamoDB::Table users-dev (requires replacement)
[-] AWS::Lambda::Function OldFunction
```

---

## 🌍 Ambientes

El proyecto soporta 4 ambientes, configurados via `-c env=<ambiente>`:

| Ambiente | Uso | Naming Pattern |
|----------|-----|----------------|
| `local` | Desarrollo local con SAM/Docker | `users-local`, `register-user-local` |
| `dev` | Desarrollo en AWS | `users-dev`, `register-user-dev` |
| `stg` | Staging/QA | `users-stg`, `register-user-stg` |
| `prd` | Producción | `users-prd`, `register-user-prd` |

---

## 📁 Estructura del Directorio

```
cdk/
├── bin/
│   └── cdk-app.ts          # Entry point del CDK app
├── lib/
│   └── clean-arch-stack.ts # Definición del stack (Lambdas, DynamoDB, etc)
├── events/                  # Eventos de prueba para SAM invoke
│   ├── register-user.json
│   ├── get-user.json
│   └── create-order.json
├── cdk.out/                 # Templates generados (gitignored)
├── package.json             # Scripts y dependencias
└── README.md                # Este archivo
```

---

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Compilar TypeScript
npm run build

# 3. Ver qué se va a crear
npm run diff:dev

# 4. Desplegar a desarrollo
npm run deploy:dev
```

---

## 🔗 Recursos Útiles

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
