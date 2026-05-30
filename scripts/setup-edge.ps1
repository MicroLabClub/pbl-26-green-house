Write-Host "=== GMS Edge Setup Script ===" -ForegroundColor Cyan

# Find the downloaded .env file in the same folder as this script
$envFile = Get-ChildItem -Path "$PSScriptRoot\*.env" -ErrorAction SilentlyContinue | Select-Object -First 1

if (-Not $envFile) {
    Write-Host "ERROR: No .env file found in the scripts\ folder!" -ForegroundColor Red
    Write-Host "Please place the credentials file downloaded from the Web UI into the scripts\ folder."
    exit 1
}

Write-Host "Using configuration from $($envFile.FullName)" -ForegroundColor Cyan
# Parse .env
$envVars = @{}
Get-Content $envFile.FullName | Where-Object { $_ -match "^([^#=]+)=(.*)$" } | ForEach-Object {
    $envVars[$Matches[1]] = $Matches[2].Trim()
}

# 1. Install Tailscale if missing
if (-Not (Get-Command tailscale -ErrorAction SilentlyContinue)) {
    Write-Host "Tailscale not found." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Installing Tailscale via winget..." -ForegroundColor Yellow
        winget install Tailscale.Tailscale -e --accept-package-agreements --accept-source-agreements
        Write-Host "Installation complete. Please close this PowerShell window, open a new one, and run this script again to reload PATH!" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "ERROR: winget is not installed. Please download and install Tailscale manually from https://tailscale.com/" -ForegroundColor Red
        exit 1
    }
}

if (-Not $envVars.ContainsKey("TAILSCALE_AUTH_KEY")) {
    Write-Host "ERROR: TAILSCALE_AUTH_KEY is missing in your downloaded .env file!" -ForegroundColor Red
    exit 1
}

$authKey = $envVars["TAILSCALE_AUTH_KEY"]
Write-Host "Connecting to Tailscale mesh network..." -ForegroundColor Yellow
tailscale up --authkey=$authKey --reset

# 2. Check Docker
if (-Not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker not found." -ForegroundColor Yellow
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "Installing Docker Desktop via winget..." -ForegroundColor Yellow
        winget install Docker.DockerDesktop -e --accept-package-agreements --accept-source-agreements
        Write-Host "Installation complete. Please restart your computer and run this script again!" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "ERROR: winget is not installed. Please download and install Docker Desktop manually." -ForegroundColor Red
        exit 1
    }
}

# Verify Docker daemon is running
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Docker is not running" }
} catch {
    Write-Host "ERROR: Docker Desktop is installed but the Docker Engine is not running." -ForegroundColor Red
    Write-Host "Please start Docker Desktop, wait for it to initialize, and run this script again." -ForegroundColor Yellow
    exit 1
}

# 3. Authenticate with GHCR if PAT is provided
if ($envVars.ContainsKey("GHCR_PAT") -and $envVars.ContainsKey("GITHUB_REPOSITORY_OWNER")) {
    Write-Host "Authenticating with GitHub Container Registry..." -ForegroundColor Yellow
    $envVars["GHCR_PAT"] | docker login ghcr.io -u $envVars["GITHUB_REPOSITORY_OWNER"] --password-stdin
}

# 4. Start Docker Compose Stack
Write-Host "Starting Edge Docker Stack..." -ForegroundColor Yellow
$deployDir = Join-Path $PSScriptRoot "..\deploy"
Set-Location $deployDir
docker compose --env-file "$($envFile.FullName)" -f docker-compose.edge.yml pull
docker compose --env-file "$($envFile.FullName)" -f docker-compose.edge.yml up -d
Set-Location $PSScriptRoot

# 4. Determine Local IP for MQTT Broker
Write-Host "Determining local IP..." -ForegroundColor Yellow
$localIp = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi","Ethernet" -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notmatch "^127\.|^169\.254\.|^100\." } | Select-Object -First 1).IPAddress
if (-Not $localIp) {
    # Fallback
    $localIp = (Test-Connection -ComputerName (hostname) -Count 1).IPV4Address.IPAddressToString
}
Write-Host "Local IP found: $localIp" -ForegroundColor Green

# 5. Check Python & PlatformIO
if (-Not (Get-Command pio -ErrorAction SilentlyContinue)) {
    Write-Host "PlatformIO not found. Attempting to install via pip..." -ForegroundColor Yellow
    if (-Not (Get-Command pip -ErrorAction SilentlyContinue)) {
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            Write-Host "Installing Python..." -ForegroundColor Yellow
            winget install Python.Python.3.11 -e --accept-package-agreements --accept-source-agreements
            Write-Host "Please restart your terminal to reload PATH and run this script again to install PlatformIO." -ForegroundColor Red
            exit 1
        } else {
            Write-Host "ERROR: Python/pip is not installed. Please install Python manually." -ForegroundColor Red
            exit 1
        }
    } else {
        pip install -U platformio
    }
}

# 6. Generate Firmware .env
$fwEnv = Join-Path $PSScriptRoot "..\firmware\src\portenta\.env"
Write-Host "Generating Firmware .env at $fwEnv..." -ForegroundColor Yellow

$uniqueId = -join ((48..57) + (97..102) | Get-Random -Count 6 | % {[char]$_})
$greenhouseId = if ($envVars.ContainsKey("GREENHOUSE_ID")) { $envVars["GREENHOUSE_ID"] } else { "unknown-gh" }

@"
WIFI_SSID="YOUR_WIFI_NAME"
WIFI_PASS="YOUR_WIFI_PASSWORD"
MQTT_BROKER="$localIp"
MQTT_PORT="18831"
GREENHOUSE_ID="$greenhouseId"
DEVICE_ID="portenta-$uniqueId"
DEVICE_LABEL="Portenta Sensor Hub"
"@ | Out-File -FilePath $fwEnv -Encoding utf8

Write-Host "=== Edge Setup Complete! ===" -ForegroundColor Cyan
Write-Host "Please edit $fwEnv with your Wi-Fi credentials before flashing the firmware." -ForegroundColor Yellow
