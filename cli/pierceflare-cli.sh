#!/bin/sh

# Configuration (from environment variables)
API_KEY="${PIERCEFLARE_API_KEY}"
SERVER_URL="${PIERCEFLARE_SERVER_URL}"
CHECK_INTERVAL_SECONDS="${PIERCEFLARE_CHECK_INTERVAL:-300}" # Default 5 minutes
ONE_SHOT_MODE="${PIERCEFLARE_ONE_SHOT:-false}"

if [ -z "$API_KEY" ]; then
  echo "Error: PIERCEFLARE_API_KEY environment variable is not set."
  exit 1
fi

if [ -z "$SERVER_URL" ]; then
  echo "Error: PIERCEFLARE_SERVER_URL environment variable is not set."
  exit 1
fi

# Function to get current external IP
get_current_ip() {
  # Try multiple services for robustness
  curl -s https://ifconfig.me || curl -s https://api.ipify.org || curl -s https://icanhazip.com || echo "error"
}

# Function to send ping to the server
send_ping() {
  local ip_address="$1"
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Sending IP update: $ip_address"
  
  response=$(curl -s -w "\n%{http_code}" -X POST \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"ip\":\"$ip_address\"}" \
    "$SERVER_URL/api/ping")
  
  # Extract body and status code
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d') # Remove last line (http_code)
  
  if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Update successful (HTTP $http_code): $body"
    return 0
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Update failed (HTTP $http_code): $body"
    return 1
  fi
}

# --- Main Logic ---

# Check if running in one-shot mode
if [ "$ONE_SHOT_MODE" = "true" ] || [ "$1" = "--force-ping" ]; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Running in one-shot mode - forcing immediate ping"
  current_ip=$(get_current_ip)
  if [ "$current_ip" != "error" ] && [ -n "$current_ip" ]; then
    send_ping "$current_ip"
    exit $?
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Error getting IP address."
    exit 1
  fi
fi

# Continue with normal continuous monitoring mode
last_sent_ip=""

echo "$(date '+%Y-%m-%d %H:%M:%S') - Pierceflare Client starting..."
echo "$(date '+%Y-%m-%d %H:%M:%S') - Server URL: $SERVER_URL"
echo "$(date '+%Y-%m-%d %H:%M:%S') - Check Interval: $CHECK_INTERVAL_SECONDS seconds"

# Initial check and send
current_ip=$(get_current_ip)
if [ "$current_ip" != "error" ] && [ -n "$current_ip" ]; then
  if send_ping "$current_ip"; then
    last_sent_ip="$current_ip"
  fi
else
  echo "$(date '+%Y-%m-%d %H:%M:%S') - Error getting initial IP address."
fi

# Periodic check loop
while true; do
  sleep "$CHECK_INTERVAL_SECONDS"
  
  current_ip=$(get_current_ip)
  
  if [ "$current_ip" = "error" ] || [ -z "$current_ip" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Error getting current IP address. Skipping check."
    continue
  fi
  
  if [ "$current_ip" != "$last_sent_ip" ]; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') - IP address changed: $last_sent_ip -> $current_ip"
    if send_ping "$current_ip"; then
      last_sent_ip="$current_ip"
    else
      echo "$(date '+%Y-%m-%d %H:%M:%S') - Failed to update server with new IP. Will retry later."
      # Keep last_sent_ip as is, so it retries next time
    fi
  else
    echo "$(date '+%Y-%m-%d %H:%M:%S') - IP address unchanged ($current_ip). No update needed."
  fi
done