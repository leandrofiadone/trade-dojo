/**
 * MarketSentiment Component
 *
 * Muestra el sentimiento del mercado basado en análisis técnico.
 */

import React from 'react';
import { motion } from 'framer-motion';
import type { CandlestickData, VolumeData } from '../../lib/priceHistory';
import { calculateMarketSentiment, type SentimentLevel } from '../../lib/technicalIndicators';

interface MarketSentimentProps {
  candleData: CandlestickData[];
  volumeData: VolumeData[];
  priceChange24h: number;
}

export function MarketSentiment({ candleData, volumeData, priceChange24h }: MarketSentimentProps) {
  const sentiment = calculateMarketSentiment(candleData, volumeData, priceChange24h);

  // Colores según sentimiento
  const colorMap: Record<SentimentLevel, { bg: string; text: string; border: string }> = {
    'extreme-greed': {
      bg: 'bg-gradient-to-r from-orange-500 to-red-500',
      text: 'text-white',
      border: 'border-red-500'
    },
    'greed': {
      bg: 'bg-gradient-to-r from-green-400 to-green-500',
      text: 'text-white',
      border: 'border-green-500'
    },
    'neutral': {
      bg: 'bg-gradient-to-r from-gray-400 to-gray-500',
      text: 'text-white',
      border: 'border-gray-500'
    },
    'fear': {
      bg: 'bg-gradient-to-r from-orange-400 to-orange-500',
      text: 'text-white',
      border: 'border-orange-500'
    },
    'extreme-fear': {
      bg: 'bg-gradient-to-r from-red-400 to-red-600',
      text: 'text-white',
      border: 'border-red-600'
    }
  };

  const colors = colorMap[sentiment.sentiment];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col space-y-2"
    >
      {/* Badge Principal */}
      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg ${colors.bg} ${colors.text} shadow-md`}>
        <span className="text-2xl">{sentiment.emoji}</span>
        <div className="flex flex-col">
          <span className="text-xs font-medium opacity-90">Sentimiento del Mercado</span>
          <span className="text-sm font-bold">{sentiment.label}</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${sentiment.score}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`h-full ${colors.bg}`}
        />
      </div>

      {/* Score numérico */}
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>😨 Miedo</span>
        <span className="font-semibold">{sentiment.score.toFixed(0)}/100</span>
        <span>🔥 Codicia</span>
      </div>
    </motion.div>
  );
}
