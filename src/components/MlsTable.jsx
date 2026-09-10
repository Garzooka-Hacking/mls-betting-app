import React from 'react';

const MlsTable = ({ title, standings = [], league = 'mls' }) => {
  const getRowClass = (rank) => {
    if (league === 'ucl') {
      if (rank <= 8) return 'qualify-direct';
      if (rank <= 24) return 'qualify-playoff';
      return 'eliminated';
    } else {
      if (rank <= 7) return 'qualify-direct';
      if (rank <= 9) return 'qualify-playoff';
      return 'eliminated';
    }
  };

  return (
    <div className="table-container fade-in">
      <h2>🏆 {title}</h2>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Equipo</th>
              <th>PTS</th>
              <th>PJ</th>
              <th>GF</th>
              <th>GC</th>
              <th>DIF</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((team) => (
              <tr key={team.rank} className={getRowClass(team.rank)}>
                <td>{team.rank}</td>
                <td className="team-name">{team.team}</td>
                <td className="points">{team.points}</td>
                <td>{team.played}</td>
                <td>{team.goalsFor}</td>
                <td>{team.goalsAgainst}</td>
                <td>{team.difference > 0 ? `+${team.difference}` : team.difference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MlsTable;
