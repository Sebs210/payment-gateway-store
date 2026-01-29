#!/bin/bash
set -e

echo "=== Cleaning Up AWS Resources ==="
echo "WARNING: This will delete all resources created for the payment gateway project."
echo "Press Ctrl+C to cancel, or wait 10 seconds to proceed..."
sleep 10

# Variables
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-payment-gateway}

# Delete ECS service
echo "Deleting ECS service..."
aws ecs update-service \
  --cluster ${PROJECT_NAME}-cluster \
  --service ${PROJECT_NAME}-service \
  --desired-count 0 \
  --region $AWS_REGION 2>/dev/null || true

aws ecs delete-service \
  --cluster ${PROJECT_NAME}-cluster \
  --service ${PROJECT_NAME}-service \
  --force \
  --region $AWS_REGION 2>/dev/null || true

# Wait for service to be deleted
echo "Waiting for service to be deleted..."
sleep 30

# Delete ECS cluster
echo "Deleting ECS cluster..."
aws ecs delete-cluster \
  --cluster ${PROJECT_NAME}-cluster \
  --region $AWS_REGION 2>/dev/null || true

# Deregister task definitions
echo "Deregistering task definitions..."
TASK_DEFS=$(aws ecs list-task-definitions \
  --family-prefix ${PROJECT_NAME}-task \
  --region $AWS_REGION \
  --output text --query 'taskDefinitionArns' || echo "")

for TASK_DEF in $TASK_DEFS; do
  aws ecs deregister-task-definition \
    --task-definition $TASK_DEF \
    --region $AWS_REGION 2>/dev/null || true
done

# Delete Application Load Balancer
echo "Deleting Application Load Balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers \
  --names ${PROJECT_NAME}-alb \
  --region $AWS_REGION \
  --output text --query 'LoadBalancers[0].LoadBalancerArn' 2>/dev/null || echo "")

if [ -n "$ALB_ARN" ]; then
  aws elbv2 delete-load-balancer \
    --load-balancer-arn $ALB_ARN \
    --region $AWS_REGION 2>/dev/null || true

  echo "Waiting for ALB to be deleted..."
  sleep 30
fi

# Delete target group
echo "Deleting target group..."
TG_ARN=$(aws elbv2 describe-target-groups \
  --names ${PROJECT_NAME}-tg \
  --region $AWS_REGION \
  --output text --query 'TargetGroups[0].TargetGroupArn' 2>/dev/null || echo "")

if [ -n "$TG_ARN" ]; then
  aws elbv2 delete-target-group \
    --target-group-arn $TG_ARN \
    --region $AWS_REGION 2>/dev/null || true
fi

# Delete CloudFront distribution
echo "Finding CloudFront distributions..."
DISTRIBUTIONS=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='${PROJECT_NAME} Frontend Distribution'].{Id:Id,ETag:ETag}" \
  --output json 2>/dev/null || echo "[]")

echo "$DISTRIBUTIONS" | jq -r '.[] | @base64' | while read dist; do
  DIST_ID=$(echo $dist | base64 -d | jq -r '.Id')

  echo "Disabling CloudFront distribution $DIST_ID..."
  DIST_CONFIG=$(aws cloudfront get-distribution-config \
    --id $DIST_ID \
    --output json)

  ETAG=$(echo $DIST_CONFIG | jq -r '.ETag')

  echo $DIST_CONFIG | jq '.DistributionConfig | .Enabled = false' > /tmp/dist-config.json

  aws cloudfront update-distribution \
    --id $DIST_ID \
    --if-match $ETAG \
    --distribution-config file:///tmp/dist-config.json 2>/dev/null || true

  echo "Waiting for distribution to be disabled..."
  aws cloudfront wait distribution-deployed --id $DIST_ID 2>/dev/null || true

  echo "Deleting CloudFront distribution $DIST_ID..."
  NEW_ETAG=$(aws cloudfront get-distribution-config --id $DIST_ID --output text --query 'ETag')

  aws cloudfront delete-distribution \
    --id $DIST_ID \
    --if-match $NEW_ETAG 2>/dev/null || true
done

# Delete S3 buckets
echo "Deleting S3 buckets..."
aws s3 ls | grep ${PROJECT_NAME}-frontend | awk '{print $3}' | while read bucket; do
  echo "Deleting bucket: $bucket"
  aws s3 rb s3://$bucket --force 2>/dev/null || true
done

# Delete ECR repository
echo "Deleting ECR repository..."
aws ecr delete-repository \
  --repository-name ${PROJECT_NAME}-backend \
  --force \
  --region $AWS_REGION 2>/dev/null || true

# Delete RDS instance
echo "Deleting RDS instance..."
aws rds delete-db-instance \
  --db-instance-identifier ${PROJECT_NAME}-db \
  --skip-final-snapshot \
  --delete-automated-backups \
  --region $AWS_REGION 2>/dev/null || true

# Delete DB subnet group
echo "Deleting DB subnet group..."
aws rds delete-db-subnet-group \
  --db-subnet-group-name ${PROJECT_NAME}-subnet-group \
  --region $AWS_REGION 2>/dev/null || true

# Delete security groups
echo "Deleting security groups..."
sleep 60  # Wait for resources using security groups to be deleted

aws ec2 delete-security-group \
  --group-name ${PROJECT_NAME}-ecs-sg \
  --region $AWS_REGION 2>/dev/null || true

aws ec2 delete-security-group \
  --group-name ${PROJECT_NAME}-alb-sg \
  --region $AWS_REGION 2>/dev/null || true

aws ec2 delete-security-group \
  --group-name ${PROJECT_NAME}-rds-sg \
  --region $AWS_REGION 2>/dev/null || true

# Delete CloudWatch log group
echo "Deleting CloudWatch log group..."
aws logs delete-log-group \
  --log-group-name /ecs/${PROJECT_NAME} \
  --region $AWS_REGION 2>/dev/null || true

# Delete IAM role
echo "Deleting IAM role..."
ROLE_NAME="${PROJECT_NAME}-ecs-execution-role"

aws iam detach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy \
  2>/dev/null || true

aws iam delete-role \
  --role-name $ROLE_NAME \
  2>/dev/null || true

echo ""
echo "=== Cleanup Complete ==="
echo "All resources have been deleted."
echo "Note: Some resources (RDS, CloudFront) may take additional time to fully delete."
