Write-Host "=== GMS Firmware Upload ===" -ForegroundColor Cyan

if (-Not (Get-Command pio -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: PlatformIO (pio) not found in PATH." -ForegroundColor Red
    Write-Host "Please ensure you have run setup-edge.ps1 or installed PlatformIO manually."
    exit 1
}

Set-Location "firmware\src\portenta"
Write-Host "Flashing firmware to Portenta H7..." -ForegroundColor Yellow
pio run -e portenta_h7_m7 -t upload
Write-Host "=== Upload Complete ===" -ForegroundColor Cyan
