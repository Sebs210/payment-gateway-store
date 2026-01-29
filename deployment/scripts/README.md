# AWS Deployment Scripts

Automated deployment scripts for Payment Gateway Store application.

## Prerequisites

- AWS CLI configured with credentials (`aws configure`)
- Docker installed and running
- Node.js 20+ installed
- Bash shell (Git Bash on Windows)

## Quick Start

### 1. Set Environment Variables

```bash
export AWS_REGION=us-east-1
export PROJECT_NAME=payment-gateway
export DB_PASSWORD=YourSecurePassword123!
```

### 2. Run Deployment Scripts in Order

```bash
# Step 1: Create RDS Database (~10 minutes)
bash 01-create-rds.sh

# Step 2: Deploy Backend to ECS (~5 minutes)
bash 02-deploy-backend.sh

# Step 3: Deploy Frontend to S3 + CloudFront (~15 minutes)
bash 03-deploy-frontend.sh

# Step 4: Update CORS (after getting CloudFront URL)
export CLOUDFRONT_URL=https://dxxxxxxxxxxxxx.cloudfront.net
bash 04-update-cors.sh
```

### 3. Verify Deployment

Open the CloudFront URL in your browser and test the full payment flow.

## Scripts

### 01-create-rds.sh
Creates RDS PostgreSQL database with:
- db.t3.micro instance
- PostgreSQL 16.6
- Public accessibility (for development)
- Security group with port 5432 open

**Output**: RDS endpoint, connection string

### 02-deploy-backend.sh
Deploys backend to ECS Fargate:
- Creates ECR repository
- Builds and pushes Docker image
- Creates ECS cluster, task definition, service
- Creates Application Load Balancer
- Configures health checks

**Output**: ALB DNS name, API URL

### 03-deploy-frontend.sh
Deploys frontend to S3 + CloudFront:
- Builds React app with production backend URL
- Creates S3 bucket
- Uploads static files
- Creates CloudFront distribution
- Configures error pages for SPA routing

**Output**: CloudFront URL, S3 bucket name

### 04-update-cors.sh
Updates backend CORS configuration:
- Modifies ECS task definition
- Updates FRONTEND_URL environment variable
- Forces new deployment

**Input**: CLOUDFRONT_URL environment variable

### cleanup-aws.sh
Deletes all AWS resources:
- ECS service, cluster, task definitions
- Application Load Balancer, target group
- CloudFront distribution
- S3 buckets
- ECR repository
- RDS instance
- Security groups
- CloudWatch logs
- IAM roles

**Warning**: This is destructive and irreversible!

## Troubleshooting

### Script fails with permission error
Ensure your AWS credentials have sufficient permissions (AdministratorAccess recommended).

### Docker build fails
Ensure Docker is running: `docker ps`

### ECS service unhealthy
Check CloudWatch logs:
```bash
aws logs tail /ecs/payment-gateway --follow
```

### Frontend can't connect to backend
1. Verify ALB health checks are passing
2. Check CORS configuration
3. Verify API URL in frontend build

## Cost Estimation

- RDS db.t3.micro: ~$15/month
- ECS Fargate (1 task): ~$15/month
- Application Load Balancer: ~$20/month
- S3 + CloudFront: ~$5/month
- ECR: ~$1/month
- **Total**: ~$56/month

## Manual Cleanup

If scripts fail, manually delete resources via AWS Console:
1. ECS → Delete service → Delete cluster
2. EC2 → Load Balancers → Delete ALB
3. RDS → Delete database
4. CloudFront → Disable + Delete distribution
5. S3 → Empty + Delete bucket
6. ECR → Delete repository
