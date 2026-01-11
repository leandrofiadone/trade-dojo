/**
 * TECHNICAL INDICATORS
 *
 * Biblioteca de indicadores técnicos para análisis de trading.
 * Incluye RSI, EMA, MACD, y análisis de volumen.
 */

import type { CandlestickData, VolumeData } from './priceHistory';

// ==================== RSI (Relative Strength Index) ====================

/**
 * Calcula el RSI (Relative Strength Index)
 *
 * RSI mide la velocidad y magnitud de los cambios de precio.
 * - RSI > 70: Sobrecompra (posible corrección bajista)
 * - RSI < 30: Sobreventa (posible rebote alcista)
 * - RSI 40-60: Zona neutral
 *
 * @param prices - Array de precios de cierre
 * @param period - Período para el cálculo (típicamente 14)
 * @returns RSI value (0-100)
 */
export function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) {
    return 50; // Valor neutral si no hay suficientes datos
  }

  const changes: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  let gains = 0;
  let losses = 0;

  // Primera iteración - promedio simple
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) {
      gains += changes[i];
    } else {
      losses += Math.abs(changes[i]);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Iteraciones subsecuentes - promedio suavizado
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return rsi;
}

// ==================== EMA (Exponential Moving Average) ====================

/**
 * Calcula la EMA (Exponential Moving Average)
 *
 * EMA da más peso a los precios recientes.
 * - Precio > EMA: Tendencia alcista
 * - Precio < EMA: Tendencia bajista
 *
 * @param prices - Array de precios
 * @param period - Período (ej: 20, 50, 200)
 * @returns EMA value
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) {
    return prices[prices.length - 1] || 0;
  }

  const multiplier = 2 / (period + 1);

  // Calcular SMA inicial
  let ema = 0;
  for (let i = 0; i < period; i++) {
    ema += prices[i];
  }
  ema = ema / period;

  // Calcular EMA
  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }

  return ema;
}

// ==================== MACD ====================

/**
 * Calcula el MACD (Moving Average Convergence Divergence)
 *
 * MACD detecta cambios en el momentum.
 * - MACD cruza arriba de Signal: Señal de compra
 * - MACD cruza abajo de Signal: Señal de venta
 *
 * @param prices - Array de precios de cierre
 * @returns { macd, signal, histogram }
 */
export function calculateMACD(prices: number[]): {
  macd: number;
  signal: number;
  histogram: number;
} {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  // Calcular línea de señal (EMA 9 del MACD)
  // Para simplificar, usamos un array de valores MACD históricos
  const macdLine: number[] = [];
  for (let i = 26; i <= prices.length; i++) {
    const slicePrices = prices.slice(0, i);
    const e12 = calculateEMA(slicePrices, 12);
    const e26 = calculateEMA(slicePrices, 26);
    macdLine.push(e12 - e26);
  }

  const signal = calculateEMA(macdLine, 9);
  const histogram = macd - signal;

  return { macd, signal, histogram };
}

// ==================== VOLUMEN ====================

/**
 * Analiza el volumen actual vs el promedio
 *
 * @param volumeData - Array de datos de volumen
 * @param period - Período para calcular promedio (default 20)
 * @returns { current, average, ratio, isHigh }
 */
export function analyzeVolume(
  volumeData: VolumeData[],
  period: number = 20
): {
  current: number;
  average: number;
  ratio: number;
  isHigh: boolean;
} {
  if (volumeData.length === 0) {
    return { current: 0, average: 0, ratio: 1, isHigh: false };
  }

  const current = volumeData[volumeData.length - 1]?.value || 0;

  const recentVolumes = volumeData.slice(-period).map(v => v.value);
  const average = recentVolumes.reduce((sum, v) => sum + v, 0) / recentVolumes.length;

  const ratio = average > 0 ? current / average : 1;
  const isHigh = ratio > 1.5; // Volumen alto si es 50% mayor al promedio

  return { current, average, ratio, isHigh };
}

// ==================== ATR (Average True Range) ====================

/**
 * Calcula el ATR (Average True Range) - Mide la volatilidad
 *
 * ATR alto = Mayor volatilidad = Movimientos de precio más grandes
 * ATR bajo = Menor volatilidad = Movimientos de precio más pequeños
 *
 * @param candleData - Datos de velas
 * @param period - Período (típicamente 14)
 * @returns ATR value
 */
export function calculateATR(candleData: CandlestickData[], period: number = 14): number {
  if (candleData.length < period + 1) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < candleData.length; i++) {
    const high = candleData[i].high;
    const low = candleData[i].low;
    const prevClose = candleData[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    trueRanges.push(tr);
  }

  // Calcular ATR como promedio móvil de True Ranges
  const recentTR = trueRanges.slice(-period);
  const atr = recentTR.reduce((sum, tr) => sum + tr, 0) / period;

  return atr;
}

// ==================== ADX (Average Directional Index) ====================

/**
 * Calcula el ADX - Mide la FUERZA de la tendencia (no la dirección)
 *
 * ADX > 25: Tendencia fuerte
 * ADX < 20: Sin tendencia clara (consolidación)
 * ADX entre 20-25: Tendencia débil
 *
 * @param candleData - Datos de velas
 * @param period - Período (típicamente 14)
 * @returns { adx, diPlus, diMinus, trend }
 */
export function calculateADX(candleData: CandlestickData[], period: number = 14): {
  adx: number;
  diPlus: number;
  diMinus: number;
  trend: 'strong-uptrend' | 'weak-uptrend' | 'ranging' | 'weak-downtrend' | 'strong-downtrend';
} {
  if (candleData.length < period * 2) {
    return { adx: 0, diPlus: 0, diMinus: 0, trend: 'ranging' };
  }

  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];

  // Calcular +DM, -DM, y TR
  for (let i = 1; i < candleData.length; i++) {
    const highDiff = candleData[i].high - candleData[i - 1].high;
    const lowDiff = candleData[i - 1].low - candleData[i].low;

    plusDM.push(highDiff > lowDiff && highDiff > 0 ? highDiff : 0);
    minusDM.push(lowDiff > highDiff && lowDiff > 0 ? lowDiff : 0);

    const trValue = Math.max(
      candleData[i].high - candleData[i].low,
      Math.abs(candleData[i].high - candleData[i - 1].close),
      Math.abs(candleData[i].low - candleData[i - 1].close)
    );
    tr.push(trValue);
  }

  // Calcular DI+ y DI-
  const smoothedPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0);
  const smoothedMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0);
  const smoothedTR = tr.slice(-period).reduce((a, b) => a + b, 0);

  const diPlus = smoothedTR > 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  const diMinus = smoothedTR > 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;

  // Calcular DX
  const dx = diPlus + diMinus > 0
    ? (Math.abs(diPlus - diMinus) / (diPlus + diMinus)) * 100
    : 0;

  // ADX es el promedio móvil de DX
  const adx = dx; // Simplificado

  // Determinar tendencia
  let trend: 'strong-uptrend' | 'weak-uptrend' | 'ranging' | 'weak-downtrend' | 'strong-downtrend';

  if (adx < 20) {
    trend = 'ranging';
  } else if (diPlus > diMinus) {
    trend = adx > 40 ? 'strong-uptrend' : 'weak-uptrend';
  } else {
    trend = adx > 40 ? 'strong-downtrend' : 'weak-downtrend';
  }

  return { adx, diPlus, diMinus, trend };
}

// ==================== SUPPORT & RESISTANCE ====================

/**
 * Detecta niveles de soporte y resistencia automáticamente
 */
export function findSupportResistance(candleData: CandlestickData[]): {
  support: number[];
  resistance: number[];
  nearest: { support: number; resistance: number };
} {
  if (candleData.length < 20) {
    const currentPrice = candleData[candleData.length - 1]?.close || 0;
    return {
      support: [],
      resistance: [],
      nearest: { support: currentPrice * 0.95, resistance: currentPrice * 1.05 }
    };
  }

  const highs = candleData.map(c => c.high);
  const lows = candleData.map(c => c.low);
  const currentPrice = candleData[candleData.length - 1].close;

  // Encontrar picos (resistencias)
  const resistanceLevels: number[] = [];
  for (let i = 2; i < highs.length - 2; i++) {
    if (
      highs[i] > highs[i - 1] &&
      highs[i] > highs[i - 2] &&
      highs[i] > highs[i + 1] &&
      highs[i] > highs[i + 2]
    ) {
      resistanceLevels.push(highs[i]);
    }
  }

  // Encontrar valles (soportes)
  const supportLevels: number[] = [];
  for (let i = 2; i < lows.length - 2; i++) {
    if (
      lows[i] < lows[i - 1] &&
      lows[i] < lows[i - 2] &&
      lows[i] < lows[i + 1] &&
      lows[i] < lows[i + 2]
    ) {
      supportLevels.push(lows[i]);
    }
  }

  // Encontrar niveles más cercanos
  const nearestSupport = supportLevels
    .filter(s => s < currentPrice)
    .sort((a, b) => b - a)[0] || currentPrice * 0.95;

  const nearestResistance = resistanceLevels
    .filter(r => r > currentPrice)
    .sort((a, b) => a - b)[0] || currentPrice * 1.05;

  return {
    support: supportLevels.slice(-3),
    resistance: resistanceLevels.slice(-3),
    nearest: {
      support: nearestSupport,
      resistance: nearestResistance
    }
  };
}

// ==================== FIBONACCI RETRACEMENTS ====================

/**
 * Calcula niveles de Fibonacci basados en el último swing high/low
 */
export function calculateFibonacci(candleData: CandlestickData[]): {
  high: number;
  low: number;
  levels: { level: number; price: number; label: string }[];
} {
  if (candleData.length < 20) {
    const currentPrice = candleData[candleData.length - 1]?.close || 0;
    return {
      high: currentPrice,
      low: currentPrice,
      levels: []
    };
  }

  const recent = candleData.slice(-50);
  const high = Math.max(...recent.map(c => c.high));
  const low = Math.min(...recent.map(c => c.low));
  const diff = high - low;

  const fibLevels = [
    { ratio: 0, label: '0% (Low)' },
    { ratio: 0.236, label: '23.6%' },
    { ratio: 0.382, label: '38.2%' },
    { ratio: 0.5, label: '50%' },
    { ratio: 0.618, label: '61.8%' },
    { ratio: 0.786, label: '78.6%' },
    { ratio: 1, label: '100% (High)' }
  ];

  const levels = fibLevels.map(fib => ({
    level: fib.ratio,
    price: low + (diff * fib.ratio),
    label: fib.label
  }));

  return { high, low, levels };
}

// ==================== CANDLESTICK PATTERNS ====================

export type CandlePattern =
  | 'doji'
  | 'hammer'
  | 'shooting-star'
  | 'bullish-engulfing'
  | 'bearish-engulfing'
  | 'morning-star'
  | 'evening-star'
  | 'none';

/**
 * Detecta patrones de velas japonesas
 */
export function detectCandlePatterns(candleData: CandlestickData[]): {
  pattern: CandlePattern;
  signal: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  explanation: string;
} {
  if (candleData.length < 3) {
    return {
      pattern: 'none',
      signal: 'neutral',
      confidence: 0,
      explanation: 'Datos insuficientes para detectar patrones'
    };
  }

  const last = candleData[candleData.length - 1];
  const prev1 = candleData[candleData.length - 2];
  const prev2 = candleData[candleData.length - 3];

  const bodySize = Math.abs(last.close - last.open);
  const totalRange = last.high - last.low;
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;

  // DOJI - Indecisión
  if (bodySize < totalRange * 0.1) {
    return {
      pattern: 'doji',
      signal: 'neutral',
      confidence: 70,
      explanation: 'Doji detectado: Indecisión en el mercado. Los compradores y vendedores están equilibrados. Espera confirmación en la próxima vela para determinar la dirección.'
    };
  }

  // HAMMER - Patrón alcista de reversión
  if (
    lowerWick > bodySize * 2 &&
    upperWick < bodySize * 0.3 &&
    last.close > last.open
  ) {
    return {
      pattern: 'hammer',
      signal: 'bullish',
      confidence: 75,
      explanation: 'Hammer (Martillo): Patrón de reversión alcista. Los vendedores empujaron el precio hacia abajo, pero los compradores recuperaron el control. Señal de posible rebote.'
    };
  }

  // SHOOTING STAR - Patrón bajista de reversión
  if (
    upperWick > bodySize * 2 &&
    lowerWick < bodySize * 0.3 &&
    last.close < last.open
  ) {
    return {
      pattern: 'shooting-star',
      signal: 'bearish',
      confidence: 75,
      explanation: 'Shooting Star (Estrella Fugaz): Patrón de reversión bajista. Los compradores intentaron subir el precio, pero los vendedores tomaron control. Señal de posible corrección.'
    };
  }

  // BULLISH ENGULFING - Envolvente alcista
  if (
    prev1.close < prev1.open && // Vela anterior bajista
    last.close > last.open && // Vela actual alcista
    last.open < prev1.close &&
    last.close > prev1.open
  ) {
    return {
      pattern: 'bullish-engulfing',
      signal: 'bullish',
      confidence: 85,
      explanation: 'Bullish Engulfing (Envolvente Alcista): Patrón muy alcista. La vela actual "envuelve" completamente a la anterior. Los compradores dominan completamente. Fuerte señal de compra.'
    };
  }

  // BEARISH ENGULFING - Envolvente bajista
  if (
    prev1.close > prev1.open && // Vela anterior alcista
    last.close < last.open && // Vela actual bajista
    last.open > prev1.close &&
    last.close < prev1.open
  ) {
    return {
      pattern: 'bearish-engulfing',
      signal: 'bearish',
      confidence: 85,
      explanation: 'Bearish Engulfing (Envolvente Bajista): Patrón muy bajista. La vela actual "envuelve" completamente a la anterior. Los vendedores dominan completamente. Fuerte señal de venta.'
    };
  }

  return {
    pattern: 'none',
    signal: 'neutral',
    confidence: 0,
    explanation: 'No se detectaron patrones significativos en las últimas velas'
  };
}

// ==================== MARKET SENTIMENT ====================

export type SentimentLevel = 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';

/**
 * Calcula el sentimiento del mercado basado en múltiples factores
 *
 * @param candleData - Datos de velas
 * @param volumeData - Datos de volumen
 * @param priceChange24h - Cambio de precio 24h (%)
 * @returns { sentiment, score, label }
 */
export function calculateMarketSentiment(
  candleData: CandlestickData[],
  volumeData: VolumeData[],
  priceChange24h: number
): {
  sentiment: SentimentLevel;
  score: number; // 0-100
  label: string;
  emoji: string;
} {
  if (candleData.length < 14) {
    return {
      sentiment: 'neutral',
      score: 50,
      label: 'Neutral',
      emoji: '⚖️'
    };
  }

  const prices = candleData.map(c => c.close);
  const rsi = calculateRSI(prices);
  const volumeAnalysis = analyzeVolume(volumeData);

  // Cálculo del score de sentimiento (0-100)
  let score = 50; // Base neutral

  // Factor 1: RSI (peso 40%)
  if (rsi > 70) {
    score += (rsi - 70) * 0.67; // Hacia greed
  } else if (rsi < 30) {
    score -= (30 - rsi) * 0.67; // Hacia fear
  } else {
    // RSI entre 30-70, ajustar proporcionalmente
    score += (rsi - 50) * 0.4;
  }

  // Factor 2: Cambio de precio 24h (peso 30%)
  const priceImpact = Math.min(Math.max(priceChange24h * 1.5, -15), 15);
  score += priceImpact;

  // Factor 3: Volumen (peso 15%)
  if (volumeAnalysis.isHigh) {
    // Alto volumen amplifica la tendencia
    if (priceChange24h > 0) {
      score += 5; // Volumen alto + precio sube = más greed
    } else if (priceChange24h < 0) {
      score -= 5; // Volumen alto + precio baja = más fear
    }
  }

  // Factor 4: Tendencia (EMA 20 vs precio actual) (peso 15%)
  const ema20 = calculateEMA(prices, 20);
  const currentPrice = prices[prices.length - 1];
  const trendStrength = ((currentPrice - ema20) / ema20) * 100;
  score += trendStrength * 0.75;

  // Normalizar score a 0-100
  score = Math.max(0, Math.min(100, score));

  // Determinar sentimiento
  let sentiment: SentimentLevel;
  let label: string;
  let emoji: string;

  if (score >= 75) {
    sentiment = 'extreme-greed';
    label = 'Codicia Extrema';
    emoji = '🔥';
  } else if (score >= 60) {
    sentiment = 'greed';
    label = 'Optimista';
    emoji = '📈';
  } else if (score >= 40) {
    sentiment = 'neutral';
    label = 'Neutral';
    emoji = '⚖️';
  } else if (score >= 25) {
    sentiment = 'fear';
    label = 'Pesimista';
    emoji = '📉';
  } else {
    sentiment = 'extreme-fear';
    label = 'Miedo Extremo';
    emoji = '😨';
  }

  return { sentiment, score, label, emoji };
}

// ==================== TRADING SIGNALS ====================

export type SignalType = 'strong-buy' | 'buy' | 'neutral' | 'sell' | 'strong-sell';

export interface TradingSignal {
  type: SignalType;
  confidence: number; // 0-100
  indicators: {
    name: string;
    signal: 'buy' | 'sell' | 'neutral';
    value: string;
    explanation: string;
    weight: number; // Importancia del indicador
  }[];
  recommendation: string;

  // NUEVOS CAMPOS AVANZADOS
  trendAnalysis: {
    shortTerm: string; // Últimas 20 velas
    mediumTerm: string; // Últimas 50 velas
    longTerm: string; // Últimas 200 velas
    overall: string;
  };

  volatilityAnalysis: {
    level: 'very-low' | 'low' | 'normal' | 'high' | 'very-high';
    atr: number;
    description: string;
  };

  priceAction: {
    pattern: CandlePattern;
    patternSignal: 'bullish' | 'bearish' | 'neutral';
    patternExplanation: string;
  };

  keyLevels: {
    entry: number;
    stopLoss: number;
    takeProfit1: number;
    takeProfit2: number;
    takeProfit3: number;
    riskRewardRatio: number;
    nearest: {
      support: number;
      resistance: number;
    };
  };

  probabilities: {
    bullishContinuation: number;
    bearishContinuation: number;
    reversal: number;
    consolidation: number;
    mostLikely: string;
  };

  educationalInsights: string[];
}

/**
 * Genera señales de trading basadas en múltiples indicadores
 *
 * @param candleData - Datos de velas
 * @param volumeData - Datos de volumen
 * @returns TradingSignal
 */
export function generateTradingSignals(
  candleData: CandlestickData[],
  volumeData: VolumeData[]
): TradingSignal {
  if (candleData.length < 50) {
    const emptySignal: TradingSignal = {
      type: 'neutral',
      confidence: 0,
      indicators: [],
      recommendation: 'Datos insuficientes para análisis completo. Se requieren al menos 50 velas.',
      trendAnalysis: {
        shortTerm: 'Insuficiente',
        mediumTerm: 'Insuficiente',
        longTerm: 'Insuficiente',
        overall: 'No disponible'
      },
      volatilityAnalysis: {
        level: 'normal',
        atr: 0,
        description: 'Datos insuficientes'
      },
      priceAction: {
        pattern: 'none',
        patternSignal: 'neutral',
        patternExplanation: 'Datos insuficientes'
      },
      keyLevels: {
        entry: 0,
        stopLoss: 0,
        takeProfit1: 0,
        takeProfit2: 0,
        takeProfit3: 0,
        riskRewardRatio: 0,
        nearest: { support: 0, resistance: 0 }
      },
      probabilities: {
        bullishContinuation: 33,
        bearishContinuation: 33,
        reversal: 17,
        consolidation: 17,
        mostLikely: 'Insuficientes datos'
      },
      educationalInsights: ['Acumula más datos históricos para un análisis completo']
    };
    return emptySignal;
  }

  const prices = candleData.map(c => c.close);
  const currentPrice = prices[prices.length - 1];

  // ==================== CALCULAR TODOS LOS INDICADORES ====================
  const rsi = calculateRSI(prices);
  const ema20 = calculateEMA(prices, 20);
  const ema50 = calculateEMA(prices, 50);
  const ema200 = calculateEMA(prices, 200);
  const macd = calculateMACD(prices);
  const volume = analyzeVolume(volumeData);
  const atr = calculateATR(candleData);
  const adx = calculateADX(candleData);
  const supportResistance = findSupportResistance(candleData);
  const fibonacci = calculateFibonacci(candleData);
  const candlePattern = detectCandlePatterns(candleData);

  const indicators: TradingSignal['indicators'] = [];
  let buyVotes = 0;
  let sellVotes = 0;
  let totalWeight = 0;

  // ==================== ANÁLISIS DE INDICADORES ====================

  // 1. RSI (Peso: 3)
  let rsiSignal: 'buy' | 'sell' | 'neutral';
  let rsiExplanation: string;
  const rsiWeight = 3;

  if (rsi < 30) {
    rsiSignal = 'buy';
    buyVotes += 3;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - ZONA DE SOBREVENTA. El activo ha bajado demasiado y es probable un rebote alcista. Los compradores podrían entrar pronto.`;
  } else if (rsi > 70) {
    rsiSignal = 'sell';
    sellVotes += 3;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - ZONA DE SOBRECOMPRA. El activo ha subido demasiado rápido. Posible corrección o consolidación próxima.`;
  } else if (rsi < 45) {
    rsiSignal = 'buy';
    buyVotes += 1;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - Presión bajista moderada. El precio está por debajo del equilibrio pero no sobrev endido.`;
  } else if (rsi > 55) {
    rsiSignal = 'sell';
    sellVotes += 1;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - Presión alcista moderada. El precio está por encima del equilibrio pero no sobrecomprado.`;
  } else {
    rsiSignal = 'neutral';
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - Zona de equilibrio (40-60). Compradores y vendedores en balance. Sin señal clara.`;
  }

  totalWeight += rsiWeight;
  indicators.push({
    name: 'RSI (14)',
    signal: rsiSignal,
    value: rsi.toFixed(1),
    explanation: rsiExplanation,
    weight: rsiWeight
  });

  // 2. EMA Crossover
  let emaSignal: 'buy' | 'sell' | 'neutral';
  let emaExplanation: string;

  if (ema20 > ema50 && currentPrice > ema20) {
    emaSignal = 'buy';
    buyVotes += 2;
    emaExplanation = 'Tendencia alcista confirmada (EMA20 > EMA50)';
  } else if (ema20 < ema50 && currentPrice < ema20) {
    emaSignal = 'sell';
    sellVotes += 2;
    emaExplanation = 'Tendencia bajista confirmada (EMA20 < EMA50)';
  } else if (currentPrice > ema20) {
    emaSignal = 'buy';
    buyVotes += 1;
    emaExplanation = 'Precio por encima de EMA20';
  } else if (currentPrice < ema20) {
    emaSignal = 'sell';
    sellVotes += 1;
    emaExplanation = 'Precio por debajo de EMA20';
  } else {
    emaSignal = 'neutral';
    emaExplanation = 'Sin tendencia clara';
  }

  indicators.push({
    name: 'EMA 20/50',
    signal: emaSignal,
    value: `${ema20.toFixed(0)} / ${ema50.toFixed(0)}`,
    explanation: emaExplanation
  });

  // 3. MACD
  let macdSignal: 'buy' | 'sell' | 'neutral';
  let macdExplanation: string;

  if (macd.histogram > 0 && macd.macd > macd.signal) {
    macdSignal = 'buy';
    buyVotes += 1;
    macdExplanation = 'MACD por encima de señal - momentum alcista';
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    macdSignal = 'sell';
    sellVotes += 1;
    macdExplanation = 'MACD por debajo de señal - momentum bajista';
  } else {
    macdSignal = 'neutral';
    macdExplanation = 'Sin momentum claro';
  }

  indicators.push({
    name: 'MACD',
    signal: macdSignal,
    value: macd.histogram.toFixed(2),
    explanation: macdExplanation
  });

  // 4. Volumen
  let volumeSignal: 'buy' | 'sell' | 'neutral';
  let volumeExplanation: string;

  const priceChange = ((prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;

  if (volume.isHigh && priceChange > 0) {
    volumeSignal = 'buy';
    buyVotes += 1;
    volumeExplanation = `Volumen alto (+${volume.ratio.toFixed(1)}x) con precio subiendo`;
  } else if (volume.isHigh && priceChange < 0) {
    volumeSignal = 'sell';
    sellVotes += 1;
    volumeExplanation = `Volumen alto (+${volume.ratio.toFixed(1)}x) con precio bajando`;
  } else if (volume.ratio < 0.7) {
    volumeSignal = 'neutral';
    volumeExplanation = 'Volumen bajo - falta confirmación';
  } else {
    volumeSignal = 'neutral';
    volumeExplanation = 'Volumen normal';
  }

  indicators.push({
    name: 'Volumen',
    signal: volumeSignal,
    value: `${volume.ratio.toFixed(1)}x`,
    explanation: volumeExplanation
  });

  // Determinar señal final
  const totalVotes = buyVotes + sellVotes;
  const netVotes = buyVotes - sellVotes;
  const confidence = totalVotes > 0 ? Math.abs(netVotes / totalVotes) * 100 : 0;

  let type: SignalType;
  let recommendation: string;

  if (netVotes >= 4) {
    type = 'strong-buy';
    recommendation = `Señal de COMPRA FUERTE. ${buyVotes} indicadores alcistas vs ${sellVotes} bajistas.`;
  } else if (netVotes >= 2) {
    type = 'buy';
    recommendation = `Señal de COMPRA. Mayoría de indicadores alcistas.`;
  } else if (netVotes <= -4) {
    type = 'strong-sell';
    recommendation = `Señal de VENTA FUERTE. ${sellVotes} indicadores bajistas vs ${buyVotes} alcistas.`;
  } else if (netVotes <= -2) {
    type = 'sell';
    recommendation = `Señal de VENTA. Mayoría de indicadores bajistas.`;
  } else {
    type = 'neutral';
    recommendation = 'Señales mixtas. Esperar confirmación antes de operar.';
  }

  return {
    type,
    confidence: Math.round(confidence),
    indicators,
    recommendation
  };
}
