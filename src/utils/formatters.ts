/**
 * FORMATTERS - Utility functions for formatting numbers, currency, and dates
 */

/**
 * Formatea un número como moneda USD
 *
 * @param value - El valor numérico
 * @param decimals - Número de decimales (default: 2)
 * @returns String formateado como "$1,234.56"
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formatea un porcentaje con signo +/-
 *
 * @param value - El valor del porcentaje
 * @param decimals - Número de decimales (default: 2)
 * @returns String formateado como "+5.67%" o "-2.34%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Formatea un número con separadores de miles
 *
 * @param value - El valor numérico
 * @param decimals - Número de decimales
 * @returns String formateado como "1,234.567"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Formatea una cantidad de criptomoneda
 * Usa más decimales para cantidades pequeñas
 *
 * @param value - La cantidad
 * @param symbol - Símbolo de la crypto (opcional)
 * @returns String formateado como "0.00123456 BTC"
 */
export function formatCryptoAmount(value: number, symbol?: string): string {
  let decimals = 8; // Bitcoin usa 8 decimales (1 satoshi = 0.00000001 BTC)

  // Si el valor es grande, usar menos decimales
  if (value >= 1) decimals = 4;
  if (value >= 100) decimals = 2;

  const formatted = value.toFixed(decimals);
  return symbol ? `${formatted} ${symbol}` : formatted;
}

/**
 * Formatea una fecha relativa (ej: "2 hours ago", "3 days ago")
 *
 * @param timestamp - Timestamp en milisegundos
 * @returns String con tiempo relativo
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

/**
 * Formatea una fecha/hora completa
 *
 * @param timestamp - Timestamp en milisegundos
 * @returns String como "Jan 10, 2026 14:30:45"
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Formatea solo la fecha
 *
 * @param timestamp - Timestamp en milisegundos
 * @returns String como "Jan 10, 2026"
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Formatea solo la hora
 *
 * @param timestamp - Timestamp en milisegundos
 * @returns String como "14:30:45"
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Abrevia números grandes (ej: 1,234,567 -> "1.23M")
 *
 * @param value - El valor numérico
 * @returns String abreviado
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * Obtiene la clase CSS apropiada para un valor de P&L
 *
 * @param value - El valor de ganancia/pérdida
 * @returns 'profit' o 'loss'
 */
export function getPnLClass(value: number): 'profit' | 'loss' {
  return value >= 0 ? 'profit' : 'loss';
}

/**
 * Obtiene el emoji apropiado para un cambio de precio
 *
 * @param value - El cambio de precio
 * @returns '🟢' para positivo, '🔴' para negativo
 */
export function getPriceChangeEmoji(value: number): string {
  return value >= 0 ? '🟢' : '🔴';
}

/**
 * Obtiene el emoji de tendencia
 *
 * @param value - El cambio
 * @returns '📈' para subida, '📉' para bajada
 */
export function getTrendEmoji(value: number): string {
  return value >= 0 ? '📈' : '📉';
}
