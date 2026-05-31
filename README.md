# Greenhouse Management System (GMS)

An IoT platform designed for controlling and monitoring greenhouse climates using a robust Edge-Cloud architecture. This repository contains the complete "monorepo" infrastructure, including the backend API, frontend dashboard, and firmware/edge engine logic.

## Project Structure

- `frontend/` - React/Vite dashboard for visualization and threshold configuration.
- `backend/` - Spring Boot control plane and database management.
- `firmware/` - Edge engine (Python) and local gateway logic.
- `deploy/` - Docker compose scripts for deploying the Cloud and Edge environments.

## Deployment Guide (Self-Hosting)

This project separates the global backend infrastructure (Cloud) from the local greenhouse logic (Edge). You will need to run the **Cloud** environment on your main server, and the **Edge** environment on the mini-PC stationed in the greenhouse.

### 1. Cloud Environment (Your Main Server)

The Cloud environment hosts the centralized Database (TimescaleDB), Backend API, Frontend Dashboard, and the global MQTT broker.

1. Navigate to the deployment folder and create a `.env` file:
   ```bash
   cd deploy
   ```
2. Populate the `.env` file with your configuration. This configures Tailscale for Edge node invitations, your MQTT broker details, and Cloudflare Tunnel settings:
   ```env
   GMS_TAILSCALE_API_KEY=your_tailscale_api_key
   GMS_TAILSCALE_TAILNET=your_tailnet_name (e.g. maxnoragami.github)
   GMS_PUBLIC_MQTT_HOST=your_public_mqtt_ip_or_domain
   CLOUDFLARE_TUNNEL_TOKEN=your_cloudflare_tunnel_token
   GMS_CORS_ALLOWED_ORIGINS=https://gms.yourdomain.com
   ```
3. Start the cloud infrastructure:
   ```bash
   docker-compose -f docker-compose.cloud.yml up -d
   ```
4. **Accessing the Cloud:**
   - The Frontend is mapped to the internal `frontend` network container on port `80`.
   - The Cloud MQTT Broker is exposed on port `1883`.
   - **Cloudflare Tunnels:** The stack includes a `cloudflared` container that automatically creates a secure Zero Trust tunnel to your domain using the `CLOUDFLARE_TUNNEL_TOKEN`. You can access your dashboard securely from anywhere at your configured Cloudflare Public Hostname (e.g. `https://gms.yourdomain.com`), while the backend automatically trusts CORS requests from that origin via `GMS_CORS_ALLOWED_ORIGINS`.

> **Note on Database Updates:** The Backend uses Flyway database migrations. If you push code that changes the database schema (new tables or columns), you do not need to wipe the database. The backend will automatically apply the changes upon restart without losing historical data.

### 2. Edge Environment (The Greenhouse Mini-PC)

The Edge environment runs the local MQTT broker (for the Portenta sensors) and the Edge Engine. We have provided automation scripts to make setting up the Edge PC and flashing the Arduino firmware a one-click process.

#### Step 1: Configure the Gateway
1. Add a new Greenhouse in your Cloud Dashboard to generate your Gateway credentials.
2. On the edge mini-PC, clone this repository.
3. Place the `.env` file you downloaded from the Web UI into the `scripts/` folder (e.g. `scripts/gateway.env`). It should look exactly like this:
   ```env
   TENANT_ID=...
   GREENHOUSE_ID=...
   CLOUD_BROKER_HOST=...
   CLOUD_BROKER_PORT=8883
   TAILSCALE_AUTH_KEY=tskey-auth-...
   ```

#### Step 2: Run the Setup Script
Run the automated setup script for your operating system from the root of the project:

**Mac/Linux:**
```bash
./scripts/setup-edge.sh
```

**Windows (PowerShell):**
*(Note: You may need to run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` first if scripts are disabled on your PC).*
```powershell
.\scripts\setup-edge.ps1
```

**What the script does:**
- Installs Tailscale, Docker, and PlatformIO if they are missing.
- Connects your PC to the Tailscale mesh network using your Auth Key.
- Starts the Edge Docker stack.
- Determines your local Wi-Fi IP address.
- Generates a pre-configured `firmware/src/portenta/.env` file. (The device ID is automatically generated from the hardware MAC address during upload to ensure global uniqueness).

#### Step 3: Flash the Firmware
1. Open the generated `firmware/src/portenta/.env` file and enter your `WIFI_SSID` and `WIFI_PASS`.
2. Connect your Arduino Portenta via USB.
3. Compile and upload the firmware using the provided scripts (you can optionally pass a serial port to monitor):
   - **Mac/Linux:** `./scripts/build.sh` and `./scripts/upload.sh /dev/ttyACM0`
   - **Windows:** `.\scripts\build.ps1` and `.\scripts\upload.ps1 -Port COM3`

*Note: The edge stack utilizes `network_mode: host` to automatically leverage the host machine's Tailscale connection, creating a secure, zero-config mesh network to the Cloud Broker!*

**Simulator Mode:**
If you want to test the edge environment without real hardware (Arduino Portenta), you can run the simulator profile:
```bash
docker-compose -f deploy/docker-compose.edge.yml --profile simulator up -d
```

### 3. Continuous Deployment (Auto-Updates)

This repository is configured with a **GitHub Actions** workflow (`.github/workflows/docker-build.yml`). Whenever you push code to the `main` branch, the workflow will automatically build new Docker images for the Frontend, Backend, and Edge Engine, and push them to **Docker Hub** (under `maxnoragami`).

#### For Developers
If you fork this repository and want the auto-deployment to work for your fork:
1. Create a free Docker Hub account.
2. Go to your GitHub Repository Settings -> Secrets and variables -> Actions.
3. Add two new repository secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username.
   - `DOCKERHUB_TOKEN`: A Personal Access Token generated from your Docker Hub account settings.

The `docker-compose.cloud.yml` includes a **Watchtower** container. It silently monitors your running containers in the background. Because the images on Docker Hub are completely **Public**, Watchtower can pull them anonymously. When it detects that a new image has been uploaded by GitHub Actions, it will gracefully download the update and restart the affected containers for you automatically!
