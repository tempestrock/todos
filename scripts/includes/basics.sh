#
# Text colors
#
readonly color_red='\033[0;31m'
readonly color_green='\033[0;32m'
readonly color_yellow='\033[0;33m'
readonly color_blue='\033[0;34m'
readonly color_none='\033[0m'

#
# Writes a standard message to standard out.
# Input parameters:
#   $@: the message to print
#
info() {
  echo -e "${color_blue}[INFO]${color_none}" "$@"
}

#
# Writes a warning to standard error.
# Input parameters:
#   $@: the message to print
#
warn() {
  echo -e "${color_yellow}[WARN]${color_none}" "$@" >&2
}

#
# Writes an error message to standard error and terminates the script.
# Input parameters:
#   $@: the message to print
#
fatal() {
  echo -e "${color_red}[ERROR]${color_none}" "$@" >&2
  echo >&2
  exit 1
}

#
# Writes the given message as a title line to standard out.
#   $@: the message to print
#
title() {
  echo -e ""
  echo -e -n "===========> "${color_green}${@}${color_none}" <"
  local max_dashes=100
  local str_of_args="'$*'" # all arguments put into one string
  local strlen=${#str_of_args}
  local num_dashes=$((max_dashes - strlen))
  for ((index = 0; index < num_dashes; index++)); do
    echo -n "="
  done
  echo
}

#
# Prints out the usage and an error message and leaves the script.
# Input parameters:
#   $@: the message to be printed before leaving the script
#
print_usage_and_exit() {
  print_usage
  fatal "$@"
}
