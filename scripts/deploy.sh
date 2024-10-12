#! /usr/bin/env bash

#
# Performs all steps that are necessary to deploy the current version to the remote UAT or prod machine.
# You need to be able to ssh to the remote machine. Please refer to the README for more info about
# architecture and prerequisites.
#

main() {
  welcome app-deployment
  check_for_available_commands "docker ssh zip"
  consume_command_line_params "${@}"
  set_constants

  # Install all dependencies
  cd "${Home_dir}"
  pnpm install

  # Build app and create container image from it.
  title "Building container image"
  cd "${Home_dir}"
  docker build -t "${Comtainer_image}" .

  # Make sure we get onto the remote machine.
  title "Preparing ssh"
  eval "$(ssh-agent -s)"

  # Copy the container image to the remote machine.
  title "Copying image to remote machine"
  cd "${Local_temp_dir}"
  info "Saving local image file."
  docker save -o "${Image_file_name}" "${Comtainer_image}"
  info "Zipping local image file."
  zip "${Image_file_name_zipped}" "${Image_file_name}"
  info "Copying local image file to remote machine."
  scp "${Image_file_name_zipped}" "${Remote_user_and_machine}:${Remote_temp_dir}"
  cd - >/dev/null
  rm -rf ${Local_temp_dir}
  ssh "${Remote_user_and_machine}" "cd ${Remote_temp_dir} && unzip ${Image_file_name_zipped}"

  # Pull the image on the remote machine.
  title "Remote machine: Transfering image to Docker cache"
  ssh "${Remote_user_and_machine}" "cd ${Remote_temp_dir} && docker load -i ${Image_file_name}"

  # Run the new image.
  title "Remote machine: Starting the new ${Param_env_name} image"
  ssh "${Remote_user_and_machine}" "cd ${Remote_home_dir} && ./run-app.sh"

  # Delete all image files on the remote machine.
  title "Remote machine: Deleting image files"
  ssh "${Remote_user_and_machine}" "rm -f ${Remote_temp_dir}/${Image_file_name_zipped} ${Remote_temp_dir}/${Image_file_name}"
}

# -------------- initial includes and preparations ------------------------------------------------

set -eo pipefail     # Stop this script from executing as soon as an error occurs.
cd $(dirname "${0}") # Enable this script to be run from anywhere.
readonly Home_dir=$(pwd)/..

readonly includes_dir=./includes
. ${includes_dir}/basics.sh
. ${includes_dir}/check-for-available-commands.sh
. ${includes_dir}/consume-command-line-params.sh
. ${includes_dir}/welcome.sh

#
# Constants
#
set_constants() {
  readonly Remote_machine="vpn-client-1"
  readonly Remote_user_and_machine="peter@${Remote_machine}"

  readonly Image_file_name="image.tar"
  readonly Image_file_name_zipped="${Image_file_name}.zip"
  readonly Comtainer_image="todos-${Param_env_name}:0.1.0"

  declare -A env_ports=(["uat"]=8080 ["prod"]=8081)
  readonly -A env_ports

  readonly Remote_home_dir="/home/peter/todos/${Param_env_name}"
  readonly Local_temp_dir=$(mktemp -d)
  readonly Remote_temp_dir="/tmp"
  info "Local temp dir: '${Local_temp_dir}'"
}

# -------------- calling the main function --------------------------------------------------------

main "${@}"
