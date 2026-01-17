#!/bin/bash
# Script para configurar DynamoDB Local con la tabla de usuarios
# 
# SINGLE-TABLE DESIGN (Patrón Óptimo PK/SK):
# - pk (Partition Key): "USER#{userId}" - Agrupa entidades del mismo usuario
# - sk (Sort Key): "PROFILE" (usuario) o "SESSION#{token}" (sesiones)
#
# GSIs (Global Secondary Indexes):
# - EmailIndex: Buscar usuarios por email
# - TokenIndex: Buscar sesiones por token (para logout)

echo "📦 Iniciando DynamoDB Local..."
docker-compose up -d

echo "⏳ Esperando que DynamoDB Local esté listo..."
sleep 3

echo "🛠️ Creando tabla UsersTable con PK/SK (Single-Table Design)..."
aws dynamodb create-table \
  --table-name users-local \
  --attribute-definitions \
    AttributeName=pk,AttributeType=S \
    AttributeName=sk,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=token,AttributeType=S \
  --key-schema \
    AttributeName=pk,KeyType=HASH \
    AttributeName=sk,KeyType=RANGE \
  --global-secondary-indexes \
    '[
      {
        "IndexName": "EmailIndex",
        "KeySchema": [{"AttributeName": "email", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      },
      {
        "IndexName": "TokenIndex",
        "KeySchema": [{"AttributeName": "token", "KeyType": "HASH"}],
        "Projection": {"ProjectionType": "ALL"}
      }
    ]' \
  --billing-mode PAY_PER_REQUEST \
  --endpoint-url http://localhost:8000 \
  --region us-east-1 \
  2>/dev/null || echo "   ⚠️ La tabla ya existe (esto está bien)"

echo ""
echo "✅ DynamoDB Local configurado con Single-Table Design!"
echo ""
echo "📋 Estructura de la tabla:"
echo "   ┌─────────────────────┬─────────────────────────────────┐"
echo "   │ pk (Partition Key)  │ sk (Sort Key)                   │"
echo "   ├─────────────────────┼─────────────────────────────────┤"
echo "   │ USER#{userId}       │ PROFILE                         │"
echo "   │ USER#{userId}       │ SESSION#{token}                 │"
echo "   └─────────────────────┴─────────────────────────────────┘"
echo ""
echo "📊 Para usar, ejecuta tu Lambda con:"
echo "   DYNAMODB_ENDPOINT=http://localhost:8000 npx tsx scripts/registerUser.ts"
echo ""
echo "📊 Para ver las tablas:"
echo "   aws dynamodb list-tables --endpoint-url http://localhost:8000"
echo ""
echo "📊 Para ver los items:"
echo "   aws dynamodb scan --table-name users-local --endpoint-url http://localhost:8000"
echo ""
echo "⚠️  Para detener DynamoDB Local:"
echo "   docker-compose down"
