import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';

/**
 * Guarda una nueva lista de pronósticos en el historial de Firestore.
 */
export async function savePicksToHistory(picks, userId) {
  if (!picks || picks.length === 0 || !userId) return;

  const now = new Date();
  const currentDateStr = now.toLocaleDateString();
  const historyRef = collection(db, 'users', userId, 'history');
  
  // Buscar si ya hay un registro hoy
  const q = query(historyRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  let existingId = null;

  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    if (data.dateOnly === currentDateStr) {
      existingId = docSnap.id;
    }
  });

  const entryId = existingId || Date.now().toString();
  
  const newEntry = {
    date: now.toLocaleString(),
    dateOnly: currentDateStr,
    timestamp: now.getTime(),
    picks: picks
  };

  await setDoc(doc(historyRef, entryId), newEntry);
}

/**
 * Obtiene el historial completo de pronósticos guardados
 */
export async function getSavedHistory(userId) {
  if (!userId) return [];
  
  const historyRef = collection(db, 'users', userId, 'history');
  const q = query(historyRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  
  const history = [];
  snapshot.forEach(docSnap => {
    history.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });
  
  return history;
}

/**
 * Borra todo el historial
 */
export async function clearHistory(userId) {
  if (!userId) return;
  const historyRef = collection(db, 'users', userId, 'history');
  const snapshot = await getDocs(historyRef);
  
  const deletePromises = [];
  snapshot.forEach(docSnap => {
    deletePromises.push(deleteDoc(docSnap.ref));
  });
  
  await Promise.all(deletePromises);
}

/**
 * Borra una entrada específica del historial
 */
export async function deleteHistoryEntry(userId, entryId) {
  if (!userId || !entryId) return;
  const entryRef = doc(db, 'users', userId, 'history', entryId);
  await deleteDoc(entryRef);
}
