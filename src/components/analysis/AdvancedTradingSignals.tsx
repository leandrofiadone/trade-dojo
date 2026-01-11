/**
 * AdvancedTradingSignals Component
 *
 * Panel compacto de señales de trading - TODO VISIBLE, SIN TABS
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield
} from 'lucide-react';
import { Card } from '../ui/Card';
import type { CandlestickData, VolumeData } from '../../lib/priceHistory';
import { generateAdvancedTradingSignals, type SignalType } from '../../lib/advancedSignals';

interface AdvancedTradingSignalsProps {
  candleData: CandlestickData[];
  volumeData: VolumeData[];
  assetName?: string;
}

export function AdvancedTradingSignals({
  candleData,
  volumeData,
  assetName = 'Asset'
}: AdvancedTradingSignalsProps) {
  const signals = generateAdvancedTradingSignals(candleData, volumeData);

  // Configuración visual según tipo de señal
  const signalConfig: Record<SignalType, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    emoji: string;
  }> = {
    'strong-buy': {
      label: 'COMPRA FUERTE',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-400',
      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
      emoji: '🟢🟢🟢'
    },
    'buy': {
      label: 'COMPRA',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      icon: <TrendingUp className="w-5 h-5 text-green-500" />,
      emoji: '🟢'
    },
    'neutral': {
      label: 'NEUTRAL - ESPERA',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      icon: <Minus className="w-5 h-5 text-gray-600" />,
      emoji: '⚪'
    },
    'sell': {
      label: 'VENTA',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      icon: <TrendingDown className="w-5 h-5 text-red-500" />,
      emoji: '🔴'
    },
    'strong-sell': {
      label: 'VENTA FUERTE',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      icon: <TrendingDown className="w-6 h-6 text-red-600" />,
      emoji: '🔴🔴🔴'
    }
  };

  const config = signalConfig[signals.type];

  return (
    <Card className="overflow-hidden">
      <div className="p-2 space-y-2">
        {/* Header */}
        <div>
          <h2 className="text-xs font-bold text-gray-900">🎯 Análisis Técnico</h2>
          {assetName && (
            <p className="text-[9px] text-gray-600">{assetName}</p>
          )}
        </div>

        {/* Señal Principal - Ultra Compacta */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`p-2 rounded-lg border-2 ${config.bgColor} ${config.borderColor} shadow-sm`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              {config.icon}
              <div>
                <p className="text-[8px] text-gray-600 font-medium uppercase">Señal</p>
                <p className={`text-[10px] font-bold ${config.color}`}>
                  {config.emoji} {config.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-gray-600">Conf.</p>
              <p className={`text-lg font-black ${config.color}`}>
                {signals.confidence}%
              </p>
            </div>
          </div>

          <div className={`p-1.5 rounded ${config.color} bg-white/50 border ${config.borderColor}`}>
            <p className="text-[9px] font-medium leading-snug">
              {signals.recommendation}
            </p>
          </div>
        </motion.div>

        {/* Tendencia + Volatilidad - Grid Compacto */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-blue-50 p-1.5 rounded border border-blue-200">
            <p className="text-[8px] font-bold text-blue-900 mb-0.5">📊 Tendencia</p>
            <p className="text-[9px] font-bold text-blue-700">{signals.trendAnalysis.overall}</p>
          </div>

          <div className="bg-purple-50 p-1.5 rounded border border-purple-200">
            <p className="text-[8px] font-bold text-purple-900 mb-0.5">⚡ Volatilidad</p>
            <p className="text-[9px] font-bold text-purple-700">
              {signals.volatilityAnalysis.level.toUpperCase().replace('-', ' ')}
            </p>
          </div>
        </div>

        {/* Entry/SL/TP - Tabla Ultra Compacta */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-1.5 rounded border border-green-200">
          <p className="text-[8px] font-bold text-green-900 mb-1">💰 NIVELES DE TRADING</p>
          <div className="grid grid-cols-3 gap-1 text-center text-[9px] mb-1">
            <div className="bg-white p-1 rounded border border-blue-200">
              <p className="text-[7px] text-gray-600">Entry</p>
              <p className="font-bold text-blue-700">${signals.keyLevels.entry.toFixed(2)}</p>
            </div>
            <div className="bg-white p-1 rounded border border-red-200">
              <p className="text-[7px] text-gray-600">SL</p>
              <p className="font-bold text-red-700">${signals.keyLevels.stopLoss.toFixed(2)}</p>
              <p className="text-[7px] text-red-600">
                {((signals.keyLevels.stopLoss - signals.keyLevels.entry) / signals.keyLevels.entry * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-1 rounded border border-green-200">
              <p className="text-[7px] text-gray-600">TP1</p>
              <p className="font-bold text-green-700">${signals.keyLevels.takeProfit1.toFixed(2)}</p>
              <p className="text-[7px] text-green-600">
                +{((signals.keyLevels.takeProfit1 - signals.keyLevels.entry) / signals.keyLevels.entry * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="text-center bg-white p-1 rounded border border-purple-200">
            <span className="text-[8px] font-bold text-purple-700">
              R:R 1:{signals.keyLevels.riskRewardRatio.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Probabilidades - Mini Bars */}
        <div className="bg-indigo-50 p-1.5 rounded border border-indigo-200 space-y-0.5">
          <p className="text-[8px] font-bold text-indigo-900 mb-0.5">📊 Probabilidades</p>

          <div className="flex items-center gap-1">
            <div className="text-[8px] w-14 text-gray-700 shrink-0">Alcista</div>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-green-500 h-1.5 rounded-full"
                style={{ width: `${signals.probabilities.bullishContinuation}%` }}
              />
            </div>
            <div className="text-[8px] font-bold w-8 text-right text-green-600">
              {signals.probabilities.bullishContinuation}%
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="text-[8px] w-14 text-gray-700 shrink-0">Bajista</div>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-red-500 h-1.5 rounded-full"
                style={{ width: `${signals.probabilities.bearishContinuation}%` }}
              />
            </div>
            <div className="text-[8px] font-bold w-8 text-right text-red-600">
              {signals.probabilities.bearishContinuation}%
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div className="text-[8px] w-14 text-gray-700 shrink-0">Lateral</div>
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-gray-500 h-1.5 rounded-full"
                style={{ width: `${signals.probabilities.consolidation}%` }}
              />
            </div>
            <div className="text-[8px] font-bold w-8 text-right text-gray-600">
              {signals.probabilities.consolidation}%
            </div>
          </div>
        </div>

        {/* Patrón de Velas - Si existe */}
        {signals.priceAction.pattern !== 'none' && (
          <div className="bg-amber-50 p-1.5 rounded border border-amber-200">
            <p className="text-[8px] font-bold text-amber-900 mb-0.5">🕯️ Patrón Detectado</p>
            <p className="text-[9px] font-bold text-gray-900">
              {signals.priceAction.pattern.toUpperCase().replace(/-/g, ' ')}
              {signals.priceAction.patternSignal === 'bullish' && ' 🟢'}
              {signals.priceAction.patternSignal === 'bearish' && ' 🔴'}
            </p>
          </div>
        )}

        {/* Indicadores Técnicos - Resumen Compacto */}
        <div className="bg-gray-50 p-1.5 rounded border border-gray-200">
          <p className="text-[8px] font-bold text-gray-900 mb-1">📈 Indicadores Técnicos</p>
          <div className="grid grid-cols-2 gap-1 text-[8px]">
            <div className="flex justify-between">
              <span className="text-gray-600">RSI:</span>
              <span className={`font-bold ${
                signals.indicators.rsi.value > 70 ? 'text-red-600' :
                signals.indicators.rsi.value < 30 ? 'text-green-600' :
                'text-gray-700'
              }`}>
                {signals.indicators.rsi.value.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MACD:</span>
              <span className={`font-bold ${
                signals.indicators.macd.signal === 'buy' ? 'text-green-600' :
                signals.indicators.macd.signal === 'sell' ? 'text-red-600' :
                'text-gray-600'
              }`}>
                {signals.indicators.macd.signal === 'buy' ? '↑' :
                 signals.indicators.macd.signal === 'sell' ? '↓' : '→'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Stoch:</span>
              <span className="font-bold text-gray-700">
                {signals.indicators.stochastic.value.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between col-span-2">
              <span className="text-gray-600">Williams:</span>
              <span className="font-bold text-gray-700">
                {signals.indicators.williamsR.value.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Disclaimer Educativo */}
        <div className="flex items-start gap-1 bg-orange-50 border border-orange-200 rounded p-1.5">
          <Shield className="w-3 h-3 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-[9px] text-orange-800 leading-tight">
            <span className="font-bold">⚠️ EDUCATIVO:</span> NO es consejo financiero. Solo práctica.
          </p>
        </div>
      </div>
    </Card>
  );
}
