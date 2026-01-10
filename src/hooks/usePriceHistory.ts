/**
 * usePriceHistory Hook
 *
 * Hook personalizado para manejar datos históricos de precios.
 * Obtiene datos REALES de Binance en vez de generar datos simulados.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Asset } from '../types/trading';
import type { CandlestickData, VolumeData } from '../lib/priceHistory';
import { getHistoricalCandles } from '../lib/priceService';
import {
  generateCandlestickData,
  generateVolumeData,
  updateCandlestickData
} from '../lib/priceHistory';

interface UsePriceHistoryOptions {
  asset?: Asset;
  periods?: number;
  timeframe?: number; // en minutos
  volatility?: number;
}

interface UsePriceHistoryReturn {
  candlestickData: CandlestickData[];
  volumeData: VolumeData[];
  isLoading: boolean;
  refresh: () => void;
  updatePrice: (newPrice: number) => void;
}

export function usePriceHistory({
  asset,
  periods = 100,
  timeframe = 5,
  volatility = 0.02
}: UsePriceHistoryOptions = {}): UsePriceHistoryReturn {
  const [candlestickData, setCandlestickData] = useState<CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mapear minutos a intervalos de Binance
  const getInterval = (minutes: number): '1m' | '5m' | '15m' | '1h' | '4h' | '1d' => {
    if (minutes === 1) return '1m';
    if (minutes === 5) return '5m';
    if (minutes === 15) return '15m';
    if (minutes === 60) return '1h';
    if (minutes === 240) return '4h';
    if (minutes === 1440) return '1d';
    return '5m'; // default
  };

  // Obtener datos reales de Binance
  const generateData = useCallback(async () => {
    if (!asset) {
      console.log('📊 usePriceHistory: No asset provided');
      setCandlestickData([]);
      setVolumeData([]);
      setIsLoading(false);
      return;
    }

    console.log('📊 usePriceHistory: Fetching REAL data for', asset.symbol, 'timeframe:', timeframe);
    setIsLoading(true);

    try {
      const interval = getInterval(timeframe);
      const realCandles = await getHistoricalCandles(asset.id, interval, periods);

      if (realCandles.length === 0) {
        console.log('⚠️ No real data, falling back to simulated data');
        const basePrice = asset.current_price;
        const candles = generateCandlestickData(basePrice, periods, timeframe, volatility);
        const volume = generateVolumeData(candles);
        setCandlestickData(candles);
        setVolumeData(volume);
      } else {
        // Transformar datos de Binance al formato esperado
        const candles: CandlestickData[] = realCandles.map(c => ({
          time: c.time,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close
        }));

        const volume: VolumeData[] = realCandles.map(c => ({
          time: c.time,
          value: c.volume,
          color: c.close >= c.open ? '#26a69a' : '#ef5350'
        }));

        console.log('📊 usePriceHistory: Got REAL data', {
          candlesCount: candles.length,
          volumeCount: volume.length,
          interval,
          firstCandle: candles[0],
          lastCandle: candles[candles.length - 1]
        });

        setCandlestickData(candles);
        setVolumeData(volume);
      }
    } catch (error) {
      console.error('❌ Error fetching real data:', error);
      // Fallback a datos simulados
      const basePrice = asset.current_price;
      const candles = generateCandlestickData(basePrice, periods, timeframe, volatility);
      const volume = generateVolumeData(candles);
      setCandlestickData(candles);
      setVolumeData(volume);
    }

    setIsLoading(false);
  }, [asset, periods, timeframe, volatility]);

  // Generar datos cuando cambia el asset
  useEffect(() => {
    generateData();
  }, [generateData]);

  // Función para refrescar datos
  const refresh = useCallback(() => {
    generateData();
  }, [generateData]);

  // Función para actualizar con nuevo precio
  const updatePrice = useCallback((newPrice: number) => {
    setCandlestickData(prev => {
      if (prev.length === 0) return prev;
      return updateCandlestickData(prev, newPrice, timeframe);
    });
  }, [timeframe]);

  return {
    candlestickData,
    volumeData,
    isLoading,
    refresh,
    updatePrice
  };
}
