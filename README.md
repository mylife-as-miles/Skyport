# 🛫 SkyPort AI | Real-time Travel Assistant

**SkyPort AI** is a real-time, map-based travel assistant that tracks live flights worldwide and uses AI to answer user questions while recommending nearby places around active airports. It leverages **Leaflet.js** for mapping, **OpenSky** for flight tracking, and the **Yelp API** for venue recommendations.

![Tech Stack](https://img.shields.io/badge/Stack-React_18_|_TypeScript_|_Tailwind_|_Vite-blue)
![AI](https://img.shields.io/badge/Intelligence-Gemini_Flash_|_Yelp_AI-orange)
![Status](https://img.shields.io/badge/Network-Online-green)

---

## 🛰️ Features

### 1. Real-Time Flight Tracking
A high-performance map interface powered by **Leaflet** and **OpenSky Network**:
*   **Live Tracking**: Real-time vector-based flight paths for active aircraft.
*   **Global Coverage**: Tracks flights worldwide with interactive map controls.

### 2. Intelligent Travel Assistant
*   **Core**: Powered by Google's Gemini AI.
*   **Contextual Awareness**: The assistant understands map context and flight status to provide relevant advice.
*   **Chat Interface**: Ask questions about flights, airports, or travel advice.

### 3. Nearby Recommendations
*   **Amenity Discovery**: Dynamic discovery of hotels, lounges, and dining using **Yelp Fusion API**.
*   **Smart Suggestions**: Recommends nearby places based on active airports and user queries.

---

## 🚀 Deployment & Environment

The system requires two primary API keys:

1.  **`API_KEY`**: Google Gemini API Key (Required for the AI Chat Interface).
2.  **`YELP_API_KEY`**: Yelp Fusion API Key (Required for live local amenity discovery).

### Local Setup
Create a `.env` file in the root directory:
```bash
API_KEY=your_gemini_key_here
YELP_API_KEY=your_yelp_key_here
```

### Installation
```bash
npm install
npm run dev
```

---

## 🛠️ Operational Controls
*   **Map Navigation**: Drag and zoom to explore global airspace.
*   **Flight Search**: Track specific flights using the search bar.
*   **Chat**: Interact with the AI assistant for personalized help.

---

## 📊 Data Sources
*   **Aviation**: OpenSky Network API.
*   **Places**: Yelp Fusion API.
*   **Intelligence**: Google GenAI SDK.
