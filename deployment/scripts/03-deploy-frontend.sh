#!/bin/bash
set -e

echo "=== Deploying Frontend to S3 + CloudFront ==="

# Variables
AWS_REGION=${AWS_REGION:-us-east-1}
PROJECT_NAME=${PROJECT_NAME:-payment-gateway}
BUCKET_NAME="${PROJECT_NAME}-frontend-$(date +%s)"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query 'Account')

echo "Project: $PROJECT_NAME"
echo "Region: $AWS_REGION"
echo "Bucket: $BUCKET_NAME"

# Get backend ALB DNS
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names ${PROJECT_NAME}-alb \
  --region $AWS_REGION \
  --output text --query 'LoadBalancers[0].DNSName' 2>/dev/null || echo "")

if [ -z "$ALB_DNS" ]; then
  echo "Warning: Backend ALB not found. Using localhost as backend URL."
  BACKEND_URL="http://localhost:3001"
else
  BACKEND_URL="http://$ALB_DNS"
fi

echo "Backend URL: $BACKEND_URL"

# Build frontend with production backend URL
echo "Building frontend..."
cd ../../Front

# Create production .env
cat > .env.production <<EOF
VITE_API_URL=${BACKEND_URL}/api
EOF

npm run build

# Create S3 bucket
echo "Creating S3 bucket..."
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Configure bucket for static website hosting
echo "Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME \
  --index-document index.html \
  --error-document index.html

# Set bucket policy for public read
cat > /tmp/bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
    }
  ]
}
EOF

aws s3api put-bucket-policy \
  --bucket $BUCKET_NAME \
  --policy file:///tmp/bucket-policy.json

# Disable block public access
aws s3api put-public-access-block \
  --bucket $BUCKET_NAME \
  --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

# Upload built files
echo "Uploading files to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html"

# Upload index.html with no-cache
aws s3 cp dist/index.html s3://$BUCKET_NAME/index.html \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html"

# Create CloudFront distribution
echo "Creating CloudFront distribution (this may take 10-15 minutes)..."
cat > /tmp/cf-config.json <<EOF
{
  "CallerReference": "${PROJECT_NAME}-$(date +%s)",
  "Comment": "${PROJECT_NAME} Frontend Distribution",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${BUCKET_NAME}",
        "DomainName": "${BUCKET_NAME}.s3-website-${AWS_REGION}.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only",
          "OriginSslProtocols": {
            "Quantity": 1,
            "Items": ["TLSv1.2"]
          }
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {
        "Forward": "none"
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
EOF

DISTRIBUTION_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/cf-config.json \
  --region $AWS_REGION \
  --output text --query 'Distribution.Id' 2>/dev/null || echo "")

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "CloudFront distribution already exists or creation failed."
  echo "Check existing distributions:"
  aws cloudfront list-distributions --output table
else
  echo "CloudFront Distribution ID: $DISTRIBUTION_ID"

  # Wait for distribution to deploy
  echo "Waiting for CloudFront distribution to deploy..."
  aws cloudfront wait distribution-deployed \
    --id $DISTRIBUTION_ID

  # Get CloudFront domain
  CF_DOMAIN=$(aws cloudfront get-distribution \
    --id $DISTRIBUTION_ID \
    --output text --query 'Distribution.DomainName')

  echo ""
  echo "=== Frontend Deployed Successfully ==="
  echo "CloudFront URL: https://$CF_DOMAIN"
  echo "S3 Bucket: $BUCKET_NAME"
  echo "Distribution ID: $DISTRIBUTION_ID"
  echo ""
  echo "IMPORTANT: Update backend CORS configuration:"
  echo "Set FRONTEND_URL environment variable to: https://$CF_DOMAIN"
  echo ""
  echo "Run: bash 04-update-cors.sh"
fi
