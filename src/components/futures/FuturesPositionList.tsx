/**
 * FuturesPositionList Component
 *
 * Muestra todas las posiciones de futuros abiertas con:
 * - Información de la posición (Long/Short, leverage, margin)
 * - P&L en tiempo real
 * - Precio de liquidación
 * - RECOMENDACIÓN DE CIERRE basada en señales técnicas
 * - Botón para cerrar posición
 * - Alerts si está cerca de liquidación
 */

import React from 'react';
import { TrendingUp, TrendingDown, X, AlertTriangle, Target, CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { FuturesPosition } from '../../types/trading';
import type { CandlestickData, VolumeData } from '../../lib/priceHistory';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { generateAdvancedTradingSignals } from '../../lib/advancedSignals';

interface FuturesPositionListProps {
  positions: FuturesPosition[];
  onClosePosition: (position: FuturesPosition) => void;
  candleDataMap?: Map<string, CandlestickData[]>;
  volumeDataMap?: Map<string, VolumeData[]>;
}

export function FuturesPositionList({
  positions,
  onClosePosition,
  candleDataMap,
  volumeDataMap
}: FuturesPositionListProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>⚡ Posiciones de Futuros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">No tienes posiciones abiertas</p>
            <p className="text-xs text-gray-400 mt-2">
              Abre una posición LONG o SHORT con leverage
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚡ Posiciones de Futuros ({positions.length})</CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Posiciones abiertas • Señales actualizadas
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map(position => (
            <PositionCard
              key={position.id}
              position={position}
              onClose={() => onClosePosition(position)}
              candleData={candleDataMap?.get(position.asset)}
              volumeData={volumeDataMap?.get(position.asset)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Componente individual para cada posición
function PositionCard({
  position,
  onClose,
  candleData,
  volumeData
}: {
  position: FuturesPosition;
  onClose: () => void;
  candleData?: CandlestickData[];
  volumeData?: VolumeData[];
}) {
  const isLong = position.side === 'LONG';
  const isProfit = position.unrealizedPnL >= 0;

  // Calcular qué tan cerca está de la liquidación
  const priceDistance = Math.abs(position.currentPrice - position.liquidationPrice);
  const priceDistancePercentage = (priceDistance / position.currentPrice) * 100;
  const isNearLiquidation = priceDistancePercentage < 5; // Menos del 5% del precio

  // Calcular si el stop loss o take profit están cerca
  const hasStopLoss = position.stopLoss !== undefined;
  const hasTakeProfit = position.takeProfit !== undefined;

  // CALCULAR SEÑAL TÉCNICA ACTUAL
  let currentSignal: 'strong-buy' | 'buy' | 'neutral' | 'sell' | 'strong-sell' | null = null;
  let signalConfidence = 0;
  let signalRecommendation = '';
  let actionRecommendation: 'hold' | 'consider-close' | 'close-urgently' | 'take-profit' = 'hold';
  let actionColor = '';
  let actionIcon: React.ReactNode = null;
  let actionExplanation = '';

  if (candleData && volumeData && candleData.length >= 50) {
    try {
      const signals = generateAdvancedTradingSignals(candleData, volumeData);
      currentSignal = signals.type;
      signalConfidence = signals.confidence;
      signalRecommendation = signals.recommendation;

      // DETERMINAR ACCIÓN RECOMENDADA basada en si la señal va EN CONTRA de tu posición
      if (isLong) {
        // Tienes LONG - quieres señales alcistas
        if (currentSignal === 'strong-sell' || currentSignal === 'sell') {
          actionRecommendation = 'close-urgently';
          actionColor = 'bg-red-100 border-red-400';
          actionIcon = <XCircle className="w-4 h-4 text-red-600" />;
          actionExplanation = `Las señales técnicas (${currentSignal.toUpperCase()}) sugieren CERRAR tu LONG. El mercado va en contra de tu posición.`;
        } else if (currentSignal === 'neutral') {
          actionRecommendation = 'consider-close';
          actionColor = 'bg-yellow-100 border-yellow-400';
          actionIcon = <MinusCircle className="w-4 h-4 text-yellow-600" />;
          actionExplanation = 'Señales neutrales. Considera tomar ganancias si tienes profit o esperar confirmación alcista.';
        } else if (isProfit && (currentSignal === 'buy' || currentSignal === 'strong-buy')) {
          actionRecommendation = 'take-profit';
          actionColor = 'bg-blue-100 border-blue-400';
          actionIcon = <CheckCircle className="w-4 h-4 text-blue-600" />;
          actionExplanation = `Señales alcistas (${currentSignal.toUpperCase()}) confirman tu LONG. Considera tomar ganancias parciales o mover stop loss a profit.`;
        } else {
          actionRecommendation = 'hold';
          actionColor = 'bg-green-100 border-green-400';
          actionIcon = <CheckCircle className="w-4 h-4 text-green-600" />;
          actionExplanation = `Señales alcistas (${currentSignal.toUpperCase()}) apoyan tu LONG. Mantén la posición con stop loss activo.`;
        }
      } else {
        // Tienes SHORT - quieres señales bajistas
        if (currentSignal === 'strong-buy' || currentSignal === 'buy') {
          actionRecommendation = 'close-urgently';
          actionColor = 'bg-red-100 border-red-400';
          actionIcon = <XCircle className="w-4 h-4 text-red-600" />;
          actionExplanation = `Las señales técnicas (${currentSignal.toUpperCase()}) sugieren CERRAR tu SHORT. El mercado va en contra de tu posición.`;
        } else if (currentSignal === 'neutral') {
          actionRecommendation = 'consider-close';
          actionColor = 'bg-yellow-100 border-yellow-400';
          actionIcon = <MinusCircle className="w-4 h-4 text-yellow-600" />;
          actionExplanation = 'Señales neutrales. Considera tomar ganancias si tienes profit o esperar confirmación bajista.';
        } else if (isProfit && (currentSignal === 'sell' || currentSignal === 'strong-sell')) {
          actionRecommendation = 'take-profit';
          actionColor = 'bg-blue-100 border-blue-400';
          actionIcon = <CheckCircle className="w-4 h-4 text-blue-600" />;
          actionExplanation = `Señales bajistas (${currentSignal.toUpperCase()}) confirman tu SHORT. Considera tomar ganancias parciales o mover stop loss a profit.`;
        } else {
          actionRecommendation = 'hold';
          actionColor = 'bg-green-100 border-green-400';
          actionIcon = <CheckCircle className="w-4 h-4 text-green-600" />;
          actionExplanation = `Señales bajistas (${currentSignal.toUpperCase()}) apoyan tu SHORT. Mantén la posición con stop loss activo.`;
        }
      }
    } catch (error) {
      console.error('Error calculating signals for position:', error);
    }
  }

  const handleClose = () => {
    const confirmMessage = `
🔒 Cerrar Posición

${position.side} ${position.assetSymbol} ${position.leverage}x
P&L Actual: ${formatCurrency(position.unrealizedPnL)} (${formatPercentage(position.unrealizedPnLPercentage)})

Precio Entrada: ${formatCurrency(position.entryPrice)}
Precio Actual: ${formatCurrency(position.currentPrice)}

¿Cerrar esta posición?
    `.trim();

    if (confirm(confirmMessage)) {
      onClose();
    }
  };

  return (
    <div
      className={`
        border-2 rounded-lg p-4 transition-all
        ${isNearLiquidation ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isLong ? (
            <div className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>LONG</span>
            </div>
          ) : (
            <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold flex items-center space-x-1">
              <TrendingDown className="w-3 h-3" />
              <span>SHORT</span>
            </div>
          )}
          <span className="font-bold text-lg">{position.assetSymbol}</span>
          <span className="text-sm text-gray-500">{position.leverage}x</span>
        </div>
        <Button
          onClick={handleClose}
          variant="ghost"
          size="sm"
          className="!p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* P&L */}
      <div className="mb-3">
        <div className={`text-2xl font-bold ${isProfit ? 'profit' : 'loss'}`}>
          {isProfit ? '+' : ''}{formatCurrency(position.unrealizedPnL)}
        </div>
        <div className={`text-sm ${isProfit ? 'profit' : 'loss'}`}>
          {isProfit ? '+' : ''}{formatPercentage(position.unrealizedPnLPercentage)}
        </div>
      </div>

      {/* RECOMENDACIÓN DE ACCIÓN - NUEVO */}
      {currentSignal && (
        <div className={`border-2 rounded-lg p-2 mb-3 ${actionColor}`}>
          <div className="flex items-start gap-2">
            {actionIcon}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-900">
                  {actionRecommendation === 'close-urgently' && '🚨 CERRAR POSICIÓN'}
                  {actionRecommendation === 'consider-close' && '⚠️ Considerar Cierre'}
                  {actionRecommendation === 'take-profit' && '💰 Tomar Ganancias'}
                  {actionRecommendation === 'hold' && '✅ Mantener Posición'}
                </span>
                <span className="text-xs font-bold text-gray-700">
                  Señal: {currentSignal.toUpperCase().replace('-', ' ')} ({signalConfidence}%)
                </span>
              </div>
              <p className="text-[10px] text-gray-700 leading-tight">
                {actionExplanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Si no hay datos para señales */}
      {!currentSignal && candleData && candleData.length < 50 && (
        <div className="bg-gray-100 border border-gray-300 rounded p-2 mb-3">
          <p className="text-[10px] text-gray-600 text-center">
            📊 Acumulando datos históricos para generar señales técnicas...
          </p>
        </div>
      )}

      {/* Position Details */}
      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <div className="text-gray-500 text-xs">Margin</div>
          <div className="font-medium">{formatCurrency(position.margin)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Tamaño</div>
          <div className="font-medium">{formatCurrency(position.margin * position.leverage)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Entrada</div>
          <div className="font-medium">{formatCurrency(position.entryPrice)}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Actual</div>
          <div className="font-medium">{formatCurrency(position.currentPrice)}</div>
        </div>
      </div>

      {/* Liquidation Warning */}
      {isNearLiquidation && (
        <div className="bg-red-100 border border-red-300 rounded p-2 mb-3 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <div className="text-xs text-red-800">
            <strong>⚠️ CERCA DE LIQUIDACIÓN!</strong>
            <br />
            Liquidación en: {formatCurrency(position.liquidationPrice)} ({priceDistancePercentage.toFixed(1)}% de distancia)
          </div>
        </div>
      )}

      {/* Liquidation Price (always show) */}
      {!isNearLiquidation && (
        <div className="bg-gray-100 rounded p-2 mb-3">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">⚠️ Liquidación:</span>
            <span className="font-medium text-gray-900">
              {formatCurrency(position.liquidationPrice)}
            </span>
          </div>
        </div>
      )}

      {/* Stop Loss / Take Profit */}
      {(hasStopLoss || hasTakeProfit) && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {hasStopLoss && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <div className="text-xs text-red-600 flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>Stop Loss</span>
              </div>
              <div className="text-sm font-medium text-red-700">
                {formatCurrency(position.stopLoss!)}
              </div>
            </div>
          )}
          {hasTakeProfit && (
            <div className="bg-green-50 border border-green-200 rounded p-2">
              <div className="text-xs text-green-600 flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>Take Profit</span>
              </div>
              <div className="text-sm font-medium text-green-700">
                {formatCurrency(position.takeProfit!)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Close Button */}
      <Button
        onClick={handleClose}
        variant="ghost"
        size="sm"
        className="w-full"
      >
        🔒 Cerrar Posición
      </Button>
    </div>
  );
}
