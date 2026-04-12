<div align="center">

# 📈 munafa.io

**A premium, real-time NSE stock market analytics dashboard**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![MUI](https://img.shields.io/badge/MUI-v5-007FFF?style=flat-square&logo=mui&logoColor=white)](https://mui.com/)
[![Three.js](https://img.shields.io/badge/Three.js-r183-000000?style=flat-square&logo=three.js&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square)](CONTRIBUTING.md)

*Bloomberg-meets-fintech aesthetic — data-dense, fast, and beautiful.*

[Features](#-features) • [Demo](#-getting-started) • [Tech Stack](#-tech-stack) • [Architecture](#️-project-structure) • [Deploy](#️-build-for-production)

</div>

---

## ✨ Features

### 📊 Dashboard
- **Live Index Cards** — Nifty 50, Sensex, Bank Nifty, Nifty IT, Midcap 100, FinNifty with real-time prices and sparkline mini-charts
- **Auto-scrolling Carousel** — Index cards scroll infinitely; hover to pause
- **3D Tilt Effect** — Index cards respond to mouse movement with perspective tilt and a glossy shine overlay
- **FII / DII Activity Chart** — Grouped bar chart showing institutional buy/sell data for the last 5 sessions
- **Top Gainers & Losers** — Tabbed by Large / Mid / Small cap with sortable table view
- **52-Week High / Low** — Stocks near their yearly extremes with distance percentage
- **Most Active & Most Bought** — Horizontally scrollable stock cards
- **Most Valuable Companies** — Market cap leaders with mini donut 52W range indicator
- **Sector Explorer** — Interactive pill chips for Banking, IT, Energy, Auto, Pharma, and more
- **Market News Feed** — Sector-filtered news with source badges, stock chips, and timeline indicators

### 📉 Stock Detail Page (`/stock/:symbol`)
- **Candlestick Chart** — Powered by `lightweight-charts` (TradingView's charting library)
- **Line / Area Chart** — Recharts AreaChart with gradient fill (green/red based on trend)
- **Bar / OHLC Chart** — Recharts ComposedChart
- **Time Range Selector** — `1D · 5D · 1M · 3M · 6M · 1Y` mapped to correct Yahoo Finance API intervals
- **Volume Chart** — Color-coded bars rendered below the main chart
- **Key Stats Grid** — Open, High, Low, Close, Volume, Market Cap, P/E, 52W High/Low
- **Add to Watchlist** button

### 🗂️ Index Stock List Page (`/index/:indexSymbol`)
- **Index Chart** — Full-width live chart for the selected index
- **Constituent Stock Table** — All stocks with rank, price, change%, volume, and 52W data
- **Search & Filter** — Filter by company name or symbol within the index
- **Sorted by Change%** — Top gainers shown first by default
- **Click-through Navigation** — Any row navigates to the full stock detail page

### 🎨 UI & Theme
- **Dark / Light Mode** — Smooth toggle via MUI `createTheme`, persisted in `localStorage`
- **Dark Mode** — Deep navy `#0A0F1E` background, glassmorphism cards with backdrop blur
- **Light Mode** — Off-white `#F5F7FA` background, clean white cards with subtle shadows
- **Typography** — Space Grotesk for headings, Inter for body text
- **Color Palette** — Electric Indigo `#5C6BC0` accent · Emerald Green `#26A65B` · Coral Red `#E74C3C`

### 🌐 3D Elements (Three.js)
- **Hero Particle Background** — 250 floating particles with mouse-attraction effect
- **Wireframe Globe** — Slowly rotating globe in the navbar as a brand element
- **CSS 3D Tilt** — Perspective transform on index cards following cursor position

---

## 🗂️ Project Structure

```
munafa.io/
├── src/
│   ├── components/
│   │   ├── Dashboard.jsx         # Main dashboard layout
│   │   ├── Navbar.jsx            # Sticky navbar with live Nifty chip + theme toggle
│   │   ├── GlobeWidget.jsx       # Three.js wireframe globe (navbar)
│   │   ├── IndexCards.jsx        # Auto-scrolling index card carousel
│   │   ├── Sparkline.jsx         # Reusable mini line chart component
│   │   ├── FIIDIIChart.jsx       # Grouped bar chart for FII/DII data
│   │   ├── MostActive.jsx        # Most Active / Most Bought stock cards
│   │   ├── GainersLosers.jsx     # Top Gainers & Losers table (tabbed)
│   │   ├── FiftyTwoWeekHL.jsx    # 52-Week High / Low table
│   │   ├── SectorChips.jsx       # Sector filter pill chips
│   │   ├── MostValuable.jsx      # Market cap leaders with donut chart
│   │   ├── NewsFeed.jsx          # Market news with sector tabs
│   │   ├── StockDetail.jsx       # Full stock page with multi-chart support
│   │   ├── IndexStockList.jsx    # Index page: chart + constituent table
│   │   ├── StockList.jsx         # Reusable stock list with search/sort
│   │   └── StockRow.jsx          # Individual stock row with sparkline
│   ├── data/
│   │   ├── indexConstituents.js  # Hardcoded Nifty 50, Sensex, BankNifty, etc.
│   │   └── newsData.js           # Market news with sector tags
│   ├── services/
│   │   └── stockService.js       # Yahoo Finance API — fetch, cache, parse
│   ├── utils/
│   │   ├── formatters.js         # INR formatting, volume, date helpers
│   │   └── marketUtils.js        # NSE market hours open/close detection
│   ├── App.jsx                   # Theme setup, Router, ThemeToggleContext
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles, keyframe animations
├── index.html                    # Google Fonts (Space Grotesk, Inter)
├── vite.config.js                # Vite + Yahoo Finance CORS proxy config
├── package.json
└── .env.example                  # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js **v18+**
- npm **v9+**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Astik01/munafa.io.git
cd munafa.io

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env if needed (see Environment Variables section below)

# 4. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# Optional: Twelve Data API key (legacy, not actively used)
VITE_TWELVE_DATA_KEY=your_api_key_here

# Auto-refresh interval in milliseconds (default: 5 minutes)
VITE_REFRESH_INTERVAL=300000
```

> **Note:** The primary data source is the **Yahoo Finance unofficial API** — no API key is required.

---

## 🌐 Data Source & API Proxy

munafa.io fetches all market data from the **Yahoo Finance unofficial API** (`query1.finance.yahoo.com`). To avoid browser CORS restrictions, all requests are routed through Vite's dev server proxy:

```js
// vite.config.js
proxy: {
  '/api/yahoo': {
    target: 'https://query1.finance.yahoo.com',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
  },
}
```

### In-Memory Caching

`stockService.js` caches every API response for **30 seconds** (TTL) to reduce redundant network calls and protect against rate limiting. Cache is keyed by symbol + range (e.g., `chart:RELIANCE:1M`).

### NSE Symbol Convention

All NSE stocks use the `.NS` suffix when querying Yahoo Finance.

| Stock | Yahoo Symbol |
|-------|-------------|
| Reliance | `RELIANCE.NS` |
| TCS | `TCS.NS` |
| HDFC Bank | `HDFCBANK.NS` |

### Index Symbols

| Index | Yahoo Symbol |
|-------|-------------|
| Nifty 50 | `^NSEI` |
| Sensex | `^BSESN` |
| Bank Nifty | `^NSEBANK` |
| Nifty IT | `^CNXIT` |
| Nifty Midcap 100 | `^CNXMIDCAP` |
| FinNifty | `^CNXFIN` |

### Chart Time Ranges

| Range | Interval | Yahoo `range` |
|-------|----------|---------------|
| 1D | 5m | 1d |
| 5D | 15m | 5d |
| 1M | 1d | 1mo |
| 3M | 1d | 3mo |
| 6M | 1d | 6mo |
| 1Y | 1wk | 1y |

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build Tool | Vite 5 |
| UI Library | Material UI v5 + Emotion |
| Routing | React Router v7 |
| 2D Charts | Recharts 2 |
| Candlestick Charts | lightweight-charts 5 (TradingView) |
| 3D / WebGL | Three.js r183 |
| Fonts | Space Grotesk, Inter (Google Fonts) |
| Data Source | Yahoo Finance unofficial API (no key needed) |

---

## 🗺️ Page Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | `Dashboard` | Full market overview with all widgets |
| `/stock/:symbol` | `StockDetail` | Multi-chart view + key stats for any NSE stock |
| `/index/:indexSymbol` | `IndexStockList` | Index chart + sortable constituent table |

### Index Route IDs

| URL | Index |
|-----|-------|
| `/index/nifty50` | Nifty 50 |
| `/index/sensex` | BSE Sensex |
| `/index/banknifty` | Bank Nifty |
| `/index/niftyit` | Nifty IT |
| `/index/midcap100` | Nifty Midcap 100 |
| `/index/finnifty` | FinNifty |

---

## 🏗️ Build for Production

```bash
npm run build
```

Output is placed in the `dist/` folder. Preview it locally with:

```bash
npm run preview
```

> **Important:** The Vite proxy only works in **development** mode. For production, configure your hosting to proxy `/api/yahoo` → `https://query1.finance.yahoo.com`.

### Vercel Deployment

Add a `vercel.json` to your project root:

```json
{
  "rewrites": [
    {
      "source": "/api/yahoo/:path*",
      "destination": "https://query1.finance.yahoo.com/:path*"
    }
  ]
}
```

### Nginx (Self-hosted)

```nginx
location /api/yahoo/ {
  proxy_pass https://query1.finance.yahoo.com/;
  proxy_set_header Host query1.finance.yahoo.com;
}
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m "feat: add your feature"`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a Pull Request

Please make sure your code follows the existing code style and that the dev server runs without errors before submitting.

---

## ⚠️ Disclaimer

munafa.io is a **personal portfolio project** built for educational purposes. It uses the Yahoo Finance unofficial API which is not intended for commercial use. All market data displayed may be delayed and should **not** be used for actual investment decisions.

---

## 👤 Author

**Astik** — [@Astik01](https://github.com/Astik01)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).