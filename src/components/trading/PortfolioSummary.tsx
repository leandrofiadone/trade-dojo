/**
 * PortfolioSummary Component
 *
 * Displays key portfolio statistics in a dashboard format.
 */

import React from 'react';
import { Wallet, TrendingUp, Activity, DollarSign } from 'lucide-react';
import type { Portfolio } from '../../types/trading';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  totalTrades: number;
  initialBalance: number;
}

export function PortfolioSummary({ portfolio, totalTrades, initialBalance }: PortfolioSummaryProps) {
  const totalReturn = portfolio.totalValue - initialBalance;
  const totalReturnPercentage = ((totalReturn) / initialBalance) * 100;

  const stats = [
    {
      label: 'Available Balance',
      value: formatCurrency(portfolio.balance),
      icon: Wallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtext: '💵 Ready to trade'
    },
    {
      label: 'Invested',
      value: formatCurrency(portfolio.totalInvested),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtext: '📊 In positions'
    },
    {
      label: 'Total P&L',
      value: formatCurrency(totalReturn),
      icon: TrendingUp,
      color: totalReturn >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: totalReturn >= 0 ? 'bg-green-100' : 'bg-red-100',
      subtext: `${formatPercentage(totalReturnPercentage)} ${totalReturn >= 0 ? '📈' : '📉'}`
    },
    {
      label: 'Total Trades',
      value: totalTrades.toString(),
      icon: Activity,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      subtext: totalTrades > 0 ? '🎯 Trading active' : '🎯 Start trading!'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>

            <p className={`text-2xl font-bold mb-1 ${
              stat.label === 'Total P&L' ? stat.color : 'text-gray-900'
            }`}>
              {stat.value}
            </p>

            <p className={`text-xs ${
              stat.label === 'Total P&L'
                ? stat.color
                : 'text-gray-500'
            }`}>
              {stat.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
