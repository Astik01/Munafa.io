# 📈 munafa.io



A premium, real-time NSE stock market analytics dashboard built with React 18, Material UI v5, and Three.js. Designed with a Bloomberg-meets-fintech aesthetic — data-dense, fast, and beautiful.

---



## ✨ Features

### 📊 Dashboard
- **Live Index Cards** — Nifty 50, Sensex, Bank Nifty, Nifty IT, Midcap 100, FinNifty with real-time prices and sparkline charts
- **Auto-scrolling Carousel** — Index cards scroll infinitely; hover over any card to pause
- **3D Tilt Effect** — Index cards respond to mouse movement with perspective tilt and a glossy shine overlay
- **FII / DII Activity Chart** — Grouped bar chart showing institutional buy/sell data for last 5 sessions
- **Top Gainers & Losers** — Tabbed by Large / Mid / Small cap with sortable table view
- **52 Week High / Low** — Stocks near their yearly extremes with distance percentage
- **Most Active & Most Bought** — Horizontally scrollable stock cards
- **Most Valuable Companies** — Market cap leaders with mini donut 52W range indicator
- **Sector Explorer** — Interactive pill chips for Banking, IT, Energy, Auto, Pharma, and more
- **Market News Feed** — Sector-filtered news with source badges, stock chips, and timeline indicators

### 📉 Stock Detail Page (`/stock/:symbol`)
- **Candlestick Chart** — Powered by `lightweight-charts` (TradingView's charting library)
- **Line / Area Chart** — Recharts AreaChart with gradient fill (green/red based on trend)
- **Bar / OHLC Chart** — Recharts ComposedChart
- **Time Range Selector** — 1D · 5D · 1M · 3M · 6M · 1Y (maps to correct Yahoo Finance API intervals)
- **Volume Chart** — Color-coded bars below the main chart
- **Key Stats Grid** — Open, High, Low, Close, Volume, Market Cap, P/E, 52W High/Low
- **Add to Watchlist** button

### 🗂️ Index Stock List Page (`/index/:indexSymbol`)
- **Index Chart on Top** — Full-width live chart for the selected index
- **Constituent Stock Table** — All stocks in the index with rank, price, change%, volume, 52W data
- **Search & Filter** — Filter by company name or symbol within the list
- **Sorted by Change%** — Top gainers shown first by default
- **Click-through** — Any stock row navigates to its full detail page

### 🎨 UI & Theme
- **Dark / Light Mode** — Smooth toggle with MUI `createTheme`, persisted in `localStorage`
- **Dark Mode** — Deep navy (#0A0F1E) background, glassmorphism cards with backdrop blur
- **Light Mode** — Off-white (#F5F7FA) background, clean white cards with subtle shadows
- **Typography** — Space Grotesk for headings, Inter for body text
- **Color Palette** — Electric Indigo (#5C6BC0) accent · Emerald Green (#26A65B) · Coral Red (#E74C3C)

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
│   │   ├── HeroBackground.jsx    # Three.js particle canvas
│   │   ├── GlobeWidget.jsx       # Three.js wireframe globe (navbar)
│   │   ├── IndexCards.jsx        # Auto-scrolling index card carousel
│   │   ├── Sparkline.jsx         # Reusable mini line chart
│   │   ├── FIIDIIChart.jsx       # Grouped bar chart for FII/DII data
│   │   ├── MostActive.jsx        # Most Active / Most Bought stock cards
│   │   ├── GainersLosers.jsx     # Top Gainers & Losers table (tabbed)
│   │   ├── FiftyTwoWeekHL.jsx    # 52 Week High / Low table
│   │   ├── SectorChips.jsx       # Sector filter pill chips
│   │   ├── MostValuable.jsx      # Market cap leaders with donut chart
│   │   ├── NewsFeed.jsx          # Market news with sector tabs
│   │   ├── StockDetail.jsx       # Full stock page with charts
│   │   ├── IndexStockList.jsx    # Index page: chart + constituent table
│   │   ├── StockList.jsx         # Reusable stock list with search/sort
│   │   └── StockRow.jsx          # Individual stock row with sparkline
│   ├── data/
│   │   ├── indexConstituents.js  # Hardcoded Nifty 50, Sensex, BankNifty, etc.
│   │   └── newsData.js           # Dummy market news with sector tags
│   ├── services/
│   │   └── stockService.js       # All Yahoo Finance API fetch functions
│   ├── utils/
│   │   ├── formatters.js         # INR formatting, volume, date helpers
│   │   └── marketUtils.js        # NSE market hours open/close status
│   ├── App.jsx                   # Theme setup, Router, ThemeToggleContext
│   ├── main.jsx                  # React entry point
│   └── index.css                 # Global styles, keyframe animations
├── index.html                    # Google Fonts (Space Grotesk, Inter)
├── vite.config.js                # Vite + Yahoo Finance proxy config
├── package.json
└── .env                          # Environment variables
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Astik01/munafa.io.git
cd munafa.io

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env if needed (see Environment Variables section)

# 4. Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: legacy key from Twelve Data (not actively used)
VITE_TWELVE_DATA_KEY=your_api_key_here

# Auto-refresh interval in milliseconds (default: 5 minutes)
VITE_REFRESH_INTERVAL=300000
```

> **Note:** The primary data source is the **Yahoo Finance unofficial API** via Vite's proxy — no API key required.

---

## 🌐 Data Source & Proxy

munafa.io uses the **Yahoo Finance unofficial API** (`query1.finance.yahoo.com`) for all market data. To avoid CORS issues in the browser, requests are routed through Vite's dev server proxy:

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

### Symbol Convention

All NSE stocks use the `.NS` suffix (e.g., `RELIANCE.NS`, `TCS.NS`).

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
| UI Library | Material UI v5 |
| Routing | React Router v7 |
| 2D Charts | Recharts 2 |
| Candlestick | lightweight-charts 5 (TradingView) |
| 3D / WebGL | Three.js r183 |
| Styling | Emotion (MUI default) |
| Fonts | Space Grotesk, Inter (Google Fonts) |
| Data | Yahoo Finance (unofficial, no key needed) |

---

## 🗺️ Page Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Full market overview |
| `/stock/:symbol` | StockDetail | Charts + stats for any NSE stock |
| `/index/:indexSymbol` | IndexStockList | Index chart + all constituent stocks |

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

Output goes to the `dist/` folder. Preview the production build locally:

```bash
npm run preview
```

> **Important:** The Vite proxy only works in dev mode. For production, configure your web server (Nginx, Vercel, etc.) to proxy `/api/yahoo` to `https://query1.finance.yahoo.com`.

### Vercel Deployment

Add this to your `vercel.json`:

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

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m "feat: add your feature"`
4. Push to the branch — `git push origin feature/your-feature`
5. Open a Pull Request

---

## ⚠️ Disclaimer

munafa.io is a **personal portfolio project** built for educational purposes. It uses the Yahoo Finance unofficial API which is not intended for commercial use. All market data displayed may be delayed and should **not** be used for actual investment decisions.

---

## 👤 Author

**Astik** — [@Astik01](https://github.com/Astik01)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
