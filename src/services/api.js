import { easternConference, westernConference, bettingPicks as mockPicks } from '../data/mockData';

// Endpoint público de ESPN (no requiere API Key, gratis y siempre actualizado)
const ESPN_STANDINGS_URL = 'https://site.api.espn.com/apis/v2/sports/soccer/usa.1/standings';
const ESPN_SCOREBOARD_URL = 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard';

/**
 * Función matemática que calcula la probabilidad de que haya más de 1.5 goles en un partido.
 * Basado estrictamente en los goles a favor y en contra de los equipos. No usa IA.
 */
function calculateOver15GoalsProbability(teamA, teamB) {
  // Si los equipos no han jugado, asumimos una probabilidad neutral (50%)
  if (teamA.played === 0 || teamB.played === 0) return 50;

  // Promedio de goles marcados y recibidos por partido
  const teamAGoalsPerMatch = (teamA.goalsFor + teamA.goalsAgainst) / teamA.played;
  const teamBGoalsPerMatch = (teamB.goalsFor + teamB.goalsAgainst) / teamB.played;

  // Promedio combinado esperado para el partido
  const expectedGoals = (teamAGoalsPerMatch + teamBGoalsPerMatch) / 2;

  // Si se esperan 1.5 goles o más, le asignamos una probabilidad base alta
  // Esta es una fórmula matemática simple de ejemplo (normalizando a un % entre 0 y 100)
  let probability = (expectedGoals / 2.5) * 100;
  
  if (probability > 95) probability = 95; // Tope máximo de confianza realista
  if (probability < 50) probability = 50; // Tope mínimo

  return Math.round(probability);
}

/**
 * Intenta conectar con la API real. Si falla (por falta de API Key o error de red),
 * hace un "fallback" a los datos simulados (mockData) para que la app no se rompa.
 */
export async function fetchMlsData() {
  try {
    // Hacemos ambas llamadas a ESPN en paralelo
    const [standingsRes, fixturesRes] = await Promise.all([
      fetch(ESPN_STANDINGS_URL),
      fetch(ESPN_SCOREBOARD_URL)
    ]);

    if (!standingsRes.ok || !fixturesRes.ok) {
      throw new Error(`Error conectando a ESPN`);
    }

    const data = await standingsRes.json();
    const fixturesData = await fixturesRes.json();
    
    // Mapeo de la tabla de ESPN a nuestra estructura
    let eastern = [];
    let western = [];
    let allTeams = [];

    // Helper para extraer un stat específico de ESPN
    const getStat = (statsArray, statName) => {
      const stat = statsArray.find(s => s.name === statName);
      return stat ? stat.value : 0;
    };

    if (data.children) {
      data.children.forEach(conference => {
        const isWest = conference.name.includes("Western");
        const formattedConference = conference.standings.entries.map((entry, index) => ({
          rank: index + 1,
          team: entry.team.displayName,
          points: getStat(entry.stats, 'points'),
          played: getStat(entry.stats, 'gamesPlayed'),
          goalsFor: getStat(entry.stats, 'pointsFor'), // ESPN llama pointsFor a los goles a favor en soccer
          goalsAgainst: getStat(entry.stats, 'pointsAgainst'),
          difference: getStat(entry.stats, 'pointDifferential')
        }));

        if (isWest) {
          western = formattedConference;
        } else {
          eastern = formattedConference;
        }
        allTeams = [...allTeams, ...formattedConference];
      });
    }

    // Mapeo de Partidos de Hoy/Semana desde el Scoreboard de ESPN
    let picks = [];
    let pickId = 1;
    
    // Filtramos los eventos del scoreboard
    if (fixturesData.events && fixturesData.events.length > 0) {
      fixturesData.events.forEach(match => {
        // Filtrar partidos de ayer o antes
        if (match.date) {
          const matchDate = new Date(match.date);
          const todayStr = new Date().toLocaleDateString();
          if (matchDate < new Date() && matchDate.toLocaleDateString() !== todayStr) {
            return; // Saltar partidos viejos
          }
        }

        // En ESPN scoreboard, los competitors son los equipos (home y away)
        const team1 = match.competitions[0].competitors[0].team.displayName;
        const team2 = match.competitions[0].competitors[1].team.displayName;

        // Buscamos a los equipos en nuestra tabla mapeada
        const teamA = allTeams.find(t => t.team === team1 || team1.includes(t.team));
        const teamB = allTeams.find(t => t.team === team2 || team2.includes(t.team));
        
        if (teamA && teamB) {
          const probability = calculateOver15GoalsProbability(teamA, teamB);
          
          // Ya no filtramos por probabilidad para no ocultar partidos reales de hoy.
          // Mostramos la probabilidad real para que el usuario decida si vale la pena apostar.
          
          const score1 = parseInt(match.competitions[0].competitors[0].score || "0", 10);
          const score2 = parseInt(match.competitions[0].competitors[1].score || "0", 10);
          const totalGoals = score1 + score2;
          const matchState = match.status.type.state; // 'pre', 'in', 'post'
          const matchMinute = match.status.type.shortDetail; // e.g. "52'", "FT", "7:30 PM"

          let pickResult = 'pending'; // 'pending', 'win', 'loss'
          
          if (totalGoals >= 2) {
            pickResult = 'win'; // Ya acertó aunque no haya terminado
          } else if (matchState === 'post' && totalGoals < 2) {
            pickResult = 'loss'; // Terminó y no llegó a 2 goles
          }

          picks.push({
            id: pickId++,
            match: `${teamA.team} vs. ${teamB.team}`,
            pick: "Más de 1.5 Goles",
            probability: probability,
            odds: (1 + (100 - probability) / 100).toFixed(2),
            result: pickResult,
            liveScore: (matchState === 'in' || matchState === 'post') ? `(${score1} - ${score2})` : '',
            liveMinute: matchState === 'in' ? matchMinute : ''
          });
        }
      });
    }

    // Ordenar los picks de mayor a menor probabilidad y dejar solo los más seguros (máximo 6 para no saturar)
    picks = picks.sort((a, b) => b.probability - a.probability).slice(0, 6);

    if (picks.length === 0) {
      picks.push({
        id: pickId++,
        match: "No hay partidos programados para hoy",
        pick: "Vuelve más tarde",
        probability: 0,
        odds: "-",
        result: 'pending',
        liveScore: '',
        liveMinute: ''
      });
    }
    
    return {
      eastern: eastern.length > 0 ? eastern : easternConference,
      western: western.length > 0 ? western : westernConference,
      picks: picks
    };

  } catch (error) {
    console.error("Error al conectar con ESPN:", error);
    // Fallback a los datos simulados en caso de error
    return {
      eastern: easternConference,
      western: westernConference,
      picks: mockPicks
    };
  }
}

// --- Nuevo Fetch para Champions League ---
export async function fetchChampionsLeagueData() {
  const ESPN_UCL_STANDINGS = 'https://site.api.espn.com/apis/v2/sports/soccer/uefa.champions/standings';
  const ESPN_UCL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/soccer/uefa.champions/scoreboard';

  try {
    const [standingsRes, fixturesRes] = await Promise.all([
      fetch(ESPN_UCL_STANDINGS),
      fetch(ESPN_UCL_SCOREBOARD)
    ]);

    if (!standingsRes.ok || !fixturesRes.ok) {
      throw new Error(`Error conectando a ESPN UCL`);
    }

    const data = await standingsRes.json();
    const fixturesData = await fixturesRes.json();
    
    let tables = [];
    let allTeams = [];

    const getStat = (statsArray, statName, altStatName) => {
      const stat = statsArray.find(s => s.name === statName || s.name === altStatName);
      return stat ? stat.value : 0;
    };

    const processStandings = (entries, name) => {
      return entries.map((entry, index) => ({
        rank: index + 1,
        team: entry.team.displayName,
        points: getStat(entry.stats, 'points'),
        played: getStat(entry.stats, 'gamesPlayed'),
        goalsFor: getStat(entry.stats, 'pointsFor', 'goalsFor'),
        goalsAgainst: getStat(entry.stats, 'pointsAgainst', 'goalsAgainst'),
        difference: getStat(entry.stats, 'pointDifferential', 'goalDifference')
      }));
    };

    if (data.children && data.children.length > 0) {
      data.children.forEach(group => {
        const formattedGroup = processStandings(group.standings.entries, group.name);
        tables.push({ title: group.name, standings: formattedGroup });
        allTeams = [...allTeams, ...formattedGroup];
      });
    } else if (data.standings && data.standings.entries) {
      const formattedGroup = processStandings(data.standings.entries, data.name || "Fase de Liga");
      tables.push({ title: data.name || "Fase de Liga", standings: formattedGroup });
      allTeams = [...allTeams, ...formattedGroup];
    }

    let finalTables = [];
    if (tables.length === 1 && tables[0].standings.length > 18) {
      const mid = Math.ceil(tables[0].standings.length / 2);
      finalTables.push({ title: "Fase de Liga (Top)", standings: tables[0].standings.slice(0, mid) });
      finalTables.push({ title: "Fase de Liga (Bottom)", standings: tables[0].standings.slice(mid) });
    } else {
      if (tables.length > 2) {
         finalTables = tables.slice(0, 2); 
      } else {
         finalTables = tables;
      }
    }

    let picks = [];
    let pickId = 1;
    
    if (fixturesData.events && fixturesData.events.length > 0) {
      fixturesData.events.forEach(match => {
        // Filtrar partidos de ayer o antes
        if (match.date) {
          const matchDate = new Date(match.date);
          const todayStr = new Date().toLocaleDateString();
          if (matchDate < new Date() && matchDate.toLocaleDateString() !== todayStr) {
            return; // Saltar partidos viejos
          }
        }

        const team1 = match.competitions[0].competitors[0].team.displayName;
        const team2 = match.competitions[0].competitors[1].team.displayName;

        const teamA = allTeams.find(t => t.team === team1 || team1.includes(t.team));
        const teamB = allTeams.find(t => t.team === team2 || team2.includes(t.team));
        
        if (teamA && teamB) {
          const probability = calculateOver15GoalsProbability(teamA, teamB);
          
          // Igual que en la MLS, no ocultamos partidos reales.
          const score1 = parseInt(match.competitions[0].competitors[0].score || "0", 10);
          const score2 = parseInt(match.competitions[0].competitors[1].score || "0", 10);
          const totalGoals = score1 + score2;
          const matchState = match.status.type.state;
          const matchMinute = match.status.type.shortDetail;

          let pickResult = 'pending';
          if (totalGoals >= 2) {
            pickResult = 'win';
          } else if (matchState === 'post' && totalGoals < 2) {
            pickResult = 'loss';
          }

          picks.push({
            id: pickId++,
            match: `${teamA.team} vs. ${teamB.team}`,
            pick: "Más de 1.5 Goles",
            probability: probability,
            odds: (1 + (100 - probability) / 100).toFixed(2),
            result: pickResult,
            liveScore: (matchState === 'in' || matchState === 'post') ? `(${score1} - ${score2})` : '',
            liveMinute: matchState === 'in' ? matchMinute : ''
          });
        }
      });
    }

    picks = picks.sort((a, b) => b.probability - a.probability).slice(0, 6);

    if (picks.length === 0) {
      // En lugar de generar partidos falsos cruzando tablas, simplemente devolvemos un mensaje
      picks.push({
        id: pickId++,
        match: "No hay partidos próximos o el filtro los descartó",
        pick: "Vuelve más tarde",
        probability: 0,
        odds: "-",
        result: 'pending',
        liveScore: '',
        liveMinute: ''
      });
    }
    
    return {
      table1: finalTables[0] || { title: "Grupo A", standings: [] },
      table2: finalTables[1] || { title: "Grupo B", standings: [] },
      picks: picks
    };

  } catch (error) {
    console.error("Error al conectar con ESPN UCL:", error);
    return {
      table1: { title: "Champions League", standings: [] },
      table2: { title: "Champions League", standings: [] },
      picks: []
    };
  }
}
