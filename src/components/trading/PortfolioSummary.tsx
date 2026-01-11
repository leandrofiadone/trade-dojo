/**
 * PortfolioSummary Component
 *
 * Displays key portfolio statistics in a dashboard format.
 */

import React from 'react';
import { Wallet, TrendingUp, Activity, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <div className="grid grid-cols-4 gap-1">
      {stats.map((stat, index) => {
        const Icon = stat.icon;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15, delay: index * 0.03 }}
            className="bg-white rounded shadow-sm p-1 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-0.5">
              <p className="text-[8px] text-gray-600 font-medium">{stat.label}</p>
              <Icon className={`w-2.5 h-2.5 ${stat.color}`} />
            </div>

            <p className={`text-xs font-bold ${
              stat.label === 'Total P&L' ? stat.color : 'text-gray-900'
            }`}>
              {stat.value}
            </p>

            <p className={`text-[7px] ${
              stat.label === 'Total P&L'
                ? stat.color
                : 'text-gray-500'
            }`}>
              {stat.subtext}
            </p>
          </motion.div>
        );
      })}
    </div>
  );
}
