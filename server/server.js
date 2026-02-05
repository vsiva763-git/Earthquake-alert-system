/**
 * Earthquake Alert System - Backend Server (API Data Aggregator)
 * Real-time data from USGS Earthquakes API
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

// Polling intervals (in milliseconds)
const EARTHQUAKE_POLL_INTERVAL = 60000; // 1 minute

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// ==================== DATA STRUCTURES ====================
class AlertSystem {
  constructor() {
    this.earthquakes = [];
    this.stats = {
      totalEarthquakes: 0,
      maxMagnitude: 0,
      averageMagnitude: 0,
      lastEarthquakeTime: null,
      dataStatus: 'INITIALIZING',
      lastUpdated: new Date(),
      dataSource: 'USGS'
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

  updateAverageMagnitude() {
    if (this.earthquakes.length === 0) return;
    const sum = this.earthquakes.reduce((acc, eq) => acc + eq.magnitude, 0);
    this.stats.averageMagnitude = (sum / this.earthquakes.length).toFixed(2);
  }

  // ==================== FORESHOCK DETECTION ====================
  
  detectClusters(timeWindowMinutes = 1440, spatialRadiusKm = 100) {
    /**
     * Detect earthquake clusters within a time and spatial window
     * Returns clusters of earthquakes in the last 24 hours within 100km radius
     */
    const now = Date.now();
    const timeWindowMs = timeWindowMinutes * 60 * 1000;
    const clusters = [];

    for (let i = 0; i < this.earthquakes.length; i++) {
      const eq = this.earthquakes[i];
      const timeDiff = now - eq.received_at;

      // Only consider earthquakes within time window
      if (timeDiff > timeWindowMs) break;

      // Check if this earthquake is part of existing cluster
      let foundCluster = false;
      for (let cluster of clusters) {
        for (let member of cluster.members) {
          const distance = this.calculateDistance(
            eq.latitude, eq.longitude,
            member.latitude, member.longitude
          );
          
          if (distance < spatialRadiusKm) {
            cluster.members.push(eq);
            cluster.magnitude_trend = this.analyzeMagnitudeTrend(cluster.members);
            cluster.last_update = new Date();
            foundCluster = true;
            break;
          }
        }
        if (foundCluster) break;
      }

      // Create new cluster if not found
      if (!foundCluster) {
        clusters.push({
          id: clusters.length + 1,
          center_lat: eq.latitude,
          center_lon: eq.longitude,
          members: [eq],
          member_count: 1,
          magnitude_trend: 'stable',
          min_magnitude: eq.magnitude,
          max_magnitude: eq.magnitude,
          avg_magnitude: eq.magnitude,
          foreshock_probability: 0,
          main_shock_eta: null,
          created_at: new Date(eq.received_at),
          last_update: new Date()
        });
      }
    }

    // Update cluster statistics and calculate probabilities
    for (let cluster of clusters) {
      cluster.member_count = cluster.members.length;
      const mags = cluster.members.map(m => m.magnitude);
      cluster.min_magnitude = Math.min(...mags);
      cluster.max_magnitude = Math.max(...mags);
      cluster.avg_magnitude = (mags.reduce((a, b) => a + b) / mags.length).toFixed(2);
      cluster.foreshock_probability = this.calculateForecastProbability(cluster);
    }

    return clusters.filter(c => c.member_count >= 2); // Only return clusters with 2+ events
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    /**
     * Calculate distance between two coordinates using Haversine formula
     * Returns distance in kilometers
     */
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  analyzeMagnitudeTrend(earthquakes) {
    /**
     * Analyze if magnitude is increasing in a cluster
     * Returns: 'increasing', 'decreasing', or 'stable'
     */
    if (earthquakes.length < 2) return 'stable';
    
    const sorted = [...earthquakes].sort((a, b) => b.received_at - a.received_at); // Most recent first
    const recent = sorted.slice(0, Math.min(5, sorted.length));
    
    const avgRecent = recent.reduce((a, b) => a + b.magnitude, 0) / recent.length;
    const avgOlder = this.earthquakes.slice(5, 10).reduce((a, b) => a + b.magnitude, 0) / Math.min(5, this.earthquakes.length - 5);
    
    if (avgRecent > avgOlder + 0.3) return 'increasing';
    if (avgRecent < avgOlder - 0.3) return 'decreasing';
    return 'stable';
  }

  calculateForecastProbability(cluster) {
    /**
     * Calculate probability of main shock within 24 hours
     * Based on: cluster size, magnitude trend, temporal distribution
     * Returns probability (0-100%)
     */
    let probability = 0;

    // Factor 1: Cluster size (more events = higher probability)
    const sizeScore = Math.min(cluster.member_count / 10, 1) * 25;
    
    // Factor 2: Magnitude trend
    const trendScore = cluster.magnitude_trend === 'increasing' ? 30 : 
                       cluster.magnitude_trend === 'stable' ? 15 : 5;
    
    // Factor 3: Magnitude range (larger spread = higher probability)
    const magRange = cluster.max_magnitude - cluster.min_magnitude;
    const rangeScore = Math.min(magRange / 2, 1) * 20;
    
    // Factor 4: Time concentration (events close together in time = higher probability)
    const timeDiffs = [];
    for (let i = 0; i < cluster.members.length - 1; i++) {
      timeDiffs.push(cluster.members[i].received_at - cluster.members[i + 1].received_at);
    }
    const avgTimeDiff = timeDiffs.length > 0 ? timeDiffs.reduce((a, b) => a + b) / timeDiffs.length : 0;
    const timeConcentration = avgTimeDiff < 3600000 ? 25 : avgTimeDiff < 86400000 ? 15 : 5; // < 1hr, < 24hr, > 24hr
    
    // Factor 5: Maximum magnitude in cluster
    const magScore = Math.min(cluster.max_magnitude / 7, 1) * 20;

    probability = sizeScore + trendScore + rangeScore + timeConcentration + magScore;
    return Math.min(Math.round(probability), 100);
  }

  getForecast(hours = 24) {
    /**
     * Get 24-hour forecast data based on cluster analysis
     * Returns forecast information including probability of main shock
     */
    const clusters = this.detectClusters(hours * 60, 100);
    const alerts = [];

    for (let cluster of clusters) {
      if (cluster.foreshock_probability > 30) {
        alerts.push({
          alert_level: cluster.foreshock_probability > 60 ? 'HIGH' : 'MODERATE',
          probability: cluster.foreshock_probability,
          cluster_id: cluster.id,
          cluster_size: cluster.member_count,
          location: {
            lat: cluster.center_lat,
            lon: cluster.center_lon
          },
          magnitude_range: `${cluster.min_magnitude.toFixed(1)} - ${cluster.max_magnitude.toFixed(1)}`,
          trend: cluster.magnitude_trend,
          recent_activity: cluster.last_update,
          forecast_hours: hours
        });
      }
    }

    return {
      forecast_generated_at: new Date(),
      forecast_window_hours: hours,
      total_clusters: clusters.length,
      alerts: alerts.sort((a, b) => b.probability - a.probability),
      summary: {
        high_probability_events: alerts.filter(a => a.alert_level === 'HIGH').length,
        moderate_probability_events: alerts.filter(a => a.alert_level === 'MODERATE').length,
        max_probability: alerts.length > 0 ? Math.max(...alerts.map(a => a.probability)) : 0
      }
    };
  }

  getStats() {
    return {
      ...this.stats,
      totalInHistory: this.earthquakes.length,
      connectedClients: this.connectedDevices,
      forecast: this.getForecast(24) // Include 24-hour forecast in stats
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
      stats: alertSystem.getStats(),
      forecast: alertSystem.getForecast(24),
      foreshocks: alertSystem.detectClusters()
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

        // Check for foreshock clusters and broadcast alerts
        const clusters = alertSystem.detectClusters(1440, 100); // 24-hour window, 100km radius
        const alerts = clusters.filter(c => c.foreshock_probability > 30);
        
        if (alerts.length > 0) {
          broadcastUpdate({
            type: 'foreshock_alert',
            data: {
              high_probability: alerts.filter(a => a.foreshock_probability > 60),
              moderate_probability: alerts.filter(a => a.foreshock_probability >= 30 && a.foreshock_probability <= 60)
            }
          });
        }

        // Broadcast updated forecast
        broadcastUpdate({
          type: 'forecast_update',
          data: alertSystem.getForecast(24)
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

// ==================== DATA POLLING ====================

// Fetch earthquakes on startup and periodically
fetchUSGSEarthquakes();
setInterval(fetchUSGSEarthquakes, EARTHQUAKE_POLL_INTERVAL);

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

  // Check for foreshock clusters
  const clusters = alertSystem.detectClusters(1440, 100);
  const alerts = clusters.filter(c => c.foreshock_probability > 30);
  
  if (alerts.length > 0) {
    broadcastUpdate({
      type: 'foreshock_alert',
      data: {
        high_probability: alerts.filter(a => a.foreshock_probability > 60),
        moderate_probability: alerts.filter(a => a.foreshock_probability >= 30 && a.foreshock_probability <= 60)
      }
    });
  }

  // Broadcast updated forecast
  broadcastUpdate({
    type: 'forecast_update',
    data: alertSystem.getForecast(24)
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
    connected_clients: alertSystem.connectedDevices,
    data_status: alertSystem.stats.dataStatus
  });
});

/**
 * GET /api/foreshocks
 * Get detected foreshock clusters
 */
app.get('/api/foreshocks', (req, res) => {
  const timeWindowMinutes = parseInt(req.query.window) || 1440; // Default 24 hours
  const spatialRadiusKm = parseInt(req.query.radius) || 100; // Default 100km
  
  const clusters = alertSystem.detectClusters(timeWindowMinutes, spatialRadiusKm);
  
  res.json({
    status: 'success',
    timestamp: new Date(),
    parameters: {
      time_window_minutes: timeWindowMinutes,
      spatial_radius_km: spatialRadiusKm
    },
    total_clusters: clusters.length,
    foreshock_clusters: clusters,
    summary: {
      high_probability: clusters.filter(c => c.foreshock_probability > 60).length,
      moderate_probability: clusters.filter(c => c.foreshock_probability >= 30 && c.foreshock_probability <= 60).length,
      low_probability: clusters.filter(c => c.foreshock_probability < 30).length
    }
  });
});

/**
 * GET /api/forecast
 * Get 24-hour earthquake forecast with main shock probability
 */
app.get('/api/forecast', (req, res) => {
  const hours = parseInt(req.query.hours) || 24;
  const forecast = alertSystem.getForecast(hours);
  
  res.json({
    status: 'success',
    timestamp: new Date(),
    ...forecast
  });
});

/**
 * GET /api/clusters/:id
 * Get detailed information about a specific cluster
 */
app.get('/api/clusters/:id', (req, res) => {
  const clusters = alertSystem.detectClusters();
  const cluster = clusters.find(c => c.id === parseInt(req.params.id));
  
  if (!cluster) {
    return res.status(404).json({
      error: 'Cluster not found',
      cluster_id: req.params.id
    });
  }
  
  res.json({
    status: 'success',
    cluster: cluster,
    analysis: {
      magnitude_trend_analysis: {
        trend: cluster.magnitude_trend,
        min: cluster.min_magnitude,
        max: cluster.max_magnitude,
        average: cluster.avg_magnitude
      },
      foreshock_indicators: {
        probability_percentage: cluster.foreshock_probability,
        member_count: cluster.member_count,
        spatial_density: (cluster.member_count / 100).toFixed(2),
        time_span_minutes: (cluster.last_update - cluster.created_at) / 60000
      }
    }
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
║  EARTHQUAKE MONITORING SYSTEM                         ║
║         Real-time Data Aggregator                     ║
╠════════════════════════════════════════════════════════╣
║  Server running on: http://0.0.0.0:${PORT}
║  WebSocket: ws://0.0.0.0:${PORT}/ws
║  Dashboard: http://localhost:${PORT}
║  API Docs: http://localhost:${PORT}/api/health
║  Data Sources:
║    • USGS Earthquake Hazards (1 min updates)
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
