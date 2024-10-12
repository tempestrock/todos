#! /usr/bin/env bash

#
# Creates all database tables for the given environment (dev, uat, or prod) that are necessary
# for the Todos app.
#
# Prerequisites:
#   - AWS CLI is installed.
#   - The AWS environment variables AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
#     (and AWS_SESSION_TOKEN if necessary) are set.
#

main() {
  welcome db-table-creation
  check_for_available_commands "aws"
  consume_command_line_params "${@}"
  check_for_aws_env_vars

  local -r table_names=("TaskListMetadata" "Tasks" "Users" "Labels" "Sessions")

  for table_name in "${table_names[@]}"; do
    create_table "${table_name}"
  done

  enable_ttl_on_table "Sessions"

  echo
  info "Script finished successfully."
}

# -------------- initial includes and preparations ------------------------------------------------

set -eo pipefail     # Stop this script from executing as soon as an error occurs.
cd $(dirname "${0}") # Enable this script to be run from anywhere.
readonly Home_dir=$(pwd)/..

readonly includes_dir=./includes
. ${includes_dir}/basics.sh
. ${includes_dir}/check-for-available-commands.sh
. ${includes_dir}/check-for-aws-env-vars.sh
. ${includes_dir}/consume-command-line-params-db.sh
. ${includes_dir}/welcome.sh

#
# Creates a DynamoDB table with the given name.
#
create_table() {
  local -r expected_params=1 && [[ "${expected_params}" -ne "${#}" ]] && fatal "${FUNCNAME[0]}: expected ${expected_params} parameters but got ${#}."
  local -r table_name="${1}-${Param_env_name}"

  title "Creating table: ${table_name}"

  local -r response=$(aws dynamodb create-table \
    --table-name "${table_name}" \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "${AWS_REGION}" 2>&1)

  if [[ "${response}" =~ "Table already exists" ]]; then
    info "${table_name} already exists --> skipping."
  elif [[ "${response}" =~ '"TableStatus": "CREATING"' ]]; then
    info "${table_name} created successfully."
  else
    echo "${response}"
    fatal "${table_name} could not be created."
  fi
}

enable_ttl_on_table() {
  local -r expected_params=1 && [[ "${expected_params}" -ne "${#}" ]] && fatal "${FUNCNAME[0]}: expected ${expected_params} parameters but got ${#}."
  local -r table_name="${1}-${Param_env_name}"

  title "Enabling TTL on table: ${table_name}"

  local -r response=$(aws dynamodb update-time-to-live \
    --table-name "${table_name}" \
    --time-to-live-specification "Enabled=true, AttributeName=expiresAt" \
    --region "${AWS_REGION}" 2>&1)

  if [[ "${response}" =~ '"AttributeName": "expiresAt"' ]]; then
    info "TTL enabled on ${table_name} with expiresAt attribute."
  elif [[ "${response}" =~ 'TimeToLive is already enabled' ]]; then
    info "TTL already enabled on ${table_name} --> skipping."
  else
    echo "${response}"
    fatal "TTL could not be enabled on table ${table_name}."
  fi
}

# -------------- calling the main function --------------------------------------------------------

main "${@}"
