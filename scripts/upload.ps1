param(
    [string]$Port = ""
)

$PortArg = if ($Port) { "-p $Port" } else { "" }

Write-Host "=== GMS Firmware Upload ===" -ForegroundColor Cyan

if (-Not (Get-Command pio -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: PlatformIO (pio) not found in PATH." -ForegroundColor Red
    Write-Host "Please ensure you have run setup-edge.ps1 or installed PlatformIO manually."
    exit 1
}

$originalPath = Get-Location

try {
    Set-Location "$PSScriptRoot\..\firmware\src\portenta"
    
    # Ensure DEVICE_ID is empty to enforce unique MAC-based IDs across devices
    if (Test-Path .env) {
        (Get-Content .env) -replace '^DEVICE_ID=.*', 'DEVICE_ID=""' | Set-Content .env
    }

    Write-Host "Building firmware for Portenta H7..." -ForegroundColor Yellow
    pio run -e portenta_h7_m7

    Write-Host "Please ensure your Portenta is in Bootloader Mode!" -ForegroundColor Red
    Write-Host "(Double-tap the reset button until the green LED fades in and out)" -ForegroundColor Yellow
    Write-Host "Flashing firmware to Portenta H7..." -ForegroundColor Yellow
    
    $dfuUtil = "$env:USERPROFILE\.platformio\packages\tool-dfuutil-arduino\dfu-util.exe"
    if (-not (Test-Path $dfuUtil)) {
        Write-Host "ERROR: dfu-util not found at $dfuUtil. Make sure PlatformIO is installed." -ForegroundColor Red
        exit 1
    }

    & $dfuUtil --device 2341:035b -D .pio\build\portenta_h7_m7\firmware.bin -a 0 --dfuse-address=0x08040000:leave

    Start-Sleep -Seconds 2

    if ($Port) {
        pio device monitor -b 115200 -p $Port
    } else {
        pio device monitor -b 115200
    }

    Write-Host "=== Upload Complete ===" -ForegroundColor Cyan
} finally {
    Set-Location $originalPath
}
