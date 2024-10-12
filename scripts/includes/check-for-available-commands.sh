#
# Checks if all necessary commands are avalable on this machine.
# Input:
#   a blank separated list of strings containing all required commands
#
check_for_available_commands() {
  local -r required_commands=(${@})

  for command in "${required_commands[@]}"; do
    if ! command -v "${command}" >/dev/null; then
      fatal "Command '${command}' needs to be available on this machine."
    fi
  done
}
