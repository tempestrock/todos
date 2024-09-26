#! /usr/bin/env bash

# Variables
REGION="eu-central-1"

DB_POSTFIX="dev" # HUGO: make this a parameter of the script

# Function to create a DynamoDB table
create_table() {
  local table_name="$1-${DB_POSTFIX}"
  echo "Creating table: $table_name"
  
  aws dynamodb create-table \
    --table-name "${table_name}" \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "${REGION}"

  echo "${table_name} created successfully."
}

# create_table "TaskListMetadata"
# create_table "Tasks"
# create_table "Users"
create_table "Labels"

echo "All tables created successfully."
