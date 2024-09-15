#
# Handling of exports and imports around DynamoDB.
#

#
# Exports the data from DynamoDB into a directory called 'table-data'.
# Input:
#   $1: the name of the source env, e.g. 'uat'
#   $2: the name of the target env, e.g. 'prod'
#
export_tables() {
  source_environment=$1 # environment name to use for export
  target_environment=$2 # environment name to use for later import - necessary to prepare the data already via this script
  table_names=(TaskListMetadata Tasks)

  if [[ ${TABLE_DIR} == '' ]]; then
    export TABLE_DIR=table-data # directory to store exported data
  fi

  # Set table names.
  source_table_names=()
  target_table_names=()
  for table_name in ${table_names[@]}; do
    source_table_names+=("${table_name}-${source_environment}")
    target_table_names+=("${table_name}-${target_environment}")
  done

  # Inform the user.
  info "Exporting data from tables:"
  for index in ${!source_table_names[*]}; do
    info "\t${source_table_names[$index]}  -->  ${target_table_names[$index]}"
  done
  info "Target directory: ${TABLE_DIR}"
  echo

  rm -rf ${TABLE_DIR}
  max_items=25
  export LC_ALL=C.UTF-8 # handle special characters in the export data

  for index in ${!source_table_names[*]}; do
    source_table_name=${source_table_names[$index]}
    target_table_name=${target_table_names[$index]}

    info "--------------- ${source_table_name} ---------------"
    index=0

    # Create target directories if necessary.
    mkdir -pv ${TABLE_DIR}/$target_table_name/export-data

    # Check the existence of the table.
    local num_tables_found=$(aws dynamodb list-tables ${PROFILE_PARAM} | grep "${source_table_name}" | wc -l)

    if [[ ${num_tables_found} == 0 ]]; then
      info "Table '${source_table_name}' not found --> Skipping."
    else
      # Read from database.
      aws dynamodb scan ${PROFILE_PARAM} --table-name "${source_table_name}" --max-items ${max_items} --output json >${TABLE_DIR}/${target_table_name}/export-data/${index}.json

      # Check for 0 entries:
      num_entries=$(cat ${TABLE_DIR}/$target_table_name/export-data/$index.json | jq '.Count')
      if [[ ${num_entries} -ne 0 ]]; then

        info "Created dataset ${index}."

        nextToken=$(cat ${TABLE_DIR}/$target_table_name/export-data/$index.json | jq '.NextToken')

        ((index += 1))

        # Read more datasets if there is more to come.
        while [ ! -z "${nextToken}" ] && [ "${nextToken}" != "null" ]; do
          aws dynamodb scan $PROFILE_PARAM --table-name $source_table_name --max-items $max_items --starting-token $nextToken --output json >${TABLE_DIR}/$target_table_name/export-data/$index.json
          if [[ $? != 0 ]]; then fatal "Exiting."; fi
          info "Created dataset ${index}."

          nextToken=$(cat ${TABLE_DIR}/$target_table_name/export-data/$index.json | jq '.NextToken')
          ((index += 1))
        done

        # Write to file.
        mkdir -pv ${TABLE_DIR}/$target_table_name/converted-data-for-import

        # Split record to aws batch insert cli
        for filename in ${TABLE_DIR}/$target_table_name/export-data/*.json; do
          file=${filename##*/} # everything after the final "/"
          info "Filename: ${filename}"
          cat $filename | jq '.Items' | jq -cM --argjson sublen '25' 'range(0; length; $sublen) as $i | .[$i:$i+$sublen]' | split -l 1 - ${TABLE_DIR}/${target_table_name}/converted-data-for-import/${file%.*}_
        done

        conversion_dir=${TABLE_DIR}/$target_table_name/converted-data-for-import
        for filename in ${conversion_dir}/*; do
          info "Processing ${filename##*/}"
          cat $filename | jq "{\"$target_table_name\": [.[] | {PutRequest: {Item: .}}]}" >${conversion_dir}/${filename##*/}.txt
          rm $filename
        done
        info "Completed."

      else
        info "No data for ${target_table_name}."
      fi
    fi

    echo
  done
}

#
# Imports all data that resides in the local export folders.
# The names of the import tables are already defined by the data in the export folder.
#
import_tables() {
  if [[ ${TABLE_DIR} == '' ]]; then
    export TABLE_DIR=table-data # directory to read import data from
  fi

  all_files=${TABLE_DIR}/*/converted-data-for-import/*.txt
  files_exist=true
  ls -lR ${all_files} || files_exist=false
  echo "Files exist: ${files_exist}"

  if [[ ${files_exist} == "true" ]]; then
    info "Importing all data from directory '${TABLE_DIR}'."

    for filename in ${all_files}; do
      info "Importing batch ${filename}"
      aws dynamodb batch-write-item --request-items file://${filename} 1>/dev/null
    done
  else
    info "No data to import from directory '${TABLE_DIR}'."
  fi
}
