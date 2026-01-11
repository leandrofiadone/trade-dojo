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
import { RefreshCw, AlertCircle, Wallet, DollarSign, Activity, TrendingUp } from 'lucide-react';
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

// Utils
import { formatCurrency, formatPercentage } from '../utils/formatters';

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

      {/* Header - Rediseño: Inline stats con separadores, texto más legible */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg sticky top-0 z-10">
        <div className="mx-auto px-3 py-1.5">
          <div className="flex items-center justify-between gap-4">
            {/* Logo + Title */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-lg">📈</span>
              <h1 className="text-sm font-bold hidden sm:inline">Trading Dojo</h1>
            </div>

            {/* Portfolio Stats - Inline con separadores */}
            <div className="flex items-center gap-3 text-xs flex-1 overflow-x-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-gray-400">💰</span>
                <span className="font-semibold">{formatCurrency(portfolio.balance)}</span>
              </div>

              <span className="text-gray-600">|</span>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-gray-400">📊</span>
                <span className="font-semibold">{formatCurrency(portfolio.totalInvested)}</span>
              </div>

              <span className="text-gray-600">|</span>

              <div className={`flex items-center gap-1.5 shrink-0 ${
                (portfolio.totalValue - initialBalance) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                <span>{(portfolio.totalValue - initialBalance) >= 0 ? '📈' : '📉'}</span>
                <span className="font-bold">
                  {formatCurrency(portfolio.totalValue - initialBalance)}
                  {' '}
                  ({formatPercentage(((portfolio.totalValue - initialBalance) / initialBalance) * 100)})
                </span>
              </div>

              <span className="text-gray-600">|</span>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-gray-400">🎯</span>
                <span className="font-semibold">{trades.length} trades</span>
              </div>
            </div>

            {/* Spot/Futures Tabs */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setActiveTab('spot')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'spot'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Spot
              </button>
              <button
                onClick={() => setActiveTab('futures')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'futures'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Futures
              </button>
            </div>

            {/* Reset */}
            <div className="shrink-0">
              {showResetConfirm ? (
                <div className="flex items-center gap-1 bg-yellow-900 border border-yellow-600 rounded px-2 py-1">
                  <span className="text-xs text-yellow-200">Sure?</span>
                  <button
                    onClick={handleReset}
                    className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 font-semibold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="text-xs text-gray-300 px-2 py-0.5 hover:text-white"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleReset}
                  className="text-xs text-gray-400 hover:text-white px-2 py-1"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto px-2 sm:px-3 lg:px-4 py-1">

        {/* Mobile Navigation Tabs - Solo visible en mobile */}
        {isMobile && (
          <div className="mb-3 sticky top-7 z-20 bg-gray-50 -mx-2 px-2 py-1.5 shadow-md">
            <nav className="flex space-x-0.5 bg-white rounded p-0.5 shadow-sm" role="navigation" aria-label="Mobile view selection">
              <button
                onClick={() => setMobileView('chart')}
                aria-label="View price chart"
                aria-pressed={mobileView === 'chart'}
                className={`
                  flex-1 py-1.5 px-1 rounded text-[9px] font-semibold transition-all duration-150
                  flex flex-col items-center justify-center space-y-0.5
                  ${mobileView === 'chart'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-sm" aria-hidden="true">📊</span>
                <span>Chart</span>
              </button>

              <button
                onClick={() => setMobileView('market')}
                aria-label="View market list"
                aria-pressed={mobileView === 'market'}
                className={`
                  flex-1 py-1.5 px-1 rounded text-[9px] font-semibold transition-all duration-150
                  flex flex-col items-center justify-center space-y-0.5
                  ${mobileView === 'market'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-sm" aria-hidden="true">💹</span>
                <span>Market</span>
              </button>

              <button
                onClick={() => setMobileView('trade')}
                aria-label="View trading form"
                aria-pressed={mobileView === 'trade'}
                className={`
                  flex-1 py-1.5 px-1 rounded text-[9px] font-semibold transition-all duration-150
                  flex flex-col items-center justify-center space-y-0.5
                  ${mobileView === 'trade'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-sm" aria-hidden="true">🎯</span>
                <span>Trade</span>
              </button>

              <button
                onClick={() => setMobileView('portfolio')}
                aria-label="View portfolio"
                aria-pressed={mobileView === 'portfolio'}
                className={`
                  flex-1 py-1.5 px-1 rounded text-[9px] font-semibold transition-all duration-150
                  flex flex-col items-center justify-center space-y-0.5
                  ${mobileView === 'portfolio'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-sm" aria-hidden="true">💼</span>
                <span>Portfolio</span>
              </button>

              <button
                onClick={() => setMobileView('signals')}
                aria-label="View trading signals"
                aria-pressed={mobileView === 'signals'}
                className={`
                  flex-1 py-1.5 px-1 rounded text-[9px] font-semibold transition-all duration-150
                  flex flex-col items-center justify-center space-y-0.5
                  ${mobileView === 'signals'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-sm" aria-hidden="true">🎯</span>
                <span>Signals</span>
              </button>
            </nav>
          </div>
        )}

        {/* Chart & Analysis Section - Desktop: 2 columnas lado a lado, Mobile: tabs separadas */}
        {selectedAsset && (
          <div className="mb-2">
            {/* Desktop: Grid de 2 columnas (Gráfico + Análisis) */}
            {!isMobile && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                {/* Gráfico - 2 columnas */}
                <div className="lg:col-span-2">
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

                {/* Análisis Técnico - 1 columna con scroll */}
                {candlestickData.length > 0 && (
                  <div className="lg:col-span-1">
                    <div className="max-h-[500px] overflow-y-auto sticky top-8">
                      <AdvancedTradingSignals
                        candleData={candlestickData}
                        volumeData={volumeData}
                        assetName={selectedAsset.name}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile: Vistas separadas según tab */}
            {isMobile && (
              <>
                {mobileView === 'chart' && (
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
                )}

                {mobileView === 'signals' && candlestickData.length > 0 && (
                  <AdvancedTradingSignals
                    candleData={candlestickData}
                    volumeData={volumeData}
                    assetName={selectedAsset.name}
                  />
                )}
              </>
            )}
          </div>
        )}

        {!selectedAsset && (!isMobile || mobileView === 'chart' || mobileView === 'signals') && (
          <div className="mb-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
            <p className="text-gray-600 text-xs font-medium">
              {!isMobile || mobileView === 'chart' ? '📊 Selecciona una criptomoneda para ver el gráfico y análisis' : '🎯 Selecciona una criptomoneda para ver señales'}
            </p>
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
              transition={{ duration: 0.2 }}
            >
              {/* Desktop: Grid de 3 columnas, Mobile: Una vista a la vez */}
              <div className={isMobile ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-3 gap-2'}>
              {/* Left Column: Market List - Sticky en desktop */}
              {(!isMobile || mobileView === 'market') && (
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-8">
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
                  <div className="lg:sticky lg:top-8">
                    <Portfolio portfolio={portfolio} />
                  </div>
                </div>
              )}
            </div>

              {/* Trade History - Solo en desktop o en vista portfolio en mobile */}
              {(!isMobile || mobileView === 'portfolio') && (
                <div className="mt-2">
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
              transition={{ duration: 0.2 }}
            >
              {/* Desktop: Grid de 3 columnas, Mobile: Una vista a la vez */}
              <div className={isMobile ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-3 gap-2'}>
              {/* Left Column: Market List - Sticky en desktop */}
              {(!isMobile || mobileView === 'market') && (
                <div className="lg:col-span-1">
                  <div className="lg:sticky lg:top-8">
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
                  <div className="lg:sticky lg:top-8">
                    <FuturesPositionList
                      positions={futuresPositions.filter(p => p.status === 'OPEN')}
                      onClosePosition={handleClosePosition}
                    />
                  </div>
                </div>
              )}
            </div>

              {/* Educational Note for Futures - Compacto */}
              {(!isMobile || mobileView === 'trade' || mobileView === 'portfolio') && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="text-[10px] font-semibold text-yellow-900 mb-0.5">
                    ⚠️ Advertencia: Trading con Leverage
                  </h3>
                  <p className="text-[9px] text-yellow-800 mb-0.5">
                    El trading de futuros es <strong>extremadamente riesgoso</strong>.
                  </p>
                  <ul className="space-y-0.5 text-[9px] text-yellow-700">
                    <li>• Leverage amplifica pérdidas: 10x = liquidación -10%</li>
                    <li>• Usa Stop Loss siempre</li>
                    <li>• Empieza con 2x-5x antes de leverage alto</li>
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 2 Teaser - Compacto */}
        <div className="mt-1.5 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded p-1.5">
          <p className="text-[8px] text-purple-900">
            <span className="font-semibold">🔮 Coming in Phase 2:</span> <span className="text-purple-700">AI Trading Assistant - Portfolio analysis, trade suggestions, educational insights powered by Claude AI.</span>
          </p>
        </div>
      </main>

      {/* Footer - Compacto */}
      <footer className="bg-white border-t border-gray-200 mt-2">
        <div className="mx-auto px-2 sm:px-3 lg:px-4 py-1">
          <p className="text-center text-[8px] text-gray-600">
            🎓 Educational trading simulator • Built with Astro + React + TypeScript • All trades are simulated
          </p>
        </div>
      </footer>
    </div>
  );
}
