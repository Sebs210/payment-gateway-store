#!/bin/bash
set -e

echo "=== Creating RDS PostgreSQL Database ==="

# Variables
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-payment-gateway}
DB_PASSWORD=${DB_PASSWORD:-PaymentGateway2026!}
DB_USERNAME=${DB_USERNAME:-postgres}
DB_NAME=payment_store
DB_INSTANCE_CLASS=db.t3.micro
ALLOCATED_STORAGE=20

echo "Project: $PROJECT_NAME"
echo "Region: $AWS_REGION"
echo "DB Username: $DB_USERNAME"

# Create security group
echo "Creating RDS security group..."
SG_ID=$(aws ec2 create-security-group \
  --group-name ${PROJECT_NAME}-rds-sg \
  --description "Security group for ${PROJECT_NAME} RDS" \
  --region $AWS_REGION \
  --output text --query 'GroupId' 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=${PROJECT_NAME}-rds-sg" \
    --region $AWS_REGION \
    --output text --query 'SecurityGroups[0].GroupId')

echo "Security Group ID: $SG_ID"

# Allow PostgreSQL access from anywhere (for development - restrict in production)
aws ec2 authorize-security-group-ingress \
  --group-id $SG_ID \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0 \
  --region $AWS_REGION 2>/dev/null || echo "Ingress rule already exists"

# Create DB subnet group (uses default VPC)
echo "Creating DB subnet group..."
DEFAULT_VPC=$(aws ec2 describe-vpcs \
  --filters "Name=is-default,Values=true" \
  --region $AWS_REGION \
  --output text --query 'Vpcs[0].VpcId')

SUBNETS=$(aws ec2 describe-subnets \
  --filters "Name=vpc-id,Values=$DEFAULT_VPC" \
  --region $AWS_REGION \
  --output text --query 'Subnets[*].SubnetId' | tr '\t' ' ')

aws rds create-db-subnet-group \
  --db-subnet-group-name ${PROJECT_NAME}-subnet-group \
  --db-subnet-group-description "Subnet group for ${PROJECT_NAME}" \
  --subnet-ids $SUBNETS \
  --region $AWS_REGION 2>/dev/null || echo "DB subnet group already exists"

# Create RDS instance
echo "Creating RDS PostgreSQL instance (this will take ~10 minutes)..."
aws rds create-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --db-instance-class $DB_INSTANCE_CLASS \
  --engine postgres \
  --engine-version 16.6 \
  --master-username $DB_USERNAME \
  --master-user-password "$DB_PASSWORD" \
  --allocated-storage $ALLOCATED_STORAGE \
  --storage-type gp3 \
  --vpc-security-group-ids $SG_ID \
  --db-subnet-group-name ${PROJECT_NAME}-subnet-group \
  --publicly-accessible \
  --no-multi-az \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --region $AWS_REGION 2>/dev/null || echo "RDS instance already exists"

echo "Waiting for RDS instance to be available..."
aws rds wait db-instance-available \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --region $AWS_REGION

# Get RDS endpoint
RDS_ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --region $AWS_REGION \
  --output text --query 'DBInstances[0].Endpoint.Address')

echo ""
echo "=== RDS Database Created Successfully ==="
echo "Endpoint: $RDS_ENDPOINT"
echo "Port: 5432"
echo "Username: $DB_USERNAME"
echo "Password: $DB_PASSWORD"
echo "Database: postgres (default)"
echo ""
echo "Connection string:"
echo "postgresql://$DB_USERNAME:$DB_PASSWORD@$RDS_ENDPOINT:5432/postgres"
echo ""
echo "Update your .env file with:"
echo "DB_HOST=$RDS_ENDPOINT"
echo "DB_PORT=5432"
echo "DB_USERNAME=$DB_USERNAME"
echo "DB_PASSWORD=$DB_PASSWORD"
echo "DB_DATABASE=$DB_NAME"
