/**
 * PRICE HISTORY GENERATOR
 *
 * Genera datos históricos simulados de precios usando movimiento browniano.
 * Esto nos permite tener gráficos de velas realistas para practicar.
 *
 * En producción, estos datos vendrían de la API de CoinGecko.
 */

export interface CandlestickData {
  time: number;           // Unix timestamp en segundos
  open: number;           // Precio de apertura
  high: number;           // Precio máximo
  low: number;            // Precio mínimo
  close: number;          // Precio de cierre
}

export interface VolumeData {
  time: number;
  value: number;
  color: string;
}

/**
 * Genera datos históricos de velas usando random walk
 *
 * @param basePrice - Precio inicial
 * @param periods - Número de velas a generar
 * @param timeframe - Timeframe en minutos (1, 5, 15, 60, etc.)
 * @param volatility - Volatilidad (0.01 = 1%)
 */
export function generateCandlestickData(
  basePrice: number,
  periods: number = 100,
  timeframe: number = 5, // 5 minutos por defecto
  volatility: number = 0.02 // 2% de volatilidad
): CandlestickData[] {
  const data: CandlestickData[] = [];
  const now = Math.floor(Date.now() / 1000); // Unix timestamp en segundos
  const timeframeSeconds = timeframe * 60;

  let currentPrice = basePrice;

  for (let i = periods; i >= 0; i--) {
    const timestamp = now - (i * timeframeSeconds);

    // Generar movimiento aleatorio (random walk)
    const change = (Math.random() - 0.5) * 2 * volatility;
    const open = currentPrice;

    // Simular variación durante la vela
    const highChange = Math.random() * volatility;
    const lowChange = Math.random() * volatility;

    currentPrice = open * (1 + change);
    const high = Math.max(open, currentPrice) * (1 + highChange);
    const low = Math.min(open, currentPrice) * (1 - lowChange);
    const close = currentPrice;

    data.push({
      time: timestamp,
      open,
      high,
      low,
      close
    });
  }

  return data;
}

/**
 * Genera datos de volumen simulados
 */
export function generateVolumeData(
  candlestickData: CandlestickData[]
): VolumeData[] {
  return candlestickData.map(candle => {
    const isGreen = candle.close >= candle.open;
    const baseVolume = Math.random() * 1000000 + 500000;

    return {
      time: candle.time,
      value: baseVolume,
      color: isGreen ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
    };
  });
}

/**
 * Actualiza los datos añadiendo una nueva vela
 * (útil para simular updates en tiempo real)
 */
export function updateCandlestickData(
  existingData: CandlestickData[],
  newPrice: number,
  timeframe: number = 5
): CandlestickData[] {
  if (existingData.length === 0) return existingData;

  const lastCandle = existingData[existingData.length - 1];
  const now = Math.floor(Date.now() / 1000);
  const timeframeSeconds = timeframe * 60;

  // Si estamos en el mismo periodo de tiempo, actualizar la última vela
  if (now - lastCandle.time < timeframeSeconds) {
    const updated = [...existingData];
    const updatedCandle = {
      ...lastCandle,
      close: newPrice,
      high: Math.max(lastCandle.high, newPrice),
      low: Math.min(lastCandle.low, newPrice)
    };
    updated[updated.length - 1] = updatedCandle;
    return updated;
  }

  // Si ya pasó el timeframe, crear nueva vela
  const newCandle: CandlestickData = {
    time: now,
    open: lastCandle.close,
    high: newPrice,
    low: newPrice,
    close: newPrice
  };

  return [...existingData, newCandle];
}

/**
 * Convierte precio actual a formato de vela
 */
export function priceToCandle(
  price: number,
  timestamp?: number
): CandlestickData {
  const time = timestamp || Math.floor(Date.now() / 1000);
  return {
    time,
    open: price,
    high: price,
    low: price,
    close: price
  };
}

/**
 * Calcula indicadores técnicos simples
 */
export function calculateMovingAverage(
  data: CandlestickData[],
  period: number
): Array<{ time: number; value: number }> {
  const ma: Array<{ time: number; value: number }> = [];

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    ma.push({
      time: data[i].time,
      value: sum / period
    });
  }

  return ma;
}

/**
 * Calcula RSI (Relative Strength Index)
 * Indicador de sobrecompra/sobreventa (0-100)
 * > 70 = Sobrecomprado
 * < 30 = Sobrevendido
 */
export function calculateRSI(
  data: CandlestickData[],
  period: number = 14
): Array<{ time: number; value: number }> {
  const rsi: Array<{ time: number; value: number }> = [];

  if (data.length < period + 1) return rsi;

  let gains = 0;
  let losses = 0;

  // Calcular promedio inicial
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Primera RSI
  const rs = avgGain / avgLoss;
  rsi.push({
    time: data[period].time,
    value: 100 - (100 / (1 + rs))
  });

  // RSI subsecuentes
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const currentRS = avgGain / avgLoss;
    rsi.push({
      time: data[i].time,
      value: 100 - (100 / (1 + currentRS))
    });
  }

  return rsi;
}

/**
 * Calcula EMA (Exponential Moving Average)
 * Le da más peso a los datos recientes
 */
export function calculateEMA(
  data: CandlestickData[],
  period: number
): Array<{ time: number; value: number }> {
  const ema: Array<{ time: number; value: number }> = [];

  if (data.length < period) return ema;

  // Calcular SMA inicial
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  const initialSMA = sum / period;

  // Primer valor EMA = SMA
  ema.push({
    time: data[period - 1].time,
    value: initialSMA
  });

  // Multiplicador para EMA
  const multiplier = 2 / (period + 1);

  // Calcular EMAs subsecuentes
  for (let i = period; i < data.length; i++) {
    const prevEMA = ema[ema.length - 1].value;
    const currentEMA = (data[i].close - prevEMA) * multiplier + prevEMA;
    ema.push({
      time: data[i].time,
      value: currentEMA
    });
  }

  return ema;
}

/**
 * Calcula MACD (Moving Average Convergence Divergence)
 * Indicador de momentum que muestra la relación entre dos EMAs
 * Retorna: MACD line, Signal line, Histogram
 */
export function calculateMACD(
  data: CandlestickData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: Array<{ time: number; value: number }>;
  signal: Array<{ time: number; value: number }>;
  histogram: Array<{ time: number; value: number }>;
} {
  const result = {
    macd: [] as Array<{ time: number; value: number }>,
    signal: [] as Array<{ time: number; value: number }>,
    histogram: [] as Array<{ time: number; value: number }>
  };

  if (data.length < slowPeriod) return result;

  // Calcular EMAs rápido y lento
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  // MACD Line = Fast EMA - Slow EMA
  const macdLine: Array<{ time: number; value: number }> = [];
  for (let i = 0; i < slowEMA.length; i++) {
    const fastValue = fastEMA.find(e => e.time === slowEMA[i].time);
    if (fastValue) {
      macdLine.push({
        time: slowEMA[i].time,
        value: fastValue.value - slowEMA[i].value
      });
    }
  }

  result.macd = macdLine;

  // Signal Line = EMA del MACD
  if (macdLine.length >= signalPeriod) {
    let signalEMA = 0;
    for (let i = 0; i < signalPeriod; i++) {
      signalEMA += macdLine[i].value;
    }
    signalEMA /= signalPeriod;

    result.signal.push({
      time: macdLine[signalPeriod - 1].time,
      value: signalEMA
    });

    const multiplier = 2 / (signalPeriod + 1);
    for (let i = signalPeriod; i < macdLine.length; i++) {
      signalEMA = (macdLine[i].value - signalEMA) * multiplier + signalEMA;
      result.signal.push({
        time: macdLine[i].time,
        value: signalEMA
      });
    }

    // Histogram = MACD - Signal
    for (let i = 0; i < result.signal.length; i++) {
      const macdValue = macdLine.find(m => m.time === result.signal[i].time);
      if (macdValue) {
        result.histogram.push({
          time: result.signal[i].time,
          value: macdValue.value - result.signal[i].value
        });
      }
    }
  }

  return result;
}

/**
 * Calcula Bollinger Bands
 * Bandas de volatilidad que muestran niveles de sobrecompra/sobreventa
 */
export function calculateBollingerBands(
  data: CandlestickData[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: Array<{ time: number; value: number }>;
  middle: Array<{ time: number; value: number }>;
  lower: Array<{ time: number; value: number }>;
} {
  const result = {
    upper: [] as Array<{ time: number; value: number }>,
    middle: [] as Array<{ time: number; value: number }>,
    lower: [] as Array<{ time: number; value: number }>
  };

  if (data.length < period) return result;

  for (let i = period - 1; i < data.length; i++) {
    // Calcular SMA (banda media)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    const sma = sum / period;

    // Calcular desviación estándar
    let variance = 0;
    for (let j = 0; j < period; j++) {
      variance += Math.pow(data[i - j].close - sma, 2);
    }
    const sd = Math.sqrt(variance / period);

    // Bandas
    result.middle.push({ time: data[i].time, value: sma });
    result.upper.push({ time: data[i].time, value: sma + (stdDev * sd) });
    result.lower.push({ time: data[i].time, value: sma - (stdDev * sd) });
  }

  return result;
}

/**
 * Calcula Stochastic Oscillator
 * Indicador de momentum que compara el precio de cierre con el rango de precios
 * Retorna valores entre 0-100
 * > 80 = Sobrecomprado
 * < 20 = Sobrevendido
 */
export function calculateStochastic(
  data: CandlestickData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): {
  k: Array<{ time: number; value: number }>;
  d: Array<{ time: number; value: number }>;
} {
  const result = {
    k: [] as Array<{ time: number; value: number }>,
    d: [] as Array<{ time: number; value: number }>
  };

  if (data.length < kPeriod) return result;

  // Calcular %K
  for (let i = kPeriod - 1; i < data.length; i++) {
    let highestHigh = data[i].high;
    let lowestLow = data[i].low;

    for (let j = 0; j < kPeriod; j++) {
      highestHigh = Math.max(highestHigh, data[i - j].high);
      lowestLow = Math.min(lowestLow, data[i - j].low);
    }

    const currentClose = data[i].close;
    const kValue = highestHigh === lowestLow
      ? 50  // Evitar división por cero
      : ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;

    result.k.push({
      time: data[i].time,
      value: kValue
    });
  }

  // Calcular %D (SMA de %K)
  if (result.k.length >= dPeriod) {
    for (let i = dPeriod - 1; i < result.k.length; i++) {
      let sum = 0;
      for (let j = 0; j < dPeriod; j++) {
        sum += result.k[i - j].value;
      }
      result.d.push({
        time: result.k[i].time,
        value: sum / dPeriod
      });
    }
  }

  return result;
}
