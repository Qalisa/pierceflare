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

# --- Unified HTTP Helper Function ---

# Make an HTTP request and handle errors consistently
# Arguments:
#   $1: HTTP method (GET, PUT, POST, etc.)
#   $2: Endpoint path (will be appended to SERVER_URL)
#   $3: Request body (optional, for PUT/POST)
#   $4: Additional curl options (optional)
make_request() {
  local method="$1"
  local endpoint="$2"
  local body="$3"
  local curl_opts="$4"
  local full_url="$SERVER_URL$endpoint"
  
  logT "Making $method request to: $full_url"
  
  # Base curl command with common options
  local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
  
  # Add authorization header
  curl_cmd="$curl_cmd -H 'Authorization: Bearer $API_KEY'"
  
  # Add content-type and body for PUT/POST requests
  if [ -n "$body" ]; then
    curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$body'"
  fi
  
  # Add additional curl options if provided
  if [ -n "$curl_opts" ]; then
    curl_cmd="$curl_cmd $curl_opts"
  fi
  
  # Add URL and capture stderr
  curl_cmd="$curl_cmd '$full_url' 2>&1"
  
  # Execute the curl command
  logT "Executing request..."
  response=$(eval "$curl_cmd")
  curl_exit_code=$?
  
  # Handle curl execution errors
  if [ $curl_exit_code -ne 0 ]; then
    logT "Request failed with curl exit code $curl_exit_code: $response"
    echo "error|$curl_exit_code|$response"
    return 1
  fi
  
  # Extract response body and status code
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d') # Remove last line (http_code)
  
  logT "Response HTTP code: $http_code"
  
  # Check if we got a valid HTTP status code
  if ! echo "$http_code" | grep -q "^[0-9]\+$"; then
    logT "Invalid HTTP code: $http_code. Full response: $response"
    echo "error|000|$response"
    return 1
  fi
  
  # Log based on HTTP status
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    logT "Request successful (HTTP $http_code)"
  else
    logT "Request failed (HTTP $http_code): $body"
  fi
  
  # Return formatted response
  echo "success|$http_code|$body"
  return 0
}

# Parse response from make_request function
# Arguments:
#   $1: Response from make_request
# Returns:
#   0 on success, non-zero on failure
# Sets:
#   RESPONSE_STATUS - "success" or "error"
#   RESPONSE_CODE - HTTP status code or curl exit code
#   RESPONSE_BODY - Response body
parse_response() {
  local response="$1"
  
  # Split the response
  RESPONSE_STATUS=$(echo "$response" | cut -d'|' -f1)
  RESPONSE_CODE=$(echo "$response" | cut -d'|' -f2)
  RESPONSE_BODY=$(echo "$response" | cut -d'|' -f3-)
  
  if [ "$RESPONSE_STATUS" = "success" ] && [ "$RESPONSE_CODE" -ge 200 ] && [ "$RESPONSE_CODE" -lt 300 ]; then
    return 0
  else
    return 1
  fi
}

# --- IP Management Functions ---

# Attempt to get current external IP using multiple fallback services
get_current_ip() {
  # Try multiple services for robustness
  for service in "https://ifconfig.me" "https://api.ipify.org" "https://icanhazip.com"; do
    logT "Trying to get IP from $service"
    ip=$(curl -s --max-time 5 "$service")
    if [ -n "$ip" ] && echo "$ip" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' > /dev/null; then
      logT "Retrieved IP: $ip"
      echo "$ip"
      return 0
    fi
  done
  
  logT "Failed to get IP from any service"
  echo "error"
  return 1
}

# Check token validity
GET_infos() {
  logT "Checking token validity..."
  
  response=$(make_request "GET" "$ENDPOINT_GET_INFOS")
  parse_response "$response"
  
  if [ $? -eq 0 ]; then
    logT "Token valid for [$RESPONSE_BODY]."
    return 0
  else
    logT "Could not assert validity of supplied token (HTTP $RESPONSE_CODE): $RESPONSE_BODY"
    return 1
  fi
}

# Send IP update to the server
PUT_flare() {
  local ip_address="$1"
  logT "Sending IP update: $ip_address"
  
  response=$(make_request "PUT" "$ENDPOINT_PUT_FLARE" "{\"ip\":\"$ip_address\"}")
  parse_response "$response"
  
  if [ $? -eq 0 ]; then
    logT "Update successful (HTTP $RESPONSE_CODE): $RESPONSE_BODY"
    return 0
  else
    logT "Update failed (HTTP $RESPONSE_CODE): $RESPONSE_BODY"
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

logT "Client starting..."
logT "Server URL: $SERVER_URL"
logT "Check Interval: $CHECK_INTERVAL_SECONDS seconds"

# Check token validity
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