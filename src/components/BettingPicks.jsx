import React from 'react';

const BettingPicks = ({ picks }) => {
  return (
    <div className="picks-container fade-in">
      <h2>🔥 Mejores Pronósticos de Hoy (Más de 1.5 Goles)</h2>
      
      <div className="info-banner" style={{
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderLeft: '4px solid #38bdf8',
        padding: '1rem',
        margin: '1rem 0',
        borderRadius: '0 8px 8px 0',
        fontSize: '0.9rem',
        color: '#e2e8f0'
      }}>
        💡 <strong>Guía de Probabilidades:</strong> Si ves un partido con <strong>90% o más</strong>, es un pronóstico muy sólido. Si ves uno cercano al <strong>50%</strong>, es mejor que lo ignores o no lo incluyas en tus combinadas, porque hay un alto riesgo de fallar.
      </div>

      {picks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
          <p>⚽ No hay partidos con datos disponibles para mostrar.</p>
        </div>
      ) : (
        <div className="picks-grid">
        {picks.map((pick) => (
          <div className="pick-card" key={pick.id}>
            <div className="pick-header">
              <div className="match-name">
                {pick.match} 
                {pick.liveScore && <span style={{color: '#94a3b8', fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '6px'}}>{pick.liveScore}</span>}
                {pick.liveMinute && <span style={{color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem', marginLeft: '6px', animation: 'pulse 2s infinite'}}>{pick.liveMinute}</span>}
                {pick.result === 'win' && <span style={{marginLeft: '8px'}} title="¡Acertada!">✅</span>}
                {pick.result === 'loss' && <span style={{marginLeft: '8px'}} title="Fallada">❌</span>}
              </div>
              <span className="odds">Cuota: {pick.odds}</span>
            </div>
            <div className="pick-body">
              <div className="prediction">
                <span>Pronóstico:</span>
                <strong>{pick.pick}</strong>
              </div>
              <div className="probability-container">
                <div className="prob-text">Probabilidad: {pick.probability}%</div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${pick.probability}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default BettingPicks;
