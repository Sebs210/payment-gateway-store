#!/bin/bash
set -e

echo "=== Deploying Backend to ECS Fargate ==="

# Variables
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-payment-gateway}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query 'Account')
ECR_REPO_NAME=${PROJECT_NAME}-backend
IMAGE_TAG=latest

echo "Project: $PROJECT_NAME"
echo "Region: $AWS_REGION"
echo "Account: $AWS_ACCOUNT_ID"

# Create ECR repository
echo "Creating ECR repository..."
aws ecr create-repository \
  --repository-name $ECR_REPO_NAME \
  --region $AWS_REGION 2>/dev/null || echo "ECR repository already exists"

ECR_URI="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPO_NAME}"
echo "ECR URI: $ECR_URI"

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build Docker image
echo "Building Docker image..."
cd ../../Back
docker build -t $ECR_REPO_NAME:$IMAGE_TAG .
docker tag $ECR_REPO_NAME:$IMAGE_TAG ${ECR_URI}:${IMAGE_TAG}

# Push to ECR
echo "Pushing image to ECR..."
docker push ${ECR_URI}:${IMAGE_TAG}

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --region $AWS_REGION \
  --output text --query 'DBInstances[0].Endpoint.Address' 2>/dev/null || echo "")

if [ -z "$RDS_ENDPOINT" ]; then
  echo "Warning: RDS instance not found. Please create it first with 01-create-rds.sh"
  RDS_ENDPOINT="localhost"
fi

DB_PASSWORD=${DB_PASSWORD:-PaymentGateway2026!}
DB_USERNAME=${DB_USERNAME:-postgres}

# Create ECS cluster
echo "Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name ${PROJECT_NAME}-cluster \
  --region $AWS_REGION 2>/dev/null || echo "ECS cluster already exists"

# Create CloudWatch log group
echo "Creating CloudWatch log group..."
aws logs create-log-group \
  --log-group-name /ecs/${PROJECT_NAME} \
  --region $AWS_REGION 2>/dev/null || echo "Log group already exists"

# Create execution role for ECS
echo "Creating ECS execution role..."
ROLE_NAME="${PROJECT_NAME}-ecs-execution-role"

# Create trust policy
cat > /tmp/ecs-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file:///tmp/ecs-trust-policy.json \
  --region $AWS_REGION 2>/dev/null || echo "IAM role already exists"

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
  --region $AWS_REGION 2>/dev/null || echo "Policy already attached"

ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --output text --query 'Role.Arn')

# Wait for role to be ready
sleep 10

# Register task definition
echo "Registering ECS task definition..."
cat > /tmp/task-def.json <<EOF
{
  "family": "${PROJECT_NAME}-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "$ROLE_ARN",
  "containerDefinitions": [
    {
      "name": "${PROJECT_NAME}",
      "image": "${ECR_URI}:${IMAGE_TAG}",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "PORT", "value": "3001"},
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DB_HOST", "value": "$RDS_ENDPOINT"},
        {"name": "DB_PORT", "value": "5432"},
        {"name": "DB_USERNAME", "value": "$DB_USERNAME"},
        {"name": "DB_PASSWORD", "value": "$DB_PASSWORD"},
        {"name": "DB_DATABASE", "value": "payment_store"},
        {"name": "PAYMENT_GATEWAY_API_URL", "value": "https://api-sandbox.co.uat.wompi.dev/v1"},
        {"name": "PAYMENT_GATEWAY_PUBLIC_KEY", "value": "pub_stagtest_g2u0HQd3ZMh05hsSgTS2lUV8t3s4mfR7"},
        {"name": "PAYMENT_GATEWAY_PRIVATE_KEY", "value": "prv_stagtest_K1LvIPeTCs03JOAeYOipiL1I1Y80BSLK"},
        {"name": "PAYMENT_GATEWAY_INTEGRITY_KEY", "value": "stagtest_integrity_pW65g8ysOkddahxe00XKxvwNwa66N7Y3"},
        {"name": "PAYMENT_GATEWAY_EVENTS_SECRET", "value": "stagtest_events_SphzskO5STXq4sKHNFBPxljtk4z9ygB8"},
        {"name": "FRONTEND_URL", "value": "http://localhost:5173"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF

aws ecs register-task-definition \
  --cli-input-json file:///tmp/task-def.json \
  --region $AWS_REGION

# Create security group for ECS tasks
echo "Creating security group for ECS tasks..."
DEFAULT_VPC=$(aws ec2 describe-vpcs \
  --filters "Name=is-default,Values=true" \
  --region $AWS_REGION \
  --output text --query 'Vpcs[0].VpcId')

ECS_SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-ecs-sg \
  --description "Security group for ${PROJECT_NAME} ECS tasks" \
  --vpc-id $DEFAULT_VPC \
  --region $AWS_REGION \
  --output text --query 'GroupId' 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-ecs-sg" \
    --region $AWS_REGION \
    --output text --query 'SecurityGroups[0].GroupId')

aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION 2>/dev/null || echo "Ingress rule already exists"

# Get subnets
SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$DEFAULT_VPC" \
  --region $AWS_REGION \
  --output text --query 'Subnets[*].SubnetId' | tr '\t' ',' | sed 's/,$//')

# Create Application Load Balancer
echo "Creating Application Load Balancer..."
ALB_SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-alb-sg \
  --description "Security group for ${PROJECT_NAME} ALB" \
  --vpc-id $DEFAULT_VPC \
  --region $AWS_REGION \
  --output text --query 'GroupId' 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-alb-sg" \
    --region $AWS_REGION \
    --output text --query 'SecurityGroups[0].GroupId')

aws ec2 authorize-security-group-ingress \
  --group-id $ALB_SG_ID \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION 2>/dev/null || echo "ALB ingress rule already exists"

# Allow ALB to reach ECS tasks
aws ec2 authorize-security-group-ingress \
  --group-id $ECS_SG_ID \
  --protocol tcp \
  --port 3001 \
  --source-group $ALB_SG_ID \
  --region $AWS_REGION 2>/dev/null || echo "ECS ingress from ALB already exists"

ALB_ARN=$(aws elbv2 create-load-balancer \
  --name ${PROJECT_NAME}-alb \
  --subnets $(echo $SUBNETS | tr ',' ' ') \
  --security-groups $ALB_SG_ID \
  --region $AWS_REGION \
  --output text --query 'LoadBalancers[0].LoadBalancerArn' 2>/dev/null || \
  aws elbv2 describe-load-balancers \
    --names ${PROJECT_NAME}-alb \
    --region $AWS_REGION \
    --output text --query 'LoadBalancers[0].LoadBalancerArn')

echo "ALB ARN: $ALB_ARN"

# Wait for ALB to be active
echo "Waiting for ALB to be active..."
aws elbv2 wait load-balancer-available \
  --load-balancer-arns $ALB_ARN \
  --region $AWS_REGION

# Create target group
TG_ARN=$(aws elbv2 create-target-group \
  --name ${PROJECT_NAME}-tg \
  --protocol HTTP \
  --port 3001 \
  --vpc-id $DEFAULT_VPC \
  --target-type ip \
  --health-check-path /api/products \
  --health-check-interval-seconds 30 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3 \
  --region $AWS_REGION \
  --output text --query 'TargetGroups[0].TargetGroupArn' 2>/dev/null || \
  aws elbv2 describe-target-groups \
    --names ${PROJECT_NAME}-tg \
    --region $AWS_REGION \
    --output text --query 'TargetGroups[0].TargetGroupArn')

echo "Target Group ARN: $TG_ARN"

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=$TG_ARN \
  --region $AWS_REGION 2>/dev/null || echo "Listener already exists"

# Create ECS service
echo "Creating ECS service..."
aws ecs create-service \
  --cluster ${PROJECT_NAME}-cluster \
  --service-name ${PROJECT_NAME}-service \
  --task-definition ${PROJECT_NAME}-task \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$ECS_SG_ID],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=$TG_ARN,containerName=${PROJECT_NAME},containerPort=3001" \
  --region $AWS_REGION 2>/dev/null || echo "ECS service already exists (updating...)"

# Update service if it exists
aws ecs update-service \
  --cluster ${PROJECT_NAME}-cluster \
  --service ${PROJECT_NAME}-service \
  --force-new-deployment \
  --region $AWS_REGION 2>/dev/null || true

# Get ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --load-balancer-arns $ALB_ARN \
  --region $AWS_REGION \
  --output text --query 'LoadBalancers[0].DNSName')

echo ""
echo "=== Backend Deployed Successfully ==="
echo "ALB DNS: $ALB_DNS"
echo "API Base URL: http://$ALB_DNS/api"
echo ""
echo "Test the API:"
echo "curl http://$ALB_DNS/api/products"
echo ""
echo "Note: It may take 2-3 minutes for the service to become healthy."
