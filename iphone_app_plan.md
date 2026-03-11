# iPhone Missile Alert App - Project Plan

## 1. Core Concept & Minimum Viable Product (MVP)
The goal is to provide immediate, reliable, and targeted alerts to users based on their location or manually selected locations using the Oref (Home Front Command) API.

**Core Features:**
- **Real-time Alerts:** Push notifications triggered the moment the Oref API broadcasts a siren.
- **Location Selection:** Users can select specific cities/polygons to monitor, or use GPS to track their physical location.
- **Alert History/Feed:** A scrollable list of recent alerts across the country.
- **Critical Alerts:** Using the official Home Front Command siren sound (or custom sounds) that bypass silent mode for critical alerts (requires special Apple entitlements).
- **Live Map View:** A dynamic map displaying current threats and active alert polygons in real-time across Israel.


## 2. Technology Stack Options
- **Frontend (iOS App):** **React Native** (with Expo). Allows us to reuse React knowledge and easily handle iOS push notifications.
- **Backend Service:** A lightweight Node.js/TypeScript server (e.g., Express or NestJS) to intermediate between the phone and Oref.
- **Push Notification Service:** **Firebase Cloud Messaging (FCM)** or **Expo Push Notification Service** - wait until app is ready to decide on this.

## 3. High-Level Architecture
1. **The Poller (Backend):** Constantly polls the official Oref API (e.g., sending HTTP requests every 1-2 seconds, or using long-polling/WebSockets if the API supports it) to fetch the latest active alerts.
2. **The Processor (Backend):** Matches the alert areas to the users subscribed to those areas.
3. **The Broadcaster (Backend):** Sends a push notification payload to APNs or Firebase.
4. **The Client (iPhone App):** Receives the push notification, wakes up, plays the siren sound, and displays the alert screen.

## 4. Development Phases

**Phase 1: Backend & API Proof of Concept**
- Write a Node.js script to read real-time/mocked data from the Oref API.
- Set up a push notification service to send a test notification to a physical device.

**Phase 2: The iOS App Foundation**
- Initialize a React Native (Expo) project.
- Build the core UI: Home screen (status), area selection screen, and alert history log.
- Implement Apple permissions for Location Services and Push Notifications.

**Phase 3: Integration & Critical Push Notifications**
- Connect the app to the backend to register device tokens.
- Configure "Critical Alerts" entitlement through the Apple Developer portal to bypass the hardware silent switch.

**Phase 4: Design & Polish**
- Implement dynamic design (dark mode, pulsing red UI elements, glassmorphism).
- Add background location tracking so alerts follow the user as they travel.

---
*Note: We can edit this document together to refine the plan!*
