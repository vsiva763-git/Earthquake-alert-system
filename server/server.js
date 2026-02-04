/**
 * Earthquake Alert System - Backend Server (API Data Aggregator)
 * Real-time data from USGS Earthquakes API, IOC Water Levels, NOAA Buoys
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

// ==================== CONFIGURATION ====================
const PORT = process.env.PORT || 3000;
const MAX_HISTORY = 200; // Maximum alerts to keep in history
const ALERT_THRESHOLD = 4.0; // Magnitude threshold for alert (Richter scale)

// Data Source URLs
const USGS_EARTHQUAKE_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_day.geojson';
const USGS_SIGNIFICANT_API = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson';
const IOC_WATER_LEVEL_API = 'https://www.ioc-sealevelmonitoring.org/api/v1/station/';
const NOAA_STATIONS_API = 'https://api.waterlevels.noaa.gov/api/stations/';
const NOAA_PREDICTIONS_API = 'https://api.waterlevels.noaa.gov/api/predictions/';

// Polling intervals (in milliseconds)
const EARTHQUAKE_POLL_INTERVAL = 60000; // 1 minute
const WATER_LEVEL_POLL_INTERVAL = 300000; // 5 minutes

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// ==================== DATA STRUCTURES ====================
class AlertSystem {
  constructor() {
    this.earthquakes = [];
    this.waterLevels = [];
    this.stats = {
      totalEarthquakes: 0,
      maxMagnitude: 0,
      averageMagnitude: 0,
      lastEarthquakeTime: null,
      dataStatus: 'INITIALIZING',
      lastUpdated: new Date(),
      dataSource: 'USGS + IOC/NOAA'
    };
    this.connectedDevices = 0;
    this.monitoringRegions = [
      { name: 'Pacific Ring of Fire', lat: [0, 60], lon: [100, 180] },
      { name: 'Mediterranean', lat: [30, 45], lon: [-10, 45] },
      { name: 'Mid-Atlantic Ridge', lat: [-60, 60], lon: [-45, 0] }
    ];
  }

  addEarthquake(data) {
    // Avoid duplicates by checking USGS id
    const exists = this.earthquakes.find(e => e.usgs_id === data.usgs_id);
    if (exists) return null;

    const earthquake = {
      id: this.earthquakes.length + 1,
      ...data,
      timestamp: new Date(),
      received_at: Date.now()
    };

    this.earthquakes.unshift(earthquake);
    
    // Trim history
    if (this.earthquakes.length > MAX_HISTORY) {
      this.earthquakes.pop();
    }

    // Update stats
    this.stats.totalEarthquakes++;
    this.stats.maxMagnitude = Math.max(this.stats.maxMagnitude, data.magnitude);
    this.stats.lastEarthquakeTime = new Date();
    this.updateAverageMagnitude();
    this.stats.dataStatus = 'ACTIVE';
    this.stats.lastUpdated = new Date();

    return earthquake;
  }

  addWaterLevel(data) {
    const waterLevel = {
      timestamp: new Date(),
      ...data
    };

    this.waterLevels.push(waterLevel);
    
    // Keep only last 500 readings
    if (this.waterLevels.length > 500) {
      this.waterLevels.shift();
    }

    return waterLevel;
  }

  updateAverageMagnitude() {
    if (this.earthquakes.length === 0) return;
    const sum = this.earthquakes.reduce((acc, eq) => acc + eq.magnitude, 0);
    this.stats.averageMagnitude = (sum / this.earthquakes.length).toFixed(2);
  }

  getStats() {
    return {
      ...this.stats,
      totalInHistory: this.earthquakes.length,
      waterLevelReadings: this.waterLevels.length,
      connectedClients: this.connectedDevices
    };
  }

  clearEarthquakes() {
    this.earthquakes = [];
    this.stats.totalEarthquakes = 0;
    this.stats.maxMagnitude = 0;
    this.stats.averageMagnitude = 0;
  }
}

const alertSystem = new AlertSystem();

// ==================== WEBSOCKET HANDLING ====================
wss.on('connection', (ws) => {
  alertSystem.connectedDevices++;
  console.log(`\n[WebSocket] New client connected. Total: ${alertSystem.connectedDevices}`);

  // Send initial data
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      earthquakes: alertSystem.earthquakes,
      waterLevels: alertSystem.waterLevels.slice(-50), // Last 50 readings
      stats: alertSystem.getStats()
    }
  }));

  ws.on('close', () => {
    alertSystem.connectedDevices--;
    console.log(`[WebSocket] Client disconnected. Total: ${alertSystem.connectedDevices}`);
  });

  ws.on('error', (error) => {
    console.error(`[WebSocket] Error: ${error.message}`);
  });
});

// Broadcast to all connected clients
function broadcastUpdate(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// ==================== DATA FETCHING FUNCTIONS ====================

/**
 * Fetch earthquake data from USGS API
 */
async function fetchUSGSEarthquakes() {
  try {
    const response = await axios.get(USGS_EARTHQUAKE_API, {
      timeout: 10000
    });

    const features = response.data.features || [];
    let newEarthquakes = 0;

    features.forEach(feature => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      const earthquake = alertSystem.addEarthquake({
        usgs_id: props.ids,
        magnitude: props.mag,
        latitude: coords[1],
        longitude: coords[0],
        depth: coords[2],
        location: props.place,
        source: 'USGS',
        url: props.url,
        tsunami: props.tsunami,
        felt_reports: props.felt
      });

      if (earthquake) {
        newEarthquakes++;
        
        // Broadcast new earthquake
        broadcastUpdate({
          type: 'new_earthquake',
          data: earthquake
        });

        // Log significant earthquakes
        if (props.mag >= ALERT_THRESHOLD) {
          console.log(`🌍 ALERT: Magnitude ${props.mag} - ${props.place}`);
        }
      }
    });

    if (newEarthquakes > 0) {
      console.log(`✅ USGS: Fetched ${newEarthquakes} new earthquakes`);
    }

    alertSystem.stats.dataStatus = 'ACTIVE';
  } catch (error) {
    console.error('❌ USGS API Error:', error.message);
    alertSystem.stats.dataStatus = 'ERROR';
  }
}

/**
 * Fetch water level data from IOC stations
 */
async function fetchIOCWaterLevels() {
  try {
    // IOC Sealevel Monitoring data
    const response = await axios.get(IOC_WATER_LEVEL_API, {
      timeout: 10000
    });

    const stations = response.data || [];
    
    stations.slice(0, 20).forEach(station => {
      if (station.latest_data) {
        alertSystem.addWaterLevel({
          station: station.station_code,
          name: station.station_name,
          latitude: station.latitude,
          longitude: station.longitude,
          level: station.latest_data.water_level,
          timestamp: station.latest_data.timestamp,
          source: 'IOC',
          country: station.country_id
        });
      }
    });

    console.log(`✅ IOC: Fetched ${Math.min(stations.length, 20)} water level stations`);
  } catch (error) {
    console.error('❌ IOC API Error:', error.message);
  }
}

/**
 * Fetch NOAA water level data
 */
async function fetchNOAAWaterLevels() {
  try {
    // Get active NOAA stations
    const stationsResponse = await axios.get(NOAA_STATIONS_API, {
      timeout: 10000,
      params: { type: 'waterlevels' }
    });

    const stations = stationsResponse.data.stations || [];
    
    // Fetch latest data for first 10 stations
    for (let i = 0; i < Math.min(stations.length, 10); i++) {
      const station = stations[i];
      
      try {
        const dataResponse = await axios.get(
          `${NOAA_PREDICTIONS_API}?station=${station.id}&begin_date=20240101&end_date=20240131&product=water_level&datum=MLLW`,
          { timeout: 5000 }
        );

        const predictions = dataResponse.data.predictions || [];
        if (predictions.length > 0) {
          const latest = predictions[predictions.length - 1];
          
          alertSystem.addWaterLevel({
            station: station.id,
            name: station.name,
            latitude: station.lat,
            longitude: station.lng,
            level: latest.v,
            timestamp: latest.t,
            source: 'NOAA',
            state: station.state
          });
        }
      } catch (error) {
        // Continue with next station
        continue;
      }
    }

    console.log(`✅ NOAA: Fetched water level data from ${Math.min(stations.length, 10)} stations`);
  } catch (error) {
    console.error('❌ NOAA API Error:', error.message);
  }
}

// ==================== DATA POLLING ====================

// Fetch earthquakes on startup and periodically
fetchUSGSEarthquakes();
setInterval(fetchUSGSEarthquakes, EARTHQUAKE_POLL_INTERVAL);

// Fetch water levels on startup and periodically
setTimeout(() => {
  fetchIOCWaterLevels();
  fetchNOAAWaterLevels();
}, 2000);

setInterval(() => {
  fetchIOCWaterLevels();
}, WATER_LEVEL_POLL_INTERVAL);

setInterval(() => {
  fetchNOAAWaterLevels();
}, WATER_LEVEL_POLL_INTERVAL * 2);

// ==================== REST API ENDPOINTS ====================

/**
 * POST /api/earthquake (Optional - for manual input)
 * Submit earthquake data (for testing/integration)
 */
app.post('/api/earthquake', (req, res) => {
  const { magnitude, latitude, longitude, location } = req.body;

  if (magnitude === undefined) {
    return res.status(400).json({ error: 'Missing magnitude data' });
  }

  const earthquake = alertSystem.addEarthquake({
    usgs_id: `manual_${Date.now()}`,
    magnitude: parseFloat(magnitude),
    latitude: parseFloat(latitude || 0),
    longitude: parseFloat(longitude || 0),
    location: location || 'Unknown Location',
    source: 'MANUAL'
  });

  console.log(`📍 Manual earthquake added: Magnitude ${magnitude} at ${location}`);

  broadcastUpdate({
    type: 'new_earthquake',
    data: earthquake
  });

  res.json({
    success: true,
    earthquake_id: earthquake.id,
    message: `Earthquake recorded: magnitude ${magnitude}`
  });
});

/**
 * GET /api/earthquakes
 * Get all earthquakes
 */
app.get('/api/earthquakes', (req, res) => {
  res.json({
    total: alertSystem.stats.totalEarthquakes,
    history_count: alertSystem.earthquakes.length,
    earthquakes: alertSystem.earthquakes
  });
});

/**
 * GET /api/earthquakes/:id
 * Get specific earthquake
 */
app.get('/api/earthquakes/:id', (req, res) => {
  const earthquake = alertSystem.earthquakes.find(e => e.id === parseInt(req.params.id));
  
  if (!earthquake) {
    return res.status(404).json({ error: 'Earthquake not found' });
  }

  res.json(earthquake);
});

/**
 * GET /api/water-levels
 * Get water level data
 */
app.get('/api/water-levels', (req, res) => {
  res.json({
    total_readings: alertSystem.waterLevels.length,
    recent: alertSystem.waterLevels.slice(-50),
    water_levels: alertSystem.waterLevels
  });
});

/**
 * GET /api/water-levels/station/:station
 * Get water levels for specific station
 */
app.get('/api/water-levels/station/:station', (req, res) => {
  const readings = alertSystem.waterLevels.filter(w => 
    w.station === req.params.station
  );
  
  res.json({
    station: req.params.station,
    count: readings.length,
    readings: readings
  });
});

/**
 * DELETE /api/earthquakes
 * Clear earthquake history
 */
app.delete('/api/earthquakes', (req, res) => {
  alertSystem.clearEarthquakes();
  
  broadcastUpdate({
    type: 'earthquakes_cleared'
  });

  res.json({ success: true, message: 'Earthquakes cleared' });
});

/**
 * GET /api/stats
 * Get system statistics
 */
app.get('/api/stats', (req, res) => {
  res.json(alertSystem.getStats());
});

/**
 * GET /api/data-sources
 * Get information about data sources
 */
app.get('/api/data-sources', (req, res) => {
  res.json({
    sources: [
      {
        name: 'USGS Earthquake Hazards Program',
        type: 'Earthquakes',
        url: 'https://earthquake.usgs.gov',
        update_frequency: '1 minute',
        coverage: 'Global',
        status: 'Active'
      },
      {
        name: 'IOC Sealevel Monitoring',
        type: 'Water Levels',
        url: 'https://www.ioc-sealevelmonitoring.org',
        update_frequency: '5 minutes',
        coverage: 'Global Tide Gauge Stations',
        status: 'Active'
      },
      {
        name: 'NOAA Water Levels',
        type: 'Water Levels & Predictions',
        url: 'https://www.noaa.gov',
        update_frequency: '5 minutes',
        coverage: 'USA Coastal Stations',
        status: 'Active'
      }
    ],
    last_updated: alertSystem.stats.lastUpdated
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime(),
    earthquakes_count: alertSystem.stats.totalEarthquakes,
    water_level_readings: alertSystem.waterLevels.length,
    connected_clients: alertSystem.connectedDevices,
    data_status: alertSystem.stats.dataStatus
  });
});

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ==================== SERVER START ====================
server.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║  EARTHQUAKE & WATER LEVEL MONITORING SYSTEM           ║
║         Real-time Data Aggregator                     ║
╠════════════════════════════════════════════════════════╣
║  Server running on: http://0.0.0.0:${PORT}
║  WebSocket: ws://0.0.0.0:${PORT}/ws
║  Dashboard: http://localhost:${PORT}
║  API Docs: http://localhost:${PORT}/api/health
║  Data Sources:
║    • USGS Earthquake Hazards (1 min updates)
║    • IOC Sealevel Monitoring (5 min updates)
║    • NOAA Water Levels (5 min updates)
╚════════════════════════════════════════════════════════╝
  `);
});

// ==================== GRACEFUL SHUTDOWN ====================
process.on('SIGTERM', () => {
  console.log('\n[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

module.exports = app;
