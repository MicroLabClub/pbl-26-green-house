#!/bin/bash
set -e

echo "=== GMS Edge Setup Script ==="

# Find the downloaded .env file in the scripts folder
ENV_FILE=$(find scripts -maxdepth 1 -name "*.env" | head -n 1)

if [ -z "$ENV_FILE" ]; then
    echo "ERROR: No .env file found in the scripts/ folder!"
    echo "Please place the credentials file downloaded from the Web UI into the scripts/ folder."
    exit 1
fi

echo "Using configuration from $ENV_FILE"
# Source the .env file safely
export $(grep -v '^#' "$ENV_FILE" | xargs)

# 1. Install Tailscale if missing
if ! command -v tailscale &> /dev/null; then
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
fi

if [ -z "$TAILSCALE_AUTH_KEY" ]; then
    echo "ERROR: TAILSCALE_AUTH_KEY is missing in deploy/.env!"
    exit 1
fi

echo "Connecting to Tailscale mesh network..."
sudo tailscale up --authkey=$TAILSCALE_AUTH_KEY --reset

# 2. Check Docker
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com | sh
fi

# 3. Start Docker Compose Stack
echo "Starting Edge Docker Stack..."
# Pass the found .env file explicitly so it doesn't look for deploy/.env
docker compose --env-file "$ENV_FILE" -f deploy/docker-compose.edge.yml pull
docker compose --env-file "$ENV_FILE" -f deploy/docker-compose.edge.yml up -d

# 4. Determine Local IP for MQTT Broker
echo "Determining local IP..."
if command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1.1.1.1 | awk '{print $7}' | head -1)
else
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi
echo "Local IP found: $LOCAL_IP"

# 5. Check Python & PlatformIO
if ! command -v pio &> /dev/null; then
    echo "PlatformIO not found. Attempting to install via pip..."
    if ! command -v pip3 &> /dev/null; then
        echo "WARNING: pip3 is required to install PlatformIO. Please install python3-pip manually if you plan to flash firmware from this machine."
    else
        pip3 install -U platformio || echo "Failed to install PlatformIO automatically. Please install it manually."
    fi
fi

# 6. Generate Firmware .env
FW_ENV="firmware/src/portenta/.env"
echo "Generating Firmware .env at $FW_ENV..."

# Generate a random 6-character hex string for the device ID
UNIQUE_ID=$(head -c 3 /dev/urandom | xxd -p | head -n 1)
# On macOS, xxd output might differ. Fallback if empty:
if [ -z "$UNIQUE_ID" ]; then
    UNIQUE_ID=$RANDOM
fi

cat > "$FW_ENV" <<EOF
WIFI_SSID="YOUR_WIFI_NAME"
WIFI_PASS="YOUR_WIFI_PASSWORD"
MQTT_BROKER="$LOCAL_IP"
MQTT_PORT="18831"
GREENHOUSE_ID="${GREENHOUSE_ID:-unknown-gh}"
DEVICE_ID="portenta-${UNIQUE_ID}"
DEVICE_LABEL="Portenta Sensor Hub"
EOF

echo "=== Edge Setup Complete! ==="
echo "Please edit $FW_ENV with your Wi-Fi credentials before flashing the firmware."
