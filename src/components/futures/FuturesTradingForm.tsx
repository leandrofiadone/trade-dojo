/**
 * FuturesTradingForm Component
 *
 * Formulario para abrir posiciones de futuros (Long/Short) con leverage.
 * Incluye:
 * - Selector de Long/Short
 * - Control de leverage (1x-100x)
 * - Input de margin
 * - Stop Loss / Take Profit opcionales
 * - Preview de liquidation price y riesgo
 * - Validaciones en tiempo real
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Zap } from 'lucide-react';
import type { Asset, FuturesFormData, PositionSide } from '../../types/trading';
import { validateFuturesOrder } from '../../lib/futuresEngine';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { formatCurrency } from '../../utils/formatters';

interface FuturesTradingFormProps {
  assets: Asset[];
  selectedAsset?: Asset;
  availableBalance: number;
  onOpenPosition: (formData: FuturesFormData, asset: Asset) => void;
}

export function FuturesTradingForm({
  assets,
  selectedAsset,
  availableBalance,
  onOpenPosition
}: FuturesTradingFormProps) {
  const [side, setSide] = useState<PositionSide>('LONG');
  const [margin, setMargin] = useState<string>('100');
  const [leverage, setLeverage] = useState<number>(10);
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-select first asset if none selected
  const currentAsset = selectedAsset || assets[0];

  // Reset form when asset changes
  useEffect(() => {
    setStopLoss('');
    setTakeProfit('');
  }, [currentAsset?.id]);

  // Calcular valores en tiempo real
  const marginNum = parseFloat(margin) || 0;
  const stopLossNum = parseFloat(stopLoss) || undefined;
  const takeProfitNum = parseFloat(takeProfit) || undefined;

  const positionSize = marginNum * leverage;
  const quantity = currentAsset ? positionSize / currentAsset.current_price : 0;

  // Validar la orden
  const validation = currentAsset
    ? validateFuturesOrder(
        {
          asset: currentAsset.id,
          side,
          margin: marginNum,
          leverage,
          stopLoss: stopLossNum,
          takeProfit: takeProfitNum
        },
        currentAsset,
        availableBalance
      )
    : { valid: false, error: 'Selecciona un asset' };

  // Handler para abrir posición
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validation.valid || !currentAsset) {
      alert(validation.error || 'Error en validación');
      return;
    }

    // Confirmación con resumen
    const confirmMessage = `
🚀 Confirmar Posición de Futuros

Tipo: ${side}
Asset: ${currentAsset.symbol}
Precio: ${formatCurrency(currentAsset.current_price)}
Margin: ${formatCurrency(marginNum)}
Leverage: ${leverage}x
Tamaño: ${formatCurrency(positionSize)}

⚠️ Liquidación en: ${formatCurrency(validation.liquidationPrice || 0)}
📉 Pérdida máxima: ${formatCurrency(validation.maxLoss || 0)}

${validation.warnings ? '\n' + validation.warnings.join('\n') : ''}

¿Abrir esta posición?
    `.trim();

    if (!confirm(confirmMessage)) return;

    // Ejecutar
    onOpenPosition(
      {
        asset: currentAsset.id,
        side,
        margin: marginNum,
        leverage,
        stopLoss: stopLossNum,
        takeProfit: takeProfitNum
      },
      currentAsset
    );

    // Reset form
    setMargin('100');
    setLeverage(10);
    setStopLoss('');
    setTakeProfit('');
  };

  // Handler para usar todo el balance
  const handleUseMax = () => {
    setMargin(availableBalance.toFixed(2));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>⚡ Futures Trading</span>
        </CardTitle>
        <p className="text-xs text-gray-500 mt-1">
          Trading con apalancamiento • Alto riesgo
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={currentAsset?.id || ''}
              onChange={(e) => {
                const asset = assets.find(a => a.id === e.target.value);
                // En práctica, esto debería llamar a onSelectAsset del padre
                console.log('Asset selected:', asset);
              }}
            >
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol} - {formatCurrency(asset.current_price)}
                </option>
              ))}
            </select>
          </div>

          {/* Long/Short Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSide('LONG')}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all
                  flex items-center justify-center space-x-2
                  ${side === 'LONG'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <TrendingUp className="w-4 h-4" />
                <span>LONG</span>
              </button>
              <button
                type="button"
                onClick={() => setSide('SHORT')}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all
                  flex items-center justify-center space-x-2
                  ${side === 'SHORT'
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <TrendingDown className="w-4 h-4" />
                <span>SHORT</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {side === 'LONG'
                ? '📈 Ganas si el precio SUBE, pierdes si BAJA'
                : '📉 Ganas si el precio BAJA, pierdes si SUBE'
              }
            </p>
          </div>

          {/* Leverage Slider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leverage: <span className="text-blue-600 font-bold">{leverage}x</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={leverage}
              onChange={(e) => setLeverage(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1x (Sin leverage)</span>
              <span>25x (Moderado)</span>
              <span>100x (Extremo)</span>
            </div>
            {leverage >= 50 && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                ⚠️ <strong>Leverage muy alto!</strong> Riesgo de liquidación extremo.
              </div>
            )}
          </div>

          {/* Margin Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Margin (Garantía)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                step="0.01"
                min="10"
                className="w-full pl-9 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100.00"
              />
              <button
                type="button"
                onClick={handleUseMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
              >
                MAX
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Disponible: {formatCurrency(availableBalance)}
            </p>
          </div>

          {/* Position Summary */}
          {marginNum > 0 && currentAsset && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tamaño de Posición:</span>
                <span className="font-medium">{formatCurrency(positionSize)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-medium">{quantity.toFixed(8)} {currentAsset.symbol}</span>
              </div>
              {validation.liquidationPrice && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">⚠️ Liquidación en:</span>
                  <span className="font-medium text-red-600">
                    {formatCurrency(validation.liquidationPrice)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pérdida Máxima:</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(validation.maxLoss || 0)}
                </span>
              </div>
            </div>
          )}

          {/* Advanced Options */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-600 hover:underline"
            >
              {showAdvanced ? '▼' : '▶'} Opciones Avanzadas (Stop Loss / Take Profit)
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-blue-200">
                {/* Stop Loss */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stop Loss (Opcional)
                  </label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={currentAsset ? `Ej: ${(currentAsset.current_price * 0.95).toFixed(2)}` : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio al que cerrar automáticamente para limitar pérdidas
                  </p>
                </div>

                {/* Take Profit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Take Profit (Opcional)
                  </label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={currentAsset ? `Ej: ${(currentAsset.current_price * 1.05).toFixed(2)}` : ''}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Precio al que cerrar automáticamente para asegurar ganancias
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Warnings */}
          {validation.warnings && validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              {validation.warnings.map((warning, i) => (
                <p key={i} className="text-sm text-yellow-800">
                  {warning}
                </p>
              ))}
            </div>
          )}

          {/* Error */}
          {!validation.valid && validation.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>{validation.error}</span>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant={side === 'LONG' ? 'success' : 'danger'}
            className="w-full"
            disabled={!validation.valid}
          >
            {side === 'LONG' ? '📈 Abrir LONG' : '📉 Abrir SHORT'} {leverage}x
          </Button>

          {/* Educational Note */}
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <p className="text-xs text-purple-800">
              💡 <strong>Nota Educativa:</strong> El trading con leverage amplifica tanto ganancias como pérdidas.
              Un movimiento del {(100 / leverage).toFixed(1)}% en contra puede liquidar tu posición completamente.
              Usa siempre Stop Loss para gestionar el riesgo.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
