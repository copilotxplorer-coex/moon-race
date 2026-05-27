# 🚀 Moon Race — International Space Challenge

> Multiplayer web clicker game where nations compete to send rockets to the Moon!

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Socket.io](https://img.shields.io/badge/Socket.io-4.7-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎮 Game Overview

- **Select a country** and attach your national flag to a rocket
- **Choose from 8 real rockets**: Falcon 9, SLS, New Glenn, LM-5B, Soyuz, PSLV, Ariane 6, H3
- **Click to boost!** Each click = 0.1 km + fuel refill
- **Race to the Moon** — 384,400 km away!
- If nobody clicks, fuel runs out and the rocket falls back to Earth 💥
- **Dashboard** shows all active rockets with real-time positions
- **Statistics** track successful moon landings

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend   | Node.js + Express |
| Real-time | Socket.io |
| Frontend  | Vanilla HTML/CSS/JS + Canvas |
| Styling   | CSS Custom Properties, Glassmorphism |
| Deploy    | Railway (recommended) |

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/moon-race.git
cd moon-race

# Install dependencies
npm install

# Start the server
npm start

# Open in browser
# http://localhost:3000
```

## 🖼️ Adding Real Rocket Images

Place PNG images (transparent background, vertical orientation) in:

```
public/assets/rockets/
├── falcon9.png
├── sls.png
├── new_glenn.png
├── lm5b.png
├── soyuz.png
├── pslv.png
├── ariane6.png
└── h3.png
```

**Recommended size**: 200×600px (or similar vertical aspect ratio)
If images are not found, a colorful fallback rocket is drawn automatically.

## ☁️ Deploy to Railway

### Option A: One-Click Deploy
1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app)
3. Click **"New Project"** → **"Deploy from GitHub Repo"**
4. Select your `moon-race` repository
5. Railway auto-detects Node.js and deploys! 🎉

### Option B: Railway CLI
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Environment
- Railway automatically sets the `PORT` environment variable
- No additional env vars needed

## 🎯 Game Mechanics

| Parameter | Value |
|-----------|-------|
| Distance to Moon | 384,400 km |
| Initial launch boost | 100 km |
| Per click distance | 0.1 km |
| Fuel per click | +0.8% |
| Fuel decay rate | -1.5%/sec |
| Fall speed (no fuel) | -0.8 km/sec |
| Max fuel | 100% |

## 📁 Project Structure

```
moon-race/
├── server.js           # Express + Socket.io server
├── package.json        # Dependencies & scripts
├── railway.json        # Railway deployment config
├── .gitignore
├── README.md
└── public/
    ├── index.html      # Single-page app
    ├── css/
    │   └── style.css   # Minimal dark space theme
    ├── js/
    │   └── game.js     # Client game engine + Canvas
    └── assets/
        └── rockets/    # Place rocket PNGs here
```

## 🤝 Multiplayer

- All players share the same game state via Socket.io
- Anyone can boost any rocket — it's collaborative!
- Multiple rockets can race simultaneously
- Real-time dashboard shows all missions

## 📄 License

MIT License — feel free to modify and deploy!
