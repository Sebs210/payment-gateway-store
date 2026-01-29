#!/bin/bash
set -e

echo "=== Updating Backend CORS Configuration ==="

# Variables
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-payment-gateway}
CLOUDFRONT_URL=${CLOUDFRONT_URL:-}

if [ -z "$CLOUDFRONT_URL" ]; then
  echo "Please provide CloudFront URL:"
  echo "export CLOUDFRONT_URL=https://dxxxxxxxxxxxxx.cloudfront.net"
  echo "Then run this script again."
  exit 1
fi

echo "Project: $PROJECT_NAME"
echo "Region: $AWS_REGION"
echo "CloudFront URL: $CLOUDFRONT_URL"

# Get current task definition
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition ${PROJECT_NAME}-task \
  --region $AWS_REGION \
  --output json)

# Update FRONTEND_URL environment variable
UPDATED_TASK_DEF=$(echo $TASK_DEF | jq --arg url "$CLOUDFRONT_URL" '
  .taskDefinition |
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) |
  .containerDefinitions[0].environment |=
    map(if .name == "FRONTEND_URL" then .value = $url else . end)
')

# Register new task definition
echo "Registering updated task definition..."
echo "$UPDATED_TASK_DEF" > /tmp/updated-task-def.json

aws ecs register-task-definition \
  --cli-input-json file:///tmp/updated-task-def.json \
  --region $AWS_REGION

# Update ECS service
echo "Updating ECS service..."
aws ecs update-service \
  --cluster ${PROJECT_NAME}-cluster \
  --service ${PROJECT_NAME}-service \
  --task-definition ${PROJECT_NAME}-task \
  --force-new-deployment \
  --region $AWS_REGION

echo ""
echo "=== CORS Configuration Updated ==="
echo "Service is being updated with new task definition."
echo "This will take 2-3 minutes to roll out."
echo ""
echo "Verify with:"
echo "aws ecs describe-services --cluster ${PROJECT_NAME}-cluster --services ${PROJECT_NAME}-service --region $AWS_REGION"
