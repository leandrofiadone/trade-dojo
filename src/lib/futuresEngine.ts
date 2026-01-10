/**
 * FUTURES TRADING ENGINE
 *
 * Motor de cálculos para trading de futuros con leverage.
 * Incluye:
 * - Cálculo de liquidation price
 * - Gestión de posiciones Long/Short
 * - P&L unrealized
 * - Validaciones de riesgo
 * - Stop Loss / Take Profit
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Asset,
  FuturesPosition,
  PositionSide,
  FuturesFormData,
  FuturesValidationResult,
  FuturesPortfolio
} from '../types/trading';

// ==================== CONSTANTS ====================

/**
 * Comisión por abrir/cerrar posición (0.05% = 0.0005)
 * Esto es típico en exchanges como Binance, Bybit
 */
export const FUTURES_FEE_RATE = 0.0005; // 0.05%

/**
 * Maintenance Margin Rate (1%)
 * Cuando tu margin cae por debajo de esto, eres liquidado
 */
export const MAINTENANCE_MARGIN_RATE = 0.01; // 1%

/**
 * Límites de leverage
 */
export const MIN_LEVERAGE = 1;
export const MAX_LEVERAGE = 100;

/**
 * Margin mínimo para abrir posición
 */
export const MIN_MARGIN = 10; // $10 USD

// ==================== VALIDATION ====================

/**
 * Valida una orden de futuros antes de ejecutarla
 *
 * EDUCATIONAL NOTES:
 * - Verifica que el usuario tenga suficiente balance
 * - Calcula el precio de liquidación
 * - Alerta sobre riesgos de alto leverage
 * - Valida stop loss y take profit
 */
export function validateFuturesOrder(
  formData: FuturesFormData,
  asset: Asset,
  availableBalance: number
): FuturesValidationResult {
  const { margin, leverage, side, stopLoss, takeProfit } = formData;
  const warnings: string[] = [];

  // 1. Validar margin mínimo
  if (margin < MIN_MARGIN) {
    return {
      valid: false,
      error: `Margin mínimo es $${MIN_MARGIN}`
    };
  }

  // 2. Validar que tenga suficiente balance
  if (margin > availableBalance) {
    return {
      valid: false,
      error: `Balance insuficiente. Disponible: $${availableBalance.toFixed(2)}`
    };
  }

  // 3. Validar leverage
  if (leverage < MIN_LEVERAGE || leverage > MAX_LEVERAGE) {
    return {
      valid: false,
      error: `Leverage debe estar entre ${MIN_LEVERAGE}x y ${MAX_LEVERAGE}x`
    };
  }

  // 4. Calcular liquidation price
  const liquidationPrice = calculateLiquidationPrice(
    side,
    asset.current_price,
    leverage
  );

  // 5. Warnings sobre leverage alto
  if (leverage >= 50) {
    warnings.push('⚠️ Leverage muy alto (50x+). Riesgo de liquidación extremo.');
  } else if (leverage >= 20) {
    warnings.push('⚠️ Leverage alto (20x+). Posición muy riesgosa.');
  } else if (leverage >= 10) {
    warnings.push('💡 Leverage moderado. Gestiona bien tu riesgo.');
  }

  // 6. Validar Stop Loss
  if (stopLoss !== undefined) {
    if (side === 'LONG' && stopLoss >= asset.current_price) {
      return {
        valid: false,
        error: 'Stop Loss debe estar DEBAJO del precio de entrada en posiciones LONG'
      };
    }
    if (side === 'SHORT' && stopLoss <= asset.current_price) {
      return {
        valid: false,
        error: 'Stop Loss debe estar ARRIBA del precio de entrada en posiciones SHORT'
      };
    }

    // Warning si stop loss está muy cerca del precio de liquidación
    const stopLossDistance = Math.abs(stopLoss - liquidationPrice) / asset.current_price;
    if (stopLossDistance < 0.05) {
      warnings.push('⚠️ Stop Loss muy cercano al precio de liquidación.');
    }
  } else {
    warnings.push('💡 Considera añadir un Stop Loss para limitar pérdidas.');
  }

  // 7. Validar Take Profit
  if (takeProfit !== undefined) {
    if (side === 'LONG' && takeProfit <= asset.current_price) {
      return {
        valid: false,
        error: 'Take Profit debe estar ARRIBA del precio de entrada en posiciones LONG'
      };
    }
    if (side === 'SHORT' && takeProfit >= asset.current_price) {
      return {
        valid: false,
        error: 'Take Profit debe estar DEBAJO del precio de entrada en posiciones SHORT'
      };
    }
  }

  // 8. Calcular pérdida máxima (si se es liquidado)
  const maxLoss = margin; // Pierdes todo tu margin si eres liquidado

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    liquidationPrice,
    maxLoss
  };
}

// ==================== PRICE CALCULATIONS ====================

/**
 * Calcula el precio de liquidación
 *
 * FORMULA:
 * LONG: Liquidation Price = Entry Price * (1 - (1/leverage) + maintenance_margin_rate)
 * SHORT: Liquidation Price = Entry Price * (1 + (1/leverage) - maintenance_margin_rate)
 *
 * EXPLANATION:
 * El precio de liquidación es cuando tu pérdida alcanza casi todo tu margin.
 * Con leverage 10x, una pérdida del 10% del precio = 100% de tu margin.
 * Añadimos un pequeño buffer (maintenance margin) para cubrir fees.
 *
 * EXAMPLE (LONG):
 * - Entry: $50,000
 * - Leverage: 10x
 * - Liquidation: $50,000 * (1 - 0.1 + 0.01) = $45,500
 * - Si BTC cae a $45,500, pierdes todo tu margin y eres liquidado
 *
 * EXAMPLE (SHORT):
 * - Entry: $50,000
 * - Leverage: 10x
 * - Liquidation: $50,000 * (1 + 0.1 - 0.01) = $54,500
 * - Si BTC sube a $54,500, pierdes todo tu margin y eres liquidado
 */
export function calculateLiquidationPrice(
  side: PositionSide,
  entryPrice: number,
  leverage: number
): number {
  if (side === 'LONG') {
    // Para LONG: pierdes si el precio BAJA
    return entryPrice * (1 - (1 / leverage) + MAINTENANCE_MARGIN_RATE);
  } else {
    // Para SHORT: pierdes si el precio SUBE
    return entryPrice * (1 + (1 / leverage) - MAINTENANCE_MARGIN_RATE);
  }
}

/**
 * Calcula el P&L no realizado de una posición
 *
 * FORMULA:
 * LONG: PnL = (currentPrice - entryPrice) * quantity
 * SHORT: PnL = (entryPrice - currentPrice) * quantity
 *
 * EXPLANATION:
 * - LONG: Ganas si el precio sube, pierdes si baja
 * - SHORT: Ganas si el precio baja, pierdes si sube
 * - El leverage amplifica las ganancias/pérdidas
 *
 * EXAMPLE (LONG):
 * - Entry: $50,000, Margin: $1,000, Leverage: 10x
 * - Quantity: ($1,000 * 10) / $50,000 = 0.2 BTC
 * - Si precio va a $55,000:
 *   - PnL = ($55,000 - $50,000) * 0.2 = $1,000 (100% ganancia!)
 * - Si precio va a $45,000:
 *   - PnL = ($45,000 - $50,000) * 0.2 = -$1,000 (100% pérdida - LIQUIDADO!)
 */
export function calculateUnrealizedPnL(
  position: FuturesPosition,
  currentPrice: number
): { pnl: number; pnlPercentage: number } {
  const { side, entryPrice, quantity, margin } = position;

  let pnl: number;

  if (side === 'LONG') {
    // LONG: Ganas si sube
    pnl = (currentPrice - entryPrice) * quantity;
  } else {
    // SHORT: Ganas si baja
    pnl = (entryPrice - currentPrice) * quantity;
  }

  // Calcular porcentaje basado en el margin invertido
  const pnlPercentage = (pnl / margin) * 100;

  return { pnl, pnlPercentage };
}

// ==================== POSITION MANAGEMENT ====================

/**
 * Abre una nueva posición de futuros
 */
export function openFuturesPosition(
  formData: FuturesFormData,
  asset: Asset
): FuturesPosition {
  const { margin, leverage, side, stopLoss, takeProfit } = formData;

  // Calcular cantidad de asset que controlamos
  const quantity = (margin * leverage) / asset.current_price;

  // Calcular precio de liquidación
  const liquidationPrice = calculateLiquidationPrice(
    side,
    asset.current_price,
    leverage
  );

  // Calcular comisión de apertura
  const positionSize = margin * leverage;
  const openFee = positionSize * FUTURES_FEE_RATE;

  // Crear la posición
  const position: FuturesPosition = {
    id: uuidv4(),
    timestamp: Date.now(),
    asset: asset.id,
    assetSymbol: asset.symbol,
    assetName: asset.name,
    side,
    status: 'OPEN',

    leverage,
    margin,
    entryPrice: asset.current_price,
    quantity,

    currentPrice: asset.current_price,
    liquidationPrice,
    stopLoss,
    takeProfit,

    unrealizedPnL: 0,
    unrealizedPnLPercentage: 0,

    openFee,
    fundingFees: 0
  };

  return position;
}

/**
 * Actualiza el P&L de una posición con el precio actual
 */
export function updatePositionPnL(
  position: FuturesPosition,
  currentPrice: number
): FuturesPosition {
  const { pnl, pnlPercentage } = calculateUnrealizedPnL(position, currentPrice);

  return {
    ...position,
    currentPrice,
    unrealizedPnL: pnl,
    unrealizedPnLPercentage: pnlPercentage
  };
}

/**
 * Verifica si una posición debe ser liquidada
 */
export function shouldLiquidate(position: FuturesPosition): boolean {
  const { side, currentPrice, liquidationPrice } = position;

  if (side === 'LONG') {
    // LONG se liquida si el precio baja al liquidation price
    return currentPrice <= liquidationPrice;
  } else {
    // SHORT se liquida si el precio sube al liquidation price
    return currentPrice >= liquidationPrice;
  }
}

/**
 * Verifica si se debe ejecutar el Stop Loss
 */
export function shouldTriggerStopLoss(position: FuturesPosition): boolean {
  if (!position.stopLoss) return false;

  const { side, currentPrice, stopLoss } = position;

  if (side === 'LONG') {
    // LONG: Stop Loss se activa si el precio baja
    return currentPrice <= stopLoss;
  } else {
    // SHORT: Stop Loss se activa si el precio sube
    return currentPrice >= stopLoss;
  }
}

/**
 * Verifica si se debe ejecutar el Take Profit
 */
export function shouldTriggerTakeProfit(position: FuturesPosition): boolean {
  if (!position.takeProfit) return false;

  const { side, currentPrice, takeProfit } = position;

  if (side === 'LONG') {
    // LONG: Take Profit se activa si el precio sube
    return currentPrice >= takeProfit;
  } else {
    // SHORT: Take Profit se activa si el precio baja
    return currentPrice <= takeProfit;
  }
}

/**
 * Cierra una posición y calcula el P&L final
 */
export function closePosition(
  position: FuturesPosition,
  closePrice: number,
  reason: 'USER' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION'
): FuturesPosition {
  // Calcular P&L final
  const { pnl } = calculateUnrealizedPnL(
    { ...position, currentPrice: closePrice },
    closePrice
  );

  // Calcular comisión de cierre
  const positionSize = position.margin * position.leverage;
  const closeFee = reason === 'LIQUIDATION' ? 0 : positionSize * FUTURES_FEE_RATE;

  // P&L realizado (después de fees)
  const realizedPnL = pnl - position.openFee - closeFee - position.fundingFees;

  return {
    ...position,
    status: reason === 'LIQUIDATION' ? 'LIQUIDATED' : 'CLOSED',
    currentPrice: closePrice,
    closePrice,
    closeTimestamp: Date.now(),
    closeReason: reason,
    closeFee,
    unrealizedPnL: pnl,
    realizedPnL
  };
}

// ==================== PORTFOLIO CALCULATIONS ====================

/**
 * Calcula el estado del portfolio de futuros
 */
export function calculateFuturesPortfolio(
  positions: FuturesPosition[],
  totalBalance: number
): FuturesPortfolio {
  const openPositions = positions.filter(p => p.status === 'OPEN');
  const closedPositions = positions.filter(p => p.status !== 'OPEN');

  // Calcular margin usado
  const totalMarginUsed = openPositions.reduce((sum, p) => sum + p.margin, 0);

  // Calcular P&L total no realizado
  const totalUnrealizedPnL = openPositions.reduce((sum, p) => sum + p.unrealizedPnL, 0);

  // Calcular P&L total realizado (de posiciones cerradas)
  const totalRealizedPnL = closedPositions.reduce(
    (sum, p) => sum + (p.realizedPnL || 0),
    0
  );

  // Calcular fees totales
  const totalFeesPaid = positions.reduce(
    (sum, p) => sum + p.openFee + (p.closeFee || 0) + p.fundingFees,
    0
  );

  // Margin disponible
  const availableMargin = totalBalance - totalMarginUsed;

  // Utilización de margin (%)
  const marginUtilization = totalBalance > 0 ? (totalMarginUsed / totalBalance) * 100 : 0;

  return {
    positions: openPositions,
    totalMarginUsed,
    totalUnrealizedPnL,
    totalRealizedPnL,
    totalFeesPaid,
    availableMargin,
    marginUtilization,
    lastUpdated: Date.now()
  };
}

/**
 * Actualiza todas las posiciones abiertas con nuevos precios
 */
export function updateAllPositions(
  positions: FuturesPosition[],
  priceMap: Map<string, number>
): FuturesPosition[] {
  return positions.map(position => {
    if (position.status !== 'OPEN') return position;

    const currentPrice = priceMap.get(position.asset);
    if (!currentPrice) return position;

    return updatePositionPnL(position, currentPrice);
  });
}

/**
 * Verifica todas las posiciones abiertas por liquidaciones y triggers
 */
export function checkPositionTriggers(
  positions: FuturesPosition[]
): {
  toClose: Array<{ position: FuturesPosition; reason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION' }>;
  updated: FuturesPosition[];
} {
  const toClose: Array<{ position: FuturesPosition; reason: 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION' }> = [];
  const updated: FuturesPosition[] = [];

  positions.forEach(position => {
    if (position.status !== 'OPEN') {
      updated.push(position);
      return;
    }

    // Check liquidation (máxima prioridad)
    if (shouldLiquidate(position)) {
      toClose.push({ position, reason: 'LIQUIDATION' });
      return;
    }

    // Check stop loss
    if (shouldTriggerStopLoss(position)) {
      toClose.push({ position, reason: 'STOP_LOSS' });
      return;
    }

    // Check take profit
    if (shouldTriggerTakeProfit(position)) {
      toClose.push({ position, reason: 'TAKE_PROFIT' });
      return;
    }

    // No triggers, keep open
    updated.push(position);
  });

  return { toClose, updated };
}
