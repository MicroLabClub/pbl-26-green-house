#!/bin/bash
set -e

echo "=== GMS Firmware Upload ==="

if ! command -v pio &> /dev/null; then
    echo "ERROR: PlatformIO (pio) not found in PATH."
    echo "Please ensure you have run setup-edge.sh or installed PlatformIO manually."
    exit 1
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR/../firmware/src/portenta"
echo "Flashing firmware to Portenta H7..."
pio run -e portenta_h7_m7 -t upload
echo "=== Upload Complete ==="
