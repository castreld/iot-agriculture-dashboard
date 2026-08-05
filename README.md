# Smart Farming IoT Platform

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![NestJS](https://img.shields.io/badge/NestJS-10-red?style=flat-square&logo=nestjs)](https://nestjs.co)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](https://opensource.org/licenses/MIT)

An end-to-end IoT telemetry dashboard for smart agriculture, enabling multiple Arduino and ESP32 nodes to transmit real-time sensor measurements to a central dashboard.

![Dashboard Screenshot](./docs/dashboard.png)

## Features

* 📊 **Real-Time Charting** - Live continuous telemetry tracking using Recharts.
* 🔌 **Device Multiplexing** - Dynamically parse and display records from multiple sensor nodes concurrently.
* 🛡️ **Secret Admin Mode** - Hidden Easter egg interface to add, monitor, or remove device streams on the fly.
* 🌐 **Bilingual Support** - Switch between English and Indonesian interface localizations.
* 🐍 **Python Serial Gateway** - Plug-and-play Python bridge forwarding local hardware serial data to the cloud.

## Tech Stack

* **Frontend**: Next.js (App Router, React context state, Recharts)
* **Backend**: NestJS (REST API controller, WebSocket Gateway with Socket.io)
* **Styling**: Tailwind CSS
* **Hardware Integration**: Python (Serial-to-HTTP gateway), C++ (Arduino/ESP32)

## Folder Structure

```
smart-farming-iot-platform/
├── backend/                  # NestJS backend application
│   ├── src/                  # Source files (controllers, modules, guards, gateways)
│   └── package.json
├── frontend/                 # Next.js App Router frontend application
│   ├── src/                  # Source files (app routing, components, contexts, translations)
│   └── package.json
└── README.md                 # Project documentation
```

## Getting Started

### Installation & Setup

#### 1. Clone the repository
```bash
git clone https://github.com/username/smart-farming-iot-platform.git
cd smart-farming-iot-platform
```

#### 2. Run the NestJS Backend
```bash
cd backend
npm install
npm run start
```
The NestJS server will start on port 3001.

#### 3. Run the Next.js Frontend
```bash
cd ../frontend
npm install
npm run dev
```
Open http://localhost:3000 to view the dashboard.

#### 4. Forward Serial Data
Ensure your hardware is connected to a serial port, then run the Python gateway script:
```bash
python smart_farm_sender.py
```

## Hardware Setup

Your Arduino or ESP32 nodes must write measurements to the Serial port in a Key: Value format:

```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  int moisture = analogRead(A0);
  float temperature = 27.5;
  
  Serial.print("kelembaban:");
  Serial.println(moisture);
  
  Serial.print("suhu:");
  Serial.println(temperature);
  
  delay(2000);
}
```
