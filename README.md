# Let's Connect — Real-Time Chat & Collaboration Platform

A modern, full-stack real-time communication platform built with React, TypeScript, Node.js, Socket.IO, and WebRTC for low-latency messaging, peer-to-peer audio/video calling, and AI-powered productivity.

---

## 🌐 Live Demo & Links

- **Live Demo**: [chat-application-gamma-steel.vercel.app](https://chat-application-gamma-steel.vercel.app/)
- **Backend API**: [chat-application-e7yi.onrender.com](https://chat-application-e7yi.onrender.com)
- **GitHub Repository**: [github.com/Sparsh88/chat-application](https://github.com/Sparsh88/chat-application)

---

## 📖 Overview

**Let's Connect** is a full-stack real-time collaboration application engineered to combine instant messaging, browser-native audio/video conferencing, and AI workflow assistance into a single unified workspace.

The application solves key real-time engineering challenges, including bi-directional WebSocket state synchronization, WebRTC peer connection signaling for low-latency media streams, and database connection resilience with automatic fallback handling.

Built using React, TypeScript, Node.js, Express, Socket.IO, and MongoDB, the platform delivers a fast, responsive experience with modern team collaboration features such as public channels, direct messaging, meeting scheduling, and an AI copilot powered by Google Gemini.

---

## 🎯 Problem Statement

Traditional collaboration setups often require users to switch between disconnected tools for text chat, video meetings, and scheduling.

Let's Connect addresses this with:
- **Fragmented Tools**: Consolidates real-time messaging, WebRTC calling, calendar scheduling, and AI assistance into a single interface.
- **High Latency & Overhead**: Replaces HTTP polling with full-duplex WebSocket connections for instantaneous sub-100ms message delivery.
- **Heavy Media Server Loads**: Uses peer-to-peer WebRTC connections for voice and video streams, minimizing backend bandwidth consumption.
- **Backend Cold Starts & Outages**: Features resilient MongoDB connection pooling with seamless in-memory fallback to avoid application downtime.

---

## ✨ Key Features

### 💬 Real-Time Messaging & Channels
- **Full-Duplex Chat**: Instant message delivery across public channels (`#general`, `#engineering`, `#design`, `#announcements`) and private 1-on-1 direct messages using Socket.IO.
- **Interactive Chat UX**: Live typing indicators, message pinning, emoji reactions with user counters, and timestamp formatting.

### 📹 WebRTC Voice & Video Calling
- **Peer-to-Peer Calls**: 1-on-1 HD voice and video conferencing built on browser-native `RTCPeerConnection` with Socket.IO signaling.
- **In-Call Controls**: Screen sharing via `getDisplayMedia`, audio/video mute toggles, audio visualizer, and local call recording (`MediaRecorder`).

### 🤖 AI Productivity Assistant (Google Gemini)
- **Message Tone Rewriter**: Rewrite drafts in professional, friendly, formal, concise, or enthusiastic tones.
- **Smart Replies & Summaries**: Auto-generate context-aware quick responses and one-click bulleted executive summaries of chat history.
- **Action Item Extraction**: Parse task assignments and action items directly from ongoing conversation threads.

### 📅 Meeting Scheduler & Calendar
- **Event Management**: Create and schedule meetings with titles, descriptions, host details, and attendee lists.
- **Calendar Integration**: Visual monthly calendar view and one-click `.ics` calendar export for external schedule sync.

### 📊 Real-Time Analytics Dashboard
- **Usage Metrics**: Interactive visualizations using Recharts displaying daily message volume, call counts, weekly activity breakdowns, and platform device usage.

### 🔐 Security & Client-Side Encryption
- **Authentication**: User registration and login with bcrypt password hashing and session management.
- **E2EE Utility**: Client-side encryption/decryption module utilizing Web Crypto API (`ECDH` / `AES-GCM-256`).

### 🎨 Theme Customization
- **6 Theme Presets**: Seamless switching between Dark, Light, Midnight OLED, Cyberpunk, Emerald, and Sunset palettes.

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite | Component-based client interface with strict type safety |
| **Styling & UI** | Tailwind CSS, Lucide React, Recharts | Responsive layout, modern iconography, and data visualizations |
| **Backend** | Node.js, Express.js, TypeScript | RESTful API endpoints and WebSocket server |
| **Real-Time Engine** | Socket.IO (WebSockets) | Full-duplex messaging, presence events, and WebRTC signaling |
| **Media Streaming** | WebRTC (`RTCPeerConnection`) | Direct peer-to-peer audio, video, and screen sharing |
| **Database** | MongoDB Atlas, Mongoose | Data modeling and persistent storage for users, messages, and meetings |
| **AI Integration** | Google Gemini API (`@google/generative-ai`) | Message rewriting, thread summarization, and smart replies |
| **Security** | Bcrypt.js, Helmet, CORS, Web Crypto API | Password hashing, HTTP security headers, and client-side encryption |
| **Deployment** | Vercel, Render | Frontend hosting (Vercel) and backend web service hosting (Render) |

---

## 🏗️ Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                  Client Browser (React + TS)                │
│    Context State (Auth, Socket, Call, Theme) + WebRTC UI    │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
   HTTP REST    │                             │ WebRTC P2P Media Stream
   & Socket.IO  ▼                             ▼ (Direct Audio / Video)
┌───────────────────────────┐      ┌──────────────────────────┐
│     Node.js / Express     │      │    Remote Peer Client    │
│  (REST API & Signaling)   │      │      (Peer Browser)      │
└───────────────┬───────────┘      └──────────────────────────┘
                │
                ▼
┌───────────────────────────┐
│       MongoDB Atlas       │
│  (Mongoose Models / Cache)│
└───────────────────────────┘
```

---

## 🔄 Application Flow

1. **Authentication & Session**: The user logs in or registers; the backend validates credentials with bcrypt and returns the user profile.
2. **WebSocket Handshake**: The frontend connects via Socket.IO, registers the active user session (`user_login`), and subscribes to room channels.
3. **Real-Time Messaging**: Dispatched messages are broadcast instantaneously to room participants over WebSockets and persisted to MongoDB.
4. **WebRTC Signaling**: When a call is initiated, Socket.IO relays the SDP offer, SDP answer, and ICE candidates between peers.
5. **Direct Media Exchange**: Once signaling completes, audio and video streams flow directly peer-to-peer between browsers without server media relay.
6. **AI Assistant Processing**: On-demand user requests (summarize chat, rewrite text, extract tasks) query the Google Gemini 1.5 Flash model.
7. **Schedule & Metrics Sync**: Meeting entries and analytics metrics are synchronized through REST API endpoints and live socket notifications.

---

## 📁 Project Structure

```text
chat-application/
├── frontend/                     # React + TypeScript Client
│   ├── src/
│   │   ├── components/           # UI modules (chat, call, ai, meeting, analytics, auth)
│   │   ├── context/              # State management (Auth, Socket, Call, Theme, Chat)
│   │   ├── services/             # API, WebRTC, Gemini AI, and E2EE services
│   │   ├── types/                # TypeScript interfaces and data models
│   │   ├── App.tsx               # Main application component
│   │   └── main.tsx              # Application entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Node.js + Express Backend
│   ├── src/
│   │   ├── models/               # Mongoose Schemas (User, Message, Meeting)
│   │   ├── db.ts                 # Resilient MongoDB connection pooling
│   │   └── index.ts              # REST API routes & Socket.IO signaling server
│   ├── package.json
│   └── tsconfig.json
│
├── api/                          # Serverless entry point (Vercel)
│   └── index.ts
├── vercel.json                   # Frontend deployment configuration
├── render.yaml                   # Backend deployment configuration
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas URI or local MongoDB instance (Optional — in-memory fallback enabled)

### 1. Clone the Repository
```bash
git clone https://github.com/Sparsh88/chat-application.git
cd chat-application
```

### 2. Backend Setup
```bash
cd backend
npm install

# Configure environment variables (.env)
PORT=5000
FRONTEND_URL=http://localhost:3000
MONGODB_URI=your_mongodb_connection_string

# Start backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Configure environment variables (.env)
VITE_BACKEND_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your_gemini_api_key

# Start frontend development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

---

## 🔌 API & WebSocket Endpoints

### REST API
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check, DB connection status, and active socket count |
| `POST` | `/api/auth/register` | Create a new user account with hashed password |
| `POST` | `/api/auth/login` | Authenticate user and initiate session |
| `GET` | `/api/users` | Retrieve list of registered users |
| `GET` | `/api/messages/:targetId` | Fetch message history by channel ID or user ID |
| `POST` | `/api/messages` | Store and dispatch a new chat message |
| `GET` | `/api/meetings` | Retrieve scheduled team meetings |
| `POST` | `/api/meetings` | Create and broadcast a new scheduled meeting |
| `GET` | `/api/analytics` | Fetch user engagement and platform metrics |

### Key Socket.IO Events
| Event Name | Direction | Description |
| :--- | :--- | :--- |
| `user_login` | Client → Server | Registers user session and broadcasts online status |
| `send_message` | Client → Server | Sends message to room or recipient and persists to DB |
| `receive_message` | Server → Client | Delivers incoming message to target client |
| `typing_start` / `typing_stop` | Client → Server | Broadcasts live typing indicators to room members |
| `call_initiate` / `call_answer` | Client ↔ Server | Relays WebRTC SDP Offer and Answer between peers |
| `ice_candidate` | Bidirectional | Exchanges ICE candidates for P2P NAT traversal |

---

## 👨‍💻 Author

**Sparsh Chauhan**
- **GitHub**: [github.com/Sparsh88](https://github.com/Sparsh88)
- **LinkedIn**: [linkedin.com/in/sparshchauhan08](https://linkedin.com/in/sparshchauhan08)
- **Live Project**: [chat-application-gamma-steel.vercel.app](https://chat-application-gamma-steel.vercel.app/)