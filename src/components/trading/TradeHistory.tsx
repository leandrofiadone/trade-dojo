/**
 * TradeHistory Component
 *
 * Displays the complete history of all trades executed.
 */

import React, { useState } from 'react';
import { Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import type { Trade } from '../../types/trading';
import { formatCurrency, formatDateTime, formatCryptoAmount } from '../../utils/formatters';
import { downloadTradesCSV } from '../../lib/storage';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const [filterType, setFilterType] = useState<'all' | 'buy' | 'sell'>('all');
  const [filterAsset, setFilterAsset] = useState<string>('all');

  // Get unique assets from trades
  const uniqueAssets = Array.from(new Set(trades.map(t => t.asset)));

  // Filter trades
  const filteredTrades = trades.filter(trade => {
    if (filterType !== 'all' && trade.type !== filterType) return false;
    if (filterAsset !== 'all' && trade.asset !== filterAsset) return false;
    return true;
  });

  // Sort by most recent first
  const sortedTrades = [...filteredTrades].sort((a, b) => b.timestamp - a.timestamp);

  const handleDownloadCSV = () => {
    downloadTradesCSV(sortedTrades);
  };

  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📜 Trade History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-600 font-medium">No trades yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Your trade history will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📜 Trade History ({sortedTrades.length})</CardTitle>
          <Button
            onClick={handleDownloadCSV}
            variant="ghost"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select
            label="Filter by Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
          >
            <option value="all">All Trades</option>
            <option value="buy">Buy Only</option>
            <option value="sell">Sell Only</option>
          </Select>

          <Select
            label="Filter by Asset"
            value={filterAsset}
            onChange={(e) => setFilterAsset(e.target.value)}
          >
            <option value="all">All Assets</option>
            {uniqueAssets.map(asset => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </Select>
        </div>

        {/* Trades List */}
        {sortedTrades.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No trades match the selected filters
          </div>
        ) : (
          <div className="space-y-2">
            {sortedTrades.map((trade) => {
              const isBuy = trade.type === 'buy';

              return (
                <div
                  key={trade.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    {/* Left: Trade Type & Asset */}
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        isBuy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isBuy ? '🟢 BUY' : '🔴 SELL'}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {trade.assetSymbol}
                      </span>
                    </div>

                    {/* Right: Date */}
                    <span className="text-xs text-gray-500">
                      {formatDateTime(trade.timestamp)}
                    </span>
                  </div>

                  {/* Trade Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Quantity</p>
                      <p className="font-medium text-gray-900">
                        {formatCryptoAmount(trade.quantity, trade.assetSymbol)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Price</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(trade.price)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Fee</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(trade.fee)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500 text-xs">Total</p>
                      <p className={`font-semibold ${isBuy ? 'text-red-600' : 'text-green-600'}`}>
                        {isBuy ? '-' : '+'}{formatCurrency(trade.netTotal)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
