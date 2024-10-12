#
# Checks if all necessary AWS variables are set. (They still may not work, but they at least have to be set.)
# Leaves with an error message if not.
# Output:
#   AWS_REGION:     the AWS region to use if it has not been set before
#   AWS_ACCOUNT_ID: the AWS account ID if it has not been set before
#
check_for_aws_env_vars() {
  title "Checking for AWS settings"

  [[ -z "${AWS_ACCESS_KEY_ID+x}" ]] && fatal "Please set AWS_ACCESS_KEY_ID as environment variable."
  [[ -z "${AWS_SECRET_ACCESS_KEY+x}" ]] && fatal "Please set AWS_SECRET_ACCESS_KEY as environment variable."
  [[ -z "${AWS_REGION+x}" ]] && export AWS_REGION="eu-central-1"

  # Take the account id from the credentials if it is not set.
  [[ -z "${AWS_ACCOUNT_ID+x}" ]] && export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output=text | awk '{ print $1 }')

  [[ "${AWS_ACCOUNT_ID}" == "" ]] && fatal "AWS_ACCOUNT_ID could not be found." && exit 1

  info "Taking '${AWS_REGION}' as AWS region."
  info "Taking '${AWS_ACCOUNT_ID}' as AWS account ID."
}
