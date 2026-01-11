/**
 * AdvancedTradingSignals Component
 *
 * Panel profesional y completo de señales de trading con análisis avanzado.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Target,
  Shield,
  BarChart3,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Activity,
  Percent
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
  const [expandedSections, setExpandedSections] = useState({
    indicators: true,
    levels: true,
    probabilities: true,
    insights: true
  });

  const signals = generateAdvancedTradingSignals(candleData, volumeData);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      icon: <TrendingUp className="w-8 h-8 text-green-600" />,
      emoji: '🟢🟢🟢'
    },
    'buy': {
      label: 'COMPRA',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      icon: <TrendingUp className="w-6 h-6 text-green-500" />,
      emoji: '🟢'
    },
    'neutral': {
      label: 'NEUTRAL - ESPERA',
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      icon: <Minus className="w-6 h-6 text-gray-600" />,
      emoji: '⚪'
    },
    'sell': {
      label: 'VENTA',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-300',
      icon: <TrendingDown className="w-6 h-6 text-red-500" />,
      emoji: '🔴'
    },
    'strong-sell': {
      label: 'VENTA FUERTE',
      color: 'text-red-700',
      bgColor: 'bg-red-100',
      borderColor: 'border-red-400',
      icon: <TrendingDown className="w-8 h-8 text-red-600" />,
      emoji: '🔴🔴🔴'
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
    if (signal === 'buy') return 'text-green-600 bg-green-50 border-green-200';
    if (signal === 'sell') return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
              <Activity className="w-7 h-7 text-blue-600" />
              <span>Análisis Técnico Avanzado</span>
            </h2>
            {assetName && (
              <p className="text-sm text-gray-600 mt-1">{assetName}</p>
            )}
          </div>
        </div>

        {/* Señal Principal - MUY DESTACADA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className={`p-6 rounded-xl border-3 ${config.bgColor} ${config.borderColor} mb-6 shadow-lg`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4">
              {config.icon}
              <div>
                <p className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Señal General</p>
                <p className={`text-3xl font-black ${config.color} mt-1`}>
                  {config.emoji} {config.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-600 font-semibold uppercase">Confianza</p>
              <p className={`text-4xl font-black ${config.color}`}>
                {signals.confidence}%
              </p>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${config.color} bg-white/50 border ${config.borderColor}`}>
            <p className="text-sm font-semibold leading-relaxed">
              {signals.recommendation}
            </p>
          </div>
        </motion.div>

        {/* Análisis de Tendencia Multi-Timeframe */}
        <div className="mb-6 p-5 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-bold text-blue-900 mb-3 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Análisis de Tendencia (Multi-Timeframe)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs text-gray-600 font-medium">Corto Plazo (20 velas)</p>
              <p className="text-sm font-bold text-gray-900">{signals.trendAnalysis.shortTerm}</p>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs text-gray-600 font-medium">Mediano Plazo (50 velas)</p>
              <p className="text-sm font-bold text-gray-900">{signals.trendAnalysis.mediumTerm}</p>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs text-gray-600 font-medium">Largo Plazo (200 velas)</p>
              <p className="text-sm font-bold text-gray-900">{signals.trendAnalysis.longTerm}</p>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <p className="text-xs text-gray-600 font-medium">Tendencia General</p>
              <p className="text-sm font-bold text-blue-700">{signals.trendAnalysis.overall}</p>
            </div>
          </div>
        </div>

        {/* Volatilidad */}
        <div className="mb-6 p-5 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="text-lg font-bold text-purple-900 mb-2 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Análisis de Volatilidad</span>
          </h3>
          <div className="bg-white p-4 rounded border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Nivel:</span>
              <span className={`text-sm font-bold px-3 py-1 rounded ${
                signals.volatilityAnalysis.level === 'very-high' ? 'bg-red-100 text-red-700' :
                signals.volatilityAnalysis.level === 'high' ? 'bg-orange-100 text-orange-700' :
                signals.volatilityAnalysis.level === 'normal' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {signals.volatilityAnalysis.level.toUpperCase().replace('-', ' ')}
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">ATR: {signals.volatilityAnalysis.atr.toFixed(2)}</p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {signals.volatilityAnalysis.description}
            </p>
          </div>
        </div>

        {/* Patrón de Velas */}
        {signals.priceAction.pattern !== 'none' && (
          <div className="mb-6 p-5 bg-amber-50 rounded-lg border border-amber-200">
            <h3 className="text-lg font-bold text-amber-900 mb-2">🕯️ Patrón de Velas Detectado</h3>
            <div className="bg-white p-4 rounded border border-amber-200">
              <p className="text-sm font-bold text-gray-900 mb-2">
                {signals.priceAction.pattern.toUpperCase().replace(/-/g, ' ')}
                {signals.priceAction.patternSignal === 'bullish' && ' 🟢'}
                {signals.priceAction.patternSignal === 'bearish' && ' 🔴'}
              </p>
              <p className="text-sm text-gray-700">{signals.priceAction.patternExplanation}</p>
            </div>
          </div>
        )}

        {/* Niveles Clave de Trading - COLAPSABLE */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('levels')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-colors"
          >
            <h3 className="text-lg font-bold text-green-900 flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>💰 Niveles Clave de Trading (Entry/SL/TP)</span>
            </h3>
            {expandedSections.levels ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {expandedSections.levels && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-5 bg-white rounded-lg border border-green-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">🎯 ENTRADA</p>
                      <p className="text-2xl font-bold text-blue-700">${signals.keyLevels.entry.toFixed(2)}</p>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">🛑 STOP LOSS</p>
                      <p className="text-2xl font-bold text-red-700">${signals.keyLevels.stopLoss.toFixed(2)}</p>
                      <p className="text-xs text-red-600 mt-1">
                        -{Math.abs(((signals.keyLevels.stopLoss - signals.keyLevels.entry) / signals.keyLevels.entry) * 100).toFixed(2)}%
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">✅ TAKE PROFIT 1</p>
                      <p className="text-2xl font-bold text-green-700">${signals.keyLevels.takeProfit1.toFixed(2)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        +{Math.abs(((signals.keyLevels.takeProfit1 - signals.keyLevels.entry) / signals.keyLevels.entry) * 100).toFixed(2)}%
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">✅ TAKE PROFIT 2</p>
                      <p className="text-2xl font-bold text-green-700">${signals.keyLevels.takeProfit2.toFixed(2)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        +{Math.abs(((signals.keyLevels.takeProfit2 - signals.keyLevels.entry) / signals.keyLevels.entry) * 100).toFixed(2)}%
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">✅ TAKE PROFIT 3</p>
                      <p className="text-2xl font-bold text-green-700">${signals.keyLevels.takeProfit3.toFixed(2)}</p>
                      <p className="text-xs text-green-600 mt-1">
                        +{Math.abs(((signals.keyLevels.takeProfit3 - signals.keyLevels.entry) / signals.keyLevels.entry) * 100).toFixed(2)}%
                      </p>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-xs text-gray-600 font-medium mb-1">⚖️ RISK:REWARD</p>
                      <p className="text-2xl font-bold text-purple-700">1:{signals.keyLevels.riskRewardRatio.toFixed(2)}</p>
                      <p className="text-xs text-purple-600 mt-1">
                        {signals.keyLevels.riskRewardRatio >= 2 ? 'Excelente ✅' : signals.keyLevels.riskRewardRatio >= 1.5 ? 'Bueno 👍' : 'Mejorable ⚠️'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-2">Soporte/Resistencia Más Cercanos:</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-red-700 font-semibold">⬇️ Soporte: ${signals.keyLevels.nearest.support.toFixed(2)}</span>
                      <span className="text-green-700 font-semibold">⬆️ Resistencia: ${signals.keyLevels.nearest.resistance.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Probabilidades - COLAPSABLE */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('probabilities')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200 hover:from-indigo-100 hover:to-blue-100 transition-colors"
          >
            <h3 className="text-lg font-bold text-indigo-900 flex items-center space-x-2">
              <Percent className="w-5 h-5" />
              <span>📊 Probabilidades de Escenarios</span>
            </h3>
            {expandedSections.probabilities ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {expandedSections.probabilities && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-5 bg-white rounded-lg border border-indigo-200 space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">📈 Continuación Alcista</span>
                      <span className="text-sm font-bold text-green-600">{signals.probabilities.bullishContinuation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${signals.probabilities.bullishContinuation}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">📉 Continuación Bajista</span>
                      <span className="text-sm font-bold text-red-600">{signals.probabilities.bearishContinuation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${signals.probabilities.bearishContinuation}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">🔄 Reversión</span>
                      <span className="text-sm font-bold text-purple-600">{signals.probabilities.reversal}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${signals.probabilities.reversal}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-700">⏸️ Consolidación</span>
                      <span className="text-sm font-bold text-gray-600">{signals.probabilities.consolidation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-gray-500 to-gray-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${signals.probabilities.consolidation}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <p className="text-sm font-bold text-indigo-900">
                      🎯 Escenario Más Probable: {signals.probabilities.mostLikely}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Indicadores Detallados - COLAPSABLE */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('indicators')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-300 hover:from-gray-100 hover:to-slate-100 transition-colors"
          >
            <h3 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>📊 Desglose por Indicador</span>
            </h3>
            {expandedSections.indicators ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {expandedSections.indicators && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  {signals.indicators.map((indicator, index) => (
                    <motion.div
                      key={indicator.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getSignalIcon(indicator.signal)}
                          <div>
                            <span className="text-sm font-bold text-gray-900">
                              {indicator.name}
                            </span>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`text-xs font-bold px-2 py-1 rounded border ${getSignalColor(indicator.signal)}`}>
                                {indicator.value}
                              </span>
                              <span className="text-xs text-gray-500">
                                Peso: {indicator.weight}/4
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed ml-7">
                        {indicator.explanation}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Insights Educativos - COLAPSABLE */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('insights')}
            className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-300 hover:from-yellow-100 hover:to-amber-100 transition-colors"
          >
            <h3 className="text-lg font-bold text-yellow-900 flex items-center space-x-2">
              <Lightbulb className="w-5 h-5" />
              <span>💡 Lecciones y Consejos Educativos</span>
            </h3>
            {expandedSections.insights ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>

          <AnimatePresence>
            {expandedSections.insights && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-5 bg-white rounded-lg border border-yellow-300 space-y-3">
                  {signals.educationalInsights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <Lightbulb className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-800 leading-relaxed">{insight}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Disclaimer educativo */}
        <div className="p-4 bg-orange-50 border-2 border-orange-300 rounded-lg flex items-start space-x-3">
          <Shield className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-orange-800">
            <p className="font-bold mb-1">⚠️ AVISO EDUCATIVO IMPORTANTE</p>
            <p>
              Este análisis es EDUCATIVO y para PRÁCTICA únicamente. NO es consejo financiero.
              Siempre haz tu propia investigación, gestiona el riesgo apropiadamente (nunca arriesgues más del 1-2% de tu capital por operación),
              y practica en simulación antes de usar dinero real. El trading conlleva riesgo de pérdida significativa.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
