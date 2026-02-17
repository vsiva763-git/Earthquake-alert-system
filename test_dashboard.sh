#!/bin/bash

# Test script to generate sample earthquake predictions
# This sends test data to the FastAPI backend

API_URL="http://localhost:8000"

echo "🧪 Testing Earthquake Alert System"
echo "=================================="
echo ""

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
curl -s "${API_URL}/health" | jq '.'
echo ""

# Test 2: LOW alert (magnitude < 4.0)
echo "2️⃣  Generating LOW alert (Delhi)..."
curl -s -X POST "${API_URL}/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090,
    "depth_km": 10,
    "time": "2026-02-17T14:30:00"
  }' | jq '.'
echo ""

# Test 3: MID alert (4.0 <= magnitude < 5.5)
echo "3️⃣  Generating MID alert (Mumbai)..."
curl -s -X POST "${API_URL}/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 19.0760,
    "longitude": 72.8777,
    "depth_km": 15,
    "time": "2026-02-17T15:00:00"
  }' | jq '.'
echo ""

# Test 4: HIGH alert (magnitude >= 5.5)
echo "4️⃣  Generating HIGH alert (Bhuj - Zone V)..."
curl -s -X POST "${API_URL}/predict" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 23.2420,
    "longitude": 69.6669,
    "depth_km": 20,
    "time": "2026-02-17T15:30:00"
  }' | jq '.'
echo ""

# Test 5: Check latest alerts
echo "5️⃣  Fetching latest alerts..."
curl -s "${API_URL}/latest-alerts" | jq '. | length' | xargs echo "Total alerts:"
echo ""

echo "✅ Test complete! Check dashboard at port 5173"
