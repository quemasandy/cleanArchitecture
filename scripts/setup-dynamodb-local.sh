#!/bin/bash
# Script para configurar DynamoDB Local con la tabla de usuarios

echo "📦 Iniciando DynamoDB Local..."
docker-compose up -d

echo "⏳ Esperando que DynamoDB Local esté listo..."
sleep 3

echo "🛠️ Creando tabla UsersTable..."
aws dynamodb create-table \
  --table-name users-local \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
  --global-secondary-indexes \
    '[{
      "IndexName": "EmailIndex",
      "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
      "Projection": {"ProjectionType": "ALL"}
    }]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region us-east-1 \
  2>/dev/null || echo "   ⚠️ La tabla ya existe (esto está bien)"

echo ""
echo "✅ DynamoDB Local configurado!"
echo ""
echo "Para usar, ejecuta tu Lambda con:"
echo "  DYNAMODB_ENDPOINT=http://localhost:8000 npx tsx scripts/local-run.ts"
echo ""
echo "Para ver las tablas:"
echo "  aws dynamodb list-tables --endpoint-url http://localhost:8000"
echo ""
echo "Para detener DynamoDB Local:"
echo "  docker-compose down"
