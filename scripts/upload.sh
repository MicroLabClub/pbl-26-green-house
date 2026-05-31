#!/bin/bash
set -e

PORT=$1
if [ -n "$PORT" ]; then
    PORT_ARG="-p $PORT"
else
    PORT_ARG=""
fi

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

# Ensure DEVICE_ID is empty to enforce unique MAC-based IDs across devices
if [ -f .env ]; then
    sed -i 's/^DEVICE_ID=.*/DEVICE_ID=""/' .env
fi

echo "Building firmware for Portenta H7..."
pio run -e portenta_h7_m7

echo -e "\033[0;31mPlease ensure your Portenta is in Bootloader Mode!\033[0m"
echo -e "\033[0;33m(Double-tap the reset button until the green LED fades in and out)\033[0m"
echo "Flashing firmware to Portenta H7..."

~/.platformio/packages/tool-dfuutil-arduino/dfu-util --device 2341:035b -D .pio/build/portenta_h7_m7/firmware.bin -a 0 --dfuse-address=0x08040000:leave

# Wait for the device to reboot and re-enumerate as a serial port
sleep 2

pio device monitor -b 115200 $PORT_ARG
echo "=== Upload Complete ==="
