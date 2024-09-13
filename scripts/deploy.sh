#! /usr/bin/env bash

#
# Performs all steps that are necessary to deploy the current version to the remote UAT or prod machine.
#

main() {
  welcome app-deployment
  consume_command_line_params "${@}"
  set_constants

  # Install all dependencies
  cd "${Home_dir}"
  pnpm install
}

# -------------- initial includes and preparations ------------------------------------------------

set -eo pipefail     # Stop this script from executing as soon as an error occurs.
cd $(dirname "${0}") # Enable this script to be run from anywhere.
readonly Home_dir=$(pwd)/..

readonly includes_dir=./includes
. ${includes_dir}/basics.sh
. ${includes_dir}/consume-command-line-params.sh
. ${includes_dir}/welcome.sh

set_constants() {
  readonly Remote_machine="vpn-client-1"
  readonly Remote_user_and_machine="peter@${Remote_machine}"
  readonly Comtainer_image="todos-${Param_env_name}:0.1.0"
  declare -A env_ports=( ["uat"]=8080 ["prod"]=8081 )
  readonly -A env_ports

  readonly Remote_home_dir="/home/peter/todos/${Param_env_name}"
  readonly Local_temp_dir=$(mktemp -d)
  readonly Remote_temp_dir="/tmp"
  info "Local temp dir: '${Local_temp_dir}'"
}

# -------------- calling the main function --------------------------------------------------------

main "${@}"
