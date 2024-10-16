#! /usr/bin/env bash

#
# Import data from the specified source directory to DynamoDB
# Prerequisites:
#  - AWS CLI must be installed locally.
#  - The tables to import into must already exist.
#

main() {
  check_for_available_commands "aws"
  check_for_aws_env_vars
  import_tables
}

set -eo pipefail     # Stop this script from executing as soon as an error occurs.
cd $(dirname "${0}") # Enable this script to be run from anywhere.

readonly includes_dir=./includes
. ${includes_dir}/basics.sh
. ${includes_dir}/check-for-available-commands.sh
. ${includes_dir}/check-for-aws-env-vars.sh

#
# Imports all data that resides in the data folder.
#
import_tables() {
  local -r DATA_DIR="./initial-data"

  all_files=${DATA_DIR}/*.txt
  info "Importing all data from directory '${DATA_DIR}'."

  for filename in ${all_files}; do
    info "Importing batch ${filename}"
    aws dynamodb batch-write-item --request-items file://${filename} 1>/dev/null
  done
}

# -------------- calling the main function --------------------------------------------------------

main "${@}"
