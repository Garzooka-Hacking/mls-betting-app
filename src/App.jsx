import React, { useState, useEffect } from 'react';
import MlsTable from './components/MlsTable';
import BettingPicks from './components/BettingPicks';
import SavedPicks from './components/SavedPicks';
import { fetchMlsData, fetchChampionsLeagueData } from './services/api';
import { savePicksToHistory } from './services/storage';
import Chat from './components/Chat';
import './index.css';

function App() {
  const [dataGenerated, setDataGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [currentLeague, setCurrentLeague] = useState('mls');

  const handleGenerate = async (league = 'mls') => {
    setIsGenerating(true);
    setCurrentLeague(league);
    setApiData(null); // Limpiamos los datos anteriores para evitar choques de estructura
    
    // Llamada a la API correspondiente
    const data = league === 'mls' ? await fetchMlsData() : await fetchChampionsLeagueData();
    
    setApiData(data);
    setDataGenerated(true);
    setShowSaved(false); // Volver al dashboard principal al generar
    
    // Auto-guardado en localStorage
    if (data && data.picks && data.picks.length > 0) {
      savePicksToHistory(data.picks);
    }

    setIsGenerating(false);
  };

  useEffect(() => {
    // Generar y guardar automáticamente al iniciar la app
    handleGenerate('mls');
  }, []);

  // Auto-refrescar en segundo plano cada 60 segundos
  useEffect(() => {
    let interval;
    if (dataGenerated) {
      interval = setInterval(async () => {
        const newData = currentLeague === 'mls' ? await fetchMlsData() : await fetchChampionsLeagueData();
        setApiData(newData);
        if (newData && newData.picks && newData.picks.length > 0) {
          savePicksToHistory(newData.picks);
        }
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [dataGenerated, currentLeague]);

  return (
    <div className="app-container">
      <header className="hero-header">
        <div className="hero-content">
          <h1>Predicciones Deportivas <span>Pro</span></h1>
          <p>Estadísticas avanzadas desde la jornada 1 hasta hoy para tus apuestas.</p>
          
          <div className="hero-buttons" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button 
              className={`generate-btn ${isGenerating && currentLeague === 'mls' ? 'loading' : ''}`} 
              onClick={() => handleGenerate('mls')}
              disabled={isGenerating}
            >
              {isGenerating && currentLeague === 'mls' ? 'Procesando...' : 'Generar Pronósticos MLS'}
            </button>
            <button 
              className={`generate-btn ${isGenerating && currentLeague === 'ucl' ? 'loading' : ''}`} 
              onClick={() => handleGenerate('ucl')}
              disabled={isGenerating}
              style={{ background: 'linear-gradient(135deg, #0d1b2a, #1b263b)' }}
            >
              {isGenerating && currentLeague === 'ucl' ? 'Procesando...' : 'Generar Pronósticos Champions'}
            </button>
            <button 
              className="view-saved-btn" 
              onClick={() => setShowSaved(!showSaved)}
            >
              {showSaved ? 'Volver al Panel Principal' : 'Ver Historial de Apuestas'}
            </button>
          </div>
        </div>
      </header>

      {showSaved ? (
        <main className="dashboard">
          <SavedPicks />
        </main>
      ) : (
        dataGenerated && apiData && (
          <main className="dashboard">
            <div className="dashboard-grid">
              {currentLeague === 'mls' ? (
                <>
                  <MlsTable title="Conferencia Este" standings={apiData.eastern} league={currentLeague} />
                  <MlsTable title="Conferencia Oeste" standings={apiData.western} league={currentLeague} />
                </>
              ) : (
                <>
                  <MlsTable title={apiData.table1?.title || "Grupo A"} standings={apiData.table1?.standings || []} league={currentLeague} />
                  <MlsTable title={apiData.table2?.title || "Grupo B"} standings={apiData.table2?.standings || []} league={currentLeague} />
                </>
              )}
            </div>
            <div className="bottom-grid">
              <BettingPicks picks={apiData.picks} />
              <Chat />
            </div>
          </main>
        )
      )}
    </div>
  );
}

export default App;
