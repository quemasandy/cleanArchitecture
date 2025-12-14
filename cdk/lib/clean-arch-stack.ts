/**
 * Archivo: clean-arch-stack.ts
 * UBICACIÓN: Infraestructura como Código (IaC) / Definición del Stack
 * 
 * Este archivo define QUÉ recursos de AWS vamos a crear.
 * Es como un "plano arquitectónico" que CloudFormation leerá para construir tu casa en la nube.
 */

// Importamos la librería principal de CDK.
import * as cdk from 'aws-cdk-lib';
// Construct es el bloque básico de construcción de CDK.
import { Construct } from 'constructs';
// Importamos módulos específicos de AWS.
import * as lambda from 'aws-cdk-lib/aws-lambda'; // Para crear funciones Lambda
import * as apigateway from 'aws-cdk-lib/aws-apigateway'; // Para crear la API REST
import * as path from 'path'; // Para manejar rutas de archivos del sistema operativo
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs'; // Utilidad especial para Lambda con Node.js

/**
 * Clase CleanArchStack
 * Representa nuestra pila de recursos en CloudFormation.
 * Todos los recursos creados dentro del constructor pertenecerán a este Stack.
 */
export class CleanArchStack extends cdk.Stack {
  /**
   * @param scope El padre de este stack (usualmente la App).
   * @param id El nombre lógico de este stack (CleanArchStack).
   * @param props Propiedades de configuración (región, cuenta, etc).
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    // Llamamos al constructor de la clase padre (Stack) para inicializar lo básico.
    super(scope, id, props);

    // ========================================================================
    // 1. DEFINICIÓN DE FUNCIONES LAMBDA
    // ========================================================================
    
    // NOTA: No necesitamos definir una "VPC" (red privada) explícitamente aquí,
    // por lo que nuestras Lambdas tendrán acceso a internet público (útil para llamar APIs externas).

    // ========================================================================
    // 1.5. DEFINICIÓN DE DYNAMODB TABLE
    // ========================================================================
    
    // Importamos dynamodb (asegúrate de tenerlo importado arriba: import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';)
    // O podemos usar cdk.aws_dynamodb si no queremos agregar import explicitamente, pero mejor agregarlo.
    // Voy a asumir que necesitamos agregar el import arriba, lo haré en un bloque separado o usare la referencia completa si es posible,
    // pero para clean code mejor agregar import.
    // Como limitation de replace_file_content, agregaré el recurso aquí y asumiré que importare 'aws_dynamodb' como 'dynamodb'.
    // PERO espera, no tengo el import 'dynamodb' en los imports actuales.
    // Usaré 'aws-cdk-lib/aws-dynamodb'
    
    const usersTable = new cdk.aws_dynamodb.Table(this, 'UsersTable', {
        partitionKey: { name: 'pk', type: cdk.aws_dynamodb.AttributeType.STRING },
        billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN, // PRODUCCIÓN: Mantiene la tabla incluso si se destruye el stack
    });
    
    // Global Secondary Index para buscar por email
    usersTable.addGlobalSecondaryIndex({
        indexName: 'EmailIndex',
        partitionKey: { name: 'email', type: cdk.aws_dynamodb.AttributeType.STRING },
        projectionType: cdk.aws_dynamodb.ProjectionType.ALL,
    });

    /**
     * LAMBDA 1: Registro de Usuarios
     * 
     * Usamos NodejsFunction porque hace magia por nosotros:
     * 1. Usa 'esbuild' automáticamente para compilar TypeScript a JavaScript.
     * 2. Empaqueta solo el código necesario (Tree Shaking).
     * 3. Crea el archivo .zip optimizado.
     */
    const registerUserLambda = new nodejs.NodejsFunction(this, 'RegisterUserLambda', {
        // Runtime: Versión de Node.js. Debe coincidir con lo que probamos en local.
        runtime: lambda.Runtime.NODEJS_20_X,
        
        // Entry: ¿Dónde está el código fuente?
        // __dirname es la carpeta actual (cdk/lib).
        // Subimos dos niveles (../../) para llegar a la raíz y entramos a 'src'.
        entry: path.join(__dirname, '../../src/lambdaMain.ts'),
        
        // Handler: ¿Qué función exportada dentro de ese archivo se debe ejecutar?
        handler: 'registerUserHandler',
        
        // Bundling: Configuración de cómo empaquetar el código.
        bundling: { 
            minify: true, // Reduce el tamaño del archivo final eliminando espacios y renonbrando variables.
        },
        environment: {
            USERS_TABLE: usersTable.tableName,
        },
    });
    
    // Damos permisos a la Lambda para escribir en la tabla
    usersTable.grantReadWriteData(registerUserLambda);

    /**
     * LAMBDA 2: Crear Órden
     * 
     * Observa que usamos EL MISMO archivo de entrada (lambdaMain.ts).
     * Esto es eficiente porque reutilizamos lógica de dominio.
     * AWS Lambda solo cargará en memoria el código necesario.
     */
    const createOrderLambda = new nodejs.NodejsFunction(this, 'CreateOrderLambda', {
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(__dirname, '../../src/lambdaMain.ts'),
        handler: 'createOrderHandler', // <-- Aquí cambiamos el handler para ejecutar otra lógica
        bundling: { minify: true },
        // Por ahora Orders no usa Dynamo, pero podríamos pasarlo si fuera necesario
    });

    // ========================================================================
    // 2. DEFINICIÓN DEL API GATEWAY
    // ========================================================================

    /**
     * API Gateway actúa como la "puerta de entrada" pública.
     * Recibe peticiones HTTP y las dirige a las Lambdas.
     */
    const api = new apigateway.RestApi(this, 'CleanArchApi', {
      restApiName: 'Clean Architecture Service', // Nombre legible en la consola de AWS
      description: 'This service serves Clean Architecture operations.',
      deployOptions: {
         stageName: 'dev', // El sufijo de la URL (ej. .../dev/users)
      }
    });

    // ========================================================================
    // 3. SEGURIDAD (API KEY)
    // ========================================================================

    // 1. Crear la API Key
    const apiKey = api.addApiKey('ApiKey', {
       apiKeyName: 'CleanArchApiKey',
       description: 'Llave para acceder a la API de Clean Architecture',
    });

    // 2. Crear un Plan de Uso (Usage Plan)
    // El API Key por sí solo no sirve si no está asociado a un plan que diga "cuánto" puedes usarla.
    const plan = api.addUsagePlan('UsagePlan', {
      name: 'StandardPlan',
      throttle: {
        rateLimit: 10,  // 10 peticiones por segundo
        burstLimit: 2   // Ráfagas de hasta 2 peticiones
      }
    });

    // 3. Asociar la Key al Plan
    plan.addApiKey(apiKey);
    
    // 4. Asociar el Plan al Stage 'dev' de la API
    plan.addApiStage({
      stage: api.deploymentStage,
    });

    // ========================================================================
    // 4. RUTAS Y CONEXIONES (INTEGRACIÓN)
    // ========================================================================

    // RUTA 1: /users
    // Creamos el recurso (path) '/users' en la API
    const users = api.root.addResource('users');
    
    // IMPORTANTE: Ahora requerimos apiKeyRequired: true
    users.addMethod('POST', new apigateway.LambdaIntegration(registerUserLambda), {
      apiKeyRequired: true 
    });

    // RUTA 2: /orders
    const orders = api.root.addResource('orders');
    
    orders.addMethod('POST', new apigateway.LambdaIntegration(createOrderLambda), {
      apiKeyRequired: true
    });
    
    // ========================================================================
    // 5. SALIDAS (OUTPUTS)
    // ========================================================================
    
    // Esto imprime la URL final en la consola al terminar el despliegue.
    // Es muy útil para saber dónde probar.
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });
  }
}
