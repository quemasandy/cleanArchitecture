/**
 * Script para crear/recrear la tabla users-local en DynamoDB Local.
 * 
 * SINGLE-TABLE DESIGN (Patrón Óptimo PK/SK):
 * - pk (Partition Key): "USER#{userId}" - Agrupa entidades del mismo usuario
 * - sk (Sort Key): "PROFILE" (usuario) o "SESSION#{token}" (sesiones)
 *
 * GSIs (Global Secondary Indexes):
 * - EmailIndex: Buscar usuarios por email
 * - TokenIndex: Buscar sesiones por token (para logout)
 * 
 * Uso: npx tsx scripts/createTable.ts
 */

import { 
    DynamoDBClient, 
    CreateTableCommand, 
    ListTablesCommand,
    DeleteTableCommand 
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});

const TABLE_NAME = 'users-local';

async function deleteTableIfExists(): Promise<boolean> {
    const listResult = await client.send(new ListTablesCommand({}));
    
    if (listResult.TableNames?.includes(TABLE_NAME)) {
        console.log(`🗑️  Eliminando tabla existente: ${TABLE_NAME}...`);
        await client.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
        // Esperar un momento para que se complete la eliminación
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
    }
    return false;
}

async function createTable() {
    console.log('📋 Verificando tablas existentes...');
    
    const deleted = await deleteTableIfExists();
    if (deleted) {
        console.log('   Tabla eliminada, recreando con nueva estructura...');
    }
    
    console.log(`🛠️  Creando tabla ${TABLE_NAME} con PK/SK (Single-Table Design)...`);
    
    await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        // Definición de atributos usados en claves
        AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'sk', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' },
            { AttributeName: 'token', AttributeType: 'S' }
        ],
        // Clave primaria compuesta: pk + sk
        KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' },   // Partition Key
            { AttributeName: 'sk', KeyType: 'RANGE' }   // Sort Key
        ],
        // Índices secundarios globales
        GlobalSecondaryIndexes: [
            {
                // GSI para buscar usuarios por email
                IndexName: 'EmailIndex',
                KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            },
            {
                // GSI para buscar sesiones por token (logout)
                IndexName: 'TokenIndex',
                KeySchema: [{ AttributeName: 'token', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    }));
    
    console.log('');
    console.log('✅ Tabla creada exitosamente con Single-Table Design!');
    console.log('');
    console.log('📋 Estructura de la tabla:');
    console.log('   ┌─────────────────────┬─────────────────────────────────┐');
    console.log('   │ pk (Partition Key)  │ sk (Sort Key)                   │');
    console.log('   ├─────────────────────┼─────────────────────────────────┤');
    console.log('   │ USER#{userId}       │ PROFILE                         │');
    console.log('   │ USER#{userId}       │ SESSION#{token}                 │');
    console.log('   └─────────────────────┴─────────────────────────────────┘');
    console.log('');
    console.log('📊 GSIs disponibles:');
    console.log('   - EmailIndex: Buscar usuarios por email');
    console.log('   - TokenIndex: Buscar sesiones por token');
}

createTable().catch(console.error);
