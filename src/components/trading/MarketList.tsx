/**
 * MarketList Component
 *
 * Displays a list of cryptocurrencies with real-time prices from CoinGecko.
 * Updates automatically every 60 seconds.
 * Includes quick signals with technical indicators based on selected timeframe.
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Target, Clock } from 'lucide-react';
import type { Asset } from '../../types/trading';
import { getMarketPrices, clearPriceCache, getHistoricalCandles } from '../../lib/priceService';
import { formatCurrency, formatPercentage, formatRelativeTime } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { calculateQuickSignal, calculateQuickSignalFromCandles } from '../../lib/quickSignals';
import type { CandlestickData } from '../../lib/priceHistory';

interface MarketListProps {
  onSelectAsset?: (asset: Asset) => void;
  selectedAssetId?: string;
}

type SignalTimeframe = '1m' | '3m' | '5m' | '15m' | '30m' | '1h';

export function MarketList({ onSelectAsset, selectedAssetId }: MarketListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [refreshing, setRefreshing] = useState(false);
  const [showSignals, setShowSignals] = useState(false);
  const [signalTimeframe, setSignalTimeframe] = useState<SignalTimeframe>('5m');
  const [candleDataMap, setCandleDataMap] = useState<Map<string, CandlestickData[]>>(new Map());
  const [loadingSignals, setLoadingSignals] = useState(false);

  // Load market prices
  const loadPrices = async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setRefreshing(true);
        clearPriceCache();
      } else {
        setLoading(true);
      }

      const data = await getMarketPrices(!forceRefresh);
      setAssets(data);
      setLastUpdate(Date.now());

    } catch (err) {
      console.error('Error loading market prices:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load candle data for all assets when signals are enabled
  const loadCandleData = async () => {
    if (!showSignals || assets.length === 0) {
      return;
    }

    setLoadingSignals(true);

    try {
      const candleMap = new Map<string, CandlestickData[]>();

      // Load candles for top assets (limit to avoid rate limits)
      const assetsToLoad = assets.slice(0, 12);

      await Promise.all(
        assetsToLoad.map(async (asset) => {
          try {
            const candles = await getHistoricalCandles(asset.id, signalTimeframe, 100);

            if (candles && candles.length > 0) {
              candleMap.set(asset.id, candles);
            }
          } catch (err) {
            console.warn(`Failed to load candles for ${asset.symbol}:`, err);
          }
        })
      );

      setCandleDataMap(candleMap);
    } catch (err) {
      console.error('Error loading candle data:', err);
    } finally {
      setLoadingSignals(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPrices();
  }, []);

  // OPTIMIZADO PARA SCALPING: Auto-refresh basado en timeframe
  useEffect(() => {
    // Determinar intervalo según timeframe seleccionado
    let refreshInterval = 60 * 1000; // Default: 60 segundos

    if (showSignals) {
      // Para scalping, ajustar según timeframe
      switch (signalTimeframe) {
        case '1m':
          refreshInterval = 5 * 1000; // 5 segundos para 1m
          break;
        case '3m':
          refreshInterval = 10 * 1000; // 10 segundos para 3m
          break;
        case '5m':
          refreshInterval = 15 * 1000; // 15 segundos para 5m
          break;
        case '15m':
          refreshInterval = 30 * 1000; // 30 segundos para 15m
          break;
        case '30m':
          refreshInterval = 45 * 1000; // 45 segundos para 30m
          break;
        case '1h':
          refreshInterval = 60 * 1000; // 60 segundos para 1h
          break;
      }
    }

    const interval = setInterval(() => {
      loadPrices();
      // Si las señales están activas, también actualizar las velas
      if (showSignals) {
        loadCandleData();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [showSignals, signalTimeframe]); // Re-crear interval cuando cambia timeframe

  // Load candle data when signals are enabled or timeframe changes
  useEffect(() => {
    if (showSignals) {
      loadCandleData();
    }
  }, [showSignals, signalTimeframe, assets]);

  const handleRefresh = () => {
    loadPrices(true);
  };

  const handleAssetClick = (asset: Asset) => {
    if (onSelectAsset) {
      onSelectAsset(asset);
    }
  };

  if (loading && assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading market data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="primary" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timeframes: SignalTimeframe[] = ['1m', '3m', '5m', '15m', '30m', '1h'];

  // Calcular intervalo de actualización actual
  const getRefreshInterval = () => {
    if (!showSignals) return 60;
    switch (signalTimeframe) {
      case '1m': return 5;
      case '3m': return 10;
      case '5m': return 15;
      case '15m': return 30;
      case '30m': return 45;
      case '1h': return 60;
      default: return 60;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between mb-1.5">
          <CardTitle className="text-base">📊 Market Prices</CardTitle>
          <div className="flex items-center space-x-1.5">
            {showSignals && (
              <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                🔄{getRefreshInterval()}s
              </span>
            )}
            <span className="text-[10px] text-gray-500">
              {formatRelativeTime(lastUpdate)}
            </span>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              loading={refreshing}
              className="!p-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Signals Toggle - Compacto */}
        <div className="pt-1.5 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-gray-700">Señales</span>
              {loadingSignals && <RefreshCw className="w-2.5 h-2.5 animate-spin text-blue-600" />}
            </div>
            <button
              onClick={() => setShowSignals(!showSignals)}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                ${showSignals ? 'bg-blue-600' : 'bg-gray-300'}
              `}
              aria-label="Toggle signals"
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform
                  ${showSignals ? 'translate-x-5' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>

          {/* Timeframe Selector */}
          {showSignals && (
            <div className="mt-1.5 space-y-0.5">
              <div className="flex items-center space-x-1">
                <Clock className="w-2.5 h-2.5 text-gray-500" />
                <span className="text-[10px] font-medium text-gray-600">TF:</span>
              </div>
              <div className="flex flex-wrap gap-0.5">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSignalTimeframe(tf)}
                    className={`
                      px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors
                      ${signalTimeframe === tf
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                    `}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">
                💡 19 INDICADORES: RSI • Stoch • CCI • Williams%R • ROC • MFI • EMA • MACD • SAR • Supertrend • BB • OBV • VWAP
              </p>
              <p className="text-[10px] text-green-700 font-medium mt-0.5">
                📊 {candleDataMap.size}/{Math.min(12, assets.length)} assets • Q{'>'}45 OK • Refresh {getRefreshInterval()}s
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="!p-0">
        <div className={`divide-y divide-gray-200 overflow-y-auto scroll-smooth overflow-x-hidden ${showSignals ? 'min-h-[55vh] max-h-[75vh]' : 'min-h-[60vh] max-h-[75vh]'}`}>
          {assets.map((asset) => {
            const isPositive = asset.price_change_percentage_24h >= 0;
            const isSelected = asset.id === selectedAssetId;

            // Calculate signal
            let signal = null;
            if (showSignals) {
              const candleData = candleDataMap.get(asset.id);
              if (candleData && candleData.length > 0) {
                signal = calculateQuickSignalFromCandles(candleData, asset);
              } else {
                signal = calculateQuickSignal(asset);
              }
            }

            return (
              <div
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className={`
                  flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors
                  ${showSignals ? 'p-2' : 'p-3'}
                  ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''}
                `}
              >
                {/* Left: Asset Info */}
                <div className={`flex items-center flex-1 ${showSignals ? 'space-x-1.5' : 'space-x-2'}`}>
                  {asset.image && (
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className={showSignals ? 'w-5 h-5 rounded-full' : 'w-6 h-6 rounded-full'}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-gray-900 truncate ${showSignals ? 'text-xs' : 'text-sm'}`}>
                      {asset.name}
                    </p>
                    <p className={`text-gray-500 ${showSignals ? 'text-[10px]' : 'text-xs'}`}>
                      {asset.symbol}
                    </p>

                    {/* Signal Badge with Gradient + Quality Score - Compacto */}
                    {signal && (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center space-x-1">
                          <span
                            className={`
                              inline-block px-1.5 py-0.5 rounded-full text-[10px] font-bold
                              ${signal.bgGradient} ${signal.color}
                              ${signal.type === 'extreme-buy' || signal.type === 'extreme-sell' || signal.type === 'strong-buy' || signal.type === 'strong-sell'
                                ? 'shadow-sm ring-1 ring-offset-0 ' +
                                  (signal.type === 'extreme-buy' || signal.type === 'strong-buy' ? 'ring-green-500' : 'ring-red-500')
                                : 'shadow-sm'}
                            `}
                            title={`Confirmaciones:\n${signal.confirmations.join('\n')}\n\nAdvertencias:\n${signal.warnings.join('\n')}`}
                          >
                            {signal.emoji} {signal.label}
                          </span>
                          {/* Quality Score Badge - Más pequeño */}
                          <span
                            className={`
                              px-1 py-0.5 rounded text-[9px] font-bold
                              ${signal.qualityScore >= 80
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : signal.qualityScore >= 60
                                ? 'bg-green-100 text-green-800 border border-green-300'
                                : signal.qualityScore >= 40
                                ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                : 'bg-gray-100 text-gray-600 border border-gray-300'
                              }
                            `}
                            title={`Quality Score: ${signal.qualityScore}/100`}
                          >
                            Q{signal.qualityScore}
                          </span>
                        </div>
                        {/* Confirmations count - Más compacto */}
                        <div className="text-[9px] text-gray-600">
                          ✓{signal.confirmations.length}
                          {signal.warnings.length > 0 && ` • ⚠️${signal.warnings.length}`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Price Info */}
                <div className={`text-right ${showSignals ? 'ml-1' : 'ml-2'}`}>
                  <p className={`font-semibold text-gray-900 ${showSignals ? 'text-xs' : 'text-sm'}`}>
                    {formatCurrency(asset.current_price)}
                  </p>
                  <div className="flex items-center justify-end space-x-0.5">
                    {isPositive ? (
                      <TrendingUp className={showSignals ? 'w-2.5 h-2.5 text-green-600' : 'w-3 h-3 text-green-600'} />
                    ) : (
                      <TrendingDown className={showSignals ? 'w-2.5 h-2.5 text-red-600' : 'w-3 h-3 text-red-600'} />
                    )}
                    <span className={`${isPositive ? 'profit' : 'loss'} ${showSignals ? 'text-[10px]' : 'text-xs'}`}>
                      {formatPercentage(asset.price_change_percentage_24h)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {error && assets.length > 0 && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs text-yellow-800">
            ⚠️ {error} Showing cached data.
          </p>
        </div>
      )}
    </Card>
  );
}
