# NebulaChat | Premium Real-Time SaaS Collaboration Platform

NebulaChat is a production-ready, feature-rich, and visually stunning SaaS collaboration platform that combines the capabilities of Discord, Slack, Microsoft Teams, and Notion. It is built using a modern TypeScript full-stack architecture featuring a custom-designed glassmorphism UI.

## 🚀 Key Highlights & Resume-Ready Features

1. **🔒 End-to-End Encryption (E2EE)**
   * Built on top of the browser's native **Web Crypto API**.
   * Employs **ECDH (Elliptic Curve Diffie-Hellman) P-256** key exchanges to derive a 256-bit symmetric shared key between two users locally.
   * Messages are encrypted and decrypted in the browser using **AES-GCM**. The backend server only sees encrypted ciphertext and random initialization vectors (IVs).
   * Visual encryption badge status and key exchange parameters viewer.

2. **🎥 WebRTC Video & Voice Conferences**
   * Real-time audio and video sessions built with `RTCPeerConnection` signalling.
   * Custom controls: Camera toggle, mute/unmute, picture-in-picture, call history logging, and hand-raising.
   * **Custom Blur Background Effect**: Fallback canvas filter layers that give users privacy during video meetings.

3. **🤖 Built-in AI Assistant**
   * Pre-wired backend proxies for OpenAI and Google Gemini APIs.
   * **Smart Mock Engine Fallback**: Runs out-of-the-box in development without requiring API keys. Handles context-aware translation, formal/friendly message rewrites, grammar correction, task checklists extraction, smart message search, and conversation summarizations.

4. **📊 Analytics Dashboard**
   * Interactive chart views powered by **Recharts** displaying activity statistics.
   * **User Dashboards**: Track sent messages, active groups, friends, and active call minutes with weekly frequency lines.
   * **Admin Console**: Monitored view for Daily Active Users (DAU), storage footprint sizes, geographic distribution pie charts, registration growth rate graphs, and browser device usages.

5. **📅 Calendar Scheduler**
   * Interactive monthly calendar grid showing plans, dates, and event times.
   * Inviting users to meetings automatically triggers WebSockets invitations.
   * Custom join-links that map directly to the WebRTC call channels.

6. **🎨 Premium Glassmorphic Design System**
   * Tailored entirely using **Vanilla CSS variables** for dynamic modifications.
   * Support for multiple accent themes: Indigo, Emerald Forest, Rose Gold, and Ocean Drift.
   * Smooth animations with `framer-motion` and custom UI skeletons.

---

## 🛠 Project Architecture & Structure

```text
chat-application/
├── backend/                  # express, tsx, socket.io, prisma, mongodb
│   ├── prisma/
│   │   └── schema.prisma     # database schemas for users, calls, meetings
│   ├── src/
│   │   ├── controllers/      # auth, analytics, meetings, AI controllers
│   │   ├── middleware/       # JWT validations, rate-limiters
│   │   ├── server.ts         # bootstraps REST server & database seeders
│   │   └── socket.ts         # socket.io presence & WebRTC signaler
│   ├── .env                  # local environment variables & connection string
│   └── package.json
│
├── frontend/                 # vite, react 18, typescript, framer-motion, recharts
│   ├── src/
│   │   ├── components/       # Sidebar, ChatArea, CallWindow, Calendar, Charts
│   │   ├── services/
│   │   │   └── CryptoService.ts # ECDH & AES-GCM encryption engines
│   │   ├── App.tsx           # Context providers and main views router
│   │   ├── index.css         # core design tokens & custom keyframes
│   │   └── main.tsx
│   ├── vercel.json           # Vercel proxy configuration rewrites
│   ├── vite.config.ts
│   └── package.json
│
└── package.json              # workspace manager scripts
```

---

## ⚙ Setup & Run Instructions

To compile, build, and run the project locally:

### 1. Prerequisite Installations
Ensure you have **Node.js** (v18+) and **npm** installed on your machine.

### 2. Workspace Setup
Install root, backend, and frontend packages simultaneously:
```bash
npm run install:all
```

### 3. Initialize the Database
Configure your database connection string in `backend/.env` (e.g. your MongoDB Atlas connection string), then run:
```bash
cd backend
npm run prisma:generate
npm run prisma:db
cd ..
```
*Note: This generates Prisma clients, syncs database collections (supporting MongoDB Atlas), and seeds it with demo users (`admin@nebulachat.io`, `alex@company.com`, and `sarah@design.com`).*

### 4. Boot Dev Server
Start both servers concurrently:
```bash
npm run dev
```
* The backend API server will run at `http://localhost:5000`
* The frontend single-page application will run at `http://localhost:3000`

---

## 🧪 Testing Scenarios (For Showcasing)

* **Real-time DM with E2EE**: Open two browser tabs (one on `localhost:3000` logged in as `AlexDev` using password `user123`, and the other as `SarahUX` with `user123`). Select Sarah from Alex's sidebar DMs. Notice the **E2EE Secured** green badge and send a message. Messages are encrypted locally on Alex's browser, routed through socket.io, and decrypted on Sarah's browser!
* **Dynamic Accent Selector**: Navigate to Settings and select **Rose Gold** or **Emerald** palette. The whole design theme dynamically transforms its neon gradients.
* **WebRTC Calling**: In the DMs list, click the **Camera 🎥** icon. The calling overlay will appear on the other user's screen in real time. Click accept to start video stream rendering.
* **AI Actions**: Click the **Summarize** button in the header of the general discussion channel to trigger the AI summary compiler.
