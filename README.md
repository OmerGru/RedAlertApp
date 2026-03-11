# 🚨 Red Alert - Israel Missile Warning System
![React Native](https://img.shields.io/badge/react_native-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Expo](https://img.shields.io/badge/expo-1C1E24?style=for-the-badge&logo=expo&logoColor=#D04A37)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)

An open-source, real-time public safety application designed to provide immediate, reliable, and targeted missile alerts to users in Israel using the official Oref (Home Front Command) API.

## ✨ Features (WIP)
- 🔴 **Real-Time Polling:** Connects directly to the official active Oref API to pull threat updates every 2 seconds.
- 📱 **Cross-Platform UI:** Built on React Native with Expo, featuring a modern dark-mode aesthetic, active threat glassmorphism, and haptic engine feedback.
- 🗺️ **Live Map Tracking:** Includes a real-time OpenStreetMap integration that visually highlights active threat areas alongside a dynamic, auto-cycling list of targeted cities.
- 🔔 **Critical Notifications (Planned):** Will support Apple's "Critical Alerts" entitlement to break through device silent modes during emergencies.
- 📍 **GPS Tracking (Planned):** Automatic user-location tracking to trigger alerts locally without manual setup.

---

## 🏗️ Architecture Stack

### 1. `backend-poc` Server
A lightweight Node.js/TypeScript Express server. It circumvents cross-origin browser restrictions by directly fetching the raw binary data from the Israeli Home Front Command Oref API, decoding the incoming threat data, and broadcasting a clean JSON endpoint (`/api/alerts`) across the local network. 

### 2. `ios-app` Frontend
A React Native client that constantly polls the backend server. It features a heavily responsive grid layout, a custom multi-layer haptic vibration system built on `expo-haptics`, and a complex platform-agnostic split layout for web/native map rendering via `react-native-webview`.

---

## 🚀 Local Development Setup

### Running the Backend Poller
1. Navigate to the backend directory:
   ```bash
   cd backend-poc
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```

*The server will begin tracking Israeli Home Front Command alerts on `http://localhost:3000`.*

### Running the iOS/Web App
1. Navigate to the frontend directory:
   ```bash
   cd ios-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update the backend URL in `HomeScreen.tsx` and `MapScreen.tsx` to match your local IP address instead of localhost, so your physical device can connect.
4. Start the Expo builder:
   ```bash
   npm start -- -c --web
   ```

Scan the QR code with your iPhone's camera or use the web preview to view the application in action!

---
*Created as part of an experimental public safety engineering project.*
