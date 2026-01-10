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

        // Alert user
        const message = reason === 'LIQUIDATION'
          ? `⚠️ LIQUIDADO! Tu posición ${position.side} ${position.assetSymbol} fue liquidada.\nPérdida: ${closedPosition.realizedPnL?.toFixed(2)} USD`
          : `✅ ${reason === 'STOP_LOSS' ? 'Stop Loss' : 'Take Profit'} ejecutado!\n${position.side} ${position.assetSymbol}\nP&L: ${closedPosition.realizedPnL?.toFixed(2)} USD`;

        alert(message);
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

    // Show success message (you could add a toast notification here)
    alert(`✅ ${type.toUpperCase()} order executed!\n\n${quantity.toFixed(8)} ${asset.symbol} @ ${asset.current_price.toFixed(2)} USD`);
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

    alert(`✅ Posición ${formData.side} abierta!\n\n${asset.symbol} ${formData.leverage}x\nMargin: $${formData.margin}\nLiquidación: $${position.liquidationPrice.toFixed(2)}`);
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
    alert(`✅ Posición cerrada!\n\n${position.side} ${position.assetSymbol}\nP&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${closedPosition.unrealizedPnLPercentage.toFixed(2)}%)`);
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

    alert('✅ All data has been reset!');
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary Cards */}
        <div className="mb-8">
          <PortfolioSummary
            portfolio={portfolio}
            totalTrades={trades.length}
            initialBalance={initialBalance}
          />
        </div>

        {/* Trading Mode Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('spot')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'spot'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                💰 Spot Trading
              </button>
              <button
                onClick={() => setActiveTab('futures')}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === 'futures'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                ⚡ Futures Trading (Leverage)
              </button>
            </nav>
          </div>
        </div>

        {/* Candlestick Chart */}
        {selectedAsset && (
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

        {!selectedAsset && (
          <div className="mb-8 p-8 bg-white rounded-lg shadow-md border border-gray-200 text-center">
            <p className="text-gray-600 font-medium">📊 Selecciona una criptomoneda del Market List para ver el gráfico de velas</p>
            <p className="text-sm text-gray-500 mt-2">Haz click en cualquier crypto de la lista</p>
          </div>
        )}

        {/* Main Grid - Spot Trading */}
        {activeTab === 'spot' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Market List */}
              <div className="lg:col-span-1">
                <MarketList
                  onSelectAsset={setSelectedAsset}
                  selectedAssetId={selectedAsset?.id}
                />
              </div>

              {/* Middle Column: Trading Form */}
              <div className="lg:col-span-1">
                <TradingForm
                  assets={assets}
                  portfolio={portfolio}
                  selectedAsset={selectedAsset}
                  onTrade={handleTrade}
                />
              </div>

              {/* Right Column: Portfolio */}
              <div className="lg:col-span-1">
                <Portfolio portfolio={portfolio} />
              </div>
            </div>

            {/* Trade History */}
            <div className="mt-6">
              <TradeHistory trades={trades} />
            </div>
          </>
        )}

        {/* Main Grid - Futures Trading */}
        {activeTab === 'futures' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Market List */}
              <div className="lg:col-span-1">
                <MarketList
                  onSelectAsset={setSelectedAsset}
                  selectedAssetId={selectedAsset?.id}
                />
              </div>

              {/* Middle Column: Futures Trading Form */}
              <div className="lg:col-span-1">
                <FuturesTradingForm
                  assets={assets}
                  selectedAsset={selectedAsset}
                  availableBalance={portfolio.balance}
                  onOpenPosition={handleOpenPosition}
                />
              </div>

              {/* Right Column: Futures Positions */}
              <div className="lg:col-span-1">
                <FuturesPositionList
                  positions={futuresPositions.filter(p => p.status === 'OPEN')}
                  onClosePosition={handleClosePosition}
                />
              </div>
            </div>

            {/* Educational Note for Futures */}
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
          </>
        )}

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
