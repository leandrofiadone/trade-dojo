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

// ==================== BOLLINGER BANDS ====================

/**
 * Calcula las Bandas de Bollinger
 *
 * Bandas de Bollinger miden la volatilidad y niveles de sobrecompra/sobreventa
 * - Precio toca banda superior: Posible sobrecompra
 * - Precio toca banda inferior: Posible sobreventa
 * - Bandas se estrechan: Baja volatilidad (posible breakout próximo)
 * - Bandas se ensanchan: Alta volatilidad
 */
export function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number; // %B: posición del precio dentro de las bandas (0-1)
} {
  if (prices.length < period) {
    const currentPrice = prices[prices.length - 1] || 0;
    return {
      upper: currentPrice,
      middle: currentPrice,
      lower: currentPrice,
      bandwidth: 0,
      percentB: 0.5
    };
  }

  // Calcular SMA (banda media)
  const recentPrices = prices.slice(-period);
  const middle = recentPrices.reduce((sum, p) => sum + p, 0) / period;

  // Calcular desviación estándar
  const squaredDiffs = recentPrices.map(p => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((sum, d) => sum + d, 0) / period;
  const standardDeviation = Math.sqrt(variance);

  // Calcular bandas
  const upper = middle + (standardDeviation * stdDev);
  const lower = middle - (standardDeviation * stdDev);

  // Bandwidth: qué tan anchas están las bandas
  const bandwidth = ((upper - lower) / middle) * 100;

  // %B: posición del precio dentro de las bandas
  const currentPrice = prices[prices.length - 1];
  const percentB = (upper - lower) !== 0
    ? (currentPrice - lower) / (upper - lower)
    : 0.5;

  return { upper, middle, lower, bandwidth, percentB };
}

// ==================== STOCHASTIC OSCILLATOR ====================

/**
 * Calcula el Oscilador Estocástico
 *
 * Stochastic mide el momentum comparando el precio de cierre con el rango de precios
 * - %K > 80: Sobrecompra
 * - %K < 20: Sobreventa
 * - %K cruza %D al alza: Señal de compra
 * - %K cruza %D a la baja: Señal de venta
 */
export function calculateStochastic(candleData: CandlestickData[], kPeriod: number = 14, dPeriod: number = 3): {
  k: number; // %K: Línea rápida
  d: number; // %D: Línea de señal (SMA de %K)
  signal: 'overbought' | 'oversold' | 'neutral';
} {
  if (candleData.length < kPeriod) {
    return { k: 50, d: 50, signal: 'neutral' };
  }

  // Calcular %K
  const recentCandles = candleData.slice(-kPeriod);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  const currentClose = recentCandles[recentCandles.length - 1].close;

  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);

  const k = (highestHigh - lowestLow) !== 0
    ? ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
    : 50;

  // Calcular %D (SMA de %K para los últimos dPeriod períodos)
  // Para simplificar, calculamos %K para cada una de las últimas dPeriod velas
  const kValues: number[] = [];
  for (let i = 0; i < Math.min(dPeriod, candleData.length - kPeriod + 1); i++) {
    const slice = candleData.slice(-(kPeriod + dPeriod - i), candleData.length - i);
    if (slice.length >= kPeriod) {
      const sliceHighs = slice.slice(-kPeriod).map(c => c.high);
      const sliceLows = slice.slice(-kPeriod).map(c => c.low);
      const sliceClose = slice[slice.length - 1].close;
      const sliceHH = Math.max(...sliceHighs);
      const sliceLL = Math.min(...sliceLows);
      const sliceK = (sliceHH - sliceLL) !== 0
        ? ((sliceClose - sliceLL) / (sliceHH - sliceLL)) * 100
        : 50;
      kValues.push(sliceK);
    }
  }

  const d = kValues.length > 0
    ? kValues.reduce((sum, v) => sum + v, 0) / kValues.length
    : k;

  // Determinar señal
  let signal: 'overbought' | 'oversold' | 'neutral';
  if (k > 80) {
    signal = 'overbought';
  } else if (k < 20) {
    signal = 'oversold';
  } else {
    signal = 'neutral';
  }

  return { k, d, signal };
}

// ==================== CCI (Commodity Channel Index) ====================

/**
 * Calcula el CCI (Commodity Channel Index)
 *
 * CCI mide la desviación del precio respecto a su promedio
 * - CCI > +100: Sobrecompra
 * - CCI < -100: Sobreventa
 * - CCI cruzando 0: Cambio de tendencia
 */
export function calculateCCI(candleData: CandlestickData[], period: number = 20): {
  cci: number;
  signal: 'overbought' | 'oversold' | 'bullish' | 'bearish' | 'neutral';
} {
  if (candleData.length < period) {
    return { cci: 0, signal: 'neutral' };
  }

  const recentCandles = candleData.slice(-period);

  // Calcular Typical Price (TP) = (High + Low + Close) / 3
  const typicalPrices = recentCandles.map(c => (c.high + c.low + c.close) / 3);

  // Calcular SMA de TP
  const sma = typicalPrices.reduce((sum, tp) => sum + tp, 0) / period;

  // Calcular Mean Deviation
  const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - sma), 0) / period;

  // CCI = (Typical Price - SMA) / (0.015 * Mean Deviation)
  const currentTP = typicalPrices[typicalPrices.length - 1];
  const cci = meanDeviation !== 0 ? (currentTP - sma) / (0.015 * meanDeviation) : 0;

  // Determinar señal
  let signal: 'overbought' | 'oversold' | 'bullish' | 'bearish' | 'neutral';
  if (cci > 100) {
    signal = 'overbought';
  } else if (cci < -100) {
    signal = 'oversold';
  } else if (cci > 0) {
    signal = 'bullish';
  } else if (cci < 0) {
    signal = 'bearish';
  } else {
    signal = 'neutral';
  }

  return { cci, signal };
}

// ==================== WILLIAMS %R ====================

/**
 * Calcula Williams %R
 *
 * Williams %R mide nivel de sobrecompra/sobreventa
 * - %R > -20: Sobrecompra (valores van de 0 a -100)
 * - %R < -80: Sobreventa
 */
export function calculateWilliamsR(candleData: CandlestickData[], period: number = 14): {
  williamsR: number;
  signal: 'overbought' | 'oversold' | 'neutral';
} {
  if (candleData.length < period) {
    return { williamsR: -50, signal: 'neutral' };
  }

  const recentCandles = candleData.slice(-period);
  const highs = recentCandles.map(c => c.high);
  const lows = recentCandles.map(c => c.low);
  const currentClose = recentCandles[recentCandles.length - 1].close;

  const highestHigh = Math.max(...highs);
  const lowestLow = Math.min(...lows);

  const williamsR = (highestHigh - lowestLow) !== 0
    ? ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100
    : -50;

  let signal: 'overbought' | 'oversold' | 'neutral';
  if (williamsR > -20) {
    signal = 'overbought';
  } else if (williamsR < -80) {
    signal = 'oversold';
  } else {
    signal = 'neutral';
  }

  return { williamsR, signal };
}

// ==================== ROC (Rate of Change) ====================

/**
 * Calcula ROC (Rate of Change)
 *
 * ROC mide el cambio porcentual del precio en un período
 * - ROC > 0: Momentum alcista
 * - ROC < 0: Momentum bajista
 */
export function calculateROC(prices: number[], period: number = 12): {
  roc: number;
  signal: 'strong-bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong-bearish';
} {
  if (prices.length < period + 1) {
    return { roc: 0, signal: 'neutral' };
  }

  const currentPrice = prices[prices.length - 1];
  const priceNPeriodsAgo = prices[prices.length - period - 1];

  const roc = ((currentPrice - priceNPeriodsAgo) / priceNPeriodsAgo) * 100;

  let signal: 'strong-bullish' | 'bullish' | 'neutral' | 'bearish' | 'strong-bearish';
  if (roc > 5) {
    signal = 'strong-bullish';
  } else if (roc > 1) {
    signal = 'bullish';
  } else if (roc < -5) {
    signal = 'strong-bearish';
  } else if (roc < -1) {
    signal = 'bearish';
  } else {
    signal = 'neutral';
  }

  return { roc, signal };
}

// ==================== MFI (Money Flow Index) ====================

/**
 * Calcula MFI (Money Flow Index)
 *
 * MFI es como RSI pero incorpora volumen
 * - MFI > 80: Sobrecompra
 * - MFI < 20: Sobreventa
 */
export function calculateMFI(candleData: CandlestickData[], period: number = 14): {
  mfi: number;
  signal: 'overbought' | 'oversold' | 'neutral';
} {
  if (candleData.length < period + 1) {
    return { mfi: 50, signal: 'neutral' };
  }

  const recentCandles = candleData.slice(-(period + 1));

  // Calcular Typical Price y Money Flow
  let positiveMoneyFlow = 0;
  let negativeMoneyFlow = 0;

  for (let i = 1; i < recentCandles.length; i++) {
    const typicalPrice = (recentCandles[i].high + recentCandles[i].low + recentCandles[i].close) / 3;
    const prevTypicalPrice = (recentCandles[i-1].high + recentCandles[i-1].low + recentCandles[i-1].close) / 3;
    const moneyFlow = typicalPrice * (recentCandles[i].volume || 0);

    if (typicalPrice > prevTypicalPrice) {
      positiveMoneyFlow += moneyFlow;
    } else if (typicalPrice < prevTypicalPrice) {
      negativeMoneyFlow += moneyFlow;
    }
  }

  const moneyFlowRatio = negativeMoneyFlow !== 0 ? positiveMoneyFlow / negativeMoneyFlow : 100;
  const mfi = 100 - (100 / (1 + moneyFlowRatio));

  let signal: 'overbought' | 'oversold' | 'neutral';
  if (mfi > 80) {
    signal = 'overbought';
  } else if (mfi < 20) {
    signal = 'oversold';
  } else {
    signal = 'neutral';
  }

  return { mfi, signal };
}

// ==================== PARABOLIC SAR ====================

/**
 * Calcula Parabolic SAR (Stop and Reverse)
 *
 * SAR indica puntos de reversión potenciales
 * - Precio > SAR: Tendencia alcista
 * - Precio < SAR: Tendencia bajista
 */
export function calculateParabolicSAR(
  candleData: CandlestickData[],
  step: number = 0.02,
  max: number = 0.2
): {
  sar: number;
  trend: 'bullish' | 'bearish';
  signal: 'buy' | 'sell' | 'hold';
} {
  if (candleData.length < 5) {
    const currentPrice = candleData[candleData.length - 1]?.close || 0;
    return { sar: currentPrice, trend: 'bullish', signal: 'hold' };
  }

  // Simplificado: usar los últimos 5 períodos para determinar tendencia inicial
  const recent = candleData.slice(-5);
  const currentPrice = recent[recent.length - 1].close;
  const avgHigh = recent.reduce((sum, c) => sum + c.high, 0) / recent.length;
  const avgLow = recent.reduce((sum, c) => sum + c.low, 0) / recent.length;

  // Determinar tendencia actual
  const isBullish = currentPrice > (avgHigh + avgLow) / 2;

  // SAR simplificado: usar 2% por debajo/encima del precio para stops
  const sar = isBullish
    ? Math.min(...recent.map(c => c.low)) * 0.98
    : Math.max(...recent.map(c => c.high)) * 1.02;

  // Detectar reversión
  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  if (isBullish && currentPrice < sar) {
    signal = 'sell';
  } else if (!isBullish && currentPrice > sar) {
    signal = 'buy';
  }

  return {
    sar,
    trend: isBullish ? 'bullish' : 'bearish',
    signal
  };
}

// ==================== OBV (On Balance Volume) ====================

/**
 * Calcula OBV (On Balance Volume)
 *
 * OBV mide presión de compra/venta mediante volumen
 * - OBV subiendo: Acumulación
 * - OBV bajando: Distribución
 */
export function calculateOBV(candleData: CandlestickData[]): {
  obv: number;
  trend: 'accumulation' | 'distribution' | 'neutral';
  signal: 'bullish' | 'bearish' | 'neutral';
} {
  if (candleData.length < 2) {
    return { obv: 0, trend: 'neutral', signal: 'neutral' };
  }

  let obv = 0;
  for (let i = 1; i < candleData.length; i++) {
    const volume = candleData[i].volume || 0;
    if (candleData[i].close > candleData[i - 1].close) {
      obv += volume;
    } else if (candleData[i].close < candleData[i - 1].close) {
      obv -= volume;
    }
  }

  // Analizar últimas 10 velas para determinar tendencia
  const recent = Math.min(10, candleData.length - 1);
  let obvRecent = 0;
  for (let i = candleData.length - recent; i < candleData.length; i++) {
    const volume = candleData[i].volume || 0;
    if (candleData[i].close > candleData[i - 1].close) {
      obvRecent += volume;
    } else if (candleData[i].close < candleData[i - 1].close) {
      obvRecent -= volume;
    }
  }

  const trend = obvRecent > 0 ? 'accumulation' : obvRecent < 0 ? 'distribution' : 'neutral';
  const signal = obvRecent > 0 ? 'bullish' : obvRecent < 0 ? 'bearish' : 'neutral';

  return { obv, trend, signal };
}

// ==================== VWAP (Volume Weighted Average Price) ====================

/**
 * Calcula VWAP (Volume Weighted Average Price)
 *
 * VWAP es el precio promedio ponderado por volumen
 * - Precio > VWAP: Alcista
 * - Precio < VWAP: Bajista
 */
export function calculateVWAP(candleData: CandlestickData[]): {
  vwap: number;
  signal: 'bullish' | 'bearish' | 'neutral';
} {
  if (candleData.length === 0) {
    return { vwap: 0, signal: 'neutral' };
  }

  let cumulativeTPV = 0; // Typical Price * Volume
  let cumulativeVolume = 0;

  for (const candle of candleData) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    const volume = candle.volume || 0;
    cumulativeTPV += typicalPrice * volume;
    cumulativeVolume += volume;
  }

  const vwap = cumulativeVolume !== 0 ? cumulativeTPV / cumulativeVolume : 0;
  const currentPrice = candleData[candleData.length - 1].close;

  const signal = currentPrice > vwap ? 'bullish' : currentPrice < vwap ? 'bearish' : 'neutral';

  return { vwap, signal };
}

// ==================== SUPERTREND ====================

/**
 * Calcula Supertrend Indicator
 *
 * Supertrend es un indicador de seguimiento de tendencia
 * - Verde (bullish): Comprar/mantener
 * - Rojo (bearish): Vender/evitar
 */
export function calculateSupertrend(
  candleData: CandlestickData[],
  period: number = 10,
  multiplier: number = 3
): {
  supertrend: number;
  trend: 'bullish' | 'bearish';
  signal: 'buy' | 'sell' | 'hold';
} {
  if (candleData.length < period) {
    const currentPrice = candleData[candleData.length - 1]?.close || 0;
    return { supertrend: currentPrice, trend: 'bullish', signal: 'hold' };
  }

  const atr = calculateATR(candleData, period);
  const currentCandle = candleData[candleData.length - 1];
  const hl2 = (currentCandle.high + currentCandle.low) / 2;

  // Basic Band
  const basicUpperBand = hl2 + (multiplier * atr);
  const basicLowerBand = hl2 - (multiplier * atr);

  // Determinar tendencia basada en precio vs bandas
  const currentPrice = currentCandle.close;
  const isBullish = currentPrice > basicLowerBand;

  const supertrend = isBullish ? basicLowerBand : basicUpperBand;

  // Detectar cambio de tendencia
  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  if (candleData.length >= 2) {
    const prevPrice = candleData[candleData.length - 2].close;
    const prevHL2 = (candleData[candleData.length - 2].high + candleData[candleData.length - 2].low) / 2;
    const prevLowerBand = prevHL2 - (multiplier * atr);
    const prevUpperBand = prevHL2 + (multiplier * atr);
    const wasBullish = prevPrice > prevLowerBand;

    if (isBullish && !wasBullish) {
      signal = 'buy';
    } else if (!isBullish && wasBullish) {
      signal = 'sell';
    }
  }

  return {
    supertrend,
    trend: isBullish ? 'bullish' : 'bearish',
    signal
  };
}

// ==================== MARKET STRUCTURE ====================

/**
 * Analiza la estructura del mercado (Higher Highs, Lower Lows)
 *
 * Identifica si el mercado está haciendo HH/HL (alcista) o LH/LL (bajista)
 */
export function analyzeMarketStructure(candleData: CandlestickData[], lookback: number = 20): {
  structure: 'uptrend' | 'downtrend' | 'ranging' | 'consolidation';
  higherHighs: number;
  lowerLows: number;
  swingHighs: number[];
  swingLows: number[];
  signal: 'bullish' | 'bearish' | 'neutral';
} {
  if (candleData.length < lookback) {
    return {
      structure: 'ranging',
      higherHighs: 0,
      lowerLows: 0,
      swingHighs: [],
      swingLows: [],
      signal: 'neutral'
    };
  }

  const recent = candleData.slice(-lookback);
  const swingHighs: number[] = [];
  const swingLows: number[] = [];

  // Identificar swing highs y lows (simplificado)
  for (let i = 2; i < recent.length - 2; i++) {
    // Swing High: high[i] > high[i-1] && high[i] > high[i-2] && high[i] > high[i+1] && high[i] > high[i+2]
    if (
      recent[i].high > recent[i - 1].high &&
      recent[i].high > recent[i - 2].high &&
      recent[i].high > recent[i + 1].high &&
      recent[i].high > recent[i + 2].high
    ) {
      swingHighs.push(recent[i].high);
    }

    // Swing Low
    if (
      recent[i].low < recent[i - 1].low &&
      recent[i].low < recent[i - 2].low &&
      recent[i].low < recent[i + 1].low &&
      recent[i].low < recent[i + 2].low
    ) {
      swingLows.push(recent[i].low);
    }
  }

  // Contar Higher Highs y Lower Lows
  let higherHighs = 0;
  for (let i = 1; i < swingHighs.length; i++) {
    if (swingHighs[i] > swingHighs[i - 1]) higherHighs++;
  }

  let lowerLows = 0;
  for (let i = 1; i < swingLows.length; i++) {
    if (swingLows[i] < swingLows[i - 1]) lowerLows++;
  }

  // Determinar estructura
  let structure: 'uptrend' | 'downtrend' | 'ranging' | 'consolidation';
  let signal: 'bullish' | 'bearish' | 'neutral';

  if (higherHighs >= 2 && lowerLows === 0) {
    structure = 'uptrend';
    signal = 'bullish';
  } else if (lowerLows >= 2 && higherHighs === 0) {
    structure = 'downtrend';
    signal = 'bearish';
  } else if (swingHighs.length > 0 && swingLows.length > 0) {
    const highRange = Math.max(...swingHighs) - Math.min(...swingHighs);
    const lowRange = Math.max(...swingLows) - Math.min(...swingLows);
    const avgPrice = recent.reduce((sum, c) => sum + c.close, 0) / recent.length;
    const volatility = ((highRange + lowRange) / 2) / avgPrice;

    structure = volatility < 0.02 ? 'consolidation' : 'ranging';
    signal = 'neutral';
  } else {
    structure = 'ranging';
    signal = 'neutral';
  }

  return {
    structure,
    higherHighs,
    lowerLows,
    swingHighs,
    swingLows,
    signal
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
