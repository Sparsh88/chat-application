# 💬 Let's Connect - Real-Time Chat & Collaboration Platform

A modern, full-stack real-time chat application built with **React**, **TypeScript**, **Socket.IO**, and **Express**. Features include real-time messaging, video/voice calls, AI assistant, meeting scheduler, analytics dashboard, and beautiful theme customization.

## ✨ Features

- 💬 **Real-Time Messaging** — Instant messaging with Socket.IO, reactions, pinned messages
- 📹 **Video & Voice Calls** — WebRTC-powered HD video/voice calls with screen sharing
- 🤖 **AI Assistant** — Powered by Google Gemini for chat summaries & action items
- 📅 **Meeting Scheduler** — Schedule team meetings with calendar view & .ics export
- 📊 **Analytics Dashboard** — Real-time performance metrics and charts
- 🎨 **Theme Engine** — 6 beautiful theme presets (Dark, Light, OLED, Cyberpunk, Emerald, Sunset)
- 👥 **Friends & Social** — Friend requests, online status, custom statuses
- 🔐 **E2EE Ready** — End-to-end encryption architecture for secure messaging
- 📱 **Responsive Design** — Works beautifully on all screen sizes

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Node.js, Express, Socket.IO |
| **Real-Time** | WebSocket (Socket.IO) + WebRTC |
| **AI** | Google Gemini API |
| **Charts** | Recharts |
| **Icons** | Lucide React |

## 📁 Project Structure

```
lets-connect/
├── frontend/          # React + Vite frontend
│   ├── src/
│   │   ├── components/  # UI Components
│   │   ├── context/     # React Contexts (Auth, Chat, Socket, Theme, Call)
│   │   ├── services/    # AI Service
│   │   └── types/       # TypeScript types
│   └── package.json
├── backend/           # Express + Socket.IO backend
│   ├── src/
│   │   └── index.ts     # Server entry point
│   └── package.json
├── vercel.json        # Vercel deployment config (frontend)
├── render.yaml        # Render deployment config (backend)
└── README.md
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+ 
- npm

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/lets-connect.git
cd lets-connect

# 2. Install backend dependencies & start
cd backend
npm install
npm run dev

# 3. Install frontend dependencies & start (new terminal)
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000` and backend on `http://localhost:5000`.

## ☁️ Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variable:
   - `FRONTEND_URL` = your Vercel frontend URL (e.g. `https://lets-connect.vercel.app`)

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Import Project**
2. Connect your GitHub repo
3. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add environment variable:
   - `VITE_BACKEND_URL` = your Render backend URL (e.g. `https://lets-connect-backend.onrender.com`)

## 📝 Environment Variables

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port (auto-set by Render) | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://lets-connect.vercel.app` |

### Frontend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `https://lets-connect-backend.onrender.com` |

## 📄 License

MIT License - feel free to use this project for learning and development!
