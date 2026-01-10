# 📈 Trading Practice App

A full-featured cryptocurrency trading simulator built with **Astro**, **React**, **TypeScript**, and **Tailwind CSS**. Practice trading without risk while learning fundamental trading concepts.

> 🎯 **Dual Learning Goal**: Master both trading concepts AND modern web development

---

## ✨ Features (Phase 1 - COMPLETED ✅)

### 💼 Portfolio Management
- Virtual $10,000 starting balance
- Real-time portfolio valuation
- Holdings tracking with average cost basis
- Unrealized P&L calculations
- Complete trade history

### 📊 Live Market Data
- Real-time prices from CoinGecko API
- Top 15 cryptocurrencies tracked
- 24h price change indicators
- Auto-refresh every 60 seconds

### 🎯 Trading Engine
- Market orders (buy/sell at current price)
- Trade validation & risk warnings
- 0.1% trading fee simulation
- Position size management

### 💾 Data Persistence
- LocalStorage for data persistence
- Import/Export functionality
- CSV export for trade history

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:4321
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── trading/              # Trading components
│   │   ├── MarketList.tsx    # Live crypto prices
│   │   ├── Portfolio.tsx     # User holdings
│   │   ├── TradingForm.tsx   # Buy/Sell form
│   │   └── TradeHistory.tsx  # Transaction log
│   ├── ui/                   # Reusable UI
│   └── TradingDashboard.tsx  # Main app
├── lib/
│   ├── tradingEngine.ts      # Core logic
│   ├── priceService.ts       # CoinGecko API
│   └── storage.ts            # LocalStorage
├── types/
│   └── trading.ts            # TypeScript types
└── utils/
    ├── formatters.ts         # Formatting
    └── validators.ts         # Validation
```

---

## 🧠 Trading Concepts Explained

### 1. Market Orders
Trades execute immediately at current market price.

### 2. Average Cost Basis
```
Buy 1 BTC @ $50,000
Buy 1 BTC @ $60,000
→ Average Cost = $55,000
```

### 3. Unrealized P&L
"Paper" gains/losses (haven't sold yet):
```
Current Value - Total Invested = Unrealized P&L
```

### 4. Trading Fees
Exchanges charge ~0.1% per trade. Always factor this in!

---

## 🛠️ Tech Stack

- **Astro** - Static site generator
- **React** - UI components
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **CoinGecko API** - Market data
- **LocalStorage** - Data persistence

---

## 💻 Usage

### Execute a Trade
1. Select a cryptocurrency from the Market List
2. Choose Buy or Sell
3. Enter quantity (or click MAX)
4. Review the trade summary
5. Click "Execute Order"

### Track Performance
- View real-time P&L in Portfolio section
- Check complete trade history
- Export trades to CSV for analysis

### Reset & Start Over
- Click "Reset All Data" to start fresh
- All data stored locally (no server)

---

## 🔮 Phase 2: AI Integration (Planned)

### Coming Soon
- **Portfolio Analysis** powered by Claude API
- **Trade Suggestions** with explanations
- **Learning Assistant** for trading concepts
- **Risk Assessment** and warnings

### Already Prepared
```typescript
// AI context builder already implemented
const context = buildAIContext(portfolio, trades, marketData);
// Ready for Claude API integration!
```

---

## 🧪 Try These Scenarios

### Scenario 1: Simple Trade
1. Buy 0.01 BTC
2. Wait for price change
3. Sell and check P&L

### Scenario 2: Dollar-Cost Averaging
1. Buy 0.01 BTC @ current price
2. Buy 0.01 BTC again later
3. See your average cost basis

### Scenario 3: Diversification
1. Buy BTC, ETH, and SOL
2. Watch total portfolio value
3. Compare individual asset performance

---

## 📚 Learning Resources

- **Trading**: [Investopedia](https://www.investopedia.com/)
- **Astro**: [docs.astro.build](https://docs.astro.build/)
- **React**: [react.dev](https://react.dev/)
- **CoinGecko**: [coingecko.com/api](https://www.coingecko.com/en/api)

---

## 🐛 Troubleshooting

**Prices not loading?**
- Check internet connection
- Wait 60s for auto-refresh
- Click refresh button

**Data not saving?**
- Enable localStorage in browser
- Check browser console for errors

**Build errors?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🎓 Educational Notes

This app includes extensive **comments in the code** explaining:
- Trading concepts (Market Orders, P&L, Position Sizing)
- Code architecture decisions
- TypeScript patterns
- React state management

**Read the source code to learn!**

---

## 📝 Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

---

## 🤝 Contributing

This is an educational project. Feel free to:
- Fork and experiment
- Add new features
- Share what you learn!

---

## 📄 License

MIT License - Use freely for learning!

---

**Built with ❤️ while learning trading and development**

- **Phase 1**: ✅ Core MVP Complete
- **Phase 2**: 🔮 AI Integration Coming Soon
