#!/bin/bash
cd "$(dirname "$0")/.."

PORT=$1

if [ -n "$PORT" ]; then
    PORT_ARG="-p $PORT"
else
    PORT_ARG=""
fi

~/.platformio/packages/tool-dfuutil-arduino/dfu-util --device 2341:035b -D .pio/build/portenta_h7_m7/firmware.bin -a 0 --dfuse-address=0x08040000:leave

# Wait for the device to reboot and re-enumerate as a serial port
sleep 2

pio device monitor -b 115200 $PORT_ARG
