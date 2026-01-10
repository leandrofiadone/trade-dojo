/**
 * CandlestickChart Component
 *
 * Gráfico profesional de velas japonesas usando Lightweight Charts.
 * Incluye:
 * - Candlesticks (velas)
 * - Volumen
 * - Moving averages
 * - Controles de timeframe
 * - Crosshair para ver precios
 */

import React, { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import type { CandlestickData, VolumeData } from '../../lib/priceHistory';
import {
  calculateMovingAverage,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic
} from '../../lib/priceHistory';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendingUp, TrendingDown, Maximize2, RefreshCw, Info } from 'lucide-react';

interface CandlestickChartProps {
  data: CandlestickData[];
  volumeData?: VolumeData[];
  asset: string;
  currentPrice?: number;
  priceChange24h?: number;
  currentTimeframe?: string;
  onTimeframeChange?: (timeframe: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

export function CandlestickChart({
  data,
  volumeData,
  asset,
  currentPrice,
  priceChange24h = 0,
  currentTimeframe = '5m',
  onTimeframeChange,
  onRefresh,
  isLoading = false
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const indicatorSeriesRefs = useRef<any[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Indicators state
  const [activeIndicators, setActiveIndicators] = useState<{
    sma20: boolean;
    sma50: boolean;
    ema12: boolean;
    ema26: boolean;
    rsi: boolean;
    macd: boolean;
    bollinger: boolean;
    stochastic: boolean;
  }>({
    sma20: false,
    sma50: false,
    ema12: false,
    ema26: false,
    rsi: false,
    macd: false,
    bollinger: false,
    stochastic: false
  });

  const [showInfo, setShowInfo] = useState(false);

  // Create chart once on mount
  useEffect(() => {
    console.log('🔄 Chart creation useEffect triggered', {
      hasRef: !!chartContainerRef.current,
      refElement: chartContainerRef.current,
      isFullscreen
    });

    if (!chartContainerRef.current) {
      console.log('❌ Chart container ref is null, cannot create chart');
      return;
    }

    console.log('📊 Creating chart instance');

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: isFullscreen ? 600 : 400,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#9B7DFF',
          width: 1,
          style: 3,
          labelBackgroundColor: '#9B7DFF',
        },
        horzLine: {
          color: '#9B7DFF',
          width: 1,
          style: 3,
          labelBackgroundColor: '#9B7DFF',
        },
      },
      rightPriceScale: {
        borderColor: '#cccccc',
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
      },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? 600 : 400,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    console.log('✅ Chart created');

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        candlestickSeriesRef.current = null;
      }
    };
  }, [isFullscreen, data.length > 0]);

  // Update data when it changes
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current) {
      return;
    }

    if (data.length === 0) {
      return;
    }

    try {
      setError(null);
      console.log('📊 Updating chart data with', data.length, 'candles');

      const chart = chartRef.current;

      // Limpiar volumen anterior
      if (volumeSeriesRef.current) {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      }

      // Limpiar indicadores anteriores
      indicatorSeriesRefs.current.forEach(series => {
        try {
          chart.removeSeries(series);
        } catch (e) {
          // Ignore if series already removed
        }
      });
      indicatorSeriesRefs.current = [];

      // Actualizar velas
      candlestickSeriesRef.current.setData(data);

      // Agregar volumen
      if (volumeData && volumeData.length > 0) {
        const volumeSeries = chart.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });

        volumeSeries.setData(volumeData);
        volumeSeriesRef.current = volumeSeries;
      }

      // Agregar indicadores
      if (activeIndicators.sma20) {
        const sma20Data = calculateMovingAverage(data, 20);
        const sma20Series = chart.addLineSeries({
          color: '#2196F3',
          lineWidth: 2,
          title: 'SMA 20'
        });
        sma20Series.setData(sma20Data);
        indicatorSeriesRefs.current.push(sma20Series);
      }

      if (activeIndicators.sma50) {
        const sma50Data = calculateMovingAverage(data, 50);
        const sma50Series = chart.addLineSeries({
          color: '#FF9800',
          lineWidth: 2,
          title: 'SMA 50'
        });
        sma50Series.setData(sma50Data);
        indicatorSeriesRefs.current.push(sma50Series);
      }

      if (activeIndicators.ema12) {
        const ema12Data = calculateEMA(data, 12);
        const ema12Series = chart.addLineSeries({
          color: '#9C27B0',
          lineWidth: 2,
          title: 'EMA 12'
        });
        ema12Series.setData(ema12Data);
        indicatorSeriesRefs.current.push(ema12Series);
      }

      if (activeIndicators.ema26) {
        const ema26Data = calculateEMA(data, 26);
        const ema26Series = chart.addLineSeries({
          color: '#E91E63',
          lineWidth: 2,
          title: 'EMA 26'
        });
        ema26Series.setData(ema26Data);
        indicatorSeriesRefs.current.push(ema26Series);
      }

      if (activeIndicators.bollinger) {
        const bbData = calculateBollingerBands(data, 20, 2);
        const upperBand = chart.addLineSeries({
          color: '#9E9E9E',
          lineWidth: 1,
          lineStyle: 2,
          title: 'BB Upper'
        });
        const middleBand = chart.addLineSeries({
          color: '#607D8B',
          lineWidth: 1,
          title: 'BB Middle'
        });
        const lowerBand = chart.addLineSeries({
          color: '#9E9E9E',
          lineWidth: 1,
          lineStyle: 2,
          title: 'BB Lower'
        });
        upperBand.setData(bbData.upper);
        middleBand.setData(bbData.middle);
        lowerBand.setData(bbData.lower);
        indicatorSeriesRefs.current.push(upperBand, middleBand, lowerBand);
      }

      chart.timeScale().scrollToRealTime();

      console.log('✅ Chart data updated');
    } catch (err) {
      console.error('❌ Error updating chart:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [data, volumeData, activeIndicators]);

  const handleTimeframeClick = (timeframe: Timeframe) => {
    if (onTimeframeChange) {
      onTimeframeChange(timeframe);
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

  const isPositive = priceChange24h >= 0;

  // Show error state if something went wrong
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Chart</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">❌ Failed to load chart</p>
            <p className="text-sm text-red-600 mt-2">{error}</p>
            {onRefresh && (
              <Button onClick={onRefresh} variant="primary" size="sm" className="mt-4">
                Try Again
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Show loading state if no data yet
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 {asset} - Loading Chart...</CardTitle>
        </CardHeader>
        <div className="px-6 pb-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={isFullscreen ? 'fixed inset-4 z-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Asset info */}
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>📊 {asset}</span>
              {currentPrice && (
                <span className="text-2xl font-bold ml-4">
                  ${currentPrice.toFixed(2)}
                </span>
              )}
              {priceChange24h !== 0 && (
                <span className={`text-sm flex items-center ${isPositive ? 'profit' : 'loss'}`}>
                  {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {isPositive ? '+' : ''}{priceChange24h.toFixed(2)}%
                </span>
              )}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Datos históricos simulados • {data.length} velas
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="sm"
                className="!p-2"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={handleFullscreen}
              variant="ghost"
              size="sm"
              className="!p-2"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Chart */}
      <div className="px-6 relative">
        <div ref={chartContainerRef} className="w-full" style={{ height: '400px' }} />
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Cargando datos...</span>
            </div>
          </div>
        )}
      </div>

      {/* Timeframe selector */}
      <div className="px-6 pb-6 pt-4">
        <div className="flex justify-center space-x-2">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => handleTimeframeClick(tf)}
              className={`
                px-3 py-1.5 text-sm font-medium rounded transition-colors
                ${currentTimeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Vela Alcista (Precio subió)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Vela Bajista (Precio bajó)</span>
          </div>
        </div>

        {/* Indicators Section */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700">📊 Indicadores Técnicos</h4>
            <Button
              onClick={() => setShowInfo(!showInfo)}
              variant="ghost"
              size="sm"
              className="!p-1"
            >
              <Info className="w-4 h-4" />
            </Button>
          </div>

          {/* Indicator Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, sma20: !prev.sma20 }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.sma20
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              SMA 20
            </button>
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, sma50: !prev.sma50 }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.sma50
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              SMA 50
            </button>
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, ema12: !prev.ema12 }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.ema12
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              EMA 12
            </button>
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, ema26: !prev.ema26 }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.ema26
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              EMA 26
            </button>
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, bollinger: !prev.bollinger }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.bollinger
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Bollinger Bands
            </button>
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, rsi: !prev.rsi }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.rsi
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              RSI (14)
            </button>
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, macd: !prev.macd }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.macd
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              MACD
            </button>
            <button
              onClick={() => setActiveIndicators(prev => ({ ...prev, stochastic: !prev.stochastic }))}
              className={`
                px-3 py-2 text-xs font-medium rounded transition-colors
                ${activeIndicators.stochastic
                  ? 'bg-teal-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Stochastic
            </button>
          </div>
        </div>

        {/* Educational Info Panel */}
        {showInfo && (
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-bold text-gray-800 mb-3">📚 Guía de Indicadores Técnicos</h4>

            <div className="space-y-3 text-xs">
              <div className="bg-white p-3 rounded">
                <p className="font-semibold text-blue-700">SMA (Simple Moving Average)</p>
                <p className="text-gray-700 mt-1">Promedio simple de precios. SMA 20 usa los últimos 20 períodos. Identifica tendencias: precio arriba del SMA = tendencia alcista, debajo = bajista.</p>
              </div>

              <div className="bg-white p-3 rounded">
                <p className="font-semibold text-purple-700">EMA (Exponential Moving Average)</p>
                <p className="text-gray-700 mt-1">Similar al SMA pero da más peso a precios recientes. Reacciona más rápido a cambios. EMA 12 y 26 se usan en el MACD.</p>
              </div>

              <div className="bg-white p-3 rounded">
                <p className="font-semibold text-gray-700">Bollinger Bands</p>
                <p className="text-gray-700 mt-1">3 líneas: media (SMA 20) y dos bandas de desviación estándar. Precio cerca de banda superior = posible sobrecompra. Cerca de inferior = posible sobreventa. Bandas estrechas = baja volatilidad, amplias = alta volatilidad.</p>
              </div>

              <div className="bg-white p-3 rounded">
                <p className="font-semibold text-green-700">RSI (Relative Strength Index)</p>
                <p className="text-gray-700 mt-1">Oscila entre 0-100. RSI {'>'} 70 = sobrecomprado (posible corrección a la baja). RSI {'<'} 30 = sobrevendido (posible rebote al alza). Mide la fuerza del momentum.</p>
              </div>

              <div className="bg-white p-3 rounded">
                <p className="font-semibold text-indigo-700">MACD (Moving Average Convergence Divergence)</p>
                <p className="text-gray-700 mt-1">Muestra la relación entre EMA 12 y EMA 26. Línea MACD cruza arriba de línea Signal = señal de compra. Cruza abajo = señal de venta. Histograma muestra la fuerza del momentum.</p>
              </div>

              <div className="bg-white p-3 rounded">
                <p className="font-semibold text-teal-700">Stochastic Oscillator</p>
                <p className="text-gray-700 mt-1">Compara el precio de cierre con el rango de precios reciente (0-100). {'>'} 80 = sobrecomprado, {'<'} 20 = sobrevendido. %K (línea rápida) y %D (línea lenta, promedio de %K).</p>
              </div>
            </div>

            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded">
              <p className="text-xs text-yellow-900">
                <strong>⚠️ Importante:</strong> Los indicadores son herramientas de ayuda, no garantías. Siempre combina múltiples indicadores y considera el contexto del mercado. Practica aquí antes de usar dinero real.
              </p>
            </div>
          </div>
        )}

        {/* Educational tip */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>Cómo leer velas:</strong> Cada vela muestra 4 precios:
            <strong> Apertura, Máximo, Mínimo y Cierre</strong>.
            Verde = el precio subió en ese periodo. Rojo = el precio bajó.
          </p>
        </div>
      </div>
    </Card>
  );
}
