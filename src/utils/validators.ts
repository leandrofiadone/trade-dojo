/**
 * VALIDATORS - Input validation utilities
 */

/**
 * Valida que un número sea positivo
 */
export function isPositiveNumber(value: number): boolean {
  return typeof value === 'number' && value > 0 && !isNaN(value) && isFinite(value);
}

/**
 * Valida que un string sea un número válido
 */
export function isValidNumberString(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const num = parseFloat(value);
  return !isNaN(num) && isFinite(num);
}

/**
 * Parsea un input string a número
 */
export function parseNumberInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const num = parseFloat(trimmed);
  if (isNaN(num) || !isFinite(num)) return null;

  return num;
}

/**
 * Valida que una cantidad sea válida para trading
 */
export function isValidTradeQuantity(quantity: number): boolean {
  return isPositiveNumber(quantity) && quantity > 0.00000001; // Mínimo 1 satoshi
}

/**
 * Limita decimales de un número
 */
export function limitDecimals(value: number, decimals: number): number {
  const multiplier = Math.pow(10, decimals);
  return Math.round(value * multiplier) / multiplier;
}
