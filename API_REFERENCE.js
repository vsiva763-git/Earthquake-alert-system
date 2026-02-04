/**
 * API Reference - Earthquake Alert System
 * 
 * Base URL: http://localhost:3000
 * WebSocket: ws://localhost:3000/ws
 */

// ==================== ALERT ENDPOINTS ====================

/**
 * POST /api/alert
 * Submit an earthquake alert from IoT device
 * 
 * Request Body:
 * {
 *   "magnitude": number,     // Required: m/s²
 *   "x": number,            // Optional: X-axis acceleration
 *   "y": number,            // Optional: Y-axis acceleration
 *   "z": number,            // Optional: Z-axis acceleration
 *   "timestamp": number     // Optional: Device timestamp
 * }
 * 
 * Example:
 * POST /api/alert
 * Content-Type: application/json
 * 
 * {
 *   "magnitude": 16.5,
 *   "x": 8.2,
 *   "y": 9.3,
 *   "z": 10.1,
 *   "timestamp": 1234567890
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "alert_id": 42,
 *   "message": "Alert received with magnitude 16.5m/s²"
 * }
 */

/**
 * GET /api/alerts
 * Retrieve all alerts from history
 * 
 * Query Parameters: None
 * 
 * Response:
 * {
 *   "total": 42,
 *   "history_count": 42,
 *   "alerts": [
 *     {
 *       "id": 1,
 *       "magnitude": 16.5,
 *       "x": 8.2,
 *       "y": 9.3,
 *       "z": 10.1,
 *       "timestamp": "2024-02-04T10:30:45.123Z",
 *       "received_at": 1707053445123
 *     },
 *     ...
 *   ]
 * }
 */

/**
 * GET /api/alerts/:id
 * Retrieve specific alert by ID
 * 
 * URL Parameters:
 * - id: Alert ID (number)
 * 
 * Response:
 * {
 *   "id": 1,
 *   "magnitude": 16.5,
 *   "x": 8.2,
 *   "y": 9.3,
 *   "z": 10.1,
 *   "timestamp": "2024-02-04T10:30:45.123Z"
 * }
 * 
 * Error Response (404):
 * {
 *   "error": "Alert not found"
 * }
 */

/**
 * DELETE /api/alerts
 * Clear all alert history
 * 
 * Response:
 * {
 *   "success": true,
 *   "message": "All alerts cleared"
 * }
 */

// ==================== SENSOR DATA ENDPOINTS ====================

/**
 * POST /api/sensor-data
 * Submit continuous sensor readings (optional)
 * 
 * Request Body:
 * {
 *   "x": number,         // X-axis acceleration (m/s²)
 *   "y": number,         // Y-axis acceleration (m/s²)
 *   "z": number,         // Z-axis acceleration (m/s²)
 *   "magnitude": number  // Resultant magnitude (m/s²)
 * }
 * 
 * Response:
 * {
 *   "success": true
 * }
 */

/**
 * GET /api/current-sensor
 * Get latest sensor reading
 * 
 * Response:
 * {
 *   "x": 2.34,
 *   "y": 3.45,
 *   "z": 1.23,
 *   "magnitude": 4.12,
 *   "timestamp": "2024-02-04T10:30:45.123Z"
 * }
 */

// ==================== STATISTICS & STATUS ====================

/**
 * GET /api/stats
 * Get system statistics
 * 
 * Response:
 * {
 *   "totalAlerts": 42,
 *   "maxMagnitude": 22.5,
 *   "averageMagnitude": "14.32",
 *   "lastAlertTime": "2024-02-04T10:30:45.123Z",
 *   "deviceStatus": "CONNECTED",
 *   "totalAlertsInHistory": 42,
 *   "connectedDevices": 1
 * }
 */

/**
 * GET /api/health
 * Health check endpoint
 * 
 * Response:
 * {
 *   "status": "ok",
 *   "timestamp": "2024-02-04T10:30:45.123Z",
 *   "uptime": 3600.5,
 *   "alerts_count": 42,
 *   "connected_devices": 1
 * }
 */

/**
 * POST /api/device-status
 * Update device status (heartbeat)
 * 
 * Request Body:
 * {
 *   "status": "CONNECTED",  // Device status
 *   "rssi": -45             // WiFi signal strength (optional)
 * }
 * 
 * Response:
 * {
 *   "success": true
 * }
 */

// ==================== WEBSOCKET MESSAGES ====================

/**
 * WebSocket Connection: ws://localhost:3000/ws
 * 
 * Initial Connection Message:
 * {
 *   "type": "init",
 *   "data": {
 *     "alerts": [...],
 *     "stats": {...},
 *     "currentSensorData": {...}
 *   }
 * }
 */

/**
 * New Alert Message (Server → Client):
 * {
 *   "type": "new_alert",
 *   "data": {
 *     "id": 42,
 *     "magnitude": 16.5,
 *     "x": 8.2,
 *     "y": 9.3,
 *     "z": 10.1,
 *     "timestamp": "2024-02-04T10:30:45.123Z"
 *   }
 * }
 */

/**
 * Sensor Update Message (Server → Client):
 * {
 *   "type": "sensor_update",
 *   "data": {
 *     "x": 2.34,
 *     "y": 3.45,
 *     "z": 1.23,
 *     "magnitude": 4.12,
 *     "timestamp": "2024-02-04T10:30:45.123Z"
 *   }
 * }
 */

/**
 * Device Status Message (Server → Client):
 * {
 *   "type": "device_status",
 *   "data": {
 *     "status": "CONNECTED",
 *     "rssi": -45,
 *     "lastSeen": "2024-02-04T10:30:45.123Z"
 *   }
 * }
 */

/**
 * Alerts Cleared Message (Server → Client):
 * {
 *   "type": "alerts_cleared"
 * }
 */

// ==================== CURL EXAMPLES ====================

/*
// Test Alert Submission
curl -X POST http://localhost:3000/api/alert \
  -H "Content-Type: application/json" \
  -d '{
    "magnitude": 18.5,
    "x": 9.2,
    "y": 10.3,
    "z": 11.1,
    "timestamp": '$(date +%s)
}'

// Get All Alerts
curl http://localhost:3000/api/alerts

// Get Specific Alert
curl http://localhost:3000/api/alerts/1

// Get Statistics
curl http://localhost:3000/api/stats

// Get Health Status
curl http://localhost:3000/api/health

// Update Device Status
curl -X POST http://localhost:3000/api/device-status \
  -H "Content-Type: application/json" \
  -d '{
    "status": "CONNECTED",
    "rssi": -50
}'

// Clear Alert History
curl -X DELETE http://localhost:3000/api/alerts

// Export Alerts to JSON
curl http://localhost:3000/api/alerts > alerts_backup.json
*/

// ==================== ERROR RESPONSES ====================

/*
// 400 Bad Request
{
  "error": "Missing magnitude data"
}

// 404 Not Found
{
  "error": "Alert not found"
}

// 500 Internal Server Error
{
  "error": "Internal server error",
  "message": "Error details..."
}
*/

// ==================== HTTP STATUS CODES ====================

/*
200 OK              - Request successful
201 Created         - Resource created
204 No Content      - Successful, no response body
400 Bad Request     - Invalid request data
404 Not Found       - Resource not found
500 Server Error    - Server error
503 Unavailable     - Service temporarily unavailable
*/

// ==================== AUTHENTICATION (Future) ====================

/*
// When authentication is added:

POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600
}

// Then use token in Authorization header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
*/
