# 🛫 SkyPort AI | Enterprise Crisis Management System

**SkyPort AI** is a mission-critical, "Enterprise-Grade" recovery dashboard designed for global airline operations. It automates the complex logistics of managing stranded passengers and flight crews during large-scale travel disruptions.

![Tech Stack](https://img.shields.io/badge/Stack-React_19_|_TypeScript_|_Tailwind_|_Vite-blue)
![AI](https://img.shields.io/badge/Intelligence-Gemini_3_Flash_|_Yelp_AI-orange)
![Status](https://img.shields.io/badge/Network-Secure-green)

---

## 🛰️ System Architecture

### 1. Swarm Recovery Engine
Located in `app/actions/swarm.ts`, the system deploys autonomous "Recovery Agents" for different passenger segments:
*   **VIP/Executive**: Prioritizes high-end, quiet venues for business continuity.
*   **Family**: Identifies large-capacity, kid-friendly environments.
*   **Economy/Crew**: Sources budget-friendly, high-availability lodging and dining.
*   **Automated Workflow**: Stranded -> Analyzing -> Booked (with real-time system logs).

### 2. Tactical Airspace Feed
A high-performance `CyberMap` powered by **Leaflet** and **OpenSky Network**:
*   **Live Tracking**: Real-time vector-based flight paths for over 50+ active aircraft.
*   **Sector Navigation**: 40+ pre-configured US Airport hubs with tactical overlays.
*   **Amenity Nodes**: Dynamic discovery of hotels, lounges, and dining using **Yelp Fusion**.

### 3. Neural Chat Intelligence
*   **Core**: Powered by `gemini-3-flash-preview`.
*   **Contextual Awareness**: The assistant tracks map coordinates and flight status to provide hyper-local advice.
*   **Tools**: Automatically triggers amenity scans based on conversational intent (e.g., "Where can my crew sleep near JFK?").

---

## 🚀 Deployment & Environment

The system requires two primary secure keys to reach full operational capacity:

1.  **`API_KEY`**: Google Gemini API Key (Required for the Neural Chat Interface).
2.  **`YELP_API_KEY`**: Yelp Fusion API Key (Required for live local amenity discovery and Swarm Agent rebooking).

### Local Setup
Create a `.env` file in the root directory:
```bash
API_KEY=your_gemini_key_here
YELP_API_KEY=your_yelp_key_here
```

---

## 🛠️ Operational Controls
*   **[F]**: Toggle Tactical Fullscreen Mode.
*   **[HOME]**: Recenter on Primary Hub (Chicago O'Hare / ORD).
*   **[ESC]**: Emergency exit from fullscreen or command-line clear.
*   **Deploy All**: Triggers a global recovery swarm for all currently stranded passengers.
*   **Aggressiveness**: Adjust the AI's search depth vs. speed for venue matching.

---

## 📊 Telemetry Data Sources
*   **Aviation**: OpenSky Network API (with deterministic fallback).
*   **Environmental**: National Weather Service (NWS) API for KORD telemetry.
*   **Intelligence**: Google GenAI SDK & Yelp Fusion AI.

**Proprietary Software of SkyPort Global Operations. Unauthorized access is logged.**