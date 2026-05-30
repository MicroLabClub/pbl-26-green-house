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

1. Navigate to the deployment folder:
   ```bash
   cd deploy
   ```
2. Start the cloud infrastructure:
   ```bash
   # Set the GITHUB_REPOSITORY_OWNER to the GitHub user/organization where this is hosted
   export GITHUB_REPOSITORY_OWNER=your-org-name
   docker-compose -f docker-compose.cloud.yml up -d
   ```
3. **Accessing the Cloud:**
   - The Frontend is available at `http://localhost:80`.
   - The Cloud MQTT Broker is exposed on port `1883`.
   - **Cloudflare Tunnels:** The stack includes a `cloudflared` container that automatically creates a secure, temporary tunnel to the internet so you don't need to configure your router. To see your public URL, run:
     ```bash
     docker logs gms-cloudflared
     ```
     You will find a `.trycloudflare.com` link in the logs. You can use this URL to access the frontend from anywhere.

> **Note on Database Updates:** The Backend uses Flyway database migrations. If you push code that changes the database schema (new tables or columns), you do not need to wipe the database. The backend will automatically apply the changes upon restart without losing historical data.

### 2. Edge Environment (The Greenhouse Mini-PC)

The Edge environment runs the local MQTT broker (for the Portenta sensors) and the Edge Engine.

1. On the greenhouse mini-PC, navigate to the deployment folder:
   ```bash
   cd deploy
   ```
2. Set the environment variable for your Cloud Broker. This should be the IP address of your Cloud Server (or domain if you set one up). If testing locally on the same machine, use your machine's LAN IP address (e.g., 192.168.x.x):
   ```bash
   export CLOUD_BROKER_HOST=192.168.1.100
   export GITHUB_REPOSITORY_OWNER=your-org-name
   ```
3. Start the edge engine:
   ```bash
   docker-compose -f docker-compose.edge.yml up -d
   ```

**Simulator Mode:**
If you want to test the edge environment without real hardware (Arduino Portenta), you can run the simulator profile. This will start a virtual sensor node that sends mock data to the edge engine:
```bash
docker-compose -f docker-compose.edge.yml --profile simulator up -d
```

### 3. Continuous Deployment (Auto-Updates)

This repository is configured with a **GitHub Actions** workflow (`.github/workflows/docker-build.yml`). Whenever you push code to the `main` branch, the workflow will automatically build new Docker images for the Frontend, Backend, and Edge Engine, and push them to the GitHub Container Registry (GHCR).

The `docker-compose.cloud.yml` includes a **Watchtower** container. It silently monitors GHCR in the background. When it detects that a new image has been uploaded by GitHub Actions, it will gracefully download the update and restart the affected containers for you automatically!
