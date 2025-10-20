// Production WebSocket server for Tic-Tac-Toe Arena
// Deployed on Railway with PostgreSQL database
import { WebSocketServer } from 'ws';
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        draws INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_history (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(100) NOT NULL,
        player1_username VARCHAR(50) NOT NULL,
        player2_username VARCHAR(50) NOT NULL,
        winner VARCHAR(50), -- 'X', 'O', or 'draw'
        board TEXT NOT NULL, -- JSON string of final board state
        moves_count INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[db] Database tables initialized');
  } catch (error) {
    console.error('[db] Error initializing database:', error);
  }
}

// Server configuration
const PORT = parseInt(process.env.PORT || '7350');
const wss = new WebSocketServer({ port: PORT });

console.log(`[server] WebSocket server listening on port ${PORT}`);
console.log(`[server] Environment: ${process.env.NODE_ENV || 'development'}`);

// Game state management
const matchmakingQueue = [];
const matches = new Map();
const players = new Map();

// Database operations
async function getOrCreatePlayer(username) {
  try {
    // Try to get existing player
    let result = await pool.query(
      'SELECT * FROM players WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      // Create new player
      result = await pool.query(
        'INSERT INTO players (username) VALUES ($1) RETURNING *',
        [username]
      );
    } else {
      // Update last active
      await pool.query(
        'UPDATE players SET last_active = CURRENT_TIMESTAMP WHERE username = $1',
        [username]
      );
    }

    return result.rows[0];
  } catch (error) {
    console.error('[db] Error with player:', error);
    return null;
  }
}

async function updatePlayerStats(username, result) {
  try {
    const updateField = result === 'win' ? 'wins = wins + 1' :
                       result === 'loss' ? 'losses = losses + 1' :
                       'draws = draws + 1';

    await pool.query(`
      UPDATE players 
      SET ${updateField}, games_played = games_played + 1, last_active = CURRENT_TIMESTAMP
      WHERE username = $1
    `, [username]);

    console.log(`[db] Updated ${username}: ${result}`);
  } catch (error) {
    console.error('[db] Error updating player stats:', error);
  }
}

async function saveGameHistory(matchData) {
  try {
    await pool.query(`
      INSERT INTO game_history (match_id, player1_username, player2_username, winner, board, moves_count)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      matchData.matchId,
      matchData.player1,
      matchData.player2,
      matchData.winner,
      JSON.stringify(matchData.board),
      matchData.movesCount
    ]);

    console.log(`[db] Saved game history for match ${matchData.matchId}`);
  } catch (error) {
    console.error('[db] Error saving game history:', error);
  }
}

async function getLeaderboard() {
  try {
    const result = await pool.query(`
      SELECT username, wins, losses, draws, games_played,
             ROW_NUMBER() OVER (ORDER BY wins DESC, losses ASC, games_played DESC) as rank
      FROM players 
      WHERE games_played > 0 
      ORDER BY wins DESC, losses ASC, games_played DESC 
      LIMIT 50
    `);

    return result.rows.map(row => ({
      username: row.username,
      wins: row.wins,
      losses: row.losses,
      rank: row.rank
    }));
  } catch (error) {
    console.error('[db] Error getting leaderboard:', error);
    return [];
  }
}

// Game logic functions
function checkWinner(board) {
  const winPatterns = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell !== null)) return 'draw';
  return null;
}

function broadcast(match, payload) {
  match.players.forEach(playerId => {
    const player = players.get(playerId);
    if (player && player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(payload));
    }
  });
}

function createMatch(player1, player2) {
  const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const match = {
    id: matchId,
    players: [player1.id, player2.id],
    board: Array(9).fill(null),
    turn: 'X',
    symbols: { [player1.id]: 'X', [player2.id]: 'O' },
    winner: null,
    createdAt: Date.now(),
    movesCount: 0
  };
  
  matches.set(matchId, match);
  
  player1.currentMatch = matchId;
  player2.currentMatch = matchId;
  
  [player1, player2].forEach(player => {
    const symbol = match.symbols[player.id];
    const opponent = player.id === player1.id ? player2 : player1;
    
    player.ws.send(JSON.stringify({
      type: 'match_found',
      data: { 
        matchId, 
        playerSymbol: symbol, 
        opponentId: opponent.id 
      }
    }));
  });
  
  console.log(`[game] Created match ${matchId} between ${player1.username} and ${player2.username}`);
  return match;
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  console.log(`[server] Player connected: ${playerId}`);

  ws.on('message', async (raw) => {
    let msg;
    try { 
      msg = JSON.parse(raw.toString()); 
    } catch (error) { 
      console.error('[server] Invalid message format:', error);
      return; 
    }

    switch (msg.type) {
      case 'authenticate': {
        const username = msg.data?.username || `Player_${playerId.slice(-6)}`;
        
        const playerData = await getOrCreatePlayer(username);
        if (!playerData) {
          ws.send(JSON.stringify({ type: 'error', message: 'Failed to authenticate' }));
          return;
        }

        players.set(playerId, {
          id: playerId,
          username: playerData.username,
          ws
        });
        
        console.log(`[server] Player authenticated: ${playerData.username} (${playerId})`);
        
        // Send initial leaderboard
        const leaderboard = await getLeaderboard();
        ws.send(JSON.stringify({ 
          type: 'leaderboard_update', 
          data: { entries: leaderboard } 
        }));
        break;
      }
      
      case 'start_matchmaking': {
        const player = players.get(playerId);
        if (!player) return;
        
        if (matchmakingQueue.find(p => p.id === playerId)) return;
        
        matchmakingQueue.push(player);
        console.log(`[matchmaking] Added ${player.username} to queue (${matchmakingQueue.length} players)`);
        
        if (matchmakingQueue.length >= 2) {
          const player1 = matchmakingQueue.shift();
          const player2 = matchmakingQueue.shift();
          createMatch(player1, player2);
        }
        break;
      }
      
      case 'cancel_matchmaking': {
        const queueIndex = matchmakingQueue.findIndex(p => p.id === playerId);
        if (queueIndex !== -1) {
          const player = matchmakingQueue.splice(queueIndex, 1)[0];
          console.log(`[matchmaking] Removed ${player.username} from queue`);
        }
        break;
      }
      
      case 'make_move': {
        const { matchId, cellIndex } = msg.data || {};
        const match = matches.get(matchId);
        const player = players.get(playerId);
        
        if (!match || !player) return;
        
        const playerSymbol = match.symbols[playerId];
        if (!playerSymbol || match.winner || match.turn !== playerSymbol) return;
        if (match.board[cellIndex] !== null) return;
        
        // Make the move
        match.board[cellIndex] = playerSymbol;
        match.turn = playerSymbol === 'X' ? 'O' : 'X';
        match.movesCount++;
        
        console.log(`[game] Move by ${player.username}: ${playerSymbol} at ${cellIndex}`);
        
        const winner = checkWinner(match.board);
        if (winner) {
          match.winner = winner;
          broadcast(match, { type: 'game_end', data: { winner, board: match.board } });
          
          // Update player statistics and save game history
          const player1 = players.get(match.players[0]);
          const player2 = players.get(match.players[1]);
          
          if (player1 && player2) {
            const gameData = {
              matchId: match.id,
              player1: player1.username,
              player2: player2.username,
              winner: winner === 'draw' ? 'draw' : winner,
              board: match.board,
              movesCount: match.movesCount
            };
            
            await saveGameHistory(gameData);
            
            // Update player stats
            if (winner === 'draw') {
              await updatePlayerStats(player1.username, 'draw');
              await updatePlayerStats(player2.username, 'draw');
            } else {
              const winnerSymbol = winner;
              const player1Symbol = match.symbols[player1.id];
              const player2Symbol = match.symbols[player2.id];
              
              if (player1Symbol === winnerSymbol) {
                await updatePlayerStats(player1.username, 'win');
                await updatePlayerStats(player2.username, 'loss');
              } else {
                await updatePlayerStats(player1.username, 'loss');
                await updatePlayerStats(player2.username, 'win');
              }
            }
            
            // Clear current matches
            player1.currentMatch = undefined;
            player2.currentMatch = undefined;
          }
          
          // Send updated leaderboard
          const leaderboard = await getLeaderboard();
          broadcast(match, { type: 'leaderboard_update', data: { entries: leaderboard } });
          
          matches.delete(matchId);
        } else {
          broadcast(match, { type: 'game_update', data: { board: match.board, currentTurn: match.turn } });
        }
        break;
      }
      
      case 'leave_match': {
        const { matchId } = msg.data || {};
        const match = matches.get(matchId);
        const player = players.get(playerId);
        
        if (match && player) {
          match.players.forEach(pid => {
            const p = players.get(pid);
            if (p && p.id !== playerId) {
              p.ws.send(JSON.stringify({ type: 'opponent_left' }));
              p.currentMatch = undefined;
            }
          });
          
          matches.delete(matchId);
          player.currentMatch = undefined;
        }
        break;
      }
      
      case 'get_leaderboard': {
        const leaderboard = await getLeaderboard();
        ws.send(JSON.stringify({ 
          type: 'leaderboard_update', 
          data: { entries: leaderboard } 
        }));
        break;
      }
    }
  });

  ws.on('close', () => {
    const player = players.get(playerId);
    if (player) {
      console.log(`[server] Player disconnected: ${player.username}`);
      
      // Remove from matchmaking queue
      const queueIndex = matchmakingQueue.findIndex(p => p.id === playerId);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }
      
      // Handle active match
      if (player.currentMatch) {
        const match = matches.get(player.currentMatch);
        if (match) {
          match.players.forEach(pid => {
            const p = players.get(pid);
            if (p && p.id !== playerId) {
              p.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
              p.currentMatch = undefined;
            }
          });
          matches.delete(player.currentMatch);
        }
      }
      
      players.delete(playerId);
    }
  });
});

// Health check endpoint for Railway
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      players: players.size,
      matches: matches.size,
      queue: matchmakingQueue.length 
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const httpPort = PORT + 1;
server.listen(httpPort, () => {
  console.log(`[http] Health check server on port ${httpPort}`);
});

// Initialize database on startup
initDatabase().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[server] Graceful shutdown...');
  await pool.end();
  process.exit(0);
});