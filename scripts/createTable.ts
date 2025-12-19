/**
 * Script para crear la tabla users-local en DynamoDB Local.
 * Útil cuando el contenedor Docker se reinicia y pierde los datos.
 */

import { DynamoDBClient, CreateTableCommand, ListTablesCommand } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'us-east-1',
    credentials: {
        accessKeyId: 'local',
        secretAccessKey: 'local'
    }
});

async function createTable() {
    console.log('📋 Verificando tablas existentes...');
    
    const listResult = await client.send(new ListTablesCommand({}));
    console.log('   Tablas encontradas:', listResult.TableNames);
    
    if (listResult.TableNames?.includes('users-local')) {
        console.log('✅ La tabla users-local ya existe');
        return;
    }
    
    console.log('🛠️ Creando tabla users-local...');
    
    await client.send(new CreateTableCommand({
        TableName: 'users-local',
        AttributeDefinitions: [
            { AttributeName: 'pk', AttributeType: 'S' },
            { AttributeName: 'email', AttributeType: 'S' }
        ],
        KeySchema: [
            { AttributeName: 'pk', KeyType: 'HASH' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'EmailIndex',
                KeySchema: [{ AttributeName: 'email', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' }
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    }));
    
    console.log('✅ Tabla users-local creada exitosamente!');
}

createTable().catch(console.error);
