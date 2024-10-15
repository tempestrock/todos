#! /usr/bin/env bash

#
# Simple script to create an AWS Cognito user pool and app client.
#
# Prerequisites:
# - AWS CLI is installed.
# - AWS environment variables AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY
#   (and AWS_SESSION_TOKEN if necessary) are set.
#
# The resulting COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID need to be set
# in the .env file.
#

# Constants
readonly USER_POOL_NAME="MyTodosUserPool" # CUSTOMIZE_ME
readonly APP_CLIENT_NAME="MyAppClient"    # CUSTOMIZE_ME

# Check if the user pool already exists.
EXISTING_USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 \
  --query "UserPools[?Name=='${USER_POOL_NAME}'].Id" --output text)

if [[ -n "${EXISTING_USER_POOL_ID}" ]]; then
  echo "User pool '${USER_POOL_NAME}' already exists with ID: ${EXISTING_USER_POOL_ID}. Exiting."
  exit 1
fi

# Create Cognito user pool with a reasonable configuration.
COGNITO_USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name "${USER_POOL_NAME}" \
  --mfa-configuration OFF \
  --username-configuration "CaseSensitive=false" \
  --admin-create-user-config "AllowAdminCreateUserOnly=true" \
  --query 'UserPool.Id' --output text)

echo "Created user pool with ID: ${COGNITO_USER_POOL_ID}"

# Create app client with a reasonable configuration.
COGNITO_CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id "${COGNITO_USER_POOL_ID}" \
  --client-name "${APP_CLIENT_NAME}" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_USER_SRP_AUTH \
  --access-token-validity 10 \
  --refresh-token-validity 30 \
  --token-validity-units AccessToken=minutes,RefreshToken=days \
  --query 'UserPoolClient.ClientId' --output text)

echo "Created app client with ID: ${COGNITO_CLIENT_ID}"
