# Earthquake Alert System - Complete Setup & Usage Guide

## 🌍 Overview

This is a comprehensive IoT-based **Earthquake Alert System** that combines Arduino/NodeMCU microcontrollers with an accelerometer sensor to detect seismic activity and alert users in real-time through a modern web dashboard.

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  WEB DASHBOARD                          │
│  (Real-time monitoring, alerts, statistics)             │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket
                       │
┌──────────────────────┴──────────────────────────────────┐
│         NODE.JS EXPRESS SERVER (Backend)                │
│  - REST API endpoints                                   │
│  - WebSocket server                                     │
│  - Alert history & statistics                           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/TCP
                       │
┌──────────────────────┴──────────────────────────────────┐
│  NODEMCU / ARDUINO DEVICES                              │
│  ┌────────────────────────────────────────────────┐    │
│  │  ADXL345 Accelerometer (I2C)                   │    │
│  │  16x2 LCD Display (I2C)                        │    │
│  │  Buzzer (GPIO)                                 │    │
│  │  LED Indicator (GPIO)                          │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

---

## 📋 Components Required

### Hardware Components
- **1x NodeMCU v3** (ESP8266) or Arduino with WiFi shield
- **1x ADXL345 Accelerometer** (3-axis, I2C)
- **1x 16x2 LCD Display** (I2C with PCF8574 backpack)
- **1x Active Buzzer** (5V, GPIO controlled)
- **1x LED** (for status indication)
- **Resistors**: 10kΩ (for I2C pull-ups)
- **Capacitors**: 100µF, 10µF (power supply filtering)
- **Power Supply**: 5V/2A USB or DC adapter
- **Breadboard & Jumper Wires**

### Software Requirements
- Node.js v14+ with npm
- Arduino IDE (for uploading firmware)
- Web browser with WebSocket support
- USB cable for NodeMCU

---

## ⚙️ Installation & Setup

### Step 1: Install Backend Dependencies

```bash
cd /workspaces/Earthquake-alert-system
npm install
```

### Step 2: Configure Environment Variables

```bash
cp .env.example .env
```

### Step 3: Upload Firmware to NodeMCU

1. Open Arduino IDE
2. Install ESP8266 Board and required libraries
3. Update WiFi credentials in firmware/earthquake_sensor.ino
4. Upload sketch to NodeMCU

### Step 4: Start the Backend Server

```bash
npm start
```

### Step 5: Access Dashboard

Open your browser to `http://localhost:3000`

---

## 🎯 Features

- **Real-time Sensor Monitoring**: X, Y, Z acceleration + magnitude
- **Automatic Alert Detection**: Buzzer + LED + Server notification
- **Web Dashboard**: Statistics, charts, alert history
- **REST API**: Complete API for integration
- **Data Export**: Download alerts as JSON
- **Responsive Design**: Works on desktop, tablet, mobile

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/alert` | Submit earthquake alert |
| GET | `/api/alerts` | Get all alerts |
| DELETE | `/api/alerts` | Clear history |
| GET | `/api/stats` | Get statistics |
| GET | `/api/health` | Health check |

---

## 🚨 Troubleshooting

- **WiFi Connection**: Check SSID, password, and 2.4GHz network
- **I2C Issues**: Verify pull-up resistors and I2C addresses
- **Dashboard Not Updating**: Check WebSocket connection in console
- **Buzzer Silent**: Verify GPIO5 connection and buzzer polarity

---

**Version**: 1.0.0 | **Status**: Production Ready ✅
