#
# Handling of command line arguments and printing usage information for the 'db-create-tables' script.
#

#
# Prints an information how to use the script.
#
print_usage() {
  local script_name=$(basename "$0")
  echo
  echo "Usage: ${script_name} [options]"
  echo
  echo "Creates the necessary DynamoDB tables for the ToDos app."
  echo
  echo "Options:"
  echo "  -e, --env-name [dev|uat|prod]         set the environment's name"
  echo "  -h, --help                            display this usage help (optional)"
  echo
  echo "Example:"
  echo "  ${script_name} --env-name uat    creates tables in environment 'uat'"
  echo
}

#
# Consumes the command line parameters and puts them into variables.
# Input:
#   $@: the list of all command line arguments
# Output:
#   Param_env_name: the name of the environment to be deployed
#
consume_command_line_params() {
  local positional_params=() # arguments without a '-x something' parameter

  while [[ $# -gt 0 ]]; do
    case $1 in
    -h | --help)
      print_usage
      exit 0
      ;;

    -e | --env-name)
      [[ -z $2 ]] && print_usage_and_exit "Option [-e|--env-name] needs an argument"
      Param_env_name="$2"
      shift && shift
      ;;

    -* | --*)
      print_usage_and_exit "Unknown option '$1'."
      ;;

    *)
      positional_params+=("$1") # save positional arg
      shift                     # past argument
      ;;
    esac
  done

  # Handle parameters that came without options
  [[ ${#positional_params[@]} -ne 0 ]] && print_usage_and_exit "Unknown param(s) '${positional_params[@]}'."

  if [[ -z ${Param_env_name+x} ]]; then
    print_usage_and_exit "Option [-e|--env-name] is mandatory. Please define an environment name."
  fi

  case "${Param_env_name}" in
  dev | uat | prod) ;;

  *)
    print_usage_and_exit "Values for option [-e|--env-name] may only be 'dev', 'uat' or 'prod'."
    ;;
  esac
}
