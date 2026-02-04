# ⚠️ FIRMWARE ARCHIVE - PHASE 1 (DEPRECATED)

## Status: ARCHIVED

This directory contains the **deprecated Phase 1 hardware-based code** for the Earthquake Alert System.

### ❌ This Code is No Longer Used

The system has been migrated from hardware-based IoT sensors to **cloud-based API data aggregation** (Phase 2).

**No hardware setup is required anymore!**

---

## What's Here

### earthquake_sensor.ino (720 lines)
Arduino/NodeMCU firmware for ADXL345 accelerometer
- **Status**: Archived/Unused
- **Reason**: Replaced with USGS, IOC, and NOAA cloud APIs
- **Hardware**: Arduino UNO, NodeMCU, ADXL345, LCD, Buzzer

### config.h (90 lines)
Hardware configuration constants
- **Status**: Archived/Unused
- **Reason**: No hardware dependencies needed

---

## Migration Information

### Phase 1 (Original - Archived)
```
Hardware (Arduino/NodeMCU with ADXL345)
    ↓
WiFi Transmission
    ↓
Server Processing
    ↓
Local Alerts
```

### Phase 2 (Current - Active)
```
Cloud APIs (USGS, IOC, NOAA)
    ↓
Automatic Polling
    ↓
Server Aggregation
    ↓
Global Monitoring
```

---

## Why We Migrated

| Factor | Phase 1 | Phase 2 |
|--------|---------|---------|
| **Coverage** | Single location | Global |
| **Setup Time** | 30+ minutes | <5 minutes |
| **Hardware** | Required | Not needed ✨ |
| **Data Source** | Accelerometer | Public APIs |
| **Reliability** | Device dependent | Cloud resilient |
| **Scalability** | Limited | Unlimited |

---

## For Historical Reference

If you need to understand the original hardware-based implementation:

1. **earthquake_sensor.ino** - Contains Arduino sketch with:
   - ADXL345 accelerometer initialization
   - I2C communication with LCD
   - WiFi connectivity to server
   - Buzzer alert triggering
   - Data transmission logic

2. **config.h** - Hardware pin definitions:
   - NodeMCU GPIO mappings
   - I2C addresses
   - Server connection settings

---

## Current System Uses

For the **active production system**, see:

- **Backend**: [../server/server.js](../server/server.js)
  - USGS Earthquake API
  - IOC Water Level API
  - NOAA Water Level API

- **Frontend**: [../public/](../public/)
  - Dashboard UI
  - Real-time WebSocket updates

- **Documentation**: [../README.md](../README.md)
  - Complete system overview

---

## 🚀 To Run Current System

```bash
# No hardware setup needed!
npm install
npm start

# Visit http://localhost:3000
```

---

## Archive Date

**Archived**: February 4, 2024  
**Reason**: Migration to cloud-based data aggregation  
**Status**: Historical reference only

---

**This directory is kept for historical reference only. It is not used by the current system.**
