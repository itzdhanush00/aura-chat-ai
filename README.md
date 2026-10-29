# Aura Chat AI ⚡🤖

A modern, high-speed, full-stack AI chatbot application powered by **Google Gemini** (`@google/genai` SDK). Built with **React 19**, **TypeScript**, **Tailwind CSS**, and an **Express** streaming backend.

![Aura Chat AI](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/bot.svg)

---

## ✨ Features

- **⚡ Blazing Fast Streaming**: Real-time token-by-token response streaming over Server-Sent Events (SSE) with `X-Accel-Buffering: no` for zero proxy latency.
- **🚀 Dynamic Speed & Intelligence Modes**:
  - **⚡ Ultra Fast**: Powered by `gemini-3.1-flash-lite` for instantaneous ~1s replies.
  - **🚀 Balanced**: Powered by `gemini-3.8-flash` with low-latency reasoning (`ThinkingLevel.LOW`).
  - **🧠 Deep Reasoning**: `gemini-3.8-flash` with full chain-of-thought (`ThinkingLevel.HIGH`) for complex coding and math.
- **🔄 Auto Model Failover**: Automatic backup failover between models if Google API endpoints experience temporary high-demand spikes (503/429).
- **🎭 AI Personas**: Switch between specialized personas with dedicated system directives:
  - 🤖 **Aura Assistant**: Balanced and helpful
  - 💻 **Code Architect**: Senior developer for clean, idiomatic code and debugging
  - ✍️ **Creative Wordsmith**: Vivid storytelling, copywriting, and essays
  - 🔬 **Socratic Tutor**: Intuitive breakdowns and first-principles learning
  - ⚡ **Executive Brief**: Ultra-concise, dense bullet points
  - 🎨 **Custom Mode**: Write your own system instructions and tune temperature
- **🌐 Google Search Grounding**: Toggle live web grounding to search the internet with real-time sources and clickable citation links.
- **🖼️ Multimodal Support**: Drag-and-drop or paste images (PNG/JPEG) directly into chat for instant visual analysis.
- **🎙️ Voice Dictation & Text-to-Speech**:
  - Speech-to-Text mic input for hands-free prompting.
  - Gemini Text-to-Speech (`gemini-3.8-flash-lite-tts`) with multiple voice options (*Kore*, *Puck*, *Fenrir*, *Zephyr*, *Charon*).
- **📝 Rich Markdown & Code Blocks**: Code syntax highlighting with 1-click copy, tables, blockquotes, and lists.
- **💾 Session Management & Export**: Persistent local chat history, rename/delete sessions, and 1-click export to **Markdown (.md)** or **JSON (.json)**.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Marked
- **Backend**: Node.js, Express, tsx, esbuild
- **AI SDK**: `@google/genai` (Google Gen AI official TypeScript SDK)
- **Models**:
  - `gemini-3.1-flash-lite` (Ultra-fast chat)
  - `gemini-3.8-flash` (Balanced & Deep reasoning)
  - `gemini-3.8-flash-lite-tts` (Text-to-speech)

---

## 🚀 Quickstart Guide

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file in the project root:
```env
# Get your Gemini API key from https://aistudio.google.com/
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Build & Deployment

### Build for Production
```bash
npm run build
```
This builds both the Vite frontend into `dist/` and compiles `server.ts` into `dist/server.js`.

### Start Production Server
```bash
npm start
```

---

## ☁️ One-Click Deployment Options

### Option A: Render / Railway / Fly.io
1. Push this repository to GitHub.
2. In your deployment dashboard (e.g., [Render](https://render.com) or [Railway](https://railway.app)):
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Environment Variable**: `GEMINI_API_KEY` = your API key
   - **Node Version**: `>= 20.x`

### Option B: Google Cloud Run / Docker
Use the included Dockerfile:
```bash
docker build -t aura-chat .
docker run -p 3000:3000 -e GEMINI_API_KEY="your-key" aura-chat
```

---

## 📄 License
Apache-2.0
