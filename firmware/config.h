/**
 * Configuration file for ADXL345 Accelerometer on Arduino
 * Pin Definitions and Sensor Parameters
 */

// ==================== PIN CONFIGURATION ====================
// NodeMCU GPIO Mapping
#define BUZZER_PIN          5   // D1 - Active Buzzer
#define I2C_SDA             4   // D2 - I2C Data
#define I2C_SCL             0   // D3 - I2C Clock
#define LED_PIN             2   // D4 - Status LED

// ==================== ADXL345 I2C CONFIGURATION ====================
#define ADXL345_ADDRESS     0x53    // 7-bit I2C address (default)
#define ADXL345_DEVID       0x00    // Device ID register
#define ADXL345_POWER_CTL   0x2D    // Power control register
#define ADXL345_DATA_FORMAT 0x31    // Data format register
#define ADXL345_BW_RATE     0x2C    // Bandwidth rate register
#define ADXL345_DATAX0      0x32    // X-axis acceleration data

// ==================== SENSOR CALIBRATION ====================
#define ADXL345_SCALE       0.0078f // LSB to g conversion (13-bit, ±16g)
#define G_TO_MS2            9.81f   // g to m/s² conversion

// ==================== ALERT THRESHOLDS ====================
#define THRESHOLD_ALERT     15.0f   // Critical: >= 15 m/s²
#define THRESHOLD_WARNING   10.0f   // Warning:  >= 10 m/s²
#define THRESHOLD_NORMAL     5.0f   // Normal:   < 5 m/s²

// ==================== TIMING PARAMETERS ====================
#define SAMPLING_RATE       100     // 10 Hz (100ms between samples)
#define ALERT_COOLDOWN      5000    // 5 seconds between alerts
#define LED_FLASH_DURATION  200     // 200ms LED flash
#define BUZZER_FREQUENCY    800     // Hz (tone frequency)

// ==================== LCD I2C CONFIGURATION ====================
#define LCD_ADDRESS         0x27    // 16x2 LCD I2C address
#define LCD_COLUMNS         16      // LCD width
#define LCD_ROWS            2       // LCD height

// ==================== WIFI CONFIGURATION ====================
// Update these with your network credentials
#define WIFI_SSID           "YOUR_SSID"
#define WIFI_PASSWORD       "YOUR_PASSWORD"
#define SERVER_IP           "192.168.1.100"     // Your server IP
#define SERVER_PORT         3000                // Server port
#define SERVER_ENDPOINT     "/api/alert"        // Alert endpoint

// ==================== SENSOR REGISTERS ====================
#define POWER_CTL_VALUE     0x08    // Enable measurement mode
#define DATA_FORMAT_VALUE   0x0B    // 13-bit, full resolution, ±16g
#define BW_RATE_VALUE       0x0A    // 100 Hz data rate

// ==================== SYSTEM PARAMETERS ====================
#define MAX_RETRIES         3       // WiFi connection retries
#define WIFI_TIMEOUT        20      // WiFi connection timeout (seconds)
#define HTTP_TIMEOUT        5000    // HTTP request timeout (ms)
