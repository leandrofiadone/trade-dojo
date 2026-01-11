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

  // Estado para las tabs internas
  const [activeTab, setActiveTab] = useState<'summary' | 'indicators' | 'levels'>('summary');

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
      <div className="p-2">
        {/* Header Compacto */}
        <div className="mb-1.5">
          <h2 className="text-xs font-bold text-gray-900 flex items-center space-x-1">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Análisis Técnico</span>
          </h2>
          {assetName && (
            <p className="text-[9px] text-gray-600 mt-0.5">{assetName}</p>
          )}
        </div>

        {/* Tabs Internas */}
        <div className="mb-1.5">
          <nav className="flex space-x-1 bg-gray-50 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab('summary')}
              className={`
                flex-1 py-1 px-1.5 rounded-md text-[9px] font-semibold transition-all duration-150
                ${activeTab === 'summary'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
                }
              `}
            >
              📊 Resumen
            </button>
            <button
              onClick={() => setActiveTab('indicators')}
              className={`
                flex-1 py-1 px-1.5 rounded-md text-[9px] font-semibold transition-all duration-150
                ${activeTab === 'indicators'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
                }
              `}
            >
              📈 Indicadores
            </button>
            <button
              onClick={() => setActiveTab('levels')}
              className={`
                flex-1 py-1 px-1.5 rounded-md text-[9px] font-semibold transition-all duration-150
                ${activeTab === 'levels'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-white'
                }
              `}
            >
              🎯 Niveles
            </button>
          </nav>
        </div>

        {/* Contenido según tab */}
        {activeTab === 'summary' && (
          <>
        {/* Señal Principal - Compacta */}
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={`p-2 rounded-lg border-2 ${config.bgColor} ${config.borderColor} mb-1.5 shadow-sm`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-1.5">
              <div className="w-4 h-4">{config.icon}</div>
              <div>
                <p className="text-[9px] text-gray-600 font-medium uppercase">Señal</p>
                <p className={`text-[10px] font-bold ${config.color}`}>
                  {config.emoji} {config.label}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-600">Conf.</p>
              <p className={`text-base font-black ${config.color}`}>
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

        {/* Tendencia - Compacta */}
        <div className="mb-1.5 p-1.5 bg-blue-50 rounded border border-blue-200">
          <h3 className="text-[9px] font-bold text-blue-900 mb-1 flex items-center space-x-1">
            <BarChart3 className="w-2.5 h-2.5" />
            <span>Tendencia</span>
          </h3>
          <div className="grid grid-cols-2 gap-1">
            <div className="bg-white p-1 rounded text-center">
              <p className="text-[8px] text-gray-600">Corto</p>
              <p className="text-[9px] font-bold text-gray-900">{signals.trendAnalysis.shortTerm}</p>
            </div>
            <div className="bg-white p-1 rounded text-center">
              <p className="text-[8px] text-gray-600">Medio</p>
              <p className="text-[9px] font-bold text-gray-900">{signals.trendAnalysis.mediumTerm}</p>
            </div>
          </div>
          <div className="bg-white p-1 rounded mt-1 text-center">
            <p className="text-[8px] text-gray-600">General</p>
            <p className="text-[9px] font-bold text-blue-700">{signals.trendAnalysis.overall}</p>
          </div>
        </div>

        {/* Volatilidad - Compacta */}
        <div className="mb-1.5 p-1.5 bg-purple-50 rounded border border-purple-200">
          <h3 className="text-[9px] font-bold text-purple-900 mb-1 flex items-center space-x-1">
            <Activity className="w-2.5 h-2.5" />
            <span>Volatilidad</span>
          </h3>
          <div className="bg-white p-1.5 rounded">
            <div className="flex items-center justify-between">
              <span className="text-[8px] font-medium text-gray-700">Nivel:</span>
              <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                signals.volatilityAnalysis.level === 'very-high' ? 'bg-red-100 text-red-700' :
                signals.volatilityAnalysis.level === 'high' ? 'bg-orange-100 text-orange-700' :
                signals.volatilityAnalysis.level === 'normal' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {signals.volatilityAnalysis.level.toUpperCase().replace('-', ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* Patrón de Velas - Compacto */}
        {signals.priceAction.pattern !== 'none' && (
          <div className="mb-1.5 p-1.5 bg-amber-50 rounded border border-amber-200">
            <h3 className="text-[9px] font-bold text-amber-900 mb-0.5">🕯️ Patrón</h3>
            <div className="bg-white p-1 rounded">
              <p className="text-[8px] font-bold text-gray-900">
                {signals.priceAction.pattern.toUpperCase().replace(/-/g, ' ')}
                {signals.priceAction.patternSignal === 'bullish' && ' 🟢'}
                {signals.priceAction.patternSignal === 'bearish' && ' 🔴'}
              </p>
            </div>
          </div>
        )}
          </>
        )}

        {/* Tab: Niveles */}
        {activeTab === 'levels' && (
          <>
        {/* Niveles Clave - COLAPSABLE */}
        <div className="mb-1.5">
          <button
            onClick={() => toggleSection('levels')}
            className="w-full flex items-center justify-between p-1.5 bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-colors"
          >
            <h3 className="text-[9px] font-bold text-green-900 flex items-center space-x-1">
              <Target className="w-2.5 h-2.5" />
              <span>💰 Niveles Entry/SL/TP</span>
            </h3>
            {expandedSections.levels ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>

          <AnimatePresence>
            {expandedSections.levels && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1 p-1.5 bg-white rounded border border-green-200 space-y-1">
                  <div className="p-1 bg-blue-50 rounded border border-blue-200">
                    <p className="text-[8px] text-gray-600 font-medium">🎯 ENTRADA</p>
                    <p className="text-xs font-bold text-blue-700">${signals.keyLevels.entry.toFixed(2)}</p>
                  </div>

                  <div className="p-1 bg-red-50 rounded border border-red-200">
                    <p className="text-[8px] text-gray-600 font-medium">🛑 STOP LOSS</p>
                    <p className="text-xs font-bold text-red-700">${signals.keyLevels.stopLoss.toFixed(2)}</p>
                    <p className="text-[8px] text-red-600">
                      -{Math.abs(((signals.keyLevels.stopLoss - signals.keyLevels.entry) / signals.keyLevels.entry) * 100).toFixed(2)}%
                    </p>
                  </div>

                  <div className="p-1 bg-green-50 rounded border border-green-200">
                    <p className="text-[8px] text-gray-600 font-medium">✅ TP1</p>
                    <p className="text-xs font-bold text-green-700">${signals.keyLevels.takeProfit1.toFixed(2)}</p>
                    <p className="text-[8px] text-green-600">
                      +{Math.abs(((signals.keyLevels.takeProfit1 - signals.keyLevels.entry) / signals.keyLevels.entry) * 100).toFixed(2)}%
                    </p>
                  </div>

                  <div className="p-1 bg-purple-50 rounded border border-purple-200">
                    <p className="text-[8px] text-gray-600 font-medium">⚖️ R:R</p>
                    <p className="text-xs font-bold text-purple-700">1:{signals.keyLevels.riskRewardRatio.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Probabilidades - COLAPSABLE */}
        <div className="mb-1.5">
          <button
            onClick={() => toggleSection('probabilities')}
            className="w-full flex items-center justify-between p-1.5 bg-indigo-50 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
          >
            <h3 className="text-[9px] font-bold text-indigo-900 flex items-center space-x-1">
              <Percent className="w-2.5 h-2.5" />
              <span>📊 Probabilidades</span>
            </h3>
            {expandedSections.probabilities ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
          </button>

          <AnimatePresence>
            {expandedSections.probabilities && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1 p-1.5 bg-white rounded border border-indigo-200 space-y-1">
                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[8px] font-medium text-gray-700">📈 Alcista</span>
                      <span className="text-[8px] font-bold text-green-600">{signals.probabilities.bullishContinuation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-green-500 h-1 rounded-full"
                        style={{ width: `${signals.probabilities.bullishContinuation}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[8px] font-medium text-gray-700">📉 Bajista</span>
                      <span className="text-[8px] font-bold text-red-600">{signals.probabilities.bearishContinuation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-red-500 h-1 rounded-full"
                        style={{ width: `${signals.probabilities.bearishContinuation}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[8px] font-medium text-gray-700">⏸️ Consolidación</span>
                      <span className="text-[8px] font-bold text-gray-600">{signals.probabilities.consolidation}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-gray-500 h-1 rounded-full"
                        style={{ width: `${signals.probabilities.consolidation}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-0.5 p-1 bg-indigo-50 rounded border border-indigo-200">
                    <p className="text-[8px] font-bold text-indigo-900">
                      🎯 {signals.probabilities.mostLikely} ({Math.max(signals.probabilities.bullishContinuation, signals.probabilities.bearishContinuation, signals.probabilities.consolidation, signals.probabilities.reversal)}%)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          </>
        )}

        {/* Tab: Indicadores */}
        {activeTab === 'indicators' && (
          <>
        {/* Indicadores Top 3 - Compacto */}
        <div className="mb-2">
          <button
            onClick={() => toggleSection('indicators')}
            className="w-full flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            <h3 className="text-[10px] font-bold text-gray-900 flex items-center space-x-1">
              <BarChart3 className="w-3 h-3" />
              <span>📊 Top Indicadores</span>
            </h3>
            {expandedSections.indicators ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <AnimatePresence>
            {expandedSections.indicators && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 space-y-1">
                  {signals.indicators.slice(0, 3).map((indicator, index) => (
                    <div
                      key={indicator.name}
                      className="p-1.5 bg-white rounded border border-gray-200"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <div className="w-3 h-3">{getSignalIcon(indicator.signal)}</div>
                          <span className="text-[9px] font-bold text-gray-900">
                            {indicator.name}
                          </span>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getSignalColor(indicator.signal)}`}>
                          {indicator.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
          </>
        )}

        {/* Disclaimer compacto - Siempre visible */}
        <div className="mt-2 p-2 bg-orange-50 border border-orange-300 rounded flex items-start space-x-1.5">
          <Shield className="w-3 h-3 text-orange-600 shrink-0 mt-0.5" />
          <p className="text-[9px] text-orange-800 leading-tight">
            <span className="font-bold">⚠️ EDUCATIVO:</span> NO es consejo financiero. Solo práctica.
          </p>
        </div>
      </div>
    </Card>
  );
}
