/**
 * MarketList Component
 *
 * Displays a list of cryptocurrencies with real-time prices from CoinGecko.
 * Updates automatically every 60 seconds.
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import type { Asset } from '../../types/trading';
import { getMarketPrices, clearPriceCache, getTimeUntilNextUpdate } from '../../lib/priceService';
import { formatCurrency, formatPercentage, formatRelativeTime } from '../../utils/formatters';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

interface MarketListProps {
  onSelectAsset?: (asset: Asset) => void;
  selectedAssetId?: string;
}

export function MarketList({ onSelectAsset, selectedAssetId }: MarketListProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [refreshing, setRefreshing] = useState(false);

  // Load market prices
  const loadPrices = async (forceRefresh = false) => {
    try {
      setError(null);
      if (forceRefresh) {
        setRefreshing(true);
        clearPriceCache();
      } else {
        setLoading(true);
      }

      const data = await getMarketPrices(!forceRefresh);
      setAssets(data);
      setLastUpdate(Date.now());

    } catch (err) {
      console.error('Error loading market prices:', err);
      setError('Failed to load market data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPrices();
  }, []);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadPrices();
    }, 60 * 1000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    loadPrices(true);
  };

  const handleAssetClick = (asset: Asset) => {
    if (onSelectAsset) {
      onSelectAsset(asset);
    }
  };

  if (loading && assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading market data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && assets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Market Prices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="primary" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>📊 Market Prices</CardTitle>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              Updated {formatRelativeTime(lastUpdate)}
            </span>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              loading={refreshing}
              className="!p-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="!p-0">
        <div className="divide-y divide-gray-200">
          {assets.map((asset) => {
            const isPositive = asset.price_change_percentage_24h >= 0;
            const isSelected = asset.id === selectedAssetId;

            return (
              <div
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className={`
                  flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors
                  ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''}
                `}
              >
                {/* Left: Asset Info */}
                <div className="flex items-center space-x-3 flex-1">
                  {asset.image && (
                    <img
                      src={asset.image}
                      alt={asset.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{asset.name}</p>
                    <p className="text-sm text-gray-500">{asset.symbol}</p>
                  </div>
                </div>

                {/* Right: Price Info */}
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(asset.current_price)}
                  </p>
                  <div className="flex items-center justify-end space-x-1">
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600" />
                    )}
                    <span className={isPositive ? 'profit text-sm' : 'loss text-sm'}>
                      {formatPercentage(asset.price_change_percentage_24h)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {error && assets.length > 0 && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs text-yellow-800">
            ⚠️ {error} Showing cached data.
          </p>
        </div>
      )}
    </Card>
  );
}
