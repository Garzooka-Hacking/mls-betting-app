const STORAGE_KEY = 'mls_picks_history';

/**
 * Guarda una nueva lista de pronósticos en el historial.
 * Solo guarda si hay picks y evita guardar duplicados del mismo día/hora exacta si hay auto-refresh.
 */
export function savePicksToHistory(picks) {
  if (!picks || picks.length === 0) return;

  const history = getSavedHistory();
  const now = new Date();
  const currentDateStr = now.toLocaleDateString();
  
  const newEntry = {
    id: Date.now().toString(),
    date: now.toLocaleString(),
    dateOnly: currentDateStr,
    picks: picks
  };

  // Prevenir que se creen múltiples registros el mismo día.
  // Si el último guardado es de hoy, lo actualizamos.
  if (history.length > 0) {
    // Extraemos la fecha del último registro
    const lastEntryDateStr = history[0].dateOnly || new Date(parseInt(history[0].id, 10)).toLocaleDateString();
    
    if (currentDateStr === lastEntryDateStr) {
      newEntry.id = history[0].id; // Mantenemos el mismo ID
      history[0] = newEntry;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return;
    }
  }

  const updatedHistory = [newEntry, ...history];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
}

/**
 * Obtiene el historial completo de pronósticos guardados
 */
export function getSavedHistory() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Error leyendo historial", e);
      return [];
    }
  }
  return [];
}

/**
 * Borra todo el historial
 */
export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Borra una entrada específica del historial
 */
export function deleteHistoryEntry(id) {
  const history = getSavedHistory();
  const updatedHistory = history.filter(entry => entry.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
}
