/**
 * Quick Signals - Fast signal calculation for Market List
 *
 * Uses simplified calculations based on 24h price data
 * without requiring full candlestick history
 */

import type { Asset } from '../types/trading';
import type { CandlestickData } from './priceHistory';
import {
  calculateRSI,
  calculateEMA,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  detectCandlePatterns,
  calculateCCI,
  calculateWilliamsR,
  calculateROC,
  calculateMFI,
  calculateParabolicSAR,
  calculateOBV,
  calculateVWAP,
  calculateSupertrend,
  analyzeMarketStructure
} from './technicalIndicators';

export type QuickSignalType =
  | 'extreme-buy'      // Nuevo: señal extremadamente alcista
  | 'strong-buy'
  | 'buy'
  | 'weak-buy'         // Nuevo: señal débilmente alcista
  | 'neutral'
  | 'weak-sell'        // Nuevo: señal débilmente bajista
  | 'sell'
  | 'strong-sell'
  | 'extreme-sell';    // Nuevo: señal extremadamente bajista

export interface QuickSignal {
  type: QuickSignalType;
  label: string;
  color: string;
  bgColor: string;
  bgGradient: string;
  emoji: string;
  strength: number;
  qualityScore: number;  // 0-100: qué tan confiable es esta señal
  confirmations: string[]; // Lista de indicadores que confirman
  warnings: string[];     // Advertencias o factores en contra
}

/**
 * Calculate a quick trading signal based on 24h price data
 * Now with 9 levels and gradient colors for scalping
 */
export function calculateQuickSignal(asset: Asset): QuickSignal {
  const priceChange24h = asset.price_change_percentage_24h || 0;
  const currentPrice = asset.current_price;
  const high24h = asset.high_24h || currentPrice;
  const low24h = asset.low_24h || currentPrice;

  // Calculate position in 24h range (0 = at low, 1 = at high)
  const range24h = high24h - low24h;
  const positionInRange = range24h > 0
    ? (currentPrice - low24h) / range24h
    : 0.5;

  // Momentum scoring - ULTRA SENSIBLE para scalping
  let score = 0;

  // Price change momentum (muy sensible)
  if (priceChange24h > 8) score += 50;
  else if (priceChange24h > 5) score += 40;
  else if (priceChange24h > 3) score += 30;
  else if (priceChange24h > 1.5) score += 20;
  else if (priceChange24h > 0.5) score += 10;
  else if (priceChange24h > 0.1) score += 5;
  else if (priceChange24h < -8) score -= 50;
  else if (priceChange24h < -5) score -= 40;
  else if (priceChange24h < -3) score -= 30;
  else if (priceChange24h < -1.5) score -= 20;
  else if (priceChange24h < -0.5) score -= 10;
  else if (priceChange24h < -0.1) score -= 5;

  // Position in range bonus (más sensible)
  if (positionInRange > 0.90) score += 15;
  else if (positionInRange > 0.75) score += 10;
  else if (positionInRange > 0.60) score += 5;
  else if (positionInRange < 0.10) score -= 15;
  else if (positionInRange < 0.25) score -= 10;
  else if (positionInRange < 0.40) score -= 5;

  // Normalize score to 0-100 range for strength
  const strength = Math.max(0, Math.min(100, 50 + score));

  // Determine signal type based on score (9 niveles)
  const baseConfirmations = [`Cambio 24h: ${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(1)}%`];
  const baseWarnings = ['Señal básica sin indicadores técnicos'];

  if (score >= 50) {
    return {
      type: 'extreme-buy',
      label: 'COMPRA EXTREMA',
      color: 'text-white',
      bgColor: 'bg-green-600',
      bgGradient: 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600',
      emoji: '🚀',
      strength,
      qualityScore: 40,
      confirmations: [...baseConfirmations, 'Momentum 24h muy fuerte'],
      warnings: baseWarnings
    };
  }

  if (score >= 35) {
    return {
      type: 'strong-buy',
      label: 'COMPRA FUERTE',
      color: 'text-white',
      bgColor: 'bg-green-500',
      bgGradient: 'bg-gradient-to-r from-green-400 to-green-500',
      emoji: '🟢',
      strength,
      qualityScore: 35,
      confirmations: [...baseConfirmations, 'Momentum 24h fuerte'],
      warnings: baseWarnings
    };
  }

  if (score >= 20) {
    return {
      type: 'buy',
      label: 'COMPRA',
      color: 'text-green-900',
      bgColor: 'bg-green-400',
      bgGradient: 'bg-gradient-to-r from-green-300 to-green-400',
      emoji: '🟢',
      strength,
      qualityScore: 30,
      confirmations: [...baseConfirmations, 'Momentum 24h positivo'],
      warnings: baseWarnings
    };
  }

  if (score >= 5) {
    return {
      type: 'weak-buy',
      label: 'COMPRA DÉBIL',
      color: 'text-green-800',
      bgColor: 'bg-green-300',
      bgGradient: 'bg-gradient-to-r from-green-200 to-green-300',
      emoji: '🟢',
      strength,
      qualityScore: 25,
      confirmations: baseConfirmations,
      warnings: [...baseWarnings, 'Momentum muy débil']
    };
  }

  if (score <= -50) {
    return {
      type: 'extreme-sell',
      label: 'VENTA EXTREMA',
      color: 'text-white',
      bgColor: 'bg-red-600',
      bgGradient: 'bg-gradient-to-r from-red-500 via-red-600 to-rose-600',
      emoji: '💥',
      strength,
      qualityScore: 40,
      confirmations: [...baseConfirmations, 'Momentum 24h muy negativo'],
      warnings: baseWarnings
    };
  }

  if (score <= -35) {
    return {
      type: 'strong-sell',
      label: 'VENTA FUERTE',
      color: 'text-white',
      bgColor: 'bg-red-500',
      bgGradient: 'bg-gradient-to-r from-red-400 to-red-500',
      emoji: '🔴',
      strength,
      qualityScore: 35,
      confirmations: [...baseConfirmations, 'Momentum 24h fuerte negativo'],
      warnings: baseWarnings
    };
  }

  if (score <= -20) {
    return {
      type: 'sell',
      label: 'VENTA',
      color: 'text-red-900',
      bgColor: 'bg-red-400',
      bgGradient: 'bg-gradient-to-r from-red-300 to-red-400',
      emoji: '🔴',
      strength,
      qualityScore: 30,
      confirmations: [...baseConfirmations, 'Momentum 24h negativo'],
      warnings: baseWarnings
    };
  }

  if (score <= -5) {
    return {
      type: 'weak-sell',
      label: 'VENTA DÉBIL',
      color: 'text-red-800',
      bgColor: 'bg-red-300',
      bgGradient: 'bg-gradient-to-r from-red-200 to-red-300',
      emoji: '🔴',
      strength,
      qualityScore: 25,
      confirmations: baseConfirmations,
      warnings: [...baseWarnings, 'Momentum muy débil']
    };
  }

  // NEUTRAL (entre -5 y 5)
  return {
    type: 'neutral',
    label: 'NEUTRAL',
    color: 'text-gray-800',
    bgColor: 'bg-gray-300',
    bgGradient: 'bg-gradient-to-r from-gray-200 to-gray-300',
    emoji: '⚪',
    strength,
    qualityScore: 30,
    confirmations: ['Solo datos de precio 24h disponibles'],
    warnings: ['Señal básica - activa timeframe para análisis completo']
  };
}

/**
 * Calculate signal based on candlestick data with MULTI-INDICATOR CONFIRMATION
 * SISTEMA COMPLETO: 19 INDICADORES TÉCNICOS para scalping profesional
 */
export function calculateQuickSignalFromCandles(
  candleData: CandlestickData[],
  asset: Asset
): QuickSignal {
  if (!candleData || candleData.length < 20) {
    return calculateQuickSignal(asset);
  }

  const prices = candleData.map(c => c.close);
  const currentPrice = prices[prices.length - 1];
  const prevPrice = prices[prices.length - 2] || currentPrice;

  // ==================== CALCULAR TODOS LOS 19 INDICADORES ====================

  // Momentum Indicators
  const rsi = calculateRSI(prices, 14);
  const stochastic = calculateStochastic(candleData, 14, 3);
  const cci = calculateCCI(candleData, 20);
  const williamsR = calculateWilliamsR(candleData, 14);
  const roc = calculateROC(prices, 12);
  const mfi = calculateMFI(candleData, 14);

  // Trend Indicators
  const ema9 = calculateEMA(prices, 9);
  const ema21 = calculateEMA(prices, 21);
  const ema50 = prices.length >= 50 ? calculateEMA(prices, 50) : null;
  const macd = calculateMACD(prices);
  const parabolicSAR = calculateParabolicSAR(candleData);
  const supertrend = calculateSupertrend(candleData);
  const marketStructure = analyzeMarketStructure(candleData, 20);

  // Volatility Indicators
  const bollinger = calculateBollingerBands(prices, 20, 2);

  // Volume Indicators
  const obv = calculateOBV(candleData);
  const vwap = calculateVWAP(candleData);

  // Pattern Recognition
  const candlePattern = detectCandlePatterns(candleData);

  // Volume analysis (básico)
  const recentCandles = candleData.slice(-10);
  const avgVolume = recentCandles.slice(0, -1).reduce((sum, c) => sum + (c.volume || 0), 0) / 9;
  const currentVolume = recentCandles[recentCandles.length - 1].volume || 0;
  const volumeRatio = avgVolume > 0 ? currentVolume / avgVolume : 1;

  // RSI Divergence detection
  const recentPrices = prices.slice(-10);
  const recentRSIs = recentPrices.map((_, i) => calculateRSI(prices.slice(0, prices.length - 10 + i + 1), 14));
  const priceTrend = recentPrices[recentPrices.length - 1] - recentPrices[0];
  const rsiTrend = recentRSIs[recentRSIs.length - 1] - recentRSIs[0];
  const bullishDivergence = priceTrend < 0 && rsiTrend > 0 && rsi < 40;
  const bearishDivergence = priceTrend > 0 && rsiTrend < 0 && rsi > 60;

  // Price momentum
  const priceChangePercent = ((currentPrice - prevPrice) / prevPrice) * 100;
  const priceChange5 = ((currentPrice - prices[prices.length - 6]) / prices[prices.length - 6]) * 100;

  // Confirmations and Warnings tracking
  const confirmations: string[] = [];
  const warnings: string[] = [];

  // ==================== SISTEMA DE CONFIRMACIÓN MÚLTIPLE (19 INDICADORES) ====================
  let bullishConfirmations = 0;
  let bearishConfirmations = 0;

  // ========== MOMENTUM INDICATORS (6 indicadores) ==========

  // 1. RSI (peso: 1-2)
  if (rsi < 30) {
    bullishConfirmations += 2;
    confirmations.push(`RSI: ${rsi.toFixed(1)} (oversold fuerte)`);
  } else if (rsi < 40) {
    bullishConfirmations += 1;
    confirmations.push(`RSI: ${rsi.toFixed(1)} (oversold)`);
  } else if (rsi > 70) {
    bearishConfirmations += 2;
    confirmations.push(`RSI: ${rsi.toFixed(1)} (overbought fuerte)`);
  } else if (rsi > 60) {
    bearishConfirmations += 1;
    confirmations.push(`RSI: ${rsi.toFixed(1)} (overbought)`);
  }

  // 2. Stochastic (peso: 1-2)
  if (stochastic.signal === 'oversold') {
    bullishConfirmations += 2;
    confirmations.push(`Stoch: ${stochastic.k.toFixed(0)} (oversold)`);
  } else if (stochastic.k < 30) {
    bullishConfirmations += 1;
    confirmations.push(`Stoch: ${stochastic.k.toFixed(0)} (bajo)`);
  } else if (stochastic.signal === 'overbought') {
    bearishConfirmations += 2;
    confirmations.push(`Stoch: ${stochastic.k.toFixed(0)} (overbought)`);
  } else if (stochastic.k > 70) {
    bearishConfirmations += 1;
    confirmations.push(`Stoch: ${stochastic.k.toFixed(0)} (alto)`);
  }

  // 3. CCI (peso: 1-2)
  if (cci.signal === 'oversold') {
    bullishConfirmations += 2;
    confirmations.push(`CCI: ${cci.cci.toFixed(0)} (oversold <-100)`);
  } else if (cci.signal === 'bullish') {
    bullishConfirmations += 1;
    confirmations.push(`CCI: ${cci.cci.toFixed(0)} (alcista)`);
  } else if (cci.signal === 'overbought') {
    bearishConfirmations += 2;
    confirmations.push(`CCI: ${cci.cci.toFixed(0)} (overbought >100)`);
  } else if (cci.signal === 'bearish') {
    bearishConfirmations += 1;
    confirmations.push(`CCI: ${cci.cci.toFixed(0)} (bajista)`);
  }

  // 4. Williams %R (peso: 1-2)
  if (williamsR.signal === 'oversold') {
    bullishConfirmations += 2;
    confirmations.push(`%R: ${williamsR.williamsR.toFixed(0)} (oversold)`);
  } else if (williamsR.signal === 'overbought') {
    bearishConfirmations += 2;
    confirmations.push(`%R: ${williamsR.williamsR.toFixed(0)} (overbought)`);
  }

  // 5. ROC (peso: 1-2)
  if (roc.signal === 'strong-bullish') {
    bullishConfirmations += 2;
    confirmations.push(`ROC: +${roc.roc.toFixed(1)}% (momentum fuerte)`);
  } else if (roc.signal === 'bullish') {
    bullishConfirmations += 1;
    confirmations.push(`ROC: +${roc.roc.toFixed(1)}% (positivo)`);
  } else if (roc.signal === 'strong-bearish') {
    bearishConfirmations += 2;
    confirmations.push(`ROC: ${roc.roc.toFixed(1)}% (momentum negativo fuerte)`);
  } else if (roc.signal === 'bearish') {
    bearishConfirmations += 1;
    confirmations.push(`ROC: ${roc.roc.toFixed(1)}% (negativo)`);
  }

  // 6. MFI - Money Flow Index (peso: 1-2)
  if (mfi.signal === 'oversold') {
    bullishConfirmations += 2;
    confirmations.push(`MFI: ${mfi.mfi.toFixed(0)} (oversold con volumen)`);
  } else if (mfi.signal === 'overbought') {
    bearishConfirmations += 2;
    confirmations.push(`MFI: ${mfi.mfi.toFixed(0)} (overbought con volumen)`);
  }

  // ========== TREND INDICATORS (7 indicadores) ==========

  // 7. EMA Trend (peso: 1-2)
  const bullishEMA = currentPrice > ema9 && ema9 > ema21;
  const bearishEMA = currentPrice < ema9 && ema9 < ema21;

  if (bullishEMA) {
    bullishConfirmations += 2;
    confirmations.push('EMA: Tendencia alcista (P>9>21)');
  } else if (bearishEMA) {
    bearishConfirmations += 2;
    confirmations.push('EMA: Tendencia bajista (P<9<21)');
  } else if (currentPrice > ema9) {
    bullishConfirmations += 1;
    confirmations.push('EMA: Precio sobre EMA9');
  } else if (currentPrice < ema9) {
    bearishConfirmations += 1;
    confirmations.push('EMA: Precio bajo EMA9');
  }

  // 8. EMA50 Long-term (peso: 1)
  if (ema50) {
    if (currentPrice > ema50 && ema9 > ema50) {
      bullishConfirmations += 1;
      confirmations.push('EMA50: Tendencia LP alcista');
    } else if (currentPrice < ema50 && ema9 < ema50) {
      bearishConfirmations += 1;
      confirmations.push('EMA50: Tendencia LP bajista');
    }
  }

  // 9. MACD (peso: 1-2)
  if (macd.histogram > 0 && macd.macd > macd.signal) {
    bullishConfirmations += 2;
    confirmations.push(`MACD: Momentum alcista (${macd.histogram.toFixed(2)})`);
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    bearishConfirmations += 2;
    confirmations.push(`MACD: Momentum bajista (${macd.histogram.toFixed(2)})`);
  } else if (macd.histogram > 0) {
    bullishConfirmations += 1;
    confirmations.push('MACD: Histograma +');
  } else if (macd.histogram < 0) {
    bearishConfirmations += 1;
    confirmations.push('MACD: Histograma -');
  }

  // 10. Parabolic SAR (peso: 1-2)
  if (parabolicSAR.signal === 'buy') {
    bullishConfirmations += 2;
    confirmations.push('⚡ SAR: Señal de COMPRA (reversión)');
  } else if (parabolicSAR.trend === 'bullish') {
    bullishConfirmations += 1;
    confirmations.push('SAR: Tendencia alcista');
  } else if (parabolicSAR.signal === 'sell') {
    bearishConfirmations += 2;
    confirmations.push('⚡ SAR: Señal de VENTA (reversión)');
  } else if (parabolicSAR.trend === 'bearish') {
    bearishConfirmations += 1;
    confirmations.push('SAR: Tendencia bajista');
  }

  // 11. Supertrend (peso: 1-2)
  if (supertrend.signal === 'buy') {
    bullishConfirmations += 2;
    confirmations.push('⚡ Supertrend: BUY signal');
  } else if (supertrend.trend === 'bullish') {
    bullishConfirmations += 1;
    confirmations.push('Supertrend: Alcista');
  } else if (supertrend.signal === 'sell') {
    bearishConfirmations += 2;
    confirmations.push('⚡ Supertrend: SELL signal');
  } else if (supertrend.trend === 'bearish') {
    bearishConfirmations += 1;
    confirmations.push('Supertrend: Bajista');
  }

  // 12. Market Structure (peso: 1-2)
  if (marketStructure.structure === 'uptrend') {
    bullishConfirmations += 2;
    confirmations.push(`Estructura: Uptrend (${marketStructure.higherHighs} HH)`);
  } else if (marketStructure.structure === 'downtrend') {
    bearishConfirmations += 2;
    confirmations.push(`Estructura: Downtrend (${marketStructure.lowerLows} LL)`);
  } else if (marketStructure.signal === 'bullish') {
    bullishConfirmations += 1;
    confirmations.push('Estructura: Alcista');
  } else if (marketStructure.signal === 'bearish') {
    bearishConfirmations += 1;
    confirmations.push('Estructura: Bajista');
  }

  // 13. VWAP (peso: 1)
  if (vwap.signal === 'bullish') {
    bullishConfirmations += 1;
    confirmations.push('VWAP: Precio > VWAP (alcista)');
  } else if (vwap.signal === 'bearish') {
    bearishConfirmations += 1;
    confirmations.push('VWAP: Precio < VWAP (bajista)');
  }

  // ========== VOLATILITY INDICATORS (1 indicador) ==========

  // 14. Bollinger Bands (peso: 1-2)
  if (bollinger.percentB < 0.2) {
    bullishConfirmations += 2;
    confirmations.push(`BB: Banda inf (${(bollinger.percentB * 100).toFixed(0)}%)`);
  } else if (bollinger.percentB < 0.3) {
    bullishConfirmations += 1;
    confirmations.push('BB: Cerca banda inferior');
  } else if (bollinger.percentB > 0.8) {
    bearishConfirmations += 2;
    confirmations.push(`BB: Banda sup (${(bollinger.percentB * 100).toFixed(0)}%)`);
  } else if (bollinger.percentB > 0.7) {
    bearishConfirmations += 1;
    confirmations.push('BB: Cerca banda superior');
  }

  // ========== VOLUME INDICATORS (3 indicadores) ==========

  // 15. Volume Ratio (peso: 1-2)
  if (volumeRatio > 1.5) {
    if (priceChangePercent > 0.3) {
      bullishConfirmations += 2;
      confirmations.push(`Vol: Alto (${(volumeRatio * 100).toFixed(0)}%) + sube`);
    } else if (priceChangePercent < -0.3) {
      bearishConfirmations += 2;
      confirmations.push(`Vol: Alto (${(volumeRatio * 100).toFixed(0)}%) + baja`);
    }
  } else if (volumeRatio < 0.6) {
    warnings.push('Vol bajo');
  }

  // 16. OBV (peso: 1-2)
  if (obv.trend === 'accumulation') {
    bullishConfirmations += 2;
    confirmations.push('OBV: Acumulación');
  } else if (obv.trend === 'distribution') {
    bearishConfirmations += 2;
    confirmations.push('OBV: Distribución');
  }

  // 17. Momentum Simple (peso: 1)
  if (priceChangePercent > 0.5 && priceChange5 > 1) {
    bullishConfirmations += 1;
    confirmations.push(`Momentum: +${priceChange5.toFixed(1)}%`);
  } else if (priceChangePercent < -0.5 && priceChange5 < -1) {
    bearishConfirmations += 1;
    confirmations.push(`Momentum: ${priceChange5.toFixed(1)}%`);
  }

  // ========== PATTERN ANALYSIS (2 indicadores) ==========

  // 18. RSI Divergence (peso: 2)
  if (bullishDivergence) {
    bullishConfirmations += 2;
    confirmations.push('⚡ DIVERGENCIA ALCISTA');
  }
  if (bearishDivergence) {
    bearishConfirmations += 2;
    confirmations.push('⚡ DIVERGENCIA BAJISTA');
  }

  // 19. Candlestick Pattern (peso: 1-2)
  if (candlePattern.pattern !== 'none') {
    if (candlePattern.signal === 'bullish') {
      const weight = candlePattern.confidence >= 80 ? 2 : 1;
      bullishConfirmations += weight;
      confirmations.push(`Patrón: ${candlePattern.pattern}`);
    } else if (candlePattern.signal === 'bearish') {
      const weight = candlePattern.confidence >= 80 ? 2 : 1;
      bearishConfirmations += weight;
      confirmations.push(`Patrón: ${candlePattern.pattern}`);
    }
  }

  // ==================== FILTROS DE CALIDAD ====================

  // Contra-tendencia (warning)
  if (bullishConfirmations > bearishConfirmations && bearishEMA && ema50 && currentPrice < ema50) {
    warnings.push('⚠️ Contra tendencia');
  }
  if (bearishConfirmations > bullishConfirmations && bullishEMA && ema50 && currentPrice > ema50) {
    warnings.push('⚠️ Contra tendencia');
  }

  // RSI neutral (warning)
  if (rsi > 45 && rsi < 55) {
    warnings.push('RSI neutral');
  }

  // ==================== QUALITY SCORE CALCULATION ====================
  // Con 19 indicadores, el score máximo teórico es ~38 confirmaciones
  // Ajustamos el cálculo: cada confirmación vale 6 puntos, warnings restan 5
  const totalConfirmations = Math.max(bullishConfirmations, bearishConfirmations);
  const qualityScore = Math.min(100, Math.max(0,
    (totalConfirmations * 6) - (warnings.length * 5)
  ));

  // ==================== SIGNAL DETERMINATION ====================
  // Umbrales ajustados para 19 indicadores
  const netScore = bullishConfirmations - bearishConfirmations;
  const strength = Math.max(0, Math.min(100, 50 + (netScore * 4)));

  // EXTREME BUY: 12+ confirmaciones (de 19 posibles = 63%)
  if (bullishConfirmations >= 12 && qualityScore >= 70) {
    return {
      type: 'extreme-buy',
      label: 'COMPRA EXTREMA',
      color: 'text-white',
      bgColor: 'bg-green-600',
      bgGradient: 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600',
      emoji: '🚀',
      strength,
      qualityScore,
      confirmations,
      warnings
    };
  }

  // STRONG BUY: 8-11 confirmaciones (42-58%)
  if (bullishConfirmations >= 8 && bearishConfirmations <= 3 && qualityScore >= 45) {
    return {
      type: 'strong-buy',
      label: 'COMPRA FUERTE',
      color: 'text-white',
      bgColor: 'bg-green-500',
      bgGradient: 'bg-gradient-to-r from-green-400 to-green-500',
      emoji: '🟢',
      strength,
      qualityScore,
      confirmations,
      warnings
    };
  }

  // BUY: 5-7 confirmaciones (26-37%)
  if (bullishConfirmations >= 5 && bearishConfirmations <= 3) {
    return {
      type: 'buy',
      label: 'COMPRA',
      color: 'text-green-900',
      bgColor: 'bg-green-400',
      bgGradient: 'bg-gradient-to-r from-green-300 to-green-400',
      emoji: '🟢',
      strength,
      qualityScore: Math.max(35, qualityScore),
      confirmations,
      warnings
    };
  }

  // WEAK BUY: 3-4 confirmaciones (16-21%)
  if (bullishConfirmations >= 3 && bearishConfirmations <= 2) {
    return {
      type: 'weak-buy',
      label: 'COMPRA DÉBIL',
      color: 'text-green-800',
      bgColor: 'bg-green-300',
      bgGradient: 'bg-gradient-to-r from-green-200 to-green-300',
      emoji: '🟢',
      strength,
      qualityScore: Math.max(25, qualityScore),
      confirmations,
      warnings
    };
  }

  // EXTREME SELL: 12+ confirmaciones
  if (bearishConfirmations >= 12 && qualityScore >= 70) {
    return {
      type: 'extreme-sell',
      label: 'VENTA EXTREMA',
      color: 'text-white',
      bgColor: 'bg-red-600',
      bgGradient: 'bg-gradient-to-r from-red-500 via-red-600 to-rose-600',
      emoji: '💥',
      strength,
      qualityScore,
      confirmations,
      warnings
    };
  }

  // STRONG SELL: 8-11 confirmaciones
  if (bearishConfirmations >= 8 && bullishConfirmations <= 3 && qualityScore >= 45) {
    return {
      type: 'strong-sell',
      label: 'VENTA FUERTE',
      color: 'text-white',
      bgColor: 'bg-red-500',
      bgGradient: 'bg-gradient-to-r from-red-400 to-red-500',
      emoji: '🔴',
      strength,
      qualityScore,
      confirmations,
      warnings
    };
  }

  // SELL: 5-7 confirmaciones
  if (bearishConfirmations >= 5 && bullishConfirmations <= 3) {
    return {
      type: 'sell',
      label: 'VENTA',
      color: 'text-red-900',
      bgColor: 'bg-red-400',
      bgGradient: 'bg-gradient-to-r from-red-300 to-red-400',
      emoji: '🔴',
      strength,
      qualityScore: Math.max(35, qualityScore),
      confirmations,
      warnings
    };
  }

  // WEAK SELL: 3-4 confirmaciones
  if (bearishConfirmations >= 3 && bullishConfirmations <= 2) {
    return {
      type: 'weak-sell',
      label: 'VENTA DÉBIL',
      color: 'text-red-800',
      bgColor: 'bg-red-300',
      bgGradient: 'bg-gradient-to-r from-red-200 to-red-300',
      emoji: '🔴',
      strength,
      qualityScore: Math.max(25, qualityScore),
      confirmations,
      warnings
    };
  }

  // NEUTRAL (menos de 3 confirmaciones en cualquier dirección)
  if (confirmations.length === 0) {
    confirmations.push('Sin señales claras');
  }

  return {
    type: 'neutral',
    label: 'NEUTRAL',
    color: 'text-gray-800',
    bgColor: 'bg-gray-300',
    bgGradient: 'bg-gradient-to-r from-gray-200 to-gray-300',
    emoji: '⚪',
    strength: 50,
    qualityScore: Math.min(35, qualityScore),
    confirmations,
    warnings: [...warnings, 'Insuficientes confirmaciones']
  };
}

/**
 * Get signal badge styling for display
 */
export function getSignalBadgeClass(signalType: QuickSignalType): string {
  switch (signalType) {
    case 'extreme-buy':
      return 'bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 text-white font-bold shadow-lg ring-2 ring-green-400';
    case 'strong-buy':
      return 'bg-gradient-to-r from-green-400 to-green-500 text-white font-bold shadow-md';
    case 'buy':
      return 'bg-gradient-to-r from-green-300 to-green-400 text-green-900 font-semibold';
    case 'weak-buy':
      return 'bg-gradient-to-r from-green-200 to-green-300 text-green-800';
    case 'neutral':
      return 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800';
    case 'weak-sell':
      return 'bg-gradient-to-r from-red-200 to-red-300 text-red-800';
    case 'sell':
      return 'bg-gradient-to-r from-red-300 to-red-400 text-red-900 font-semibold';
    case 'strong-sell':
      return 'bg-gradient-to-r from-red-400 to-red-500 text-white font-bold shadow-md';
    case 'extreme-sell':
      return 'bg-gradient-to-r from-red-500 via-red-600 to-rose-600 text-white font-bold shadow-lg ring-2 ring-red-400';
    default:
      return 'bg-gray-300 text-gray-700';
  }
}
