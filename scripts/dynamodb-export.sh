#! /usr/bin/env bash

#
# Exports the data from the tables of environment source_environment and prepares the data to be imported into environment target_environment.
# The data is exported to the directory target_dir which is created if it does not exist.
# Prerequisites: AWS CLI and jq are installed and desired AWS profile configured locally
#

main() {
  handle_cli_params $@

  TABLE_DIR=${directory_arg}

  info "Deleting a possibly existing target directory '${TABLE_DIR}'."
  rm -rf ${TABLE_DIR}

  export_tables ${source_arg} ${target_arg}
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
  echo "  -s, --source      the environment to export the data from"
  echo "  -t, --target      the environment to later import the data into"
  echo "  -d, --directory   (optional) the directory to export the data into, default is 'table-data'"
  echo "  -h, --help        display this help message and ignore all other options"
  echo
  echo "Example calls:"
  echo "  ${script_name} -s uat -t prod"
  echo "  ${script_name} -s uat -t uat -d my-export-dir"
}

handle_cli_params() {
  source_arg=''
  target_arg=''
  directory_arg='table-data'
  help_arg=false

  while [[ $# -gt 0 ]]; do
    case $1 in
    -s | --source)
      source_arg="$2"
      shift
      shift # past argument and value
      ;;
    -t | --target)
      target_arg="$2"
      shift
      shift # past argument and value
      ;;
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

  # Check for mandatory parameters:
  if [[ ${source_arg} == "" || ${target_arg} == "" ]]; then
    echo
    echo "ERROR: Missing required parameters."
    print_usage
    exit 1
  fi
}

# -------------- calling the main function --------------------------------------------------------

main "${@}"
