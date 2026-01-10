/**
 * usePriceHistory Hook
 *
 * Hook personalizado para manejar datos históricos de precios.
 * Genera y actualiza candlestick data en tiempo real.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Asset } from '../types/trading';
import type { CandlestickData, VolumeData } from '../lib/priceHistory';
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

  // Generar datos iniciales
  const generateData = useCallback(() => {
    if (!asset) {
      console.log('📊 usePriceHistory: No asset provided');
      setCandlestickData([]);
      setVolumeData([]);
      setIsLoading(false);
      return;
    }

    console.log('📊 usePriceHistory: Generating data for', asset.symbol);
    setIsLoading(true);

    // Simular delay de carga
    setTimeout(() => {
      const basePrice = asset.current_price;
      console.log('📊 usePriceHistory: Base price:', basePrice);

      const candles = generateCandlestickData(basePrice, periods, timeframe, volatility);
      const volume = generateVolumeData(candles);

      console.log('📊 usePriceHistory: Generated', {
        candlesCount: candles.length,
        volumeCount: volume.length,
        firstCandle: candles[0],
        lastCandle: candles[candles.length - 1]
      });

      setCandlestickData(candles);
      setVolumeData(volume);
      setIsLoading(false);
    }, 300);
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
