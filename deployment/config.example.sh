#!/bin/bash

# AWS Configuration
export AWS_REGION=us-east-1
export PROJECT_NAME=payment-gateway

# Database Configuration
export DB_PASSWORD=YourSecurePassword123!
export DB_USERNAME=postgres
export DB_NAME=payment_store

# CloudFront URL (set after running 03-deploy-frontend.sh)
export CLOUDFRONT_URL=https://dxxxxxxxxxxxxx.cloudfront.net

# Usage:
# 1. Copy this file: cp config.example.sh config.sh
# 2. Edit config.sh with your values
# 3. Source it before running scripts: source config.sh
