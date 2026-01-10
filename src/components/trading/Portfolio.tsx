/**
 * Portfolio Component
 *
 * Displays the user's current holdings with real-time P&L calculations.
 */

import React from 'react';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { Portfolio as PortfolioType } from '../../types/trading';
import { formatCurrency, formatPercentage, formatCryptoAmount } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface PortfolioProps {
  portfolio: PortfolioType;
}

export function Portfolio({ portfolio }: PortfolioProps) {
  const hasHoldings = portfolio.holdings.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>💼 My Portfolio</CardTitle>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(portfolio.totalValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${portfolio.totalPnL >= 0 ? 'profit' : 'loss'}`}>
              {formatCurrency(portfolio.totalPnL)}
            </p>
            <p className={`text-sm ${portfolio.totalPnL >= 0 ? 'profit' : 'loss'}`}>
              {formatPercentage(portfolio.totalPnLPercentage)}
            </p>
          </div>
        </div>

        {/* Holdings List */}
        {!hasHoldings ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">No holdings yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start trading to build your portfolio
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolio.holdings.map((holding) => {
              const isProfit = holding.pnl >= 0;

              return (
                <div
                  key={holding.asset}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Header: Asset Name & Symbol */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{holding.assetName}</p>
                      <p className="text-sm text-gray-500">{holding.assetSymbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(holding.currentValue)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatCryptoAmount(holding.quantity, holding.assetSymbol)}
                      </p>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">Avg Buy Price</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(holding.averageBuyPrice)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Current Price</p>
                      <p className="font-medium text-gray-900">
                        {formatCurrency(holding.currentPrice)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">P&L</p>
                      <p className={`font-medium ${isProfit ? 'profit' : 'loss'}`}>
                        {formatCurrency(holding.pnl)}
                      </p>
                      <p className={`text-xs ${isProfit ? 'profit' : 'loss'}`}>
                        {formatPercentage(holding.pnlPercentage)}
                      </p>
                    </div>
                  </div>

                  {/* P&L Bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isProfit ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(holding.pnlPercentage), 100)}%`
                        }}
                      />
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
