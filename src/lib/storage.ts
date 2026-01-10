/**
 * STORAGE SERVICE - LocalStorage Persistence
 *
 * Maneja toda la persistencia de datos en el navegador usando localStorage.
 *
 * IMPORTANTE: Solo guardamos lo mínimo necesario:
 * - Balance actual
 * - Historial completo de trades
 * - Balance inicial
 *
 * Los holdings se RECALCULAN a partir de los trades cada vez que se carga.
 * Esto garantiza consistencia de datos.
 */

import type { Trade, StorageData, Portfolio, Holding, FuturesPosition } from '../types/trading';
import { INITIAL_BALANCE } from './tradingEngine';

// ==================== CONSTANTS ====================

const STORAGE_KEY = 'trading_practice_data';
const STORAGE_VERSION = '1.0';

// ==================== SAVE & LOAD ====================

/**
 * Guarda el estado actual en localStorage
 */
export function saveToStorage(
  balance: number,
  trades: Trade[],
  futuresPositions: FuturesPosition[],
  initialBalance: number
): void {
  try {
    const data: StorageData = {
      balance,
      trades,
      futuresPositions,
      initialBalance,
      lastUpdate: Date.now()
    };

    const serialized = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, serialized);
    localStorage.setItem(`${STORAGE_KEY}_version`, STORAGE_VERSION);

    console.log(`💾 Data saved: ${trades.length} trades, balance: $${balance.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);

    // Si falla por quota exceeded, intentar limpiar y guardar de nuevo
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.warn('⚠️ localStorage quota exceeded, cleaning old data...');
      cleanOldData();

      // Retry
      try {
        const data: StorageData = {
          balance,
          trades,
          futuresPositions,
          initialBalance,
          lastUpdate: Date.now()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error('❌ Failed to save even after cleaning:', retryError);
      }
    }
  }
}

/**
 * Carga el estado desde localStorage
 * Si no existe, retorna estado inicial
 */
export function loadFromStorage(): StorageData {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);

    if (!serialized) {
      console.log('📭 No saved data found, returning initial state');
      return getInitialStorageData();
    }

    const data: StorageData = JSON.parse(serialized);

    // Validar que los datos sean válidos
    if (!validateStorageData(data)) {
      console.warn('⚠️ Invalid storage data, resetting to initial state');
      return getInitialStorageData();
    }

    console.log(`📂 Loaded data: ${data.trades.length} trades, balance: $${data.balance.toFixed(2)}`);
    return data;

  } catch (error) {
    console.error('❌ Error loading from localStorage:', error);
    return getInitialStorageData();
  }
}

/**
 * Retorna el estado inicial cuando no hay datos guardados
 */
function getInitialStorageData(): StorageData {
  return {
    balance: INITIAL_BALANCE,
    trades: [],
    futuresPositions: [],
    initialBalance: INITIAL_BALANCE,
    lastUpdate: Date.now()
  };
}

// ==================== VALIDATION ====================

/**
 * Valida que los datos cargados sean correctos
 * Backward compatible: si futuresPositions no existe, lo crea como array vacío
 */
function validateStorageData(data: any): data is StorageData {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.balance !== 'number') return false;
  if (!Array.isArray(data.trades)) return false;
  if (typeof data.initialBalance !== 'number') return false;

  // Backward compatibility: si no tiene futuresPositions, añadir array vacío
  if (!data.futuresPositions) {
    data.futuresPositions = [];
  }
  if (!Array.isArray(data.futuresPositions)) return false;

  // Validar cada trade
  for (const trade of data.trades) {
    if (!validateTrade(trade)) return false;
  }

  // Validar cada futures position (básico)
  for (const position of data.futuresPositions) {
    if (!position || typeof position !== 'object') return false;
    if (typeof position.id !== 'string') return false;
  }

  return true;
}

/**
 * Valida que un trade tenga la estructura correcta
 */
function validateTrade(trade: any): trade is Trade {
  return (
    trade &&
    typeof trade.id === 'string' &&
    typeof trade.timestamp === 'number' &&
    typeof trade.asset === 'string' &&
    typeof trade.assetSymbol === 'string' &&
    (trade.type === 'buy' || trade.type === 'sell') &&
    typeof trade.quantity === 'number' &&
    typeof trade.price === 'number' &&
    typeof trade.total === 'number' &&
    typeof trade.fee === 'number' &&
    typeof trade.netTotal === 'number'
  );
}

// ==================== RESET & CLEAR ====================

/**
 * Resetea todos los datos a estado inicial
 * CUIDADO: Esto borra todo el historial de trading
 */
export function resetAllData(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(`${STORAGE_KEY}_version`);
  console.log('🗑️ All data has been reset');
}

/**
 * Limpia datos viejos/corruptos
 */
function cleanOldData(): void {
  // Limpiar cualquier clave vieja que pueda estar ocupando espacio
  const keysToRemove: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('trading_') && key !== STORAGE_KEY) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`🧹 Cleaned ${keysToRemove.length} old keys`);
}

// ==================== EXPORT & IMPORT ====================

/**
 * Exporta todos los datos como JSON para backup
 */
export function exportData(): string {
  const data = loadFromStorage();
  return JSON.stringify(data, null, 2);
}

/**
 * Importa datos desde JSON
 */
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);

    if (!validateStorageData(data)) {
      console.error('❌ Invalid data format for import');
      return false;
    }

    saveToStorage(data.balance, data.trades, data.initialBalance);
    console.log('✅ Data imported successfully');
    return true;

  } catch (error) {
    console.error('❌ Error importing data:', error);
    return false;
  }
}

/**
 * Exporta historial de trades como CSV
 */
export function exportTradesAsCSV(trades: Trade[]): string {
  const headers = ['Date', 'Time', 'Type', 'Asset', 'Symbol', 'Quantity', 'Price', 'Total', 'Fee', 'Net Total'];
  const rows = trades.map(trade => {
    const date = new Date(trade.timestamp);
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      trade.type.toUpperCase(),
      trade.asset,
      trade.assetSymbol,
      trade.quantity.toFixed(8),
      trade.price.toFixed(2),
      trade.total.toFixed(2),
      trade.fee.toFixed(2),
      trade.netTotal.toFixed(2)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Descarga el CSV al filesystem
 */
export function downloadTradesCSV(trades: Trade[]): void {
  const csv = exportTradesAsCSV(trades);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `trading_history_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  console.log('📥 CSV downloaded');
}

// ==================== HELPERS ====================

/**
 * Obtiene el tamaño de los datos guardados en KB
 */
export function getStorageSize(): number {
  const serialized = localStorage.getItem(STORAGE_KEY);
  if (!serialized) return 0;

  // Tamaño aproximado en bytes
  const bytes = new Blob([serialized]).size;
  return Math.round(bytes / 1024 * 100) / 100; // KB con 2 decimales
}

/**
 * Verifica cuánto espacio queda en localStorage
 */
export function checkStorageQuota(): { used: number; available: number; percentage: number } {
  let used = 0;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        used += key.length + value.length;
      }
    }
  }

  // La mayoría de navegadores tienen 5-10MB de localStorage
  // Asumimos 5MB como límite conservador
  const available = 5 * 1024 * 1024; // 5MB en bytes
  const percentage = (used / available) * 100;

  return {
    used: Math.round(used / 1024), // KB
    available: Math.round(available / 1024), // KB
    percentage: Math.round(percentage * 100) / 100
  };
}
