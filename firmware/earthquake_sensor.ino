/**
 * Earthquake Alert System - Arduino/NodeMCU Firmware
 * Components: ADXL345 Accelerometer, Buzzer, LCD I2C, WiFi (NodeMCU)
 * Features: Real-time vibration sensing, local alerts, WiFi reporting
 */

#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ==================== PIN DEFINITIONS ====================
#define BUZZER_PIN 5          // GPIO 5 (D1 on NodeMCU)
#define SENSOR_SDA 4          // GPIO 4 (D2 on NodeMCU)
#define SENSOR_SCL 0          // GPIO 0 (D3 on NodeMCU)
#define LED_PIN 2             // GPIO 2 (D4 on NodeMCU)

// ==================== SENSOR CONFIGURATION ====================
#define ADXL345_ADDRESS 0x53  // I2C address of ADXL345
#define THRESHOLD_ALERT 15    // Acceleration threshold (m/s²) for alert
#define THRESHOLD_WARNING 10  // Lower threshold for warning
#define COOLDOWN_TIME 5000    // Cooldown between alerts (ms)

// ==================== LCD CONFIGURATION ====================
LiquidCrystal_I2C lcd(0x27, 16, 2); // Address 0x27, 16x2 LCD

// ==================== SENSOR DATA ====================
struct AccelData {
  float x, y, z;
  float magnitude;
};

// ==================== GLOBAL VARIABLES ====================
AccelData accelData;
unsigned long lastAlertTime = 0;
int alertCount = 0;
String systemStatus = "READY";
bool wifiConnected = false;

// WiFi credentials (Update these)
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";
const char* serverURL = "http://YOUR_SERVER_IP:3000";

// ==================== FUNCTION PROTOTYPES ====================
void initSensor();
void readAccelerometer();
float calculateMagnitude();
void checkAlert();
void triggerAlert();
void connectWiFi();
void sendAlertToServer();
void updateLCD();
void writeRegister(byte reg, byte value);
byte readRegister(byte reg);

// ==================== SETUP ====================
void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n\n========== EARTHQUAKE ALERT SYSTEM ==========");
  
  // Initialize pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
  
  // Initialize LCD
  Wire.begin(SENSOR_SDA, SENSOR_SCL);
  lcd.init();
  lcd.backlight();
  displayStartupScreen();
  
  // Initialize sensor
  initSensor();
  
  // Connect to WiFi
  connectWiFi();
  
  Serial.println("========== SETUP COMPLETE ==========\n");
}

// ==================== MAIN LOOP ====================
void loop() {
  // Read sensor data
  readAccelerometer();
  
  // Calculate magnitude
  accelData.magnitude = calculateMagnitude();
  
  // Check for alerts
  checkAlert();
  
  // Update LCD
  updateLCD();
  
  // Reconnect WiFi if disconnected
  if (!wifiConnected && WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  // Serial output for debugging
  printSensorData();
  
  delay(100); // 10 Hz sampling rate
}

// ==================== SENSOR FUNCTIONS ====================
void initSensor() {
  Serial.println("Initializing ADXL345 Accelerometer...");
  
  // Set power mode
  writeRegister(0x2D, 0x08); // Enable measurement
  writeRegister(0x31, 0x0B); // 13-bit, full resolution, ±16g range
  writeRegister(0x2C, 0x0A); // 100 Hz data rate
  
  lcd.setCursor(0, 0);
  lcd.print("Sensor: OK");
  delay(1000);
  lcd.clear();
  
  Serial.println("ADXL345 initialized successfully!");
}

void writeRegister(byte reg, byte value) {
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(reg);
  Wire.write(value);
  Wire.endTransmission();
}

byte readRegister(byte reg) {
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(reg);
  Wire.endTransmission(false);
  Wire.requestFrom(ADXL345_ADDRESS, 1);
  return Wire.read();
}

void readAccelerometer() {
  // Read raw data
  Wire.beginTransmission(ADXL345_ADDRESS);
  Wire.write(0x32); // Data start address
  Wire.endTransmission(false);
  Wire.requestFrom(ADXL345_ADDRESS, 6);
  
  int16_t rawX = Wire.read() | (Wire.read() << 8);
  int16_t rawY = Wire.read() | (Wire.read() << 8);
  int16_t rawZ = Wire.read() | (Wire.read() << 8);
  
  // Convert to m/s² (±16g, 1g = 9.81 m/s²)
  // Raw values at ±16g: 1 LSB = 0.0078 g
  accelData.x = rawX * 0.0078 * 9.81;
  accelData.y = rawY * 0.0078 * 9.81;
  accelData.z = rawZ * 0.0078 * 9.81;
}

float calculateMagnitude() {
  return sqrt(accelData.x * accelData.x + 
              accelData.y * accelData.y + 
              accelData.z * accelData.z);
}

void checkAlert() {
  // Check if threshold exceeded
  if (accelData.magnitude >= THRESHOLD_ALERT) {
    if (millis() - lastAlertTime > COOLDOWN_TIME) {
      triggerAlert();
      lastAlertTime = millis();
    }
  }
}

void triggerAlert() {
  alertCount++;
  systemStatus = "ALERT!";
  
  Serial.print("*** ALERT #");
  Serial.print(alertCount);
  Serial.print(" - Magnitude: ");
  Serial.println(accelData.magnitude);
  
  // Activate buzzer pattern
  for (int i = 0; i < 5; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    delay(100);
  }
  
  // Send to server
  if (wifiConnected) {
    sendAlertToServer();
  }
}

// ==================== WIFI & SERVER FUNCTIONS ====================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);
  
  lcd.setCursor(0, 0);
  lcd.print("WiFi Connecting...");
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println("\nWiFi Connected!");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi: Connected");
    delay(2000);
  } else {
    wifiConnected = false;
    Serial.println("\nWiFi Connection Failed!");
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("WiFi: Failed");
    delay(2000);
  }
  
  lcd.clear();
}

void sendAlertToServer() {
  if (!wifiConnected || WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping server alert");
    return;
  }
  
  HTTPClient http;
  String url = String(serverURL) + "/api/alert";
  
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  // Create JSON payload
  String payload = "{\"magnitude\":" + String(accelData.magnitude) + 
                   ",\"x\":" + String(accelData.x) + 
                   ",\"y\":" + String(accelData.y) + 
                   ",\"z\":" + String(accelData.z) + 
                   ",\"timestamp\":" + String(millis()) + "}";
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.print("Server Response Code: ");
    Serial.println(httpCode);
  } else {
    Serial.println("Failed to send alert to server");
  }
  
  http.end();
}

// ==================== LCD DISPLAY ====================
void displayStartupScreen() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("EARTHQUAKE");
  lcd.setCursor(0, 1);
  lcd.print("ALERT SYSTEM");
  delay(3000);
  lcd.clear();
}

void updateLCD() {
  static unsigned long lastUpdate = 0;
  
  if (millis() - lastUpdate > 500) { // Update every 500ms
    lcd.clear();
    
    // Line 1: Status and Magnitude
    lcd.setCursor(0, 0);
    if (accelData.magnitude >= THRESHOLD_ALERT) {
      lcd.print("!ALERT!");
    } else if (accelData.magnitude >= THRESHOLD_WARNING) {
      lcd.print("WARNING");
    } else {
      lcd.print("NORMAL");
    }
    
    lcd.setCursor(8, 0);
    lcd.print(accelData.magnitude, 1);
    lcd.print("m/s");
    
    // Line 2: WiFi status and alert count
    lcd.setCursor(0, 1);
    if (wifiConnected && WiFi.status() == WL_CONNECTED) {
      lcd.print("W:");
      lcd.print(WiFi.RSSI());
      lcd.print("dBm ");
    } else {
      lcd.print("WiFi:OFF ");
    }
    
    lcd.setCursor(12, 1);
    lcd.print("#");
    lcd.print(alertCount);
    
    lastUpdate = millis();
  }
}

void printSensorData() {
  static unsigned long lastPrint = 0;
  
  if (millis() - lastPrint > 1000) {
    Serial.print("X: ");
    Serial.print(accelData.x, 2);
    Serial.print(" Y: ");
    Serial.print(accelData.y, 2);
    Serial.print(" Z: ");
    Serial.print(accelData.z, 2);
    Serial.print(" | Magnitude: ");
    Serial.print(accelData.magnitude, 2);
    Serial.print(" | Status: ");
    Serial.println(systemStatus);
    
    lastPrint = millis();
  }
}
