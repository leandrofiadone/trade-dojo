/**
 * PRICE SERVICE - CoinGecko API Integration
 *
 * Este servicio maneja toda la comunicación con la API de CoinGecko
 * para obtener precios de criptomonedas en tiempo real.
 *
 * CoinGecko Free Tier Limits:
 * - 50 llamadas por minuto
 * - No requiere API key
 * - Delay recomendado: 1200ms entre llamadas
 */

import type { Asset, CoinGeckoMarketData } from '../types/trading';

// ==================== CONFIGURATION ====================

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

/**
 * Top cryptocurrencies que vamos a trackear
 * Puedes agregar más IDs de https://api.coingecko.com/api/v3/coins/list
 */
export const TRACKED_ASSETS = [
  'bitcoin',
  'ethereum',
  'tether',
  'binancecoin',
  'solana',
  'cardano',
  'ripple',
  'polkadot',
  'dogecoin',
  'avalanche-2',
  'polygon',
  'chainlink',
  'litecoin',
  'uniswap',
  'stellar'
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
    console.log('🌐 Fetching fresh prices from CoinGecko...');

    const url = `${COINGECKO_API_BASE}/coins/markets?vs_currency=usd&ids=${TRACKED_ASSETS.join(',')}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data: CoinGeckoMarketData[] = await response.json();

    // Transformar a nuestro formato
    const assets: Asset[] = data.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      current_price: coin.current_price,
      price_change_percentage_24h: coin.price_change_percentage_24h || 0,
      image: coin.image,
      market_cap: coin.market_cap,
      total_volume: coin.total_volume,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h
    }));

    // Actualizar cache
    priceCache = {
      data: assets,
      timestamp: Date.now()
    };

    console.log(`✅ Fetched ${assets.length} assets from CoinGecko`);
    return assets;

  } catch (error) {
    console.error('❌ Error fetching market prices:', error);

    // Si hay error pero tenemos cache (aunque sea viejo), usarlo
    if (priceCache) {
      console.log('⚠️ Using stale cache due to API error');
      return priceCache.data;
    }

    // Si no hay cache, retornar array vacío
    // En producción podrías mostrar un error al usuario
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
    const url = `${COINGECKO_API_BASE}/simple/price?ids=${assetId}&vs_currencies=usd`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return data[assetId]?.usd || null;

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
