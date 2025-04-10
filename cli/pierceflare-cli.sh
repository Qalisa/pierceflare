#!/bin/sh

##
##
##

log () {
  local text="$1"
  echo "[PierceFlare CLI] - $text"
} 

logT () {
  local text="$1"
  echo "[PierceFlare CLI] - $(date '+%Y-%m-%d %H:%M:%S') - $text"
} 

###
###
###

# Configuration (from environment variables)
API_KEY="${PIERCEFLARE_API_KEY}"
SERVER_URL="${PIERCEFLARE_SERVER_URL}"
CHECK_INTERVAL_SECONDS="${PIERCEFLARE_CHECK_INTERVAL:-300}" # Default 5 minutes
ONE_SHOT_MODE="${PIERCEFLARE_ONE_SHOT:-false}"

###

if [ -z "$API_KEY" ]; then
  log "Error: PIERCEFLARE_API_KEY environment variable is not set."
  exit 1
fi

if [ -z "$SERVER_URL" ]; then
  log "Error: PIERCEFLARE_SERVER_URL environment variable is not set."
  exit 1
fi

###
###
###

# Function to get current external IP
get_current_ip() {
  # Try multiple services for robustness
  curl -s https://ifconfig.me || curl -s https://api.ipify.org || curl -s https://icanhazip.com || echo "error"
}

# Function to send ping to the server
send_ping() {
  local ip_address="$1"
  logT "Sending IP update: $ip_address"
  
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"ip\":\"$ip_address\"}" \
    "$SERVER_URL/api/ping")
  
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

# --- Main Logic ---

# Check if running in one-shot mode
if [ "$ONE_SHOT_MODE" = "true" ] || [ "$1" = "--force-ping" ]; then
  logT "Running in one-shot mode - forcing immediate ping"
  current_ip=$(get_current_ip)
  if [ "$current_ip" != "error" ] && [ -n "$current_ip" ]; then
    send_ping "$current_ip"
    exit $?
  else
    logT "Error getting IP address."
    exit 1
  fi
fi

# Continue with normal continuous monitoring mode
last_sent_ip=""

logT "Client starting..."
logT "Server URL: $SERVER_URL"
logT "Check Interval: $CHECK_INTERVAL_SECONDS seconds"

# Initial check and send
current_ip=$(get_current_ip)
if [ "$current_ip" != "error" ] && [ -n "$current_ip" ]; then
  if send_ping "$current_ip"; then
    last_sent_ip="$current_ip"
  fi
else
  logT "Error getting initial IP address."
fi

# Periodic check loop
while true; do
  sleep "$CHECK_INTERVAL_SECONDS"
  
  current_ip=$(get_current_ip)
  
  if [ "$current_ip" = "error" ] || [ -z "$current_ip" ]; then
    logT "Error getting current IP address. Skipping check."
    continue
  fi
  
  if [ "$current_ip" != "$last_sent_ip" ]; then
    logT "IP address changed: $last_sent_ip -> $current_ip"
    if send_ping "$current_ip"; then
      last_sent_ip="$current_ip"
    else
      logT "Failed to update server with new IP. Will retry later."
      # Keep last_sent_ip as is, so it retries next time
    fi
  else
    logT "IP address unchanged ($current_ip). No update needed."
  fi
done