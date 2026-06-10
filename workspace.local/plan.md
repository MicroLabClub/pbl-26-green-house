# Split Infrastructure Deployment Plan

This plan addresses your new strategy of splitting the infrastructure between the highly-constrained University server and a new Digital Ocean droplet, while maintaining GitOps automation on both ends!

## Goal
Host the **Frontend** on the university's `green-house-26.microlab.club` server, and host the **Backend, Database, and Cloud Broker** on Digital Ocean.

## Proposed Architecture & Changes

### Part 1: The University Server (Frontend Only)
We will create a new file specifically for this server: `deploy/docker-compose.frontend.yml`.
It will contain:
1. **Frontend Container:** An Nginx container serving your React app, strictly bound to `127.0.0.1:9004:80` as required by the `llms.txt` constraints.
2. **Watchtower Container:** Configured to watch the frontend container and auto-update it when GitHub Actions pushes a new image.

### Part 2: Digital Ocean (Backend + Cloud Broker)
We will modify the existing `deploy/docker-compose.cloud.yml`.
1. **Remove Frontend:** We will delete the frontend service from this file since it's moving.
2. **Setup Portainer:** We will install Portainer on the droplet and point it to this file for GitOps management.
3. **CORS Update:** The backend will be configured to accept API requests originating from `https://green-house-26.microlab.club`.

### Part 3: Frontend Environment Variable
Your React app needs to know where the backend lives. Since the frontend is built into static HTML/JS via GitHub Actions, we will need to update your GitHub Actions workflow to inject `VITE_API_BASE_URL=https://gms.contry.app` during the build step!

## Progress Tracking
- `[x]` Split `docker-compose.cloud.yml` and `docker-compose.frontend.yml`
- `[x]` Add `VITE_API_BASE_URL` build args to GitHub Actions and Dockerfile
- `[x]` Fix Nginx configuration in frontend container to remove `/api/` proxy (backend handles it directly)
- `[x]` Update Backend CORS settings to allow `green-house-26.microlab.club`
- `[x]` Configure `SameSite=None` and `Secure=true` for Spring session cookies to support cross-site authentication (Microlab -> Digital Ocean)
- `[x]` Update README.md with the new deployment architecture

## Future TODO: Edge Setup Improvements
The `scripts/setup-edge.sh` script currently fails on fresh Ubuntu installations due to missing dependencies and permission issues. We need to refactor the script later to:
- `[ ]` Auto-install missing system dependencies: `git`, `curl`, `python3-full`, `pip`.
- `[ ]` Install PlatformIO safely using the official installer script instead of `pip install` to avoid PEP-668 "externally managed environment" errors on modern Linux.
- `[ ]` Automatically fetch and install PlatformIO's universal `udev` rules (`99-platformio-udev.rules`) to fix `LIBUSB_ERROR_ACCESS` during firmware flashing.
- `[ ]` Add the current user to the `docker` group to fix privileged execution errors (or check/configure rootless Docker).
- `[ ]` Automatically install `tailscale` (if not already handled robustly) and ensure it starts.
- `[ ]` Document the hardware limitation: Ensure the Wi-Fi setup warns the user that the Portenta H7 only supports 2.4 GHz networks (no 5G).

## Progress: Bugfixes & Feature Enhancements
- `[x]` **Backend:** Added persistent volume mapping for `/app/uploads` in `deploy/docker-compose.cloud.yml` to prevent greenhouse photos from disappearing after container restarts.
- `[x]` **Frontend:** Refactored the `AddGreenhouseModal` into a unified `GreenhouseFormModal` to support pre-populating and editing greenhouse details (Name, Location, Description, Photo) via the Edit button, while disabling ID modification.
