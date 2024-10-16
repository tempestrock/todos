#! /usr/bin/env bash

#
# Creates an AWS Cognito user pool, an app client, and an initial user.
#
# Prerequisites:
# - AWS CLI is installed.
# - AWS environment variables AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY
#   (and AWS_SESSION_TOKEN if necessary) are set.
#
# The resulting COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID need to be set
# in the .env file of the Todos app.
#

INITIAL_USERNAME="riley"
INITIAL_PASSWORD="N0tVeryS4fePW!"

main() {
  [[ $# -ne 1 ]] && fatal "Usage: ${0} <user-pool-name>"
  local -r USER_POOL_NAME="${1}"

  check_for_available_commands "aws"
  check_for_aws_env_vars
  create_user_pool "${USER_POOL_NAME}"
  create_initial_user "${COGNITO_USER_POOL_ID}"
}

# -------------- initial includes and preparations ------------------------------------------------

set -eo pipefail     # Stop this script from executing as soon as an error occurs.
cd $(dirname "${0}") # Enable this script to be run from anywhere.
readonly Home_dir=$(pwd)/..

readonly includes_dir=./includes
. ${includes_dir}/basics.sh
. ${includes_dir}/check-for-available-commands.sh
. ${includes_dir}/check-for-aws-env-vars.sh

# -------------- functions ------------------------------------------------------------------------

create_user_pool() {
  local -r USER_POOL_NAME="${1}"

  title "Creating user pool '${USER_POOL_NAME}'"

  # Check if the user pool already exists.
  local -r EXISTING_USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 \
    --query "UserPools[?Name=='${USER_POOL_NAME}'].Id" --output text)

  if [[ -n "${EXISTING_USER_POOL_ID}" ]]; then
    info "User pool '${USER_POOL_NAME}' already exists with ID: ${EXISTING_USER_POOL_ID}. Exiting."
    exit 0
  fi

  # Create Cognito user pool with a reasonable configuration.
  readonly COGNITO_USER_POOL_ID=$(aws cognito-idp create-user-pool \
    --pool-name "${USER_POOL_NAME}" \
    --mfa-configuration OFF \
    --username-configuration "CaseSensitive=false" \
    --admin-create-user-config "AllowAdminCreateUserOnly=true" \
    --query 'UserPool.Id' --output text)

  info "Created user pool with ID: ${COGNITO_USER_POOL_ID}"

  local -r APP_CLIENT_NAME="${USER_POOL_NAME}AppClient"

  title "Creating app client '${APP_CLIENT_NAME}'"

  # Create app client with a reasonable configuration.
  readonly COGNITO_CLIENT_ID=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "${COGNITO_USER_POOL_ID}" \
    --client-name "${APP_CLIENT_NAME}" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_REFRESH_TOKEN_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_USER_SRP_AUTH \
    --access-token-validity 10 \
    --refresh-token-validity 30 \
    --token-validity-units AccessToken=minutes,RefreshToken=days \
    --query 'UserPoolClient.ClientId' --output text)

  info "Created app client with ID: ${COGNITO_CLIENT_ID}"
}

create_initial_user() {
  local -r USER_POOL_ID="${1}"

  title "Creating initial user '${INITIAL_USERNAME}'"

  # Create an initial user without sending an invitation
  aws cognito-idp admin-create-user \
    --user-pool-id "${USER_POOL_ID}" \
    --username "${INITIAL_USERNAME}" \
    --temporary-password "${INITIAL_PASSWORD}" \
    --message-action SUPPRESS
}

# -------------- calling the main function --------------------------------------------------------

main "${@}"
