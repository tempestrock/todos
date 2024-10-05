#
# Prints a welcoming banner.
#
welcome() {
  cat <<'EOF'
   _____         _
  |_   _|__   __| | ___  ___
    | |/ _ \ / _` |/ _ \/ __|
    | | (_) | (_| | (_) \__ \
    |_|\___/ \__,_|\___/|___/

EOF

  if [[ $# -eq 1 && "${1}" == app-deployment ]]; then
    cat <<'EOF'
                        _          _                        _
   __ _ _ __ _ __    __| |___ _ __| |___ _  _ _ __  ___ _ _| |_
  / _` | '_ \ '_ \  / _` / -_) '_ \ / _ \ || | '  \/ -_) ' \  _|
  \__,_| .__/ .__/  \__,_\___| .__/_\___/\_, |_|_|_\___|__|_\__|
       |_|  |_|              |_|         |__/

------------------------------------------------------------------

EOF
  else
    echo "-------------------------------"
    echo
  fi
}
