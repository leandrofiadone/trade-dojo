/**
 * TRADING ENGINE - Core Logic
 *
 * Este archivo contiene toda la lógica fundamental del sistema de trading:
 * - Validación de trades
 * - Ejecución de compras y ventas
 * - Cálculo de P&L (Profit & Loss)
 * - Gestión del portfolio
 *
 * IMPORTANTE: Este código incluye explicaciones de conceptos de trading
 * para propósitos educativos. Lee los comentarios cuidadosamente.
 */

import type {
  Trade,
  TradeType,
  Asset,
  Portfolio,
  Holding,
  TradeValidationResult,
  AIContext,
  PortfolioStats
} from '../types/trading';

// ==================== CONSTANTS ====================

/**
 * TRADING CONCEPT: Trading Fees (Comisiones)
 *
 * Los exchanges cobran una comisión por cada trade ejecutado.
 * En exchanges reales típicamente es 0.1% - 0.5%
 * Simulamos 0.1% para realismo
 */
export const TRADING_FEE_PERCENTAGE = 0.1; // 0.1%

/**
 * Balance inicial del usuario cuando empieza
 */
export const INITIAL_BALANCE = 10000; // $10,000 USD

// ==================== TRADE VALIDATION ====================

/**
 * Valida si un trade puede ser ejecutado
 *
 * TRADING CONCEPT: Risk Management
 * Antes de ejecutar cualquier operación, debemos validar:
 * 1. Tenemos suficiente balance para comprar?
 * 2. Tenemos suficiente asset para vender?
 * 3. La cantidad es válida (> 0)?
 * 4. El precio es válido?
 *
 * @param type - 'buy' o 'sell'
 * @param asset - El asset a negociar
 * @param quantity - Cantidad a comprar/vender
 * @param price - Precio actual del asset
 * @param portfolio - Portfolio actual del usuario
 * @returns Objeto con valid (boolean) y error opcional
 */
export function validateTrade(
  type: TradeType,
  asset: Asset,
  quantity: number,
  price: number,
  portfolio: Portfolio
): TradeValidationResult {
  // Validación básica: cantidad debe ser positiva
  if (quantity <= 0) {
    return {
      valid: false,
      error: 'La cantidad debe ser mayor a 0'
    };
  }

  // Validación básica: precio debe ser positivo
  if (price <= 0) {
    return {
      valid: false,
      error: 'Precio inválido'
    };
  }

  if (type === 'buy') {
    // COMPRA: Validar que tengamos suficiente balance

    const totalCost = quantity * price;
    const fee = (totalCost * TRADING_FEE_PERCENTAGE) / 100;
    const totalWithFee = totalCost + fee;

    if (totalWithFee > portfolio.balance) {
      return {
        valid: false,
        error: `Balance insuficiente. Necesitas $${totalWithFee.toFixed(2)} pero solo tienes $${portfolio.balance.toFixed(2)}`
      };
    }

    // Warning si usamos más del 50% del balance en un trade
    const warnings: string[] = [];
    if (totalWithFee > portfolio.balance * 0.5) {
      warnings.push('⚠️ Estás usando más del 50% de tu balance en este trade. Considera diversificar.');
    }

    return { valid: true, warnings };

  } else {
    // VENTA: Validar que tengamos suficiente del asset

    const holding = portfolio.holdings.find(h => h.asset === asset.id);

    if (!holding) {
      return {
        valid: false,
        error: `No tienes ${asset.symbol} en tu portfolio para vender`
      };
    }

    if (quantity > holding.quantity) {
      return {
        valid: false,
        error: `Cantidad insuficiente. Tienes ${holding.quantity.toFixed(8)} ${asset.symbol} pero intentas vender ${quantity.toFixed(8)}`
      };
    }

    return { valid: true };
  }
}

// ==================== TRADE EXECUTION ====================

/**
 * Ejecuta un trade (compra o venta)
 *
 * TRADING CONCEPT: Market Order
 * Un "Market Order" se ejecuta inmediatamente al precio actual del mercado.
 * Es el tipo más simple de orden (vs. Limit Orders que se ejecutan a un precio específico)
 *
 * PROCESO:
 * 1. Calcular costo total + fee
 * 2. Actualizar balance
 * 3. Actualizar holdings
 * 4. Registrar el trade en el historial
 *
 * @returns Objeto con el trade ejecutado y el portfolio actualizado
 */
export function executeTrade(
  type: TradeType,
  asset: Asset,
  quantity: number,
  currentPortfolio: Portfolio
): { trade: Trade; newPortfolio: Portfolio } {
  const price = asset.current_price;
  const total = quantity * price;
  const fee = (total * TRADING_FEE_PERCENTAGE) / 100;
  const netTotal = type === 'buy' ? total + fee : total - fee;

  // Crear el trade object
  const trade: Trade = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    asset: asset.id,
    assetSymbol: asset.symbol,
    type,
    quantity,
    price,
    total,
    fee,
    netTotal
  };

  // Clonar portfolio para no mutar el original
  let newBalance = currentPortfolio.balance;
  let newHoldings = [...currentPortfolio.holdings];

  if (type === 'buy') {
    // COMPRA: Restar del balance y agregar/actualizar holding

    newBalance -= netTotal;

    const existingHoldingIndex = newHoldings.findIndex(h => h.asset === asset.id);

    if (existingHoldingIndex >= 0) {
      // Ya tenemos este asset: actualizar el holding existente
      // TRADING CONCEPT: Average Cost Basis
      // Cuando compras más de un asset que ya tienes, el precio promedio se recalcula

      const existing = newHoldings[existingHoldingIndex];
      const newQuantity = existing.quantity + quantity;
      const newTotalInvested = existing.totalInvested + netTotal;
      const newAverageBuyPrice = newTotalInvested / newQuantity;

      newHoldings[existingHoldingIndex] = {
        ...existing,
        quantity: newQuantity,
        averageBuyPrice: newAverageBuyPrice,
        totalInvested: newTotalInvested,
        currentPrice: price,
        currentValue: newQuantity * price,
        pnl: (newQuantity * price) - newTotalInvested,
        pnlPercentage: (((newQuantity * price) - newTotalInvested) / newTotalInvested) * 100
      };
    } else {
      // Nuevo asset: crear holding nuevo
      const newHolding: Holding = {
        asset: asset.id,
        assetSymbol: asset.symbol,
        assetName: asset.name,
        quantity,
        averageBuyPrice: price,
        totalInvested: netTotal,
        currentPrice: price,
        currentValue: quantity * price,
        pnl: 0, // Acabamos de comprar, P&L es 0
        pnlPercentage: 0
      };
      newHoldings.push(newHolding);
    }

  } else {
    // VENTA: Agregar al balance y reducir/eliminar holding

    newBalance += netTotal;

    const existingHoldingIndex = newHoldings.findIndex(h => h.asset === asset.id);

    if (existingHoldingIndex >= 0) {
      const existing = newHoldings[existingHoldingIndex];
      const newQuantity = existing.quantity - quantity;

      if (newQuantity <= 0.00000001) { // threshold para floating point
        // Vendimos todo: eliminar holding
        newHoldings.splice(existingHoldingIndex, 1);
      } else {
        // Venta parcial: actualizar holding
        // IMPORTANTE: El averageBuyPrice NO cambia en ventas
        // Solo cambia cuando COMPRAS más

        const proportionSold = quantity / existing.quantity;
        const investedSold = existing.totalInvested * proportionSold;

        newHoldings[existingHoldingIndex] = {
          ...existing,
          quantity: newQuantity,
          totalInvested: existing.totalInvested - investedSold,
          currentValue: newQuantity * price,
          pnl: (newQuantity * price) - (existing.totalInvested - investedSold),
          pnlPercentage: (((newQuantity * price) - (existing.totalInvested - investedSold)) / (existing.totalInvested - investedSold)) * 100
        };
      }
    }
  }

  // Calcular el nuevo portfolio completo
  const newPortfolio = calculatePortfolioValue(newBalance, newHoldings);

  return {
    trade,
    newPortfolio
  };
}

// ==================== PORTFOLIO CALCULATIONS ====================

/**
 * Calcula el valor total del portfolio y todas las métricas
 *
 * TRADING CONCEPT: Portfolio Valuation
 * El valor total de un portfolio es:
 * - Balance (cash disponible)
 * + Valor actual de todos los holdings
 * = Total Portfolio Value
 *
 * P&L Total = Portfolio Value - Total Invertido
 */
export function calculatePortfolioValue(
  balance: number,
  holdings: Holding[]
): Portfolio {
  // Calcular totales
  const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
  const holdingsValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const totalValue = balance + holdingsValue;

  // P&L total (unrealized)
  const totalPnL = holdingsValue - totalInvested;
  const totalPnLPercentage = totalInvested > 0
    ? (totalPnL / totalInvested) * 100
    : 0;

  return {
    balance,
    holdings,
    totalInvested,
    totalValue,
    totalPnL,
    totalPnLPercentage,
    lastUpdated: Date.now()
  };
}

/**
 * Actualiza los precios actuales de los holdings
 *
 * Esto se debe llamar cada vez que obtenemos precios nuevos de la API
 * para mantener el portfolio actualizado con valores en tiempo real
 */
export function updateHoldingPrices(
  holdings: Holding[],
  currentPrices: Map<string, number>
): Holding[] {
  return holdings.map(holding => {
    const newPrice = currentPrices.get(holding.asset);

    if (!newPrice) {
      // Si no tenemos precio nuevo, mantener el actual
      return holding;
    }

    // Recalcular valores con el nuevo precio
    const currentValue = holding.quantity * newPrice;
    const pnl = currentValue - holding.totalInvested;
    const pnlPercentage = (pnl / holding.totalInvested) * 100;

    return {
      ...holding,
      currentPrice: newPrice,
      currentValue,
      pnl,
      pnlPercentage
    };
  });
}

/**
 * Calcula el P&L de un holding específico
 *
 * TRADING CONCEPT: Unrealized vs Realized P&L
 * - Unrealized P&L: Ganancia/pérdida "en papel" (aún tienes el asset)
 * - Realized P&L: Ganancia/pérdida real (cuando vendes)
 *
 * Esta función calcula Unrealized P&L.
 */
export function calculateHoldingPnL(holding: Holding): {
  pnl: number;
  pnlPercentage: number;
  isProfit: boolean;
} {
  const pnl = holding.currentValue - holding.totalInvested;
  const pnlPercentage = (pnl / holding.totalInvested) * 100;

  return {
    pnl,
    pnlPercentage,
    isProfit: pnl >= 0
  };
}

// ==================== PORTFOLIO STATISTICS ====================

/**
 * Calcula estadísticas avanzadas del portfolio
 */
export function calculatePortfolioStats(
  trades: Trade[],
  portfolio: Portfolio,
  initialBalance: number
): PortfolioStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      buyTrades: 0,
      sellTrades: 0,
      totalFeesPaid: 0,
      bestTrade: null,
      worstTrade: null,
      mostTradedAsset: null,
      averageTradeSize: 0,
      winRate: 0,
      totalReturn: portfolio.totalValue - initialBalance,
      totalReturnPercentage: ((portfolio.totalValue - initialBalance) / initialBalance) * 100
    };
  }

  const buyTrades = trades.filter(t => t.type === 'buy').length;
  const sellTrades = trades.filter(t => t.type === 'sell').length;
  const totalFeesPaid = trades.reduce((sum, t) => sum + t.fee, 0);

  // Calcular P&L por cada venta (realized P&L)
  // Esto es simplificado; en realidad necesitaríamos rastrear el costo de cada lote
  const sellTradesWithPnL = trades
    .filter(t => t.type === 'sell')
    .map(t => ({
      ...t,
      estimatedPnL: 0 // TODO: calcular P&L real de cada venta
    }));

  // Trade promedio
  const averageTradeSize = trades.reduce((sum, t) => sum + t.total, 0) / trades.length;

  // Asset más negociado
  const assetCounts = trades.reduce((acc, t) => {
    acc[t.asset] = (acc[t.asset] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostTradedAsset = Object.entries(assetCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

  // Retorno total
  const totalReturn = portfolio.totalValue - initialBalance;
  const totalReturnPercentage = ((portfolio.totalValue - initialBalance) / initialBalance) * 100;

  return {
    totalTrades: trades.length,
    buyTrades,
    sellTrades,
    totalFeesPaid,
    bestTrade: null, // TODO
    worstTrade: null, // TODO
    mostTradedAsset,
    averageTradeSize,
    winRate: 0, // TODO
    totalReturn,
    totalReturnPercentage
  };
}

// ==================== AI CONTEXT BUILDER (PHASE 2) ====================

/**
 * Construye el contexto completo para el asistente AI
 *
 * TODO: AI Integration - Esta función será usada en Fase 2
 * para enviar todo el contexto necesario a Claude API
 */
export function buildAIContext(
  portfolio: Portfolio,
  allTrades: Trade[],
  marketData: Asset[]
): AIContext {
  // Tomar últimos 10 trades para contexto
  const recentTrades = allTrades.slice(-10);

  // Calcular días de trading
  const firstTrade = allTrades[0];
  const tradingDays = firstTrade
    ? Math.ceil((Date.now() - firstTrade.timestamp) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    timestamp: Date.now(),
    portfolio,
    recentTrades,
    marketSnapshot: marketData,
    totalTradesCount: allTrades.length,
    tradingDays
  };
}

/**
 * TODO: AI Integration
 * Función placeholder para la integración con Claude API en Fase 2
 */
export async function getAITradeAdvice(context: AIContext): Promise<string> {
  // Placeholder para Fase 2
  throw new Error('AI Integration not implemented yet - Coming in Phase 2!');
}
