# GMS Cloud MQTT API Documentation

This guide outlines how to connect to and publish data directly to the Greenhouse Management System (GMS) Cloud MQTT Broker. This is useful for testing sensor payloads or triggering relays without relying on the physical Edge Gateway.

## 1. Connection Details

The Cloud Broker is securely hosted on the GMS Digital Ocean droplet and protected by the Tailscale VPN. It does not require a username or password, but **you must be connected to the Tailscale network** to reach it.

- **Protocol:** `mqtt://` (Desktop Apps) or `ws://` (Web Browsers)
- **Host:** `100.77.104.2` (Or the public IP `134.122.49.143`)
- **Port:** `1883` (for `mqtt://`) or `9001` (for `ws://`)
- **Path (WebSocket only):** `/mqtt` or `/`
- **Authentication:** None (Anonymous Allowed)

> [!IMPORTANT]
> The examples below use the active production identifiers for this project:
> **Tenant ID:** `utm`
> **Greenhouse ID:** `utm-greenhouse`

---

## 2. Testing Uplink (Fake Sensor Data to Cloud)

All data going *up* to the cloud must be published to the `uplink` namespace.
**Base Topic:** `gms/utm/utm-greenhouse/uplink/{stream}`

### A. Device Discovery (Registry Stream)
**Topic:** `gms/utm/utm-greenhouse/uplink/registry`
*(This makes the device show up in the web UI under Discovered Devices)*
```json
{
  "event_id": "0b4d695c-0521-4238-9bdb-4d9c0be64faf",
  "type": "DEVICE_DISCOVERED",
  "tenant_id": "utm",
  "greenhouse_id": "utm-greenhouse",
  "device_id": "portenta-747a9070570f",
  "zone_id": "891dabec-850f-498c-9da6-6729e91e7a49",
  "zone_name": "portenta-1",
  "firmware_version": "portenta-m7-v2",
  "timestamp": "2026-06-09T11:46:22Z",
  "metadata": {
    "label": "Teacher Test Device"
  }
}
```

### B. Send Sensor Data (Telemetry Stream)
**Topic:** `gms/utm/utm-greenhouse/uplink/telemetry`
*(This pushes live sensor graphs to the dashboard)*
```json
{
  "tenant_id": "utm",
  "greenhouse_id": "utm-greenhouse",
  "device_id": "portenta-747a9070570f",
  "zone_id": "891dabec-850f-498c-9da6-6729e91e7a49",
  "zone_name": "portenta-1",
  "timestamp": "2026-06-09T11:46:30Z",
  "event_id": "b15c315e-6107-46be-a393-5d3ebbbe5dca",
  "kind": "snapshot",
  "metrics": {
    "air_temp": 28.5,
    "air_hum": 45.2,
    "soil_moist": 60.0,
    "soil_cond": 156.0,
    "soil_p": 32.0,
    "soil_tds": 78.0
  }
}
```

### C. Trigger a Warning (Alert Stream)
**Topic:** `gms/utm/utm-greenhouse/uplink/alert`
*(This creates a red warning banner in the web UI)*
```json
{
  "alert_id": "d83b0e92-056c-4852-b8be-27d69ddeca73",
  "zone_id": "891dabec-850f-498c-9da6-6729e91e7a49",
  "device_id": "portenta-747a9070570f",
  "sensor_key": "soil_k",
  "severity": "WARNING",
  "message": "soil_k warning low: 40.00 < 80.00",
  "source": "edge",
  "threshold_version": 1,
  "current_value": 40.0,
  "threshold_min": 80.0,
  "threshold_max": 400.0,
  "timestamp": "2026-06-09T11:46:06Z"
}
```

---

## 3. Testing Downlink (Controlling Relays)

To send commands from the Cloud down to the physical Edge Gateway (such as turning on a water pump), you publish to the `downlink` namespace.

**Topic:** `gms/utm/utm-greenhouse/downlink/command`

You can control a specific relay channel by defining the `channel` and its `state` (`1` for ON, `0` for OFF).

```json
{
  "command_id": "cmd-test-123",
  "device_id": "portenta-747a9070570f",
  "zone_id": "891dabec-850f-498c-9da6-6729e91e7a49",
  "payload": {
    "channel": 1,
    "state": 1
  }
}
```

**Shorthand Method:**
The Edge Engine is also hardcoded to understand a special `type` if you don't want to manually specify the channels. Sending this will also turn on relay #1:

```json
{
  "command_id": "cmd-test-124",
  "device_id": "portenta-747a9070570f",
  "zone_id": "891dabec-850f-498c-9da6-6729e91e7a49",
  "type": "IRRIGATION_ON"
}
```
*(Change `IRRIGATION_ON` to `IRRIGATION_OFF` to turn it off).*

> [!TIP]
> If you subscribe to `gms/utm/utm-greenhouse/uplink/command_ack`, you will see a receipt return from the Edge Engine confirming that the relay state was successfully changed!
