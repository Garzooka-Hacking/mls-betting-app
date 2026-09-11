import React, { useState, useEffect } from 'react';
import { getSavedHistory, clearHistory, deleteHistoryEntry } from '../services/storage';

const SavedPicks = ({ user }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    if (user) {
      setLoading(true);
      const data = await getSavedHistory(user.uid);
      setHistory(data);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleClear = async () => {
    if (window.confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
      await clearHistory(user.uid);
      setHistory([]);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas borrar este registro de apuestas?')) {
      await deleteHistoryEntry(user.uid, id);
      await loadHistory();
    }
  };

  if (loading) {
    return <div style={{textAlign: 'center', padding: '2rem'}}>Cargando historial...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="saved-picks-container fade-in">
        <h2>Historial de Pronósticos</h2>
        <div className="empty-state">
          <p>No tienes pronósticos guardados todavía. ¡Genera algunos para empezar a guardar tu historial!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="saved-picks-container fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Tus Combinadas Guardadas</h2>
        <button className="clear-btn" onClick={handleClear}>Borrar Todo el Historial</button>
      </div>

      <div className="history-list">
        {history.map((entry) => (
          <div key={entry.id} className="history-card">
            <div className="history-date" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span>📅 Generado el: {entry.date}</span>
                <span className="pick-count" style={{marginLeft: '10px'}}>{entry.picks.length} partidos</span>
              </div>
              <button 
                className="delete-entry-btn" 
                onClick={() => handleDeleteEntry(entry.id)}
                title="Borrar este registro"
                style={{ background: '#ff4d4f', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Eliminar
              </button>
            </div>
            
            <div className="history-picks-grid">
              {entry.picks.map(pick => (
                <div className="history-pick-item" key={pick.id}>
                  <div className="history-match-name">
                    {pick.match} 
                    {pick.liveScore && <span style={{color: '#94a3b8', fontSize: '0.8rem', marginLeft: '6px'}}>{pick.liveScore}</span>}
                    {pick.result === 'win' && <span style={{marginLeft: '8px'}} title="¡Acertada!">✅</span>}
                    {pick.result === 'loss' && <span style={{marginLeft: '8px'}} title="Fallada">❌</span>}
                  </div>
                  <div className="history-pick-details">
                    <span>{pick.pick} ({(pick.probability).toFixed(0)}%)</span>
                    <span className="odds">Cuota: {pick.odds}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SavedPicks;
