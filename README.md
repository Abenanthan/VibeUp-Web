<div align="center">

  # 🎵 VibeUp

  ### **Next-Generation, Electric Web Music Streaming Experience**

  [![Live Demo](https://img.shields.io/badge/Live%20Demo-VibeUp%20Web-a855f7?style=for-the-badge&logo=vercel&logoColor=white)](https://vibe-up-web.vercel.app/)
  [![React 19](https://img.shields.io/badge/React-19.2-ec4899?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

  <br />

  <p align="center">
    <b>VibeUp</b> is a state-of-the-art, high-performance web music player designed with vibrant electric aesthetics, glassmorphism UI, real-time lyric synchronization, and interactive visualization modes including a retro turntable with a draggable tonearm.
  </p>

</div>

---

## ✨ Features at a Glance

### 🎧 Interactive "Now Playing" Studio
- 🔄 **3 Dynamic Art Modes**:
  - **Vinyl Mode**: Spinning circular album artwork with vinyl grooves and neon orbit ring visualizer.
  - **Cover Mode**: 3D parallax cover art featuring real-time mouse lighting sheen and glare effects.
  - **Retro Turntable Mode**: Authentic vinyl player featuring a **draggable tonearm/needle**. Drop the needle to play; lift or drag it away to pause!
- 🎤 **Synced & Plain Lyrics**: Real-time auto-scrolling synced lyrics with click-to-seek functionality, alongside fallback plain lyric rendering.
- 🎚️ **Graphic Equalizer**: Built-in multi-band audio equalizer modal with custom audio presets.

### 🔍 Powerful Search & Discovery
- 🌐 **Direct API Search Engine**: Direct integration with multi-source fallback chains for geo-gating bypass.
- 🧹 **Smart Deduplication & Filter**: Automatically strips out low-quality covers, tribute tracks, lo-fi remixes, and karaoke versions.
- 📊 **Curated Collections**: Browse featured playlists, top charts, popular artists, and recently played tracks.

### 📱 Responsive Mobile Shell & UX
- 📱 **Mobile-First Touch Architecture**: Bottom tab navigation shell, compact mini-player, and optimized gestures for mobile viewports.
- 🔮 **Fluid Micro-Animations**: Built with `framer-motion` for physics-based layout transitions, spring physics, and particle bursts.
- 💾 **Local Library Management**: Save favorite tracks, manage local custom playlists, and preserve listening history locally.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Core Framework** | [React 19](https://react.dev/) |
| **Build Tooling** | [Vite 5](https://vitejs.dev/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Animation Engine** | [Framer Motion 12](https://www.framer.com/motion/) |
| **Iconography** | [Lucide React](https://lucide.dev/) |
| **Linter** | [Oxlint](https://github.com/oxc-project/oxc) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📁 Project Architecture

```
VibeUp/
├── web/                           # Web application workspace
│   ├── src/
│   │   ├── components/            # Reusable UI components & modals
│   │   │   ├── EqualizerModal.tsx # Multi-band Audio Graphic Equalizer
│   │   │   ├── PlaybackBar.tsx    # Bottom sticky mini-player bar
│   │   │   ├── Sidebar.tsx        # Desktop Navigation sidebar
│   │   │   └── motion.tsx         # Framer Motion animation helpers & physics
│   │   ├── context/               # React Context Providers
│   │   │   ├── AudioContext.tsx   # Global HTML5 Audio Engine & State
│   │   │   └── LibraryContext.tsx # User Library & Playlist Storage
│   │   ├── pages/                 # Main Application Views
│   │   │   ├── Home.tsx           # Home discovery dashboard
│   │   │   ├── NowPlayingPage.tsx # Fullscreen Player, Lyrics & Turntable
│   │   │   └── LyricsView.tsx     # Fullscreen lyric view
│   │   ├── services/              # API Integration & Data Mapping
│   │   │   └── api.ts             # JioSaavn API Engine & Lyric Fetcher
│   │   ├── types/                 # TypeScript domain types & interfaces
│   │   ├── App.tsx                # Main App shell routing
│   │   └── index.css              # Design System Tokens & Glassmorphism Styles
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (`v18.0.0` or higher)
- `npm` or `yarn` / `pnpm`

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Abenanthan/VibeUp.git
   cd VibeUp/web
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```

4. **Access the application**:
   Open your browser and navigate to `http://localhost:5173`.

### Building for Production

To generate an optimized production bundle:
```bash
npm run build
```

To preview the built production bundle locally:
```bash
npm run preview
```

---

## 🎨 Design System

VibeUp uses a custom dark-mode color palette built with dynamic design tokens:

- **Primary Accent**: Electric Violet (`#a855f7`)
- **Secondary Accent**: Neon Magenta (`#ec4899`)
- **Cool Highlight**: Electric Cyan (`#22d3ee`)
- **Background Base**: Deep Midnight (`#08060f`)

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more details.

---

<div align="center">
  Crafted with ❤️ by <a href="https://github.com/Abenanthan">Abenanthan</a>
</div>
