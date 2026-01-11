/**
 * TradingSignals Component
 *
 * Panel completo de señales de trading basado en análisis técnico.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import type { CandlestickData, VolumeData } from '../../lib/priceHistory';
import { generateTradingSignals, type SignalType } from '../../lib/technicalIndicators';

interface TradingSignalsProps {
  candleData: CandlestickData[];
  volumeData: VolumeData[];
  assetName?: string;
}

export function TradingSignals({ candleData, volumeData, assetName = 'Asset' }: TradingSignalsProps) {
  const signals = generateTradingSignals(candleData, volumeData);

  // Configuración visual según tipo de señal
  const signalConfig: Record<SignalType, {
    label: string;
    color: string;
    bgColor: string;
    icon: React.ReactNode;
    emoji: string;
  }> = {
    'strong-buy': {
      label: 'COMPRA FUERTE',
      color: 'text-green-700',
      bgColor: 'bg-green-100 border-green-300',
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      emoji: '🟢'
    },
    'buy': {
      label: 'COMPRA',
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      emoji: '🟢'
    },
    'neutral': {
      label: 'NEUTRAL',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100 border-gray-300',
      icon: <Minus className="w-5 h-5 text-gray-600" />,
      emoji: '⚪'
    },
    'sell': {
      label: 'VENTA',
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      icon: <TrendingDown className="w-5 h-5 text-red-500" />,
      emoji: '🔴'
    },
    'strong-sell': {
      label: 'VENTA FUERTE',
      color: 'text-red-700',
      bgColor: 'bg-red-100 border-red-300',
      icon: <TrendingDown className="w-6 h-6 text-red-600" />,
      emoji: '🔴'
    }
  };

  const config = signalConfig[signals.type];

  // Función para obtener icono de señal individual
  const getSignalIcon = (signal: 'buy' | 'sell' | 'neutral') => {
    if (signal === 'buy') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (signal === 'sell') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getSignalColor = (signal: 'buy' | 'sell' | 'neutral') => {
    if (signal === 'buy') return 'text-green-600 bg-green-50';
    if (signal === 'sell') return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">📊 Señales de Trading</h3>
          {assetName && (
            <span className="text-sm text-gray-600 font-medium">{assetName}</span>
          )}
        </div>

        {/* Señal Principal */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`p-4 rounded-lg border-2 ${config.bgColor} mb-4`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              {config.icon}
              <div>
                <p className="text-xs text-gray-600 font-medium">SEÑAL GENERAL</p>
                <p className={`text-lg font-bold ${config.color}`}>
                  {config.emoji} {config.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Confianza</p>
              <p className={`text-2xl font-bold ${config.color}`}>
                {signals.confidence}%
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-700 mt-2">
            {signals.recommendation}
          </p>
        </motion.div>

        {/* Indicadores Individuales */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Análisis por Indicador:</h4>

          {signals.indicators.map((indicator, index) => (
            <motion.div
              key={indicator.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getSignalIcon(indicator.signal)}
                  <span className="text-sm font-semibold text-gray-900">
                    {indicator.name}
                  </span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded ${getSignalColor(indicator.signal)}`}>
                  {indicator.value}
                </span>
              </div>
              <p className="text-xs text-gray-600 ml-6">
                {indicator.explanation}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer educativo */}
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-yellow-800">
            <p className="font-semibold mb-1">⚠️ Aviso Educativo</p>
            <p>
              Estas señales son para fines educativos. No son consejos financieros.
              Siempre haz tu propio análisis y gestiona el riesgo apropiadamente.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
