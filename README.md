# Let's Connect — Real-Time Chat & Collaboration Platform

A full-stack real-time communication platform built with React, TypeScript, Node.js, Socket.IO, and WebRTC for low-latency messaging, peer-to-peer audio/video conferencing, and AI-powered productivity.

---

## Live Demo & Links

- **Live Application:** [https://chat-application-gamma-steel.vercel.app/](https://chat-application-gamma-steel.vercel.app/)
- **Backend API:** [https://chat-application-e7yi.onrender.com](https://chat-application-e7yi.onrender.com)
- **GitHub Repository:** [https://github.com/Sparsh88/chat-application](https://github.com/Sparsh88/chat-application)

---

## Overview

Let's Connect is a full-stack real-time collaboration application designed to combine instant messaging, browser-native audio/video conferencing, and AI workflow assistance into a single unified workspace.

The application addresses key real-time engineering challenges, including bi-directional WebSocket state synchronization, WebRTC peer connection signaling for low-latency media streams, and database connection resilience with automatic fallback handling.

Built using React, TypeScript, Node.js, Express, Socket.IO, and MongoDB, the platform delivers a fast, responsive experience with modern team collaboration features such as public channels, direct messaging, meeting scheduling, and an AI copilot powered by Google Gemini.

---

## Problem Statement

- **Fragmented Communication Tools:** Teams frequently switch across separate platforms for text chat, video meetings, meeting scheduling, and AI drafting.
- **High Latency & Overhead:** Traditional HTTP polling creates unnecessary server overhead and unacceptable latency for real-time messaging.
- **Heavy Media Server Loads:** Centralized media relays create high bandwidth costs; browser-native peer-to-peer streaming is needed for efficient 1-on-1 calls.
- **Backend Cold Starts & Outages:** Applications without database connection resilience crash when cloud databases undergo maintenance or cold starts.

---

## Key Features

- **Full-Duplex Real-Time Messaging:** Instant message exchange across public channels (`#general`, `#engineering`, `#design`, `#announcements`) and private 1-on-1 direct messages using Socket.IO.
- **Interactive Chat UX:** Live typing indicators, message pinning, emoji reactions with user counters, and formatted timestamp history.
- **WebRTC Peer-to-Peer Audio/Video Calling:** 1-on-1 HD voice and video conferencing built on browser-native `RTCPeerConnection` with Socket.IO signaling.
- **In-Call Controls & Screen Sharing:** Screen sharing via `getDisplayMedia`, microphone/camera toggles, audio visualizer, and local recording via `MediaRecorder`.
- **AI Productivity Assistant (Google Gemini):** Message tone rewriting (professional, casual, concise), automatic chat thread summaries, and action item extraction.
- **Meeting Scheduler & Calendar Integration:** Create and schedule team meetings with attendee lists, calendar views, and one-click `.ics` file export.
- **Interactive Analytics Dashboard:** Visualizations powered by Recharts showing daily message volume, call statistics, and weekly team activity trends.
- **Client-Side Encryption Utility:** End-to-end encryption module utilizing Web Crypto API (`ECDH` / `AES-GCM-256`) for secure data handling.

---

## Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| Frontend Framework | React 18, TypeScript, Vite | Single-page client with typed component hierarchy and fast HMR |
| Real-Time Communication | Socket.IO Client, WebRTC | WebSocket messaging, typing indicators, and peer-to-peer media streams |
| Styling & UI | Tailwind CSS, Lucide React | Modern dark/light responsive interface and iconography |
| Data Visualization | Recharts | Interactive message and calling analytics charts |
| Backend Runtime | Node.js, Express.js | REST API server, authentication middleware, and business logic |
| WebSocket Server | Socket.IO | Bi-directional event routing and WebRTC signaling exchange |
| Database & ODM | MongoDB Atlas, Mongoose | NoSQL document persistence with schema modeling and in-memory fallback |
| AI Integration | Google Gemini API | Message rewriting, thread summarization, and smart replies |
| Deployment | Vercel (Frontend), Render (Backend) | Cloud hosting with automated deployment pipelines |

---

## Architecture

```text
Client Browser (React 18 + Socket.IO + WebRTC)
     │                                │
     │ HTTPS REST API                 │ WebSocket / Signaling
     ▼                                ▼
Express.js REST API            Socket.IO Server
  ├── Auth & User Routes         ├── Room & Channel Management
  ├── Gemini AI Assistant        ├── Real-Time Message Dispatch
  └── Meeting Scheduler          └── WebRTC Offer/Answer/ICE Relay
     │                                │
     └──────────────┬─────────────────┘
                    ▼
          MongoDB Database (Atlas)
          (with in-memory fallback)
```

---

## Application Flow

1. **User Authentication:** User logs in or registers; backend issues session credentials and loads channel history.
2. **WebSocket Connection:** Client establishes persistent Socket.IO connection and joins active channel rooms.
3. **Real-Time Chat:** Messages sent by a user are broadcast instantaneously to room participants with typing indicators and delivery statuses.
4. **WebRTC Call Initiation:** Caller sends call invitation over Socket.IO; callee accepts, initiating peer-to-peer ICE candidate and SDP exchange for direct audio/video streaming.
5. **AI Assistant Invocation:** User requests a message rewrite or thread summary; backend queries Gemini API and returns formatted output.
6. **Meeting Scheduling:** User creates a calendar event; backend persists meeting records and generates downloadable `.ics` files.

---

## Project Structure

```text
Chat-application/
├── backend/
│   ├── config/                # MongoDB connection and fallback memory store
│   ├── controllers/           # Auth, channel, message, meeting, and AI controllers
│   ├── middleware/            # JWT authentication and error handlers
│   ├── models/                # Mongoose models (User, Message, Channel, Meeting)
│   ├── routes/                # REST API routes
│   ├── sockets/               # Socket.IO handlers for chat, signaling, and presence
│   ├── server.js              # Express app and HTTP/WebSocket server initialization
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/        # ChatArea, VideoCall, Sidebar, Calendar, Analytics, AICopilot
│   │   ├── context/           # AuthContext, SocketContext, ThemeContext
│   │   ├── hooks/             # useWebRTC, useChat, useSocket custom hooks
│   │   ├── types/             # TypeScript type definitions
│   │   ├── App.tsx            # Main application layout
│   │   └── main.tsx           # React entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
└── README.md
```

---

## Installation & Setup

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **MongoDB**: MongoDB Atlas connection URI or local MongoDB instance

### 1. Clone the Repository

```bash
git clone https://github.com/Sparsh88/chat-application.git
cd chat-application
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key        # Optional: AI assistant features
CLIENT_URL=http://localhost:5173
```

Start backend:

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

Start frontend:

```bash
npm run dev
```

---

## Author

**Sparsh Chauhan**  
*Computer Science & Engineering Student | Full Stack Developer*

- **Portfolio:** [portfolio-flame-rho-29.vercel.app](https://portfolio-flame-rho-29.vercel.app/)
- **GitHub:** [@Sparsh88](https://github.com/Sparsh88)
- **LinkedIn:** [linkedin.com/in/sparshchauhan08](https://linkedin.com/in/sparshchauhan08)
- **Email:** [sparshchauhan050@gmail.com](mailto:sparshchauhan050@gmail.com)
