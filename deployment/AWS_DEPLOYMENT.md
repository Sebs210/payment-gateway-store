# AWS Deployment Guide

This guide provides step-by-step instructions for deploying the Payment Gateway Store application to AWS using:
- **Frontend**: S3 + CloudFront
- **Backend**: ECS Fargate + ECR
- **Database**: RDS PostgreSQL

## Prerequisites

- AWS CLI configured with credentials
- Docker installed and running
- Node.js 20+ installed
- PostgreSQL client (optional, for database verification)

## Architecture Overview

```
┌─────────────────┐
│   CloudFront    │ (CDN)
└────────┬────────┘
         │
┌────────▼────────┐
│   S3 Bucket     │ (Frontend Static Files)
└─────────────────┘

┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Application    │─────▶│   ECS Fargate   │─────▶│  RDS PostgreSQL │
│  Load Balancer  │      │   (Backend)     │      │   (Database)    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
                                 │
                         ┌───────▼───────┐
                         │      ECR      │ (Docker Registry)
                         └───────────────┘
```

## Deployment Steps

### Step 1: Set Environment Variables

```bash
export AWS_REGION=us-east-1
export PROJECT_NAME=payment-gateway
export DB_PASSWORD=YourSecurePassword123!
export DB_USERNAME=postgres
```

### Step 2: Create RDS Database

```bash
cd deployment/scripts
bash 01-create-rds.sh
```

This will:
- Create a VPC with public/private subnets
- Create a security group for RDS
- Launch RDS PostgreSQL instance
- Output the database endpoint

**Wait ~10 minutes for RDS to be available.**

### Step 3: Build and Deploy Backend to ECS

```bash
bash 02-deploy-backend.sh
```

This will:
- Create ECR repository
- Build Docker image from `Back/Dockerfile`
- Push image to ECR
- Create ECS cluster, task definition, and service
- Create Application Load Balancer
- Output the ALB DNS name

**Wait ~5 minutes for ECS service to stabilize.**

### Step 4: Run Database Migrations

```bash
# Get the ALB URL from previous step
export BACKEND_URL=http://<ALB-DNS-NAME>

# Test backend health
curl $BACKEND_URL/api/products

# If needed, run migrations manually via ECS task
aws ecs run-task \
  --cluster payment-gateway-cluster \
  --task-definition payment-gateway-task \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --overrides '{"containerOverrides":[{"name":"payment-gateway","command":["npm","run","migration:run"]}]}'
```

### Step 5: Deploy Frontend to S3 + CloudFront

```bash
bash 03-deploy-frontend.sh
```

This will:
- Build React app with production backend URL
- Create S3 bucket for static hosting
- Upload built files to S3
- Create CloudFront distribution
- Output the CloudFront URL

**Wait ~15 minutes for CloudFront distribution to deploy globally.**

### Step 6: Update CORS Configuration

Update backend environment variable `FRONTEND_URL` in ECS task definition:

```bash
# Get CloudFront URL from previous step
export CLOUDFRONT_URL=https://dxxxxxxxxxxxxx.cloudfront.net

# Update ECS task definition with new CORS origin
bash 04-update-cors.sh
```

### Step 7: Verify Deployment

1. Open CloudFront URL in browser
2. Browse products
3. Complete a test transaction with card `4242424242424242`
4. Verify payment flow works end-to-end

## Manual Deployment (Alternative)

If you prefer manual deployment via AWS Console:

### Frontend (S3 + CloudFront)

1. **Build frontend**:
   ```bash
   cd Front
   npm run build
   ```

2. **Create S3 bucket**:
   - Go to S3 Console → Create bucket
   - Name: `payment-gateway-frontend`
   - Uncheck "Block all public access"
   - Enable static website hosting

3. **Upload files**:
   - Upload contents of `Front/dist/` to bucket
   - Set bucket policy for public read access

4. **Create CloudFront distribution**:
   - Origin: S3 bucket website endpoint
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Default root object: `index.html`
   - Error pages: 404 → /index.html (for React Router)

### Backend (ECS Fargate)

1. **Create ECR repository**:
   - Go to ECR Console → Create repository
   - Name: `payment-gateway-backend`

2. **Push Docker image**:
   ```bash
   cd Back
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
   docker build -t payment-gateway-backend .
   docker tag payment-gateway-backend:latest <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/payment-gateway-backend:latest
   docker push <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/payment-gateway-backend:latest
   ```

3. **Create ECS cluster**:
   - Go to ECS Console → Create cluster
   - Name: `payment-gateway-cluster`
   - Infrastructure: AWS Fargate

4. **Create task definition**:
   - Launch type: Fargate
   - Task CPU: 0.5 vCPU
   - Task memory: 1 GB
   - Container image: ECR image URI
   - Port mappings: 3001
   - Environment variables: DB_HOST, DB_PASSWORD, FRONTEND_URL, etc.

5. **Create service**:
   - Cluster: `payment-gateway-cluster`
   - Launch type: Fargate
   - Desired tasks: 1
   - Load balancer: Application Load Balancer (create new)

### Database (RDS)

1. **Create RDS instance**:
   - Engine: PostgreSQL 16
   - Template: Free tier (or Production for better performance)
   - DB instance identifier: `payment-gateway-db`
   - Master username: `postgres`
   - Master password: (set secure password)
   - Public access: Yes (for initial setup, restrict later)
   - VPC security group: Allow inbound 5432 from ECS tasks

2. **Connect and initialize**:
   ```bash
   psql -h <RDS_ENDPOINT> -U postgres -d postgres
   CREATE DATABASE payment_store;
   \c payment_store
   # Run migrations via backend or manually
   ```

## Cost Estimation

- **RDS PostgreSQL (db.t3.micro)**: ~$15/month
- **ECS Fargate (0.5 vCPU, 1GB)**: ~$15/month (1 task)
- **ALB**: ~$20/month
- **S3 + CloudFront**: ~$5/month (low traffic)
- **ECR**: ~$1/month
- **Total**: ~$56/month

For free tier: Use t3.micro RDS free tier (12 months) and minimal Fargate usage.

## Troubleshooting

### Backend not starting
- Check ECS task logs in CloudWatch
- Verify RDS security group allows inbound from ECS tasks
- Verify environment variables are correctly set

### Frontend can't connect to backend
- Verify CORS_ORIGIN in backend env vars matches CloudFront URL
- Check ALB health checks are passing
- Verify API endpoint in frontend build

### Database connection errors
- Verify RDS is publicly accessible (or in same VPC as ECS)
- Check security group rules
- Verify DB credentials in environment variables

## Cleanup

To avoid ongoing costs, delete resources:

```bash
bash cleanup-aws.sh
```

This will delete:
- CloudFront distribution
- S3 bucket
- ECS service, cluster, task definition
- ECR repository
- Application Load Balancer
- RDS instance (with final snapshot)
- VPC resources
