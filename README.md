# 🛫 SkyPort AI: Enterprise Crisis Management & Travel Intelligence

**SkyPort AI** is a futuristic, high-stakes dashboard designed for airline operations and traveler assistance. It combines real-time global airspace tracking, local amenity intelligence via the Yelp AI Engine, and a neural-linked chat interface to manage travel logistics and crisis recovery in a unified, "Control Tower" environment.

![License](https://img.shields.io/badge/license-Enterprise-blue)
![Tech Stack](https://img.shields.io/badge/Stack-React%20|%20TypeScript%20|%20Vite-green)
![Status](https://img.shields.io/badge/System-Operational-emerald)

---

## 🛰️ Core Features

### 1. Tactical Airspace Feed (CyberMap)
*   **Live Traffic**: Real-time visualization of global flights using the OpenSky Network API.
*   **Sector Navigation**: Rapid-deployment sector switching across 50+ major US Hubs.
*   **Flight HUD**: Detailed telemetry (altitude, velocity, true track) available on marker selection.
*   **Trajectory Prediction**: Visual flight paths and position history tracking.

### 2. Neural Chat Interface (SkyPort_Neural)
*   **AI Intelligence**: Context-aware chat powered by Yelp AI for travel queries.
*   **Proactive Recommendations**: Automatically triggers amenity scans (Hotels, Lounges, Dining) based on conversation intent.
*   **Link Stability**: Simulated low-latency neural connection with visual heartbeat and system protocols.

### 3. Hyper-Local Intelligence
*   **Amenity Nodes**: Dynamic discovery of nearby venues based on the map's current grid coordinates.
*   **Crisis Recovery**: Categorization of venues (VIP, Family, Economy) to facilitate passenger relocation.
*   **Weather Telemetry**: Real-time environmental data (KORD/Chicago baseline) fetched from the National Weather Service.

---

## 🛠️ Technical Architecture

### Tech Stack
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescript.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Mapping**: [Leaflet.js](https://leafletjs.com/) with CartoDB Dark Matter tiles.
- **Icons**: [Lucide React](https://lucide.dev/)

### System Services
- **`aiService.ts`**: Orchestrates communication between the chat UI and backend AI actions.
- **`openSky.ts`**: Handles live flight telemetry and fallback simulation logic.
- **`weatherService.ts`**: Direct integration with NWS API for METAR-style data.
- **`yelp.ts`**: Server-side actions for interacting with the Yelp AI Chat and Search endpoints.

---

## 🎨 Visual Philosophy: "Enterprise Cyberpunk"
SkyPort AI adheres to a specific aesthetic designed for high-focus environments:
- **Dark Mode Primacy**: Slate-950/Black backgrounds to reduce eye strain during long shifts.
- **CRT Aesthetics**: Integrated scanlines, screen flickers, and vignetting for an immersive "terminal" vibe.
- **Tactical Grid**: 50px background grid and HUD corner brackets for spatial awareness.
- **Monospace Typography**: JetBrains Mono for all data values and system logs to ensure readability.

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/skyport-ai.git
cd skyport-ai
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
YELP_API_KEY=your_yelp_api_key_here
```
*Note: If no API key is provided, the system will automatically default to High-Fidelity Simulation Mode.*

### 4. Launch Development Server
```bash
npm run dev
```

### 5. Production Build
```bash
npm run build
```

---

## 📡 API Integrations
| Source | Purpose | Frequency |
| :--- | :--- | :--- |
| **OpenSky Network** | Live Airspace Tracking | Every 8-10 seconds |
| **Yelp AI v2** | Conversational Intelligence | On-demand |
| **National Weather Service** | Local Environmental Data | Initial load |
| **CartoDB** | Tactical Map Tiles | Tile-based |

---

## ⌨️ Tactical Controls
- **[F]**: Toggle Fullscreen Map Mode.
- **[ESC]**: Exit Fullscreen or Clear search.
- **[HOME]**: Recenter map on Primary Hub (ORD).
- **[MODE]**: Switch between ALL, AIR (In-flight), and GND (On-ground) traffic.

---

## 🛡️ Enterprise Security
SkyPort AI utilizes **Server Actions** to protect sensitive API credentials. Communication between the frontend and the Yelp API is proxied through secure server-side routes, ensuring no API keys are exposed to the client-side bundle.

---
**Developed for SkyPort Global Operations.** 
*Proprietary Intelligence System. Unauthorized access is logged.*