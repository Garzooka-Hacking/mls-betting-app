import React, { useState, useEffect } from 'react';
import MlsTable from './components/MlsTable';
import BettingPicks from './components/BettingPicks';
import SavedPicks from './components/SavedPicks';
import { fetchMlsData, fetchChampionsLeagueData } from './services/api';
import { savePicksToHistory } from './services/storage';
import AuthModal from './components/AuthModal';
import EditProfileModal from './components/EditProfileModal';
import Chat from './components/Chat';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './index.css';

function App() {
  const [dataGenerated, setDataGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const [currentLeague, setCurrentLeague] = useState('mls');
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleGenerate = async (league = 'mls') => {
    setIsGenerating(true);
    setCurrentLeague(league);
    setApiData(null); // Limpiamos los datos anteriores para evitar choques de estructura
    
    // Llamada a la API correspondiente
    const data = league === 'mls' ? await fetchMlsData() : await fetchChampionsLeagueData();
    
    setApiData(data);
    setDataGenerated(true);
    setShowSaved(false); // Volver al dashboard principal al generar
    
    // Auto-guardado en Firestore si el usuario está autenticado
    if (data && data.picks && data.picks.length > 0 && auth.currentUser) {
      savePicksToHistory(data.picks, auth.currentUser.uid);
    }

    setIsGenerating(false);
  };

  useEffect(() => {
    // Generar y guardar automáticamente al iniciar la app
    handleGenerate('mls');

    // --- PROTECCIÓN ANTI-COPIA ---
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Prevenir F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+C, Ctrl+A
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || 
        (e.ctrlKey && (e.keyCode === 85 || e.keyCode === 67 || e.keyCode === 65))
      ) {
        e.preventDefault();
      }
    };
    const handleDragStart = (e) => e.preventDefault();

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // Auto-refrescar en segundo plano cada 60 segundos
  useEffect(() => {
    let interval;
    if (dataGenerated) {
      interval = setInterval(async () => {
        const newData = currentLeague === 'mls' ? await fetchMlsData() : await fetchChampionsLeagueData();
        setApiData(newData);
        if (newData && newData.picks && newData.picks.length > 0 && auth.currentUser) {
          savePicksToHistory(newData.picks, auth.currentUser.uid);
        }
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [dataGenerated, currentLeague]);

  return (
    <div className="app-container">
      <header className="hero-header" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
          {user ? (
            <>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 'bold' }}>
                👤 {user.email ? user.email.split('@')[0] : 'Usuario'}
              </span>
              <button 
                onClick={() => setShowEditProfileModal(true)}
                style={{ background: 'transparent', border: '1px solid #3b82f6', color: '#3b82f6', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.3s ease' }}
                onMouseEnter={(e) => { e.target.style.background = '#3b82f6'; e.target.style.color = 'white'; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#3b82f6'; }}
              >
                Editar Perfil
              </button>
              <button className="logout-btn" onClick={() => signOut(auth)}>Cerrar Sesión</button>
            </>
          ) : (
            <button className="login-btn" onClick={() => setShowAuthModal(true)}>Iniciar Sesión</button>
          )}
        </div>
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
              onClick={() => {
                if (!user) {
                  setShowAuthModal(true);
                } else {
                  setShowSaved(!showSaved);
                }
              }}
            >
              {showSaved ? 'Volver al Panel Principal' : 'Ver Historial de Apuestas'}
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout">
        <div className="content-area">
          {showSaved ? (
            <SavedPicks user={user} />
          ) : (
            dataGenerated && apiData ? (
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
            ) : (
              <div className="empty-state" style={{ minHeight: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                {/* Espacio vacío para mantener el layout antes de generar pronósticos */}
                Haz clic en "Generar Pronósticos" para ver las tablas aquí.
              </div>
            )
          )}
        </div>

        {/* Panel lateral del Chat Global (siempre presente para no pausar la radio) */}
        <aside className="chat-sidebar">
          <Chat user={user} />
        </aside>
      </div>

      {/* Los pronósticos van DEBAJO del layout principal para no estirar el chat */}
      {!showSaved && dataGenerated && apiData && (
        <div className="bottom-grid" style={{ marginTop: '2rem' }}>
          <BettingPicks picks={apiData.picks} />
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
      {showEditProfileModal && <EditProfileModal onClose={() => setShowEditProfileModal(false)} />}
    </div>
  );
}

export default App;
