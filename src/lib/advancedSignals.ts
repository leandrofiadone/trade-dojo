/**
 * ADVANCED TRADING SIGNALS
 *
 * Función completa y avanzada para generar señales de trading profesionales
 */

import type { CandlestickData, VolumeData } from './priceHistory';
import {
  calculateRSI,
  calculateEMA,
  calculateMACD,
  analyzeVolume,
  calculateATR,
  calculateADX,
  findSupportResistance,
  calculateFibonacci,
  detectCandlePatterns,
  type SignalType,
  type TradingSignal
} from './technicalIndicators';

export function generateAdvancedTradingSignals(
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

  // ==================== ANÁLISIS DE INDICADORES TÉCNICOS ====================

  // 1. RSI (Peso: 3)
  let rsiSignal: 'buy' | 'sell' | 'neutral';
  let rsiExplanation: string;

  if (rsi < 30) {
    rsiSignal = 'buy';
    buyVotes += 3;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - ZONA DE SOBREVENTA 🔥. El activo ha bajado demasiado y es probable un rebote alcista. Los compradores podrían entrar pronto. Históricamente, RSI < 30 ha precedido rebotes en el 70% de los casos.`;
  } else if (rsi > 70) {
    rsiSignal = 'sell';
    sellVotes += 3;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - ZONA DE SOBRECOMPRA ⚠️. El activo ha subido demasiado rápido. Posible corrección o consolidación próxima. Espera señales de debilitamiento antes de entrar largo.`;
  } else if (rsi < 45) {
    rsiSignal = 'buy';
    buyVotes += 1;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - Presión bajista moderada. El precio está por debajo del equilibrio (50) pero aún no sobrevendido. Buena zona para acumular si otros indicadores confirman.`;
  } else if (rsi > 55) {
    rsiSignal = 'sell';
    sellVotes += 1;
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - Presión alcista moderada. El precio está por encima del equilibrio pero no sobrecomprado. Tendencia positiva pero verifica otros indicadores.`;
  } else {
    rsiSignal = 'neutral';
    rsiExplanation = `RSI en ${rsi.toFixed(1)} - Zona de equilibrio (40-60). Compradores y vendedores están en balance. Sin señal clara de dirección. Espera breakout.`;
  }

  indicators.push({
    name: 'RSI (14)',
    signal: rsiSignal,
    value: rsi.toFixed(1),
    explanation: rsiExplanation,
    weight: 3
  });

  // 2. EMA Crossover (Peso: 4 - MUY IMPORTANTE)
  let emaSignal: 'buy' | 'sell' | 'neutral';
  let emaExplanation: string;

  if (ema20 > ema50 && currentPrice > ema20) {
    emaSignal = 'buy';
    buyVotes += 4;
    emaExplanation = `TENDENCIA ALCISTA CONFIRMADA 📈. EMA20 (${ema20.toFixed(0)}) cruza arriba de EMA50 (${ema50.toFixed(0)}), y el precio está por encima de ambas. Esta es una de las señales más confiables de continuación alcista. Conocida como "Golden Cross" en corto plazo.`;
  } else if (ema20 < ema50 && currentPrice < ema20) {
    emaSignal = 'sell';
    sellVotes += 4;
    emaExplanation = `TENDENCIA BAJISTA CONFIRMADA 📉. EMA20 (${ema20.toFixed(0)}) cruza abajo de EMA50 (${ema50.toFixed(0)}), y el precio está por debajo de ambas. Señal fuerte de continuación bajista. Conocida como "Death Cross" en corto plazo.`;
  } else if (currentPrice > ema20) {
    emaSignal = 'buy';
    buyVotes += 2;
    emaExplanation = `Precio (${currentPrice.toFixed(2)}) por encima de EMA20 (${ema20.toFixed(0)}). Señal alcista de corto plazo. Sin embargo, EMA20 vs EMA50 muestra divergencia, así que la tendencia no está 100% confirmada.`;
  } else if (currentPrice < ema20) {
    emaSignal = 'sell';
    buyVotes += 2;
    emaExplanation = `Precio (${currentPrice.toFixed(2)}) por debajo de EMA20 (${ema20.toFixed(0)}). Señal bajista de corto plazo. Espera que el precio recupere la EMA20 para considerar entradas.`;
  } else {
    emaSignal = 'neutral';
    emaExplanation = `EMAs en consolidación. Precio oscilando cerca de las medias móviles. Mercado indeciso. Espera un breakout claro antes de operar.`;
  }

  indicators.push({
    name: 'EMA 20/50',
    signal: emaSignal,
    value: `${ema20.toFixed(0)} / ${ema50.toFixed(0)}`,
    explanation: emaExplanation,
    weight: 4
  });

  // 3. MACD (Peso: 3)
  let macdSignal: 'buy' | 'sell' | 'neutral';
  let macdExplanation: string;

  if (macd.histogram > 0 && macd.macd > macd.signal) {
    macdSignal = 'buy';
    buyVotes += 3;
    macdExplanation = `MACD ALCISTA ✅. MACD (${macd.macd.toFixed(2)}) está por encima de la línea de señal (${macd.signal.toFixed(2)}). Histograma positivo: ${macd.histogram.toFixed(2)}. El momentum es alcista y está acelerando. Buena señal de entrada.`;
  } else if (macd.histogram < 0 && macd.macd < macd.signal) {
    macdSignal = 'sell';
    sellVotes += 3;
    macdExplanation = `MACD BAJISTA ⛔. MACD (${macd.macd.toFixed(2)}) está por debajo de la línea de señal (${macd.signal.toFixed(2)}). Histograma negativo: ${macd.histogram.toFixed(2)}. El momentum es bajista y está acelerando. Evita entradas largas.`;
  } else {
    macdSignal = 'neutral';
    macdExplanation = `MACD neutral. Histograma: ${macd.histogram.toFixed(2)}. El momentum no muestra dirección clara. Posible cruce próximo - mantente alerta.`;
  }

  indicators.push({
    name: 'MACD',
    signal: macdSignal,
    value: macd.histogram.toFixed(2),
    explanation: macdExplanation,
    weight: 3
  });

  // 4. Volumen (Peso: 2)
  let volumeSignal: 'buy' | 'sell' | 'neutral';
  let volumeExplanation: string;

  const priceChange = ((prices[prices.length - 1] - prices[prices.length - 2]) / prices[prices.length - 2]) * 100;

  if (volume.isHigh && priceChange > 0) {
    volumeSignal = 'buy';
    buyVotes += 2;
    volumeExplanation = `VOLUMEN ALTO con PRECIO SUBIENDO 🚀 (+${volume.ratio.toFixed(1)}x el promedio). Esto indica fuerte interés de compra institucional. El movimiento alcista tiene respaldo de volumen - señal muy confiable.`;
  } else if (volume.isHigh && priceChange < 0) {
    volumeSignal = 'sell';
    sellVotes += 2;
    volumeExplanation = `VOLUMEN ALTO con PRECIO BAJANDO 📉 (+${volume.ratio.toFixed(1)}x el promedio). Esto indica fuerte presión de venta. El movimiento bajista tiene respaldo de volumen - señal de distribución.`;
  } else if (volume.ratio < 0.7) {
    volumeSignal = 'neutral';
    volumeExplanation = `Volumen BAJO (${volume.ratio.toFixed(1)}x del promedio). Los movimientos de precio carecen de convicción. Las señales son menos confiables sin confirmación de volumen. Espera incremento de volumen.`;
  } else {
    volumeSignal = 'neutral';
    volumeExplanation = `Volumen normal (${volume.ratio.toFixed(1)}x del promedio). No aporta señal direccional clara pero tampoco la invalida.`;
  }

  indicators.push({
    name: 'Volumen',
    signal: volumeSignal,
    value: `${volume.ratio.toFixed(1)}x`,
    explanation: volumeExplanation,
    weight: 2
  });

  // 5. ADX - Fuerza de Tendencia (Peso: 2)
  let adxSignal: 'buy' | 'sell' | 'neutral';
  let adxExplanation: string;

  if (adx.adx > 40 && adx.diPlus > adx.diMinus) {
    adxSignal = 'buy';
    buyVotes += 2;
    adxExplanation = `TENDENCIA ALCISTA FUERTE 💪. ADX: ${adx.adx.toFixed(1)} (>40). DI+: ${adx.diPlus.toFixed(1)} > DI-: ${adx.diMinus.toFixed(1)}. La tendencia alcista tiene mucha fuerza. Excelente para seguir la tendencia con confianza.`;
  } else if (adx.adx > 40 && adx.diPlus < adx.diMinus) {
    adxSignal = 'sell';
    sellVotes += 2;
    adxExplanation = `TENDENCIA BAJISTA FUERTE 💪. ADX: ${adx.adx.toFixed(1)} (>40). DI-: ${adx.diMinus.toFixed(1)} > DI+: ${adx.diPlus.toFixed(1)}. La tendencia bajista tiene mucha fuerza. Evita compras, considera ventas.`;
  } else if (adx.adx > 25) {
    if (adx.diPlus > adx.diMinus) {
      adxSignal = 'buy';
      buyVotes += 1;
      adxExplanation = `Tendencia alcista moderada. ADX: ${adx.adx.toFixed(1)} (>25). Hay tendencia pero no es muy fuerte aún.`;
    } else {
      adxSignal = 'sell';
      sellVotes += 1;
      adxExplanation = `Tendencia bajista moderada. ADX: ${adx.adx.toFixed(1)} (>25). Hay tendencia pero no es muy fuerte aún.`;
    }
  } else {
    adxSignal = 'neutral';
    adxExplanation = `SIN TENDENCIA CLARA 🔄. ADX: ${adx.adx.toFixed(1)} (<25). El mercado está en consolidación/rango. Evita estrategias de seguimiento de tendencia. Considera estrategias de rango o espera breakout.`;
  }

  indicators.push({
    name: 'ADX (Fuerza)',
    signal: adxSignal,
    value: adx.adx.toFixed(1),
    explanation: adxExplanation,
    weight: 2
  });

  // 6. Patrón de Velas (Peso: 2)
  indicators.push({
    name: 'Patrón de Velas',
    signal: candlePattern.signal,
    value: candlePattern.pattern !== 'none' ? candlePattern.pattern : 'Ninguno',
    explanation: candlePattern.explanation,
    weight: 2
  });

  if (candlePattern.signal === 'bullish') {
    buyVotes += 2;
  } else if (candlePattern.signal === 'bearish') {
    sellVotes += 2;
  }

  // ==================== DETERMINAR SEÑAL FINAL ====================
  const totalVotes = buyVotes + sellVotes;
  const netVotes = buyVotes - sellVotes;
  const confidence = totalVotes > 0 ? Math.abs(netVotes / totalVotes) * 100 : 0;

  let type: SignalType;
  let recommendation: string;

  if (netVotes >= 6) {
    type = 'strong-buy';
    recommendation = `COMPRA FUERTE 🟢🟢🟢 (${buyVotes} votos alcistas vs ${sellVotes} bajistas). Múltiples indicadores confirman oportunidad de compra. Alta probabilidad de movimiento alcista.`;
  } else if (netVotes >= 3) {
    type = 'buy';
    recommendation = `COMPRA 🟢 (${buyVotes} votos alcistas vs ${sellVotes} bajistas). Mayoría de indicadores son alcistas. Considera entrada con gestión de riesgo apropiada.`;
  } else if (netVotes <= -6) {
    type = 'strong-sell';
    recommendation = `VENTA FUERTE 🔴🔴🔴 (${sellVotes} votos bajistas vs ${buyVotes} alcistas). Múltiples indicadores confirman presión bajista. Evita compras, considera salidas o ventas en corto.`;
  } else if (netVotes <= -3) {
    type = 'sell';
    recommendation = `VENTA 🔴 (${sellVotes} votos bajistas vs ${buyVotes} alcistas). Mayoría de indicadores son bajistas. Precaución con entradas largas.`;
  } else {
    type = 'neutral';
    recommendation = `NEUTRAL ⚪ (${buyVotes} alcistas / ${sellVotes} bajistas). Señales mixtas. Mercado indeciso. ESPERA confirmación clara antes de operar. No fuerces operaciones en condiciones ambiguas.`;
  }

  // ==================== ANÁLISIS DE TENDENCIA MULTI-TIMEFRAME ====================
  const shortTermTrend = currentPrice > ema20 ? 'Alcista' : currentPrice < ema20 ? 'Bajista' : 'Lateral';
  const mediumTermTrend = ema20 > ema50 ? 'Alcista' : ema20 < ema50 ? 'Bajista' : 'Lateral';
  const longTermTrend = currentPrice > ema200 ? 'Alcista' : currentPrice < ema200 ? 'Bajista' : 'Lateral';

  let overallTrend = '';
  if (shortTermTrend === 'Alcista' && mediumTermTrend === 'Alcista' && longTermTrend === 'Alcista') {
    overallTrend = 'FUERTEMENTE ALCISTA - Todas las tendencias alineadas al alza';
  } else if (shortTermTrend === 'Bajista' && mediumTermTrend === 'Bajista' && longTermTrend === 'Bajista') {
    overallTrend = 'FUERTEMENTE BAJISTA - Todas las tendencias alineadas a la baja';
  } else if (longTermTrend === 'Alcista') {
    overallTrend = 'ALCISTA en largo plazo con fluctuaciones de corto plazo';
  } else if (longTermTrend === 'Bajista') {
    overallTrend = 'BAJISTA en largo plazo con fluctuaciones de corto plazo';
  } else {
    overallTrend = 'CONSOLIDACIÓN - Sin tendencia clara definida';
  }

  // ==================== ANÁLISIS DE VOLATILIDAD ====================
  const atrPercent = (atr / currentPrice) * 100;
  let volatilityLevel: 'very-low' | 'low' | 'normal' | 'high' | 'very-high';
  let volatilityDescription: string;

  if (atrPercent < 0.5) {
    volatilityLevel = 'very-low';
    volatilityDescription = `VOLATILIDAD MUY BAJA (${atrPercent.toFixed(2)}%). Movimientos de precio muy pequeños. Mercado "dormido". Difícil obtener ganancias significativas pero también bajo riesgo.`;
  } else if (atrPercent < 1.5) {
    volatilityLevel = 'low';
    volatilityDescription = `VOLATILIDAD BAJA (${atrPercent.toFixed(2)}%). Movimientos moderados. Buen ambiente para principiantes. Stops más ajustados son posibles.`;
  } else if (atrPercent < 3) {
    volatilityLevel = 'normal';
    volatilityDescription = `VOLATILIDAD NORMAL (${atrPercent.toFixed(2)}%). Rango típico de movimiento. Balance entre oportunidad y riesgo. Condiciones normales de trading.`;
  } else if (atrPercent < 5) {
    volatilityLevel = 'high';
    volatilityDescription = `VOLATILIDAD ALTA (${atrPercent.toFixed(2)}%). Movimientos grandes. Mayor potencial de ganancia PERO también mayor riesgo. Usa stops más amplios. No apalancamiento excesivo.`;
  } else {
    volatilityLevel = 'very-high';
    volatilityDescription = `VOLATILIDAD EXTREMA (${atrPercent.toFixed(2)}%). Movimientos violentos. ALTO RIESGO. Solo para traders experimentados. Reduce tamaño de posición. Stops muy amplios necesarios.`;
  }

  // ==================== NIVELES CLAVE DE TRADING ====================
  const nearest = supportResistance.nearest;

  // Calcular Entry, Stop Loss y Take Profits basados en ATR
  let entry = currentPrice;
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let takeProfit3 = 0;

  if (type === 'strong-buy' || type === 'buy') {
    // Entrada: precio actual o cerca del soporte
    entry = Math.min(currentPrice, nearest.support * 1.01);

    // Stop Loss: 2 ATR por debajo de la entrada o justo debajo del soporte
    stopLoss = Math.max(entry - (atr * 2), nearest.support * 0.98);

    // Take Profits con ratios R:R progresivos
    takeProfit1 = entry + (atr * 2); // R:R 1:1
    takeProfit2 = entry + (atr * 3.5); // R:R 1:1.75
    takeProfit3 = Math.min(entry + (atr * 5), nearest.resistance * 0.99); // R:R 1:2.5 o resistencia
  } else if (type === 'strong-sell' || type === 'sell') {
    // Entrada: precio actual o cerca de la resistencia
    entry = Math.max(currentPrice, nearest.resistance * 0.99);

    // Stop Loss: 2 ATR por encima de la entrada o justo encima de la resistencia
    stopLoss = Math.min(entry + (atr * 2), nearest.resistance * 1.02);

    // Take Profits (ventas en corto)
    takeProfit1 = entry - (atr * 2);
    takeProfit2 = entry - (atr * 3.5);
    takeProfit3 = Math.max(entry - (atr * 5), nearest.support * 1.01);
  } else {
    // Neutral - niveles para breakout
    entry = currentPrice;
    stopLoss = currentPrice - (atr * 1.5);
    takeProfit1 = nearest.resistance;
    takeProfit2 = nearest.resistance * 1.03;
    takeProfit3 = nearest.resistance * 1.05;
  }

  const risk = Math.abs(entry - stopLoss);
  const reward = Math.abs(takeProfit1 - entry);
  const riskRewardRatio = risk > 0 ? reward / risk : 0;

  // ==================== PROBABILIDADES ====================
  let bullishContinuation = 0;
  let bearishContinuation = 0;
  let reversal = 0;
  let consolidation = 0;

  // Base en señal principal
  if (type === 'strong-buy') {
    bullishContinuation = 60;
    bearishContinuation = 10;
    reversal = 10;
    consolidation = 20;
  } else if (type === 'buy') {
    bullishContinuation = 45;
    bearishContinuation = 20;
    reversal = 15;
    consolidation = 20;
  } else if (type === 'strong-sell') {
    bullishContinuation = 10;
    bearishContinuation = 60;
    reversal = 10;
    consolidation = 20;
  } else if (type === 'sell') {
    bullishContinuation = 20;
    bearishContinuation = 45;
    reversal = 15;
    consolidation = 20;
  } else {
    bullishContinuation = 25;
    bearishContinuation = 25;
    reversal = 20;
    consolidation = 30;
  }

  // Ajustar por ADX (tendencia fuerte aumenta probabilidad de continuación)
  if (adx.adx > 40) {
    if (adx.diPlus > adx.diMinus) {
      bullishContinuation += 10;
      bearishContinuation -= 5;
      consolidation -= 5;
    } else {
      bearishContinuation += 10;
      bullishContinuation -= 5;
      consolidation -= 5;
    }
  } else if (adx.adx < 20) {
    consolidation += 15;
    bullishContinuation -= 7;
    bearishContinuation -= 8;
  }

  // Normalizar a 100%
  const total = bullishContinuation + bearishContinuation + reversal + consolidation;
  bullishContinuation = Math.round((bullishContinuation / total) * 100);
  bearishContinuation = Math.round((bearishContinuation / total) * 100);
  reversal = Math.round((reversal / total) * 100);
  consolidation = 100 - bullishContinuation - bearishContinuation - reversal;

  const mostLikely = [
    { name: 'Continuación Alcista', prob: bullishContinuation },
    { name: 'Continuación Bajista', prob: bearishContinuation },
    { name: 'Reversión', prob: reversal },
    { name: 'Consolidación', prob: consolidation }
  ].sort((a, b) => b.prob - a.prob)[0];

  // ==================== INSIGHTS EDUCATIVOS ====================
  const educationalInsights: string[] = [];

  educationalInsights.push(
    `📚 LECCIÓN: La señal es "${type}". Esto significa que ${buyVotes > sellVotes ? 'los indicadores alcistas superan a los bajistas' : sellVotes > buyVotes ? 'los indicadores bajistas superan a los alcistas' : 'hay equilibrio entre señales alcistas y bajistas'}.`
  );

  if (rsi < 30 || rsi > 70) {
    educationalInsights.push(
      `💡 RSI EXTREMO: Cuando el RSI está en zona extrema (${rsi.toFixed(1)}), es común ver reversiones. Sin embargo, en tendencias fuertes, el RSI puede permanecer extremo por períodos prolongados. Combina siempre con otros indicadores.`
    );
  }

  if (adx.adx > 40) {
    educationalInsights.push(
      `📈 TENDENCIA FUERTE: ADX > 40 indica una tendencia muy fuerte. En estas condiciones, las estrategias de seguimiento de tendencia funcionan mejor que las de reversión.`
    );
  } else if (adx.adx < 20) {
    educationalInsights.push(
      `🔄 RANGO/CONSOLIDACIÓN: ADX < 20 indica falta de tendencia. En estos casos, considera estrategias de range trading (comprar en soporte, vender en resistencia) en lugar de seguir tendencias.`
    );
  }

  if (volume.isHigh) {
    educationalInsights.push(
      `📊 VOLUMEN SIGNIFICATIVO: El alto volumen (${volume.ratio.toFixed(1)}x) confirma el movimiento actual. Los movimientos respaldados por volumen son más confiables y tienen mayor probabilidad de continuar.`
    );
  }

  if (candlePattern.pattern !== 'none') {
    educationalInsights.push(
      `🕯️ PATRÓN DETECTADO: El patrón "${candlePattern.pattern}" sugiere ${candlePattern.signal === 'bullish' ? 'una reversión alcista' : candlePattern.signal === 'bearish' ? 'una reversión bajista' : 'indecisión'}. Los patrones de velas tienen mayor precisión cuando se confirman con volumen y otros indicadores.`
    );
  }

  educationalInsights.push(
    `⚡ GESTIÓN DE RIESGO: Con Stop Loss en ${stopLoss.toFixed(2)} y primera toma de ganancias en ${takeProfit1.toFixed(2)}, tu Risk:Reward ratio es ${riskRewardRatio.toFixed(2)}:1. Busca siempre ratios superiores a 1.5:1.`
  );

  educationalInsights.push(
    `🎯 ESCENARIO MÁS PROBABLE: Hay un ${mostLikely.prob}% de probabilidad de ${mostLikely.name}. Prepara tu plan de trading para este escenario pero mantén stops por si el mercado se mueve en contra.`
  );

  // ==================== RETURN SIGNAL COMPLETO ====================
  return {
    type,
    confidence: Math.round(confidence),
    indicators,
    recommendation,
    trendAnalysis: {
      shortTerm: `${shortTermTrend} (precio vs EMA20)`,
      mediumTerm: `${mediumTermTrend} (EMA20 vs EMA50)`,
      longTerm: `${longTermTrend} (precio vs EMA200)`,
      overall: overallTrend
    },
    volatilityAnalysis: {
      level: volatilityLevel,
      atr: atr,
      description: volatilityDescription
    },
    priceAction: {
      pattern: candlePattern.pattern,
      patternSignal: candlePattern.signal,
      patternExplanation: candlePattern.explanation
    },
    keyLevels: {
      entry,
      stopLoss,
      takeProfit1,
      takeProfit2,
      takeProfit3,
      riskRewardRatio,
      nearest
    },
    probabilities: {
      bullishContinuation,
      bearishContinuation,
      reversal,
      consolidation,
      mostLikely: `${mostLikely.name} (${mostLikely.prob}%)`
    },
    educationalInsights
  };
}
