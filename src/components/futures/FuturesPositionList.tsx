/**
 * FuturesPositionList Component
 *
 * Muestra todas las posiciones de futuros abiertas con:
 * - Información de la posición (Long/Short, leverage, margin)
 * - P&L en tiempo real
 * - Precio de liquidación
 * - Botón para cerrar posición
 * - Alerts si está cerca de liquidación
 */

import React from 'react';
import { TrendingUp, TrendingDown, X, AlertTriangle, Target } from 'lucide-react';
import type { FuturesPosition } from '../../types/trading';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface FuturesPositionListProps {
  positions: FuturesPosition[];
  onClosePosition: (position: FuturesPosition) => void;
}

export function FuturesPositionList({
  positions,
  onClosePosition
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
          Posiciones abiertas con leverage
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {positions.map(position => (
            <PositionCard
              key={position.id}
              position={position}
              onClose={() => onClosePosition(position)}
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
  onClose
}: {
  position: FuturesPosition;
  onClose: () => void;
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
