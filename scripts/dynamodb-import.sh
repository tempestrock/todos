#! /usr/bin/env bash

#
# Import data from the specified source directory to DynamoDB
# Prerequisites:
#  - AWS CLI must be installed locally.
#  - The tables to import into must already exist.
#

main() {
  handle_cli_params $@

  PROFILE_PARAM="--profile=${profile_arg}"
  TABLE_DIR=${directory_arg}

  import_tables
}


set -eo pipefail     # Stop this script from executing as soon as an error occurs.
cd $(dirname "${0}") # Enable this script to be run from anywhere.
readonly script_dir=$(pwd)

readonly includes_dir=./includes
. ${includes_dir}/basics.sh
. ${includes_dir}/db-export-import.sh

print_usage() {
  script_name=$(basename "$0")
  echo
  echo "Usage: ${script_name} [Options]"
  echo
  echo "Options:"
  echo "  -d, --directory   (optional) the directory to import the data from, default is 'table-data'"
  echo "  -h, --help        display this help message and ignore all other options"
  echo
  echo "Example calls:"
  echo "  ${script_name}                            imports from the default dir"
  echo "  ${script_name} -d my-import-dir           imports from 'my-import-dir'"
}

handle_cli_params() {
  directory_arg='table-data'
  help_arg=false

  while [[ $# -gt 0 ]]; do
    case $1 in
    -d | --directory)
      directory_arg="$2"
      shift
      shift # past argument and value
      ;;
    -h | --help)
      help_arg=true
      shift # past argument
      ;;
    *)
      echo
      echo "Unknown option $1"
      print_usage
      exit 1
      ;;
    esac
  done

  if [[ ${help_arg} == true ]]; then
    print_usage
    exit 0
  fi
}

# -------------- calling the main function --------------------------------------------------------

main "${@}"
