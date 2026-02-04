# 🚀 Quick Start Guide

## Real-time Earthquake & Water Level Monitoring System

### What You Have

A cloud-based data aggregation system with:
- **USGS Earthquake API** integration (real-time global data)
- **IOC Sealevel Monitoring API** (global water levels)
- **NOAA Water Levels API** (USA coastal data)
- **Node.js Express Backend** with REST API and WebSocket support
- **Modern Web Dashboard** with real-time updates and analytics
- **Zero Hardware Required** - Pure cloud data aggregation

---

## 🚀 Get Started in 2 Steps

### Step 1: Install Dependencies & Start Server
```bash
cd /workspaces/Earthquake-alert-system
npm install
npm start
```

Server will start on `http://localhost:3000`

### Step 2: Open Dashboard
```bash
# Visit http://localhost:3000 in your browser
```

Done! ✨ System will automatically start fetching earthquake and water level data.

---

## 📋 File Structure

```
├── firmware/                    # [ARCHIVED] Previous hardware code
│   ├── earthquake_sensor.ino    
│   └── config.h                 
├── server/
│   └── server.js                # API Aggregator Backend
├── public/
│   ├── index.html               # Dashboard UI
│   ├── dashboard.js             # Frontend logic
│   └── styles.css               # Dashboard styles
├── package.json                 # Node dependencies
├── .env.example                 # Environment template
├── API_DATASOURCES.md          # Data source documentation
├── QUICK_START.md              # This file
├── SETUP_GUIDE.md              # Detailed setup
└── README.md                   # Main documentation
```

---

## 📡 Data Sources

### USGS Earthquakes 🌍
- **Update Frequency**: Every 60 seconds
- **Global Coverage**: All earthquakes (magnitude 1.0+)
- **Display Threshold**: 4.0+ Richter scale alerts

### IOC Water Levels 🌊
- **Update Frequency**: Every 5 minutes
- **Coverage**: 190+ global tide gauge stations
- **Data**: Real-time water level readings

### NOAA Water Levels 📊
- **Update Frequency**: Every 10 minutes
- **Coverage**: USA coastal monitoring stations
- **Data**: Real-time + predictions

---

## 📊 Dashboard Features

✅ Real-time earthquake monitoring (global)
✅ Water level tracking (190+ stations)
✅ Magnitude-based severity indicators
✅ Live statistics & analytics
✅ Data export (JSON)
✅ Responsive design
✅ WebSocket real-time updates
✅ Zero configuration needed!

---

## 🎯 Alert System

| Magnitude | Severity | Display |
|-----------|----------|---------|
| < 4.0 | MINOR | Light notification |
| 4.0-5.5 | LIGHT | Yellow highlight |
| 5.5-7.0 | MODERATE | Orange highlight |
| ≥ 7.0 | MAJOR | Red alert |

---

## 📡 API Endpoints

```bash
# Send alert
curl -X POST http://localhost:3000/api/alert \
  -H "Content-Type: application/json" \
  -d '{"magnitude": 18, "x": 9, "y": 10, "z": 11}'

# Get all alerts
curl http://localhost:3000/api/alerts

# Get statistics
curl http://localhost:3000/api/stats

# Clear history
curl -X DELETE http://localhost:3000/api/alerts
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| WiFi not connecting | Check SSID, password, 2.4GHz network |
| I2C devices not found | Verify pull-up resistors, check addresses |
| Dashboard not updating | Check WebSocket in browser console |
| No buzzer sound | Verify D1 pin, check buzzer polarity |

---

## 📚 Documentation

- **SETUP_GUIDE.md**: Comprehensive setup instructions
- **firmware/config.h**: Hardware configuration constants
- **server/server.js**: Backend API documentation in comments
- **public/dashboard.js**: Frontend code comments

---

## 🔗 Important Links

- **Dashboard**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health
- **ADXL345 Datasheet**: https://www.analog.com/en/products/adxl345.html
- **NodeMCU Docs**: https://nodemcu.readthedocs.io/

---

## ✨ Next Steps

1. ✅ Install dependencies (`npm install`)
2. ✅ Upload firmware to NodeMCU
3. ✅ Start server (`npm start`)
4. ✅ Access dashboard (http://localhost:3000)
5. ⭐ Test with sensor or simulate data via API
6. 🎉 Monitor earthquakes in real-time!

---

## 💡 Tips

- Adjust thresholds in `firmware/config.h`
- Modify dashboard styling in `public/styles.css`
- Add database persistence in `server/server.js`
- Enable HTTPS for production use

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 4, 2026
