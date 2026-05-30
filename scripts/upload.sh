#!/bin/bash
set -e

echo "=== GMS Firmware Upload ==="

if ! command -v pio &> /dev/null; then
    echo "ERROR: PlatformIO (pio) not found in PATH."
    echo "Please ensure you have run setup-edge.sh or installed PlatformIO manually."
    exit 1
fi

ORIGINAL_DIR=$(pwd)
# Ensure we always return to the original directory even if pio fails
trap 'cd "$ORIGINAL_DIR"' EXIT

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../firmware/src/portenta"
echo -e "\033[0;31mPlease ensure your Portenta is in Bootloader Mode!\033[0m"
echo -e "\033[0;33m(Double-tap the reset button until the green LED fades in and out)\033[0m"
echo "Flashing firmware to Portenta H7..."
pio run -e portenta_h7_m7 -t upload
echo "=== Upload Complete ==="
