/**
 * Earthquake Alert System - Dashboard JavaScript
 * Real-time WebSocket updates, chart visualization, and controls
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
    wsUrl: `ws://${window.location.host}/ws`,
    apiUrl: `http://${window.location.host}/api`,
    maxChartPoints: 50,
    updateInterval: 1000
};

// ==================== GLOBAL STATE ====================
let ws = null;
let chart = null;
let earthquakesData = [];
let waterLevelsData = [];
let isConnected = false;

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initWebSocket();
    initChart();
    attachEventListeners();
    console.log('Dashboard initialized');
});

// ==================== WEBSOCKET CONNECTION ====================
function initWebSocket() {
    ws = new WebSocket(CONFIG.wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        isConnected = true;
        updateConnectionStatus(true);
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };

    ws.onclose = () => {
        console.log('WebSocket disconnected');
        isConnected = false;
        updateConnectionStatus(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(initWebSocket, 3000);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        updateConnectionStatus(false);
    };
}

function handleWebSocketMessage(message) {
    const { type, data } = message;

    switch (type) {
        case 'init':
            handleInitMessage(data);
            break;
        case 'new_alert':
            handleNewAlert(data);
            break;
        case 'sensor_update':
            handleSensorUpdate(data);
            break;
        case 'device_status':
            handleDeviceStatus(data);
            break;
        case 'alerts_cleared':
            handleAlertsCleared();
            break;
        default:
            console.log('Unknown message type:', type);
    }
}

function handleInitMessage(data) {
    console.log('Received initial data:', data);
    
    if (data.earthquakes) {
        earthquakesData = data.earthquakes;
        updateEarthquakesTable();
        updateChart();
    }

    if (data.waterLevels) {
        waterLevelsData = data.waterLevels;
        updateWaterLevelsTable();
    }

    if (data.stats) {
        updateStats(data.stats);
    }
}

function handleNewEarthquake(earthquake) {
    console.log('New earthquake received:', earthquake);
    
    earthquakesData.unshift(earthquake);
    updateEarthquakesTable();
    updateChart();
    playAlertSound();
    
    const severity = getSeverity(earthquake.magnitude);
    showNotification(`🌍 Earthquake! ${earthquake.magnitude} magnitude at ${earthquake.location}`, 'alert');
}

function handleWaterLevelUpdate(data) {
    waterLevelsData.push(data);
    
    // Keep only last 100 readings
    if (waterLevelsData.length > 100) {
        waterLevelsData.shift();
    }
    
    updateWaterLevelsTable();
}

function handleDeviceStatus(data) {
    const statusElement = document.getElementById('deviceStatus');
    statusElement.textContent = 'USGS + IOC/NOAA';
    statusElement.classList.add('connected');
}

function handleAlertsCleared() {
    earthquakesData = [];
    updateEarthquakesTable();
    updateChart();
    showNotification('Earthquake history cleared', 'success');
}

// ==================== CHART INITIALIZATION ====================
function initChart() {
    const ctx = document.getElementById('magnitudeChart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Magnitude (m/s²)',
                    data: [],
                    borderColor: 'rgb(255, 107, 107)',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: 'rgb(255, 107, 107)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 6
                },
                {
                    label: 'Alert Threshold',
                    data: [],
                    borderColor: 'rgba(255, 71, 87, 0.5)',
                    borderDash: [5, 5],
                    borderWidth: 1,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: 'rgba(255, 255, 255, 0.8)',
                        usePointStyle: true,
                        padding: 20
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    borderColor: 'rgba(255, 107, 107, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    titleFont: { size: 14, weight: 'bold' },
                    bodyFont: { size: 13 }
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 11 }
                    }
                },
                y: {
                    display: true,
                    min: 0,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!chart) return;

    const labels = earthquakesData.map((eq, index) => {
        const date = new Date(eq.timestamp);
        return date.toLocaleDateString();
    });

    const magnitudes = earthquakesData.map(eq => eq.magnitude);
    const thresholds = earthquakesData.map(() => 4.0); // Magnitude threshold

    chart.data.labels = labels;
    chart.data.datasets[0].data = magnitudes;
    chart.data.datasets[1].data = thresholds;
    
    // Keep only last N points
    if (chart.data.labels.length > CONFIG.maxChartPoints) {
        chart.data.labels = chart.data.labels.slice(-CONFIG.maxChartPoints);
        chart.data.datasets[0].data = chart.data.datasets[0].data.slice(-CONFIG.maxChartPoints);
        chart.data.datasets[1].data = chart.data.datasets[1].data.slice(-CONFIG.maxChartPoints);
    }

    chart.update('none');
}

// ==================== UI UPDATE FUNCTIONS ====================
function updateStats(stats) {
    document.getElementById('totalAlerts').textContent = stats.totalEarthquakes || 0;
    document.getElementById('maxMagnitude').textContent = (stats.maxMagnitude || 0).toFixed(1);
    document.getElementById('avgMagnitude').textContent = (stats.averageMagnitude || 0).toFixed(1);
    document.getElementById('deviceStatus').textContent = stats.dataSource || 'API';
    document.getElementById('connectedDevices').textContent = stats.connectedClients || 0;
}

function updateEarthquakesTable() {
    const tbody = document.getElementById('alertsTableBody');

    if (earthquakesData.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No earthquakes detected</td></tr>';
        return;
    }

    tbody.innerHTML = earthquakesData
        .slice(0, 50) // Show last 50
        .map(eq => {
            const time = new Date(eq.timestamp).toLocaleString();
            const severity = getSeverity(eq.magnitude);

            return `
                <tr>
                    <td>${eq.id}</td>
                    <td class="magnitude-${severity.class}">${eq.magnitude.toFixed(1)}</td>
                    <td>${eq.location || 'Unknown'}</td>
                    <td>${(eq.latitude || 0).toFixed(2)}</td>
                    <td>${(eq.longitude || 0).toFixed(2)}</td>
                    <td>${(eq.depth || 0).toFixed(1)}</td>
                    <td>${time}</td>
                    <td>${eq.source || 'USGS'}</td>
                </tr>
            `;
        })
        .join('');
}

function updateWaterLevelsTable() {
    const tbody = document.getElementById('waterLevelBody');

    if (waterLevelsData.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No water level data</td></tr>';
        return;
    }

    tbody.innerHTML = waterLevelsData
        .slice(-20) // Show last 20
        .map(wl => {
            const time = new Date(wl.timestamp).toLocaleString();
            return `
                <tr>
                    <td>${wl.station}</td>
                    <td>${wl.country || wl.state || 'Unknown'}</td>
                    <td>${(wl.latitude || 0).toFixed(2)}</td>
                    <td>${(wl.longitude || 0).toFixed(2)}</td>
                    <td>${(wl.level || 0).toFixed(2)} m</td>
                    <td>${wl.source}</td>
                    <td>${time}</td>
                </tr>
            `;
        })
        .join('');
}

function getSeverity(magnitude) {
    if (magnitude >= 7.0) {
        return { label: 'MAJOR', class: 'high' };
    } else if (magnitude >= 5.5) {
        return { label: 'MODERATE', class: 'high' };
    } else if (magnitude >= 4.0) {
        return { label: 'LIGHT', class: 'medium' };
    } else {
        return { label: 'MINOR', class: 'low' };
    }
}

function updateConnectionStatus(connected) {
    const indicator = document.querySelector('.status-indicator');
    const statusText = document.getElementById('serverStatusText');

    if (connected) {
        indicator.classList.add('connected');
        statusText.textContent = 'Connected';
    } else {
        indicator.classList.remove('connected');
        statusText.textContent = 'Disconnected';
    }
}

// ==================== EVENT LISTENERS ====================
function attachEventListeners() {
    document.getElementById('clearAlertsBtn').addEventListener('click', clearAlerts);
    document.getElementById('exportDataBtn').addEventListener('click', exportData);
    document.getElementById('refreshBtn').addEventListener('click', refreshData);
}

async function clearAlerts() {
    if (confirm('Are you sure you want to clear earthquake history?')) {
        try {
            const response = await fetch(`${CONFIG.apiUrl}/earthquakes`, {
                method: 'DELETE'
            });

            if (response.ok) {
                showNotification('Earthquakes cleared successfully', 'success');
            } else {
                showNotification('Failed to clear earthquakes', 'error');
            }
        } catch (error) {
            console.error('Error clearing earthquakes:', error);
            showNotification('Error clearing earthquakes', 'error');
        }
    }
}

async function exportData() {
    try {
        const dataToExport = {
            timestamp: new Date().toISOString(),
            totalEarthquakes: earthquakesData.length,
            earthquakes: earthquakesData,
            waterLevels: waterLevelsData
        };

        const dataStr = JSON.stringify(dataToExport, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `earthquake-data-${Date.now()}.json`;
        link.click();

        showNotification('Data exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showNotification('Error exporting data', 'error');
    }
}

async function refreshData() {
    try {
        const response = await fetch(`${CONFIG.apiUrl}/stats`);
        const stats = await response.json();
        updateStats(stats);
        showNotification('Data refreshed', 'success');
    } catch (error) {
        console.error('Error refreshing data:', error);
        showNotification('Error refreshing data', 'error');
    }
}

// ==================== NOTIFICATIONS ==================== 
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Optional: Implement visual notification toast here
    // For now, just log to console
}

// ==================== SOUND ALERT ====================
function playAlertSound() {
    // Create a simple beep using Web Audio API
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Web Audio API not available:', error);
    }
}

// ==================== PERIODIC UPDATES ====================
setInterval(() => {
    if (isConnected) {
        // Periodic status check
        fetch(`${CONFIG.apiUrl}/health`)
            .catch(error => console.error('Health check failed:', error));
    }
}, CONFIG.updateInterval * 5);

console.log('Earthquake Alert System Dashboard v1.0 loaded');
