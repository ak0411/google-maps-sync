#!/bin/bash

# Function to print debug information
debug_info() {
    echo "Debug Info:"
    echo "CONFIG_FILE: $CONFIG_FILE"
    echo "BUILD_ARGS: $BUILD_ARGS"
    echo "NEXT_PUBLIC variables:"
    env | grep NEXT_PUBLIC_
}

# Initialize variables
CONFIG_FILE=""

# Check if the script is being sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    echo "Script is being sourced. Please run it as a separate command."
    return 1
fi

# Parse command line arguments
while getopts ":c:" opt; do
  case $opt in
    c)
      CONFIG_FILE="-c $OPTARG"
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

# Read .env file
if [[ -f .env.deploy ]]; then
    set -a
    source .env.deploy
    set +a
else
    echo ".env.deploy file not found!"
    exit 1
fi

# Construct build args string
BUILD_ARGS=""
for var in "${!NEXT_PUBLIC_@}"; do
  BUILD_ARGS="$BUILD_ARGS --build-arg $var=${!var}"
done

# Print debug information
debug_info

# Deploy with build args and optional config file
echo "Deploying with command: fly deploy $CONFIG_FILE $BUILD_ARGS"
fly deploy $CONFIG_FILE $BUILD_ARGS