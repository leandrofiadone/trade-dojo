/**
 * TRADING TYPES & INTERFACES
 *
 * Este archivo define todas las estructuras de datos para la aplicación de trading.
 * Incluye conceptos fundamentales de trading como assets, trades, holdings y portfolio.
 */

// ==================== MARKET DATA ====================

/**
 * Asset: Representa una criptomoneda disponible en el mercado
 *
 * TRADING CONCEPT: Un "asset" es cualquier instrumento financiero que puedes comprar/vender.
 * En nuestro caso, son criptomonedas como Bitcoin, Ethereum, etc.
 */
export interface Asset {
  id: string;                           // Identificador único (ej: 'bitcoin')
  symbol: string;                       // Símbolo de trading (ej: 'BTC')
  name: string;                         // Nombre completo (ej: 'Bitcoin')
  current_price: number;                // Precio actual en USD
  price_change_percentage_24h: number;  // Cambio de precio en últimas 24h (%)
  image?: string;                       // URL del logo
  market_cap?: number;                  // Capitalización de mercado
  total_volume?: number;                // Volumen de trading en 24h
  high_24h?: number;                    // Precio más alto en 24h
  low_24h?: number;                     // Precio más bajo en 24h
}

// ==================== TRADING OPERATIONS ====================

/**
 * TradeType: Tipos de operaciones de trading
 *
 * TRADING CONCEPT:
 * - BUY (Comprar): Adquirir un asset usando cash (balance)
 * - SELL (Vender): Liquidar un asset y convertirlo a cash
 */
export type TradeType = 'buy' | 'sell';

/**
 * Trade: Representa una transacción individual ejecutada
 *
 * TRADING CONCEPT: Un "trade" es la ejecución de una orden de compra o venta.
 * Cada trade registra todos los detalles de la transacción para tracking y análisis.
 */
export interface Trade {
  id: string;                    // UUID único del trade
  timestamp: number;             // Fecha/hora de ejecución (Date.now())
  asset: string;                 // ID del asset (ej: 'bitcoin')
  assetSymbol: string;           // Símbolo del asset (ej: 'BTC')
  type: TradeType;               // 'buy' o 'sell'
  quantity: number;              // Cantidad de asset negociado
  price: number;                 // Precio por unidad al momento del trade
  total: number;                 // Total en USD (quantity * price)
  fee: number;                   // Comisión cobrada por el trade
  netTotal: number;              // Total neto después de comisión
}

/**
 * TradeFormData: Datos del formulario para crear un trade
 */
export interface TradeFormData {
  asset: string;
  type: TradeType;
  quantity: number;
}

/**
 * TradeValidationResult: Resultado de validar un trade
 */
export interface TradeValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// ==================== PORTFOLIO & HOLDINGS ====================

/**
 * Holding: Representa una posición abierta en el portfolio
 *
 * TRADING CONCEPTS:
 * - Position: Cantidad de un asset que posees actualmente
 * - Average Buy Price: Precio promedio ponderado de compra
 * - Unrealized P&L: Ganancia/pérdida "en papel" (aún no vendido)
 *
 * EJEMPLO:
 * Si compras 1 BTC a $50,000 y luego 1 BTC más a $60,000:
 * - quantity: 2 BTC
 * - averageBuyPrice: $55,000 (promedio ponderado)
 * - totalInvested: $110,000
 * Si el precio actual es $58,000:
 * - currentValue: $116,000 (2 * $58,000)
 * - pnl: $6,000 (unrealized gain)
 * - pnlPercentage: 5.45%
 */
export interface Holding {
  asset: string;                 // ID del asset
  assetSymbol: string;           // Símbolo del asset
  assetName: string;             // Nombre del asset
  quantity: number;              // Cantidad total que poseo
  averageBuyPrice: number;       // Precio promedio de compra (ponderado)
  totalInvested: number;         // Total invertido ($$$)
  currentPrice: number;          // Precio actual del mercado
  currentValue: number;          // Valor actual de la posición (quantity * currentPrice)
  pnl: number;                   // Ganancia/pérdida en USD (unrealized)
  pnlPercentage: number;         // Ganancia/pérdida en porcentaje
}

/**
 * Portfolio: Representa el estado completo del portfolio del usuario
 *
 * TRADING CONCEPTS:
 * - Balance: Cash disponible para trading
 * - Holdings: Posiciones abiertas (assets que posees)
 * - Total Value: Balance + valor de todas las posiciones
 * - Total P&L: Ganancia/pérdida total del portfolio
 *
 * EJEMPLO:
 * - Balance: $5,000 (cash disponible)
 * - Holdings: 1 BTC ($58,000) + 10 ETH ($30,000)
 * - Total Invested: $85,000 (lo que pagaste originalmente)
 * - Total Value: $93,000 (balance + valor actual de holdings)
 * - Total P&L: $8,000 (ganancia no realizada)
 */
export interface Portfolio {
  balance: number;               // Cash disponible en USD
  holdings: Holding[];           // Array de posiciones abiertas
  totalInvested: number;         // Total USD invertido en holdings
  totalValue: number;            // Balance + valor actual de holdings
  totalPnL: number;              // Ganancia/pérdida total en USD
  totalPnLPercentage: number;    // Ganancia/pérdida total en %
  lastUpdated: number;           // Timestamp de última actualización
}

// ==================== STORAGE & PERSISTENCE ====================

/**
 * StorageData: Datos persistidos en localStorage
 *
 * Solo guardamos lo mínimo necesario:
 * - balance: cash disponible
 * - trades: historial completo de trades
 * - futuresPositions: posiciones de futuros (todas: abiertas, cerradas, liquidadas)
 *
 * Los holdings de spot se RECALCULAN a partir de los trades cada vez.
 * Esto garantiza consistencia y facilita debugging.
 */
export interface StorageData {
  balance: number;                      // Balance actual
  trades: Trade[];                      // Historial completo de trades spot
  futuresPositions: FuturesPosition[];  // Todas las posiciones de futuros
  initialBalance: number;               // Balance inicial para calcular performance
  lastUpdate: number;                   // Timestamp de última actualización
}

// ==================== AI INTEGRATION (PHASE 2) ====================

/**
 * AIContext: Contexto completo para el asistente de trading AI
 *
 * TODO: AI Integration - Este será el payload que enviaremos a Claude API
 * en la Fase 2 para análisis de portfolio y recomendaciones de trading.
 *
 * Incluye snapshot completo del estado actual:
 * - Portfolio completo
 * - Historial reciente de trades
 * - Precios actuales del mercado
 */
export interface AIContext {
  timestamp: number;                    // Momento del snapshot
  portfolio: Portfolio;                 // Estado completo del portfolio
  recentTrades: Trade[];                // Últimos N trades para contexto
  marketSnapshot: Asset[];              // Precios actuales de los assets principales
  totalTradesCount: number;             // Total de trades ejecutados
  tradingDays: number;                  // Días desde el primer trade
}

/**
 * AIAnalysisRequest: Request para análisis AI
 * TODO: AI Integration
 */
export interface AIAnalysisRequest {
  context: AIContext;
  question?: string;                    // Pregunta específica del usuario
  analysisType: 'portfolio' | 'trade' | 'market' | 'general';
}

/**
 * AIAnalysisResponse: Response del análisis AI
 * TODO: AI Integration
 */
export interface AIAnalysisResponse {
  analysis: string;                     // Análisis en texto
  recommendations?: string[];           // Lista de recomendaciones
  warnings?: string[];                  // Warnings sobre riesgos
  timestamp: number;
}

// ==================== STATISTICS & ANALYTICS ====================

/**
 * PortfolioStats: Estadísticas avanzadas del portfolio
 */
export interface PortfolioStats {
  totalTrades: number;                  // Total de trades ejecutados
  buyTrades: number;                    // Total de compras
  sellTrades: number;                   // Total de ventas
  totalFeesPaid: number;                // Total pagado en comisiones
  bestTrade: Trade | null;              // Trade más rentable
  worstTrade: Trade | null;             // Trade menos rentable
  mostTradedAsset: string | null;       // Asset más negociado
  averageTradeSize: number;             // Tamaño promedio de trades
  winRate: number;                      // % de trades rentables
  totalReturn: number;                  // Retorno total desde inicio
  totalReturnPercentage: number;        // Retorno total en %
}

// ==================== API RESPONSES ====================

/**
 * CoinGeckoMarketData: Response de CoinGecko API
 * (Estructura simplificada de la respuesta real)
 */
export interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_date: string;
  atl: number;
  atl_date: string;
  last_updated: string;
}

/**
 * PriceUpdate: Estructura para actualizaciones de precios en tiempo real
 */
export interface PriceUpdate {
  assetId: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  changePercentage: number;
  timestamp: number;
}

// ==================== FUTURES TRADING ====================

/**
 * PositionSide: Dirección de una posición de futuros
 *
 * TRADING CONCEPTS:
 * - LONG: Apuestas a que el precio SUBE
 *   - Compras a precio actual, vendes más caro después
 *   - Ganas si el precio sube, pierdes si baja
 * - SHORT: Apuestas a que el precio BAJA
 *   - Vendes a precio actual, compras más barato después
 *   - Ganas si el precio baja, pierdes si sube
 */
export type PositionSide = 'LONG' | 'SHORT';

/**
 * PositionStatus: Estado actual de una posición
 */
export type PositionStatus = 'OPEN' | 'CLOSED' | 'LIQUIDATED';

/**
 * FuturesPosition: Representa una posición de futuros abierta
 *
 * TRADING CONCEPTS:
 * - Leverage (Apalancamiento): Multiplica tu poder de compra
 *   - Ej: Con $1,000 y leverage 10x, puedes controlar $10,000 de BTC
 *   - Mayor leverage = Mayor riesgo y recompensa
 * - Margin (Margen): Capital que depositas como garantía
 *   - Es el $ que realmente arriesgas
 * - Liquidation Price: Precio al que pierdes todo tu margin
 *   - Si el precio llega aquí, tu posición se cierra automáticamente
 * - Unrealized P&L: Ganancia/pérdida actual (sin cerrar la posición)
 * - Funding Rate: Pago periódico entre longs y shorts (simplificado aquí)
 *
 * EJEMPLO LONG:
 * - Abres LONG 1 BTC a $50,000 con leverage 10x
 * - Margin necesario: $5,000 (10% del valor total)
 * - Si BTC sube a $55,000 (+10%):
 *   - Tu ganancia: $5,000 (10% * 10x leverage = 100% de tu margin!)
 * - Si BTC baja a $45,000 (-10%):
 *   - Tu pérdida: $5,000 (pierdes todo tu margin)
 *   - LIQUIDADO!
 *
 * EJEMPLO SHORT:
 * - Abres SHORT 1 BTC a $50,000 con leverage 5x
 * - Margin necesario: $10,000
 * - Si BTC baja a $45,000 (-10%):
 *   - Tu ganancia: $5,000 (10% * 5x = 50% de tu margin)
 * - Si BTC sube a $55,000 (+10%):
 *   - Tu pérdida: $5,000 (50% de tu margin)
 */
export interface FuturesPosition {
  id: string;                       // UUID único de la posición
  timestamp: number;                // Timestamp de apertura
  asset: string;                    // ID del asset (ej: 'bitcoin')
  assetSymbol: string;              // Símbolo (ej: 'BTC')
  assetName: string;                // Nombre completo
  side: PositionSide;               // 'LONG' o 'SHORT'
  status: PositionStatus;           // 'OPEN', 'CLOSED', 'LIQUIDATED'

  // Parámetros de entrada
  leverage: number;                 // Multiplicador de apalancamiento (2x-100x)
  margin: number;                   // Capital depositado como garantía (USD)
  entryPrice: number;               // Precio de entrada
  quantity: number;                 // Cantidad de asset (margin * leverage / entryPrice)

  // Precios importantes
  currentPrice: number;             // Precio actual del mercado
  liquidationPrice: number;         // Precio de liquidación
  stopLoss?: number;                // Stop Loss (opcional)
  takeProfit?: number;              // Take Profit (opcional)

  // P&L
  unrealizedPnL: number;            // Ganancia/pérdida actual (USD)
  unrealizedPnLPercentage: number;  // Ganancia/pérdida actual (%)
  realizedPnL?: number;             // P&L al cerrar (solo si status !== 'OPEN')

  // Costos
  openFee: number;                  // Comisión de apertura
  closeFee?: number;                // Comisión de cierre (cuando se cierra)
  fundingFees: number;              // Funding fees acumulados

  // Cierre
  closeTimestamp?: number;          // Timestamp de cierre
  closePrice?: number;              // Precio de cierre
  closeReason?: 'USER' | 'STOP_LOSS' | 'TAKE_PROFIT' | 'LIQUIDATION';
}

/**
 * FuturesFormData: Datos para abrir una posición de futuros
 */
export interface FuturesFormData {
  asset: string;
  side: PositionSide;
  margin: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
}

/**
 * FuturesValidationResult: Resultado de validar una orden de futuros
 */
export interface FuturesValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  liquidationPrice?: number;
  maxLoss?: number;
}

/**
 * FuturesPortfolio: Estado del portfolio de futuros
 */
export interface FuturesPortfolio {
  positions: FuturesPosition[];                // Posiciones abiertas
  totalMarginUsed: number;                     // Margin total en uso
  totalUnrealizedPnL: number;                  // P&L total no realizado
  totalRealizedPnL: number;                    // P&L total realizado (histórico)
  totalFeesPaid: number;                       // Fees totales pagados
  availableMargin: number;                     // Margin disponible para nuevas posiciones
  marginUtilization: number;                   // % de margin en uso
  lastUpdated: number;
}

/**
 * FuturesStats: Estadísticas de trading de futuros
 */
export interface FuturesStats {
  totalPositions: number;                      // Total de posiciones abiertas históricamente
  openPositions: number;                       // Posiciones actualmente abiertas
  closedPositions: number;                     // Posiciones cerradas
  liquidatedPositions: number;                 // Posiciones liquidadas
  longPositions: number;                       // Total longs
  shortPositions: number;                      // Total shorts
  winRate: number;                             // % de posiciones rentables
  bestPosition: FuturesPosition | null;        // Posición más rentable
  worstPosition: FuturesPosition | null;       // Peor posición
  averageLeverage: number;                     // Leverage promedio usado
  averageMarginSize: number;                   // Tamaño promedio de margin
}
