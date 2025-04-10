#!/bin/sh

##############################################################################
# PierceFlare CLI Client
# This script monitors your external IP address and sends updates to the 
# PierceFlare server when changes are detected.
##############################################################################

# --- Static vars ---

readonly LOG_TAG="[PierceFlare CLI]"
readonly ENDPOINT_PUT_FLARE="/api/flare"
readonly ENDPOINT_GET_INFOS="/api/infos"

# --- Logging Functions ---

# Log message without timestamp
log() {
  local text="$1"
  echo "$LOG_TAG - $text"
}

# Log message with timestamp 
logT() {
  local text="$1"
  echo "$LOG_TAG - $(date '+%Y-%m-%d %H:%M:%S') - $text"
}

# --- Configuration ---

# Load config from environment variables with defaults
API_KEY="${PIERCEFLARE_API_KEY}"
SERVER_URL="${PIERCEFLARE_SERVER_URL}"
CHECK_INTERVAL_SECONDS="${PIERCEFLARE_CHECK_INTERVAL:-300}" # Default 5 minutes
ONE_SHOT_MODE="${PIERCEFLARE_ONE_SHOT:-false}"

# Validate required configuration
validate_config() {
  local missing_vars=0
  
  if [ -z "$API_KEY" ]; then
    log "Error: PIERCEFLARE_API_KEY environment variable is not set."
    missing_vars=1
  fi

  if [ -z "$SERVER_URL" ]; then
    log "Error: PIERCEFLARE_SERVER_URL environment variable is not set."
    missing_vars=1
  fi
  
  return $missing_vars
}

# --- IP Management Functions ---

# Attempt to get current external IP using multiple fallback services
get_current_ip() {
  # Try multiple services for robustness
  curl -s https://ifconfig.me || curl -s https://api.ipify.org || curl -s https://icanhazip.com || echo "error"
}

# 
GET_infos() {
  logT "Checking token validity..."

  response=$(curl -s -w "\n%{http_code}" -X GET \
    -H "Authorization: Bearer $API_KEY" \
    "$SERVER_URL$ENDPOINT_GET_INFOS")

  # Extract body and status code
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d') # Remove last line (http_code)
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    logT "Token valid for [$body]."
    return 0
  else
    logT "Could not assert validity of supplied token (HTTP $http_code): $body"
    return 1
  fi
}

# Send IP update to the server
PUT_flare() {
  local ip_address="$1"
  logT "Sending IP update: $ip_address"
  
  response=$(curl -s -w "\n%{http_code}" -X PUT \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"ip\":\"$ip_address\"}" \
    "$SERVER_URL$ENDPOINT_PUT_FLARE")
  
  # Extract body and status code
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d') # Remove last line (http_code)
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    logT "Update successful (HTTP $http_code): $body"
    return 0
  else
    logT "Update failed (HTTP $http_code): $body"
    return 1
  fi
}

# Process a single IP check and update
process_ip_check() {
  local last_ip="$1"
  local current_ip
  
  current_ip=$(get_current_ip)
  
  # Validate retrieved IP
  if [ "$current_ip" = "error" ] || [ -z "$current_ip" ]; then
    logT "Error getting current IP address. Skipping check."
    echo "$last_ip" # Return unchanged
    return 1
  fi
  
  # Check if IP has changed
  if [ "$current_ip" != "$last_ip" ]; then
    if [ -n "$last_ip" ]; then
      logT "IP address changed: $last_ip -> $current_ip"
    else
      logT "Initial IP detected: $current_ip"
    fi
    
    if PUT_flare "$current_ip"; then
      echo "$current_ip" # Return new IP
      return 0
    else
      logT "Failed to update server with IP. Will retry later."
      echo "$last_ip" # Return unchanged
      return 1
    fi
  else
    logT "IP address unchanged ($current_ip). No update needed."
    echo "$last_ip" # Return unchanged
    return 0
  fi
}

# --- Main Functions ---

# One-shot mode - check and update once
run_one_shot() {
  logT "Running in one-shot mode - forcing immediate ping"
  current_ip=$(get_current_ip)
  
  if [ "$current_ip" != "error" ] && [ -n "$current_ip" ]; then
    PUT_flare "$current_ip"
    return $?
  else
    logT "Error getting IP address."
    return 1
  fi
}

# Continuous monitoring mode
run_continuous() {
  local last_sent_ip=""

  # Initial check and send
  last_sent_ip=$(process_ip_check "$last_sent_ip")

  # Periodic check loop
  while true; do
    sleep "$CHECK_INTERVAL_SECONDS"
    last_sent_ip=$(process_ip_check "$last_sent_ip")
  done
}

# --- Main Execution ---

# Validate configuration first
if ! validate_config; then
  exit 1
fi

##
##
##
  
logT "Client starting..."
logT "Server URL: $SERVER_URL"
logT "Check Interval: $CHECK_INTERVAL_SECONDS seconds"

#
if ! GET_infos; then 
  exit 1
fi

# Determine run mode and execute
if [ "$ONE_SHOT_MODE" = "true" ] || [ "$1" = "--force-ping" ]; then
  run_one_shot
  exit $?
else
  run_continuous
  # This should never return under normal circumstances
fi