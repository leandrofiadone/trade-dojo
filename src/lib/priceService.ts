/**
 * PRICE SERVICE - Binance API Integration
 *
 * Este servicio maneja toda la comunicación con la API de Binance
 * para obtener precios de criptomonedas en tiempo real.
 *
 * Binance API Public Endpoints:
 * - Sin límites restrictivos
 * - No requiere API key
 * - Muy confiable y rápida
 */

import type { Asset } from '../types/trading';

// ==================== CONFIGURATION ====================

const BINANCE_API_BASE = 'https://api.binance.com/api/v3';

/**
 * Top cryptocurrencies que vamos a trackear
 * Símbolos de trading pairs en Binance (todos contra USDT)
 */
export const TRACKED_ASSETS = [
  { symbol: 'BTCUSDT', id: 'bitcoin', name: 'Bitcoin', displaySymbol: 'BTC' },
  { symbol: 'ETHUSDT', id: 'ethereum', name: 'Ethereum', displaySymbol: 'ETH' },
  { symbol: 'BNBUSDT', id: 'binancecoin', name: 'BNB', displaySymbol: 'BNB' },
  { symbol: 'SOLUSDT', id: 'solana', name: 'Solana', displaySymbol: 'SOL' },
  { symbol: 'ADAUSDT', id: 'cardano', name: 'Cardano', displaySymbol: 'ADA' },
  { symbol: 'XRPUSDT', id: 'ripple', name: 'XRP', displaySymbol: 'XRP' },
  { symbol: 'DOTUSDT', id: 'polkadot', name: 'Polkadot', displaySymbol: 'DOT' },
  { symbol: 'DOGEUSDT', id: 'dogecoin', name: 'Dogecoin', displaySymbol: 'DOGE' },
  { symbol: 'AVAXUSDT', id: 'avalanche', name: 'Avalanche', displaySymbol: 'AVAX' },
  { symbol: 'MATICUSDT', id: 'polygon', name: 'Polygon', displaySymbol: 'MATIC' },
  { symbol: 'LINKUSDT', id: 'chainlink', name: 'Chainlink', displaySymbol: 'LINK' },
  { symbol: 'LTCUSDT', id: 'litecoin', name: 'Litecoin', displaySymbol: 'LTC' },
  { symbol: 'UNIUSDT', id: 'uniswap', name: 'Uniswap', displaySymbol: 'UNI' },
  { symbol: 'XLMUSDT', id: 'stellar', name: 'Stellar', displaySymbol: 'XLM' }
];

// ==================== CACHE ====================

/**
 * Cache simple para evitar llamadas innecesarias a la API
 *
 * TRADING CONCEPT: Rate Limiting
 * Las APIs gratuitas tienen límites de llamadas. Usar cache reduce:
 * - Número de llamadas al API
 * - Latencia (respuestas más rápidas)
 * - Riesgo de ban por exceso de llamadas
 */
interface CacheEntry {
  data: Asset[];
  timestamp: number;
}

let priceCache: CacheEntry | null = null;
const CACHE_DURATION = 60 * 1000; // 60 segundos

/**
 * Verifica si el cache es válido
 */
function isCacheValid(): boolean {
  if (!priceCache) return false;
  const now = Date.now();
  return (now - priceCache.timestamp) < CACHE_DURATION;
}

// ==================== API CALLS ====================

/**
 * Obtiene los precios actuales de las criptomonedas principales
 *
 * @param useCache - Si true, usa cache si está disponible
 * @returns Array de Assets con precios actuales
 */
export async function getMarketPrices(useCache = true): Promise<Asset[]> {
  // Verificar cache
  if (useCache && isCacheValid() && priceCache) {
    console.log('📦 Using cached prices');
    return priceCache.data;
  }

  try {
    console.log('🌐 Fetching fresh prices from Binance...');

    // Obtener datos de 24hr ticker para todos los símbolos
    const symbols = TRACKED_ASSETS.map(a => `"${a.symbol}"`).join(',');
    const url = `${BINANCE_API_BASE}/ticker/24hr?symbols=[${symbols}]`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transformar a nuestro formato
    const assets: Asset[] = data.map((ticker: any) => {
      const assetInfo = TRACKED_ASSETS.find(a => a.symbol === ticker.symbol);
      if (!assetInfo) return null;

      const currentPrice = parseFloat(ticker.lastPrice);
      const priceChange24h = parseFloat(ticker.priceChangePercent);
      const high24h = parseFloat(ticker.highPrice);
      const low24h = parseFloat(ticker.lowPrice);
      const volume = parseFloat(ticker.volume);

      return {
        id: assetInfo.id,
        symbol: assetInfo.displaySymbol,
        name: assetInfo.name,
        current_price: currentPrice,
        price_change_percentage_24h: priceChange24h,
        image: `https://cryptoicons.org/api/icon/${assetInfo.displaySymbol.toLowerCase()}/200`,
        market_cap: currentPrice * volume * 365, // Estimación simple
        total_volume: volume * currentPrice,
        high_24h: high24h,
        low_24h: low24h
      };
    }).filter(Boolean) as Asset[];

    // Actualizar cache
    priceCache = {
      data: assets,
      timestamp: Date.now()
    };

    console.log(`✅ Fetched ${assets.length} assets from Binance`);
    return assets;

  } catch (error) {
    console.error('❌ Error fetching market prices:', error);

    // Si hay error pero tenemos cache (aunque sea viejo), usarlo
    if (priceCache) {
      console.log('⚠️ Using stale cache due to API error');
      return priceCache.data;
    }

    // Si no hay cache, retornar array vacío
    return [];
  }
}

/**
 * Obtiene el precio de un asset específico
 *
 * @param assetId - ID del asset (ej: 'bitcoin')
 * @returns Precio actual o null si no se encuentra
 */
export async function getAssetPrice(assetId: string): Promise<number | null> {
  try {
    const assetInfo = TRACKED_ASSETS.find(a => a.id === assetId);
    if (!assetInfo) return null;

    const url = `${BINANCE_API_BASE}/ticker/price?symbol=${assetInfo.symbol}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = await response.json();
    return parseFloat(data.price) || null;

  } catch (error) {
    console.error(`❌ Error fetching price for ${assetId}:`, error);
    return null;
  }
}

/**
 * Obtiene información detallada de un asset
 *
 * @param assetId - ID del asset
 * @returns Asset completo o null
 */
export async function getAssetDetails(assetId: string): Promise<Asset | null> {
  try {
    const url = `${COINGECKO_API_BASE}/coins/${assetId}?localization=false&tickers=false&community_data=false&developer_data=false`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();

    const asset: Asset = {
      id: data.id,
      symbol: data.symbol.toUpperCase(),
      name: data.name,
      current_price: data.market_data.current_price.usd,
      price_change_percentage_24h: data.market_data.price_change_percentage_24h,
      image: data.image.large,
      market_cap: data.market_data.market_cap.usd,
      total_volume: data.market_data.total_volume.usd,
      high_24h: data.market_data.high_24h.usd,
      low_24h: data.market_data.low_24h.usd
    };

    return asset;

  } catch (error) {
    console.error(`❌ Error fetching details for ${assetId}:`, error);
    return null;
  }
}

/**
 * Limpia el cache manualmente
 * Útil cuando el usuario quiere forzar una actualización
 */
export function clearPriceCache(): void {
  priceCache = null;
  console.log('🗑️ Price cache cleared');
}

/**
 * Obtiene el timestamp de la última actualización de precios
 */
export function getLastUpdateTime(): number | null {
  return priceCache?.timestamp || null;
}

/**
 * Calcula cuánto tiempo falta para la próxima actualización automática
 */
export function getTimeUntilNextUpdate(): number {
  if (!priceCache) return 0;

  const elapsed = Date.now() - priceCache.timestamp;
  const remaining = CACHE_DURATION - elapsed;

  return Math.max(0, remaining);
}

/**
 * Helper: Crea un Map de assetId -> price para updates rápidos
 */
export function createPriceMap(assets: Asset[]): Map<string, number> {
  const priceMap = new Map<string, number>();

  assets.forEach(asset => {
    priceMap.set(asset.id, asset.current_price);
  });

  return priceMap;
}
