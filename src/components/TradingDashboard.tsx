/**
 * TradingDashboard - Main Application Component
 *
 * This is the main component that orchestrates the entire trading application.
 * It manages:
 * - Portfolio state (balance, holdings, trades)
 * - Market data from CoinGecko
 * - Trade execution
 * - LocalStorage persistence
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  Asset,
  Portfolio as PortfolioType,
  Trade,
  TradeType,
  FuturesPosition,
  FuturesFormData
} from '../types/trading';
import { getMarketPrices, createPriceMap } from '../lib/priceService';
import {
  executeTrade,
  calculatePortfolioValue,
  updateHoldingPrices,
  INITIAL_BALANCE
} from '../lib/tradingEngine';
import {
  openFuturesPosition,
  closePosition,
  updateAllPositions,
  checkPositionTriggers,
  updatePositionPnL
} from '../lib/futuresEngine';
import {
  loadFromStorage,
  saveToStorage,
  resetAllData,
  checkStorageQuota
} from '../lib/storage';

// Components
import { PortfolioSummary } from './trading/PortfolioSummary';
import { MarketList } from './trading/MarketList';
import { Portfolio } from './trading/Portfolio';
import { TradingForm } from './trading/TradingForm';
import { TradeHistory } from './trading/TradeHistory';
import { CandlestickChart } from './charts/CandlestickChart';
import { FuturesTradingForm } from './futures/FuturesTradingForm';
import { FuturesPositionList } from './futures/FuturesPositionList';
import { AdvancedTradingSignals } from './analysis/AdvancedTradingSignals';
import { Button } from './ui/Button';

// Hooks
import { usePriceHistory } from '../hooks/usePriceHistory';

export function TradingDashboard() {
  // State
  const [portfolio, setPortfolio] = useState<PortfolioType>({
    balance: INITIAL_BALANCE,
    holdings: [],
    totalInvested: 0,
    totalValue: INITIAL_BALANCE,
    totalPnL: 0,
    totalPnLPercentage: 0,
    lastUpdated: Date.now()
  });

  const [trades, setTrades] = useState<Trade[]>([]);
  const [futuresPositions, setFuturesPositions] = useState<FuturesPosition[]>([]);
  const [initialBalance, setInitialBalance] = useState(INITIAL_BALANCE);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | undefined>();
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'spot' | 'futures'>('spot');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('5m');

  // Mobile responsive states
  const [mobileView, setMobileView] = useState<'chart' | 'market' | 'trade' | 'portfolio' | 'signals'>('chart');
  const [isMobile, setIsMobile] = useState(false);

  // Detect if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Convert timeframe string to minutes
  const timeframeToMinutes = (tf: string): number => {
    const value = parseInt(tf);
    if (tf.includes('m')) return value;
    if (tf.includes('h')) return value * 60;
    if (tf.includes('d')) return value * 1440;
    return 5; // default to 5 minutes
  };

  // Price history for candlestick chart
  const {
    candlestickData,
    volumeData,
    isLoading: chartLoading,
    refresh: refreshChart,
    updatePrice
  } = usePriceHistory({
    asset: selectedAsset,
    periods: 100,
    timeframe: timeframeToMinutes(selectedTimeframe),
    volatility: 0.02
  });

  // Handle timeframe change
  const handleTimeframeChange = (timeframe: string) => {
    console.log('📊 Changing timeframe to:', timeframe);
    setSelectedTimeframe(timeframe);
  };

  // Load saved data on mount
  useEffect(() => {
    console.log('📂 Loading saved data...');
    const savedData = loadFromStorage();

    setTrades(savedData.trades);
    setFuturesPositions(savedData.futuresPositions);
    setInitialBalance(savedData.initialBalance);

    // Recalculate portfolio from trades
    const newPortfolio = calculatePortfolioFromTrades(
      savedData.balance,
      savedData.trades
    );

    setPortfolio(newPortfolio);
    setLoading(false);

    console.log('✅ Data loaded:', {
      balance: savedData.balance,
      trades: savedData.trades.length,
      holdings: newPortfolio.holdings.length
    });
  }, []);

  // Load market prices
  useEffect(() => {
    const loadMarketData = async () => {
      const marketData = await getMarketPrices();
      setAssets(marketData);

      // Update holdings with current prices
      if (marketData.length > 0 && portfolio.holdings.length > 0) {
        const priceMap = createPriceMap(marketData);
        const updatedHoldings = updateHoldingPrices(portfolio.holdings, priceMap);
        const updatedPortfolio = calculatePortfolioValue(portfolio.balance, updatedHoldings);
        setPortfolio(updatedPortfolio);
      }
    };

    loadMarketData();

    // Auto-refresh prices every 60 seconds
    const interval = setInterval(loadMarketData, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Save to localStorage whenever portfolio or trades change
  useEffect(() => {
    if (!loading) {
      saveToStorage(portfolio.balance, trades, futuresPositions, initialBalance);
    }
  }, [portfolio.balance, trades, futuresPositions, initialBalance, loading]);

  // Update futures positions with current prices
  useEffect(() => {
    if (assets.length === 0 || futuresPositions.length === 0) return;

    const priceMap = createPriceMap(assets);
    const updatedPositions = updateAllPositions(futuresPositions, priceMap);

    // Check for liquidations and triggers
    const { toClose, updated } = checkPositionTriggers(updatedPositions);

    // Close positions that hit triggers
    if (toClose.length > 0) {
      toClose.forEach(({ position, reason }) => {
        const closedPosition = closePosition(position, position.currentPrice, reason);

        // Return margin to balance (minus losses)
        const returnAmount = position.margin + (closedPosition.realizedPnL || 0);
        setPortfolio(prev => ({
          ...prev,
          balance: prev.balance + returnAmount
        }));

        // Notify user with toast
        if (reason === 'LIQUIDATION') {
          toast.error(
            `LIQUIDADO! Tu posición ${position.side} ${position.assetSymbol} fue liquidada.\nPérdida: $${closedPosition.realizedPnL?.toFixed(2)}`,
            { duration: 6000 }
          );
        } else {
          const pnl = closedPosition.realizedPnL || 0;
          const toastFn = pnl >= 0 ? toast.success : toast.error;
          toastFn(
            `${reason === 'STOP_LOSS' ? 'Stop Loss' : 'Take Profit'} ejecutado!\n${position.side} ${position.assetSymbol} | P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`,
            { duration: 5000 }
          );
        }
      });

      // Update positions list
      const closedPositions = toClose.map(({ position, reason }) =>
        closePosition(position, position.currentPrice, reason)
      );

      setFuturesPositions(prev => [
        ...prev.filter(p => !toClose.some(tc => tc.position.id === p.id)),
        ...closedPositions
      ]);
    } else {
      // Just update P&L
      setFuturesPositions(updated);
    }
  }, [assets]);

  /**
   * Recalculates portfolio from the trade history
   * This is the "source of truth" approach - holdings are derived from trades
   */
  function calculatePortfolioFromTrades(
    currentBalance: number,
    allTrades: Trade[]
  ): PortfolioType {
    // Start with empty holdings
    const holdingsMap = new Map<string, {
      asset: string;
      assetSymbol: string;
      assetName: string;
      quantity: number;
      totalInvested: number;
    }>();

    // Process each trade to build holdings
    allTrades.forEach(trade => {
      const existing = holdingsMap.get(trade.asset);

      if (trade.type === 'buy') {
        if (existing) {
          // Add to existing holding
          holdingsMap.set(trade.asset, {
            ...existing,
            quantity: existing.quantity + trade.quantity,
            totalInvested: existing.totalInvested + trade.netTotal
          });
        } else {
          // Create new holding
          holdingsMap.set(trade.asset, {
            asset: trade.asset,
            assetSymbol: trade.assetSymbol,
            assetName: trade.asset, // Will be updated with real name from market data
            quantity: trade.quantity,
            totalInvested: trade.netTotal
          });
        }
      } else {
        // Sell
        if (existing) {
          const newQuantity = existing.quantity - trade.quantity;
          const proportionSold = trade.quantity / existing.quantity;
          const investedSold = existing.totalInvested * proportionSold;

          if (newQuantity <= 0.00000001) {
            // Sold all
            holdingsMap.delete(trade.asset);
          } else {
            holdingsMap.set(trade.asset, {
              ...existing,
              quantity: newQuantity,
              totalInvested: existing.totalInvested - investedSold
            });
          }
        }
      }
    });

    // Convert map to holdings array with current prices
    const holdings = Array.from(holdingsMap.values()).map(h => {
      const assetData = assets.find(a => a.id === h.asset);
      const currentPrice = assetData?.current_price || 0;
      const currentValue = h.quantity * currentPrice;
      const pnl = currentValue - h.totalInvested;
      const pnlPercentage = h.totalInvested > 0 ? (pnl / h.totalInvested) * 100 : 0;

      return {
        ...h,
        assetName: assetData?.name || h.asset,
        averageBuyPrice: h.totalInvested / h.quantity,
        currentPrice,
        currentValue,
        pnl,
        pnlPercentage
      };
    });

    return calculatePortfolioValue(currentBalance, holdings);
  }

  /**
   * Execute a trade
   */
  const handleTrade = (asset: Asset, type: TradeType, quantity: number) => {
    console.log(`💰 Executing ${type} trade:`, { asset: asset.symbol, quantity });

    const result = executeTrade(type, asset, quantity, portfolio);

    // Update state
    setPortfolio(result.newPortfolio);
    setTrades(prev => [...prev, result.trade]);

    console.log('✅ Trade executed:', result.trade);

    // Show success toast
    toast.success(
      `${type.toUpperCase()} order executed!\n${quantity.toFixed(8)} ${asset.symbol} @ $${asset.current_price.toFixed(2)}`,
      { duration: 3000 }
    );
  };

  /**
   * Open a futures position
   */
  const handleOpenPosition = (formData: FuturesFormData, asset: Asset) => {
    console.log(`⚡ Opening ${formData.side} position:`, { asset: asset.symbol, leverage: formData.leverage });

    // Create the position
    const position = openFuturesPosition(formData, asset);

    // Deduct margin from balance
    setPortfolio(prev => ({
      ...prev,
      balance: prev.balance - formData.margin
    }));

    // Add position to list
    setFuturesPositions(prev => [...prev, position]);

    console.log('✅ Position opened:', position);

    toast.success(
      `Posición ${formData.side} abierta!\n${asset.symbol} ${formData.leverage}x | Margin: $${formData.margin}\nLiquidación: $${position.liquidationPrice.toFixed(2)}`,
      { duration: 4000 }
    );
  };

  /**
   * Close a futures position manually
   */
  const handleClosePosition = (position: FuturesPosition) => {
    console.log(`🔒 Closing position:`, { id: position.id, side: position.side });

    // Close at current price
    const closedPosition = closePosition(position, position.currentPrice, 'USER');

    // Return margin + P&L to balance
    const returnAmount = position.margin + (closedPosition.realizedPnL || 0);
    setPortfolio(prev => ({
      ...prev,
      balance: prev.balance + returnAmount
    }));

    // Update positions list (replace with closed version)
    setFuturesPositions(prev =>
      prev.map(p => p.id === position.id ? closedPosition : p)
    );

    console.log('✅ Position closed:', closedPosition);

    const pnl = closedPosition.realizedPnL || 0;
    const toastFn = pnl >= 0 ? toast.success : toast.error;
    toastFn(
      `Posición cerrada!\n${position.side} ${position.assetSymbol}\nP&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${closedPosition.unrealizedPnLPercentage.toFixed(2)}%)`,
      { duration: 4000 }
    );
  };

  /**
   * Reset all data
   */
  const handleReset = () => {
    if (!showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }

    console.log('🗑️ Resetting all data...');
    resetAllData();

    // Reset state
    setPortfolio({
      balance: INITIAL_BALANCE,
      holdings: [],
      totalInvested: 0,
      totalValue: INITIAL_BALANCE,
      totalPnL: 0,
      totalPnLPercentage: 0,
      lastUpdated: Date.now()
    });
    setTrades([]);
    setFuturesPositions([]);
    setInitialBalance(INITIAL_BALANCE);
    setShowResetConfirm(false);

    toast.success('All data has been reset!', { duration: 3000 });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading trading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#363636',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">📈</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trading Practice App</h1>
                <p className="text-sm text-gray-600">Learn trading without risk • Phase 1 MVP</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {showResetConfirm ? (
                <div className="flex items-center space-x-2 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Are you sure?
                  </span>
                  <Button
                    onClick={handleReset}
                    variant="danger"
                    size="sm"
                  >
                    Yes, Reset
                  </Button>
                  <Button
                    onClick={() => setShowResetConfirm(false)}
                    variant="ghost"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleReset}
                  variant="ghost"
                  size="sm"
                >
                  Reset All Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Portfolio Summary Cards */}
        <div className="mb-6">
          <PortfolioSummary
            portfolio={portfolio}
            totalTrades={trades.length}
            initialBalance={initialBalance}
          />
        </div>

        {/* Trading Mode Tabs - MEJORADOS */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
            <nav className="flex space-x-2" role="navigation" aria-label="Trading mode selection">
              <button
                onClick={() => setActiveTab('spot')}
                aria-label="Switch to Spot Trading mode"
                aria-pressed={activeTab === 'spot'}
                className={`
                  flex-1 py-4 px-6 rounded-lg font-semibold text-sm transition-all duration-200
                  flex items-center justify-center space-x-2
                  ${activeTab === 'spot'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-xl" aria-hidden="true">💰</span>
                <span>Spot Trading</span>
                {activeTab === 'spot' && <span className="ml-2 text-xs bg-white/20 px-2 py-0.5 rounded">Activo</span>}
              </button>

              <button
                onClick={() => setActiveTab('futures')}
                aria-label="Switch to Futures Trading mode - High risk"
                aria-pressed={activeTab === 'futures'}
                className={`
                  flex-1 py-4 px-6 rounded-lg font-semibold text-sm transition-all duration-200
                  flex items-center justify-center space-x-2 relative
                  ${activeTab === 'futures'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md transform scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <span className="text-xl" aria-hidden="true">⚡</span>
                <span>Futures Trading</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                  activeTab === 'futures'
                    ? 'bg-white/20'
                    : 'bg-red-100 text-red-700 font-bold'
                }`}>
                  ALTO RIESGO
                </span>
              </button>
            </nav>
          </div>

          {/* Subtle indicator below */}
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              {activeTab === 'spot'
                ? '📘 Modo básico: Compra y vende criptomonedas al precio actual'
                : '⚠️ Modo avanzado: Trading con apalancamiento (leverage) - Riesgo de liquidación'
              }
            </p>
          </div>
        </div>

        {/* Mobile Navigation Tabs - Solo visible en mobile */}
        {isMobile && (
          <div className="mb-6 sticky top-[73px] z-20 bg-gray-50 -mx-4 px-4 py-3 shadow-md">
            <nav className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm" role="navigation" aria-label="Mobile view selection">
              <button
                onClick={() => setMobileView('chart')}
                aria-label="View price chart"
                aria-pressed={mobileView === 'chart'}
                className={`
                  flex-1 py-3 px-2 rounded-md text-xs font-semibold transition-all duration-200
                  flex flex-col items-center justify-center space-y-1
                  ${mobileView === 'chart'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg" aria-hidden="true">📊</span>
                <span>Chart</span>
              </button>

              <button
                onClick={() => setMobileView('market')}
                aria-label="View market list"
                aria-pressed={mobileView === 'market'}
                className={`
                  flex-1 py-3 px-2 rounded-md text-xs font-semibold transition-all duration-200
                  flex flex-col items-center justify-center space-y-1
                  ${mobileView === 'market'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg" aria-hidden="true">💹</span>
                <span>Market</span>
              </button>

              <button
                onClick={() => setMobileView('trade')}
                aria-label="View trading form"
                aria-pressed={mobileView === 'trade'}
                className={`
                  flex-1 py-3 px-2 rounded-md text-xs font-semibold transition-all duration-200
                  flex flex-col items-center justify-center space-y-1
                  ${mobileView === 'trade'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg" aria-hidden="true">🎯</span>
                <span>Trade</span>
              </button>

              <button
                onClick={() => setMobileView('portfolio')}
                aria-label="View portfolio"
                aria-pressed={mobileView === 'portfolio'}
                className={`
                  flex-1 py-3 px-2 rounded-md text-xs font-semibold transition-all duration-200
                  flex flex-col items-center justify-center space-y-1
                  ${mobileView === 'portfolio'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg" aria-hidden="true">💼</span>
                <span>Portfolio</span>
              </button>

              <button
                onClick={() => setMobileView('signals')}
                aria-label="View trading signals"
                aria-pressed={mobileView === 'signals'}
                className={`
                  flex-1 py-3 px-2 rounded-md text-xs font-semibold transition-all duration-200
                  flex flex-col items-center justify-center space-y-1
                  ${mobileView === 'signals'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg" aria-hidden="true">🎯</span>
                <span>Signals</span>
              </button>
            </nav>
          </div>
        )}

        {/* Candlestick Chart - Desktop: siempre visible, Mobile: solo si mobileView === 'chart' */}
        {selectedAsset && (!isMobile || mobileView === 'chart') && (
          <div className="mb-8">
            <CandlestickChart
              data={candlestickData}
              volumeData={volumeData}
              asset={selectedAsset.name}
              currentPrice={selectedAsset.current_price}
              priceChange24h={selectedAsset.price_change_percentage_24h}
              currentTimeframe={selectedTimeframe}
              onTimeframeChange={handleTimeframeChange}
              onRefresh={refreshChart}
              isLoading={chartLoading}
            />
          </div>
        )}

        {!selectedAsset && (!isMobile || mobileView === 'chart') && (
          <div className="mb-8 p-8 bg-white rounded-lg shadow-md border border-gray-200 text-center">
            <p className="text-gray-600 font-medium">📊 Selecciona una criptomoneda del Market List para ver el gráfico de velas</p>
            <p className="text-sm text-gray-500 mt-2">Haz click en cualquier crypto de la lista</p>
          </div>
        )}

        {/* Trading Signals Panel - Desktop y Mobile */}
        {selectedAsset && (!isMobile || mobileView === 'signals') && candlestickData.length > 0 && (
          <div className="mb-8">
            <AdvancedTradingSignals
              candleData={candlestickData}
              volumeData={volumeData}
              assetName={selectedAsset.name}
            />
          </div>
        )}

        {!selectedAsset && (!isMobile || mobileView === 'signals') && (
          <div className="mb-8 p-8 bg-white rounded-lg shadow-md border border-gray-200 text-center">
            <p className="text-gray-600 font-medium">🎯 Selecciona una criptomoneda para ver señales de trading</p>
            <p className="text-sm text-gray-500 mt-2">Las señales te ayudarán a tomar decisiones informadas</p>
          </div>
        )}

        {/* Main Grid - Spot Trading */}
        <AnimatePresence mode="wait">
          {activeTab === 'spot' && (
            <motion.div
              key="spot-trading"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Desktop: Grid de 3 columnas, Mobile: Una vista a la vez */}
              <div className={isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
              {/* Left Column: Market List - Sticky en desktop */}
              {(!isMobile || mobileView === 'market') && (
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24">
                    <MarketList
                      onSelectAsset={setSelectedAsset}
                      selectedAssetId={selectedAsset?.id}
                    />
                  </div>
                </div>
              )}

              {/* Middle Column: Trading Form */}
              {(!isMobile || mobileView === 'trade') && (
                <div className="lg:col-span-1">
                  <TradingForm
                    assets={assets}
                    portfolio={portfolio}
                    selectedAsset={selectedAsset}
                    onTrade={handleTrade}
                  />
                </div>
              )}

              {/* Right Column: Portfolio - Sticky en desktop */}
              {(!isMobile || mobileView === 'portfolio') && (
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24">
                    <Portfolio portfolio={portfolio} />
                  </div>
                </div>
              )}
            </div>

              {/* Trade History - Solo en desktop o en vista portfolio en mobile */}
              {(!isMobile || mobileView === 'portfolio') && (
                <div className="mt-6">
                  <TradeHistory trades={trades} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid - Futures Trading */}
        <AnimatePresence mode="wait">
          {activeTab === 'futures' && (
            <motion.div
              key="futures-trading"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Desktop: Grid de 3 columnas, Mobile: Una vista a la vez */}
              <div className={isMobile ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-3 gap-6'}>
              {/* Left Column: Market List - Sticky en desktop */}
              {(!isMobile || mobileView === 'market') && (
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24">
                    <MarketList
                      onSelectAsset={setSelectedAsset}
                      selectedAssetId={selectedAsset?.id}
                    />
                  </div>
                </div>
              )}

              {/* Middle Column: Futures Trading Form */}
              {(!isMobile || mobileView === 'trade') && (
                <div className="lg:col-span-1">
                  <FuturesTradingForm
                    assets={assets}
                    selectedAsset={selectedAsset}
                    availableBalance={portfolio.balance}
                    onOpenPosition={handleOpenPosition}
                  />
                </div>
              )}

              {/* Right Column: Futures Positions - Sticky en desktop */}
              {(!isMobile || mobileView === 'portfolio') && (
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24">
                    <FuturesPositionList
                      positions={futuresPositions.filter(p => p.status === 'OPEN')}
                      onClosePosition={handleClosePosition}
                    />
                  </div>
                </div>
              )}
            </div>

              {/* Educational Note for Futures - Solo en desktop o en vista portfolio/trade en mobile */}
              {(!isMobile || mobileView === 'trade' || mobileView === 'portfolio') && (
                <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                    ⚠️ Advertencia: Trading con Leverage
                  </h3>
                  <p className="text-yellow-800 mb-3">
                    El trading de futuros con apalancamiento es <strong>extremadamente riesgoso</strong>.
                    Puedes perder todo tu capital rápidamente.
                  </p>
                  <ul className="space-y-1 text-sm text-yellow-700">
                    <li>• <strong>Leverage amplifica pérdidas:</strong> Con 10x leverage, una caída del 10% = liquidación total</li>
                    <li>• <strong>Usa Stop Loss:</strong> Siempre limita tus pérdidas potenciales</li>
                    <li>• <strong>Empieza con leverage bajo:</strong> Prueba con 2x-5x antes de usar leverage alto</li>
                    <li>• <strong>No uses todo tu capital:</strong> Nunca arriesgues más del 1-5% por posición</li>
                    <li>• <strong>Esto es práctica:</strong> Aprende aquí antes de arriesgar dinero real</li>
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2 Teaser */}
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            🔮 Coming in Phase 2: AI Trading Assistant
          </h3>
          <p className="text-purple-800 mb-3">
            Get personalized trading insights and analysis powered by Claude AI.
          </p>
          <ul className="space-y-1 text-sm text-purple-700">
            <li>• Portfolio analysis and risk assessment</li>
            <li>• Trade suggestions based on market conditions</li>
            <li>• Educational explanations of trading concepts</li>
            <li>• Post-trade reviews and learning feedback</li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600">
            🎓 Educational trading simulator • Built with Astro + React + TypeScript
          </p>
          <p className="text-center text-xs text-gray-500 mt-2">
            All trades are simulated • No real money involved • Data persisted in localStorage
          </p>
        </div>
      </footer>
    </div>
  );
}
