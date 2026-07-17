# 🚀 NebulaChat – Real-Time Collaboration Platform

<div align="center">

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-black?logo=socket.io)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![WebRTC](https://img.shields.io/badge/WebRTC-Video%20Calls-orange)

### A modern full-stack collaboration platform inspired by Discord, Slack, Microsoft Teams, and Notion.

**Built with React, TypeScript, Node.js, Express, Socket.IO, MongoDB, Prisma, and WebRTC.**

🌐 **Live Demo:** https://chat-application-blond-phi.vercel.app/

⚙️ **Backend API:** https://chat-application-ju4r.onrender.com/

</div>

---

# 📌 Overview

NebulaChat is a full-stack SaaS collaboration platform developed as a portfolio project to demonstrate modern web development skills.

The application focuses on real-time communication, secure messaging, video conferencing, AI-powered productivity, and analytics while following scalable architecture and clean UI design principles.

It combines features commonly found in modern collaboration tools into a single application with a responsive, premium glassmorphism interface.

---

# ✨ Features

## 💬 Real-Time Messaging

* One-to-one Direct Messages
* Group Chats
* Real-time typing indicators
* Online/offline presence
* Instant message delivery using Socket.IO

---

## 🔒 End-to-End Encryption

Messages are encrypted inside the browser before transmission.

**Security Implementation**

* Web Crypto API
* ECDH P-256 Key Exchange
* AES-GCM Encryption
* Unique IV for every message
* Backend stores only encrypted ciphertext

---

## 🎥 Video & Voice Calling

Powered by WebRTC.

Features include:

* Video Calling
* Voice Calling
* Camera Toggle
* Microphone Toggle
* Picture-in-Picture
* Call History
* Hand Raise
* Background Blur Effect

---

## 🤖 AI Assistant

Integrated AI tools for improving productivity.

Supports:

* Conversation Summaries
* Smart Reply Suggestions
* Grammar Correction
* Message Rewriting
* Translation
* Task Extraction
* Intelligent Search

Development mode includes a mock AI engine that works without API keys.

---

## 📊 Analytics Dashboard

Interactive dashboards built using Recharts.

### User Analytics

* Messages Sent
* Groups Joined
* Friends Added
* Weekly Activity
* Call Duration

### Admin Analytics

* Daily Active Users
* Registration Growth
* Browser Usage
* Geographic Distribution
* Storage Statistics

---

## 📅 Meeting Scheduler

* Monthly Calendar
* Meeting Creation
* Event Invitations
* WebSocket Notifications
* One-click Meeting Join Links

---

## 🎨 Modern UI

* Glassmorphism Design
* Responsive Layout
* Framer Motion Animations
* Multiple Color Themes
* Dark Interface
* Loading Skeletons

Available Themes

* Indigo
* Emerald Forest
* Rose Gold
* Ocean Drift

---

# 🛠 Tech Stack

## Frontend

* React 18
* TypeScript
* Vite
* Framer Motion
* Recharts
* Web Crypto API
* WebRTC
* Socket.IO Client

## Backend

* Node.js
* Express.js
* TypeScript
* Socket.IO
* Prisma ORM
* MongoDB Atlas
* JWT Authentication

## Deployment

* Vercel
* Render

---

# 📂 Project Structure

```text
chat-application/
│
├── frontend/
│   ├── components/
│   ├── services/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
│
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── prisma/
│   ├── socket.ts
│   └── server.ts
│
└── package.json
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/Sparsh88/chat-application.git

cd chat-application
```

---

## Install Dependencies

```bash
npm run install:all
```

---

## Configure Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_secret_key
OPENAI_API_KEY=optional
GEMINI_API_KEY=optional
```

---

## Generate Prisma Client

```bash
cd backend

npm run prisma:generate

npm run prisma:db
```

---

## Start Development Server

```bash
npm run dev
```

Frontend

```
http://localhost:3000
```

Backend

```
http://localhost:5000
```

---

# 🧪 Demo Credentials

| User  | Email                                             | Password |
| ----- | ------------------------------------------------- | -------- |
| Admin | [admin@nebulachat.io](mailto:admin@nebulachat.io) | user123  |
| Alex  | [alex@company.com](mailto:alex@company.com)       | user123  |
| Sarah | [sarah@design.com](mailto:sarah@design.com)       | user123  |

---

# 📸 Key Demonstrations

### 🔒 Secure Messaging

* Login with Alex and Sarah in separate browsers
* Send encrypted messages
* Observe secure communication using browser-based encryption

### 🎥 Video Calls

* Start a WebRTC call
* Accept from another account
* Experience real-time audio and video

### 🤖 AI Assistant

* Generate conversation summaries
* Rewrite messages
* Translate content
* Extract tasks automatically

### 📊 Analytics

* View interactive dashboards
* Monitor activity trends
* Explore user statistics

---

# 🎯 Learning Outcomes

This project helped strengthen my understanding of:

* Full-Stack Development
* TypeScript
* React Architecture
* REST APIs
* Authentication
* Socket.IO
* WebRTC
* End-to-End Encryption
* MongoDB
* Prisma ORM
* Real-Time Systems
* Responsive UI Design
* Deployment with Vercel & Render

---

# 🔮 Future Improvements

* Screen Sharing
* File Sharing
* Push Notifications
* Mobile App
* Voice Notes
* Multi-language Support
* AI Meeting Notes
* Team Workspaces
* Message Reactions
* Threaded Conversations

---

# 👨‍💻 Author

**Sparsh Chauhan**

GitHub: https://github.com/Sparsh88

LinkedIn: https://linkedin.com/in/sparshchauhan08

---

# ⭐ Support

If you found this project useful, consider giving it a **⭐ Star** on GitHub.

Feedback, suggestions, and contributions are always welcome!
