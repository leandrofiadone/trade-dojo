/**
 * TradingForm Component
 *
 * Form for executing buy/sell orders.
 * Includes real-time validation and cost calculation.
 */

import React, { useState, useEffect } from 'react';
import { ShoppingCart, DollarSign, AlertCircle } from 'lucide-react';
import type { Asset, TradeType, Portfolio } from '../../types/trading';
import { validateTrade, TRADING_FEE_PERCENTAGE } from '../../lib/tradingEngine';
import { formatCurrency, formatCryptoAmount } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';

interface TradingFormProps {
  assets: Asset[];
  portfolio: Portfolio;
  selectedAsset?: Asset;
  onTrade: (asset: Asset, type: TradeType, quantity: number) => void;
}

export function TradingForm({ assets, portfolio, selectedAsset, onTrade }: TradingFormProps) {
  const [assetId, setAssetId] = useState(selectedAsset?.id || '');
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);

  const selectedAssetData = assets.find(a => a.id === assetId) || selectedAsset;

  // Update selected asset when prop changes
  useEffect(() => {
    if (selectedAsset) {
      setAssetId(selectedAsset.id);
    }
  }, [selectedAsset]);

  // Calculate trade details
  const quantityNum = parseFloat(quantity) || 0;
  const price = selectedAssetData?.current_price || 0;
  const total = quantityNum * price;
  const fee = (total * TRADING_FEE_PERCENTAGE) / 100;
  const netTotal = tradeType === 'buy' ? total + fee : total - fee;

  // Get current holding for this asset
  const currentHolding = portfolio.holdings.find(h => h.asset === assetId);

  // Validate trade on input change
  useEffect(() => {
    setError('');
    setWarnings([]);

    if (quantityNum > 0 && selectedAssetData) {
      const validation = validateTrade(
        tradeType,
        selectedAssetData,
        quantityNum,
        price,
        portfolio
      );

      if (!validation.valid && validation.error) {
        setError(validation.error);
      }

      if (validation.warnings) {
        setWarnings(validation.warnings);
      }
    }
  }, [tradeType, quantity, assetId, portfolio, selectedAssetData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAssetData) {
      setError('Please select an asset');
      return;
    }

    if (quantityNum <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const validation = validateTrade(
      tradeType,
      selectedAssetData,
      quantityNum,
      price,
      portfolio
    );

    if (!validation.valid) {
      setError(validation.error || 'Invalid trade');
      return;
    }

    // Execute trade
    onTrade(selectedAssetData, tradeType, quantityNum);

    // Reset form
    setQuantity('');
    setError('');
    setWarnings([]);
  };

  const handleMaxClick = () => {
    if (tradeType === 'buy' && selectedAssetData) {
      // Calculate max quantity we can buy with current balance
      const maxTotal = portfolio.balance / (1 + TRADING_FEE_PERCENTAGE / 100);
      const maxQty = maxTotal / price;
      setQuantity(maxQty.toFixed(8));
    } else if (tradeType === 'sell' && currentHolding) {
      // Set to max holding quantity
      setQuantity(currentHolding.quantity.toFixed(8));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>🎯 Trade Execution</CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Asset Selector */}
          <Select
            label="Select Asset"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            required
          >
            <option value="">Choose a cryptocurrency...</option>
            {assets.map(asset => (
              <option key={asset.id} value={asset.id}>
                {asset.name} ({asset.symbol}) - {formatCurrency(asset.current_price)}
              </option>
            ))}
          </Select>

          {/* Buy/Sell Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trade Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTradeType('buy')}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all
                  ${tradeType === 'buy'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                🟢 Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeType('sell')}
                className={`
                  px-4 py-3 rounded-lg font-medium transition-all
                  ${tradeType === 'sell'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                🔴 Sell
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">
                Quantity
              </label>
              {(tradeType === 'buy' || currentHolding) && (
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  MAX
                </button>
              )}
            </div>
            <Input
              type="number"
              step="any"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              required
            />
            {currentHolding && tradeType === 'sell' && (
              <p className="mt-1 text-xs text-gray-500">
                Available: {formatCryptoAmount(currentHolding.quantity, currentHolding.assetSymbol)}
              </p>
            )}
          </div>

          {/* Trade Summary */}
          {selectedAssetData && quantityNum > 0 && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-2 border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per unit:</span>
                <span className="font-medium">{formatCurrency(price)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium">{formatCryptoAmount(quantityNum, selectedAssetData.symbol)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Fee ({TRADING_FEE_PERCENTAGE}%):</span>
                <span className="font-medium">{formatCurrency(fee)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold pt-2 border-t border-gray-300">
                <span className="text-gray-900">
                  {tradeType === 'buy' ? 'Total Cost:' : 'You Receive:'}
                </span>
                <span className={tradeType === 'buy' ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(netTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              {warnings.map((warning, idx) => (
                <p key={idx} className="text-sm text-yellow-800 flex items-start">
                  <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                  {warning}
                </p>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 flex items-start">
                <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                {error}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant={tradeType === 'buy' ? 'success' : 'danger'}
            className="w-full"
            disabled={!selectedAssetData || quantityNum <= 0 || !!error}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {tradeType === 'buy' ? 'Execute Buy Order' : 'Execute Sell Order'}
          </Button>

          {/* Balance Info */}
          <div className="text-center text-sm text-gray-600">
            Available Balance: <span className="font-semibold">{formatCurrency(portfolio.balance)}</span>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
