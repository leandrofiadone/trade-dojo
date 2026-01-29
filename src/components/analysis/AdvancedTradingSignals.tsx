/**
 * AdvancedTradingSignals Component
 *
 * Panel COMPLETO de señales con TODOS los indicadores explicados
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertCircle
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
  const [showAllIndicators, setShowAllIndicators] = useState(false);
  const [showEducationalInsights, setShowEducationalInsights] = useState(false);

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

  // Calcular consenso
  const buyIndicators = signals.indicators.filter(ind => ind.signal === 'buy');
  const sellIndicators = signals.indicators.filter(ind => ind.signal === 'sell');
  const neutralIndicators = signals.indicators.filter(ind => ind.signal === 'neutral');
  const totalIndicators = signals.indicators.length;

  const consensusPercentage = totalIndicators > 0
    ? Math.round((Math.max(buyIndicators.length, sellIndicators.length) / totalIndicators) * 100)
    : 0;

  return (
    <Card className="overflow-hidden">
      <div className="p-3 space-y-3">
        {/* Header */}
        <div>
          <h2 className="text-sm font-bold text-gray-900">🎯 Análisis Técnico Profesional</h2>
          {assetName && (
            <p className="text-xs text-gray-600">{assetName}</p>
          )}
        </div>

        {/* Señal Principal */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`p-3 rounded-lg border-2 ${config.bgColor} ${config.borderColor} shadow-sm`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {config.icon}
              <div>
                <p className="text-xs text-gray-600 font-medium uppercase">Señal Principal</p>
                <p className={`text-sm font-bold ${config.color}`}>
                  {config.emoji} {config.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600">Confianza</p>
              <p className={`text-2xl font-black ${config.color}`}>
                {signals.confidence}%
              </p>
            </div>
          </div>

          <div className={`p-2 rounded ${config.color} bg-white/60 border ${config.borderColor}`}>
            <p className="text-xs font-medium leading-relaxed">
              {signals.recommendation}
            </p>
          </div>
        </motion.div>

        {/* CONSENSO DE INDICADORES - NUEVO */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-blue-900 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Consenso de {totalIndicators} Indicadores
            </h3>
            <span className="text-xs font-bold text-blue-700">{consensusPercentage}% de acuerdo</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-2">
            <div className="bg-green-100 border border-green-300 rounded p-2 text-center">
              <p className="text-lg font-black text-green-700">{buyIndicators.length}</p>
              <p className="text-[10px] text-green-600 font-medium">Alcistas</p>
            </div>
            <div className="bg-gray-100 border border-gray-300 rounded p-2 text-center">
              <p className="text-lg font-black text-gray-700">{neutralIndicators.length}</p>
              <p className="text-[10px] text-gray-600 font-medium">Neutrales</p>
            </div>
            <div className="bg-red-100 border border-red-300 rounded p-2 text-center">
              <p className="text-lg font-black text-red-700">{sellIndicators.length}</p>
              <p className="text-[10px] text-red-600 font-medium">Bajistas</p>
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-green-500"
                style={{ width: `${(buyIndicators.length / totalIndicators) * 100}%` }}
              />
              <div
                className="bg-gray-400"
                style={{ width: `${(neutralIndicators.length / totalIndicators) * 100}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${(sellIndicators.length / totalIndicators) * 100}%` }}
              />
            </div>
          </div>

          <p className="text-[10px] text-blue-700 mt-2 text-center font-medium">
            💡 Cuantos más indicadores coincidan, más confiable es la señal
          </p>
        </div>

        {/* Tendencia + Volatilidad */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50 p-2 rounded border border-blue-200">
            <p className="text-xs font-bold text-blue-900 mb-1">📊 Tendencia General</p>
            <p className="text-[10px] font-semibold text-blue-700 leading-tight">
              {signals.trendAnalysis.overall}
            </p>
          </div>

          <div className="bg-purple-50 p-2 rounded border border-purple-200">
            <p className="text-xs font-bold text-purple-900 mb-1">⚡ Volatilidad</p>
            <p className="text-[10px] font-semibold text-purple-700">
              {signals.volatilityAnalysis.level.toUpperCase().replace('-', ' ')}
            </p>
            <p className="text-[9px] text-purple-600 mt-0.5">
              {signals.volatilityAnalysis.description.split('.')[0]}
            </p>
          </div>
        </div>

        {/* Niveles de Trading */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 rounded border border-green-200">
          <p className="text-xs font-bold text-green-900 mb-2">💰 PLAN DE TRADING</p>
          <div className="grid grid-cols-3 gap-1.5 text-[10px] mb-2">
            <div className="bg-white p-1.5 rounded border border-blue-200">
              <p className="text-[9px] text-gray-600">📍 Entry</p>
              <p className="font-bold text-blue-700">${signals.keyLevels.entry.toFixed(2)}</p>
            </div>
            <div className="bg-white p-1.5 rounded border border-red-200">
              <p className="text-[9px] text-gray-600">🛑 Stop Loss</p>
              <p className="font-bold text-red-700">${signals.keyLevels.stopLoss.toFixed(2)}</p>
              <p className="text-[8px] text-red-600">
                {((signals.keyLevels.stopLoss - signals.keyLevels.entry) / signals.keyLevels.entry * 100).toFixed(1)}%
              </p>
            </div>
            <div className="bg-white p-1.5 rounded border border-green-200">
              <p className="text-[9px] text-gray-600">🎯 TP1</p>
              <p className="font-bold text-green-700">${signals.keyLevels.takeProfit1.toFixed(2)}</p>
              <p className="text-[8px] text-green-600">
                +{((signals.keyLevels.takeProfit1 - signals.keyLevels.entry) / signals.keyLevels.entry * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <div className="text-center bg-white p-1.5 rounded border border-purple-200">
            <span className="text-xs font-bold text-purple-700">
              Risk:Reward = 1:{signals.keyLevels.riskRewardRatio.toFixed(2)}
              {signals.keyLevels.riskRewardRatio >= 2 && ' ⭐ Excelente'}
              {signals.keyLevels.riskRewardRatio >= 1.5 && signals.keyLevels.riskRewardRatio < 2 && ' ✅ Bueno'}
              {signals.keyLevels.riskRewardRatio < 1.5 && ' ⚠️ Bajo'}
            </span>
          </div>
          <p className="text-[9px] text-green-700 mt-1.5 font-medium">
            💡 Usa estos niveles para planificar tus entradas y salidas
          </p>
        </div>

        {/* Probabilidades */}
        <div className="bg-indigo-50 p-2 rounded border border-indigo-200 space-y-1">
          <p className="text-xs font-bold text-indigo-900 mb-1.5">📊 Escenarios Probables</p>

          <div className="flex items-center gap-1.5">
            <div className="text-[9px] w-16 text-gray-700 shrink-0 font-medium">📈 Alcista</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${signals.probabilities.bullishContinuation}%` }}
              />
            </div>
            <div className="text-[9px] font-bold w-10 text-right text-green-600">
              {signals.probabilities.bullishContinuation}%
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="text-[9px] w-16 text-gray-700 shrink-0 font-medium">📉 Bajista</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${signals.probabilities.bearishContinuation}%` }}
              />
            </div>
            <div className="text-[9px] font-bold w-10 text-right text-red-600">
              {signals.probabilities.bearishContinuation}%
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="text-[9px] w-16 text-gray-700 shrink-0 font-medium">↩️ Reversión</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${signals.probabilities.reversal}%` }}
              />
            </div>
            <div className="text-[9px] font-bold w-10 text-right text-orange-600">
              {signals.probabilities.reversal}%
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="text-[9px] w-16 text-gray-700 shrink-0 font-medium">↔️ Lateral</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full"
                style={{ width: `${signals.probabilities.consolidation}%` }}
              />
            </div>
            <div className="text-[9px] font-bold w-10 text-right text-gray-600">
              {signals.probabilities.consolidation}%
            </div>
          </div>

          <div className="mt-2 p-1.5 bg-white rounded border border-indigo-300">
            <p className="text-[10px] font-bold text-indigo-800 text-center">
              🎯 Más probable: {signals.probabilities.mostLikely}
            </p>
          </div>
        </div>

        {/* Patrón de Velas */}
        {signals.priceAction.pattern !== 'none' && (
          <div className="bg-amber-50 p-2 rounded border border-amber-200">
            <p className="text-xs font-bold text-amber-900 mb-1">🕯️ Patrón de Velas Detectado</p>
            <p className="text-xs font-bold text-gray-900">
              {signals.priceAction.pattern.toUpperCase().replace(/-/g, ' ')}
              {signals.priceAction.patternSignal === 'bullish' && ' 🟢'}
              {signals.priceAction.patternSignal === 'bearish' && ' 🔴'}
            </p>
            <p className="text-[10px] text-gray-700 mt-1">
              {signals.priceAction.patternExplanation}
            </p>
          </div>
        )}

        {/* TODOS LOS INDICADORES - Expandible */}
        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowAllIndicators(!showAllIndicators)}
            className="w-full p-2 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-between"
          >
            <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              Ver {totalIndicators} Indicadores Explicados
            </span>
            {showAllIndicators ? (
              <ChevronUp className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600" />
            )}
          </button>

          <AnimatePresence>
            {showAllIndicators && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
                  {signals.indicators.map((indicator, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border ${
                        indicator.signal === 'buy'
                          ? 'bg-green-50 border-green-200'
                          : indicator.signal === 'sell'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {indicator.signal === 'buy' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                          )}
                          {indicator.signal === 'sell' && (
                            <XCircle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                          )}
                          {indicator.signal === 'neutral' && (
                            <AlertCircle className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-0.5" />
                          )}
                          <span className="text-xs font-bold text-gray-900">
                            {indicator.name}
                          </span>
                        </div>
                        <span className={`text-xs font-bold ${
                          indicator.signal === 'buy'
                            ? 'text-green-700'
                            : indicator.signal === 'sell'
                            ? 'text-red-700'
                            : 'text-gray-700'
                        }`}>
                          {indicator.value}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-700 leading-relaxed">
                        {indicator.explanation}
                      </p>
                      {indicator.weight && (
                        <div className="mt-1 flex items-center gap-1">
                          <div className="flex-1 bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-500 h-1 rounded-full"
                              style={{ width: `${(indicator.weight / 4) * 100}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-gray-600">
                            Peso: {indicator.weight}/4
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* INSIGHTS EDUCATIVOS - Expandible */}
        {signals.educationalInsights && signals.educationalInsights.length > 0 && (
          <div className="border border-purple-300 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowEducationalInsights(!showEducationalInsights)}
              className="w-full p-2 bg-purple-100 hover:bg-purple-200 transition-colors flex items-center justify-between"
            >
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                💡 Lecciones y Tips Educativos
              </span>
              {showEducationalInsights ? (
                <ChevronUp className="w-4 h-4 text-purple-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-600" />
              )}
            </button>

            <AnimatePresence>
              {showEducationalInsights && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-2 bg-purple-50 space-y-2">
                    {signals.educationalInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="p-2 bg-white rounded border border-purple-200"
                      >
                        <p className="text-[10px] text-purple-900 leading-relaxed">
                          {insight}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-1.5 bg-orange-50 border border-orange-200 rounded p-2">
          <Shield className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-orange-800 leading-tight">
            <span className="font-bold">⚠️ DISCLAIMER:</span> Esto es EDUCATIVO para práctica de trading. NO es consejo financiero profesional. Las señales técnicas no garantizan resultados. Aprende a interpretar múltiples indicadores antes de operar con dinero real.
          </p>
        </div>
      </div>
    </Card>
  );
}
