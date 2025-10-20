// Enhanced multiplayer Tic-Tac-Toe WebSocket server
// Handles multiple simultaneous games with proper state management
// Run with: bun mock-nakama-server.ts
import { WebSocketServer } from 'ws';
import { writeFileSync, readFileSync, existsSync } from 'fs';

interface Match {
  id: string;
  players: string[]; // connection ids
  board: ("X" | "O" | null)[];
  turn: "X" | "O";
  symbols: Record<string, "X" | "O">;
  winner: "X" | "O" | "draw" | null;
  createdAt: number;
}

interface Player {
  id: string;
  username: string;
  ws: any;
  currentMatch?: string;
}

interface Stats {
  username: string;
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
}

const STATS_FILE = './game-stats.json';
const PORT = parseInt(process.env.PORT || '7350');

const wss = new WebSocketServer({ port: PORT });
console.log(`[game-server] WebSocket server listening on ws://localhost:${PORT}/ws`);

const matchmakingQueue: Player[] = [];
const matches: Record<string, Match> = {};
const players: Record<string, Player> = {};

// Load persistent stats
function loadStats(): Record<string, Stats> {
  if (existsSync(STATS_FILE)) {
    try {
      const data = readFileSync(STATS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[game-server] Error loading stats:', error);
    }
  }
  return {};
}

// Save stats to file
function saveStats(stats: Record<string, Stats>) {
  try {
    writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
  } catch (error) {
    console.error('[game-server] Error saving stats:', error);
  }
}

const stats = loadStats();

// Utility functions
function broadcast(match: Match, payload: any) {
  match.players.forEach((pid) => {
    const player = players[pid];
    if (player && player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(payload));
    }
  });
}

function calcWinner(board: ("X" | "O" | null)[]): "X" | "O" | "draw" | null {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(cell => cell !== null)) return 'draw';
  return null;
}

function getOrCreatePlayerStats(username: string): Stats {
  if (!stats[username]) {
    stats[username] = {
      username,
      wins: 0,
      losses: 0,
      draws: 0,
      gamesPlayed: 0
    };
  }
  return stats[username];
}

function updatePlayerStats(username: string, result: 'win' | 'loss' | 'draw') {
  const playerStats = getOrCreatePlayerStats(username);
  playerStats.gamesPlayed++;
  
  switch (result) {
    case 'win':
      playerStats.wins++;
      break;
    case 'loss':
      playerStats.losses++;
      break;
    case 'draw':
      playerStats.draws++;
      break;
  }
  
  saveStats(stats);
}

function buildLeaderboard() {
  return Object.values(stats)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .map((stat, index) => ({
      username: stat.username,
      wins: stat.wins,
      losses: stat.losses,
      rank: index + 1
    }));
}

function createMatch(player1: Player, player2: Player): Match {
  const matchId = `match_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  const match: Match = {
    id: matchId,
    players: [player1.id, player2.id],
    board: Array(9).fill(null),
    turn: 'X',
    symbols: { [player1.id]: 'X', [player2.id]: 'O' },
    winner: null,
    createdAt: Date.now()
  };
  
  matches[matchId] = match;
  
  // Update player current match
  player1.currentMatch = matchId;
  player2.currentMatch = matchId;
  
  // Notify both players
  [player1, player2].forEach((player) => {
    const sym = match.symbols[player.id];
    const opponent = player.id === player1.id ? player2 : player1;
    
    player.ws.send(JSON.stringify({
      type: 'match_found',
      data: { 
        matchId, 
        playerSymbol: sym, 
        opponentId: opponent.id 
      }
    }));
  });
  
  console.log(`[game-server] Created match ${matchId} between ${player1.username} and ${player2.username}`);
  return match;
}

// WebSocket connection handler
wss.on('connection', (ws: any) => {
  const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  console.log(`[game-server] Player connected: ${playerId}`);

  ws.on('message', (raw: any) => {
    let msg: any;
    try { 
      msg = JSON.parse(raw.toString()); 
    } catch (error) { 
      console.error('[game-server] Invalid message format:', error);
      return; 
    }

    switch (msg.type) {
      case 'authenticate': {
        const username = msg.data?.username || `Player_${playerId.slice(-6)}`;
        
        players[playerId] = {
          id: playerId,
          username,
          ws
        };
        
        console.log(`[game-server] Player authenticated: ${username} (${playerId})`);
        
        // Send initial leaderboard
        ws.send(JSON.stringify({ 
          type: 'leaderboard_update', 
          data: { entries: buildLeaderboard() } 
        }));
        break;
      }
      
      case 'start_matchmaking': {
        const player = players[playerId];
        if (!player) {
          console.error(`[game-server] Player not found: ${playerId}`);
          return;
        }
        
        // Check if already in queue
        if (matchmakingQueue.find(p => p.id === playerId)) {
          console.log(`[game-server] Player ${player.username} already in matchmaking queue`);
          return;
        }
        
        // Add to queue
        matchmakingQueue.push(player);
        console.log(`[game-server] Added ${player.username} to matchmaking queue (${matchmakingQueue.length} players)`);
        
        // Try to match players
        if (matchmakingQueue.length >= 2) {
          const player1 = matchmakingQueue.shift()!;
          const player2 = matchmakingQueue.shift()!;
          
          createMatch(player1, player2);
        }
        break;
      }
      
      case 'cancel_matchmaking': {
        const queueIndex = matchmakingQueue.findIndex(p => p.id === playerId);
        if (queueIndex !== -1) {
          const player = matchmakingQueue.splice(queueIndex, 1)[0];
          console.log(`[game-server] Removed ${player.username} from matchmaking queue`);
        }
        break;
      }
      
      case 'make_move': {
        const { matchId, cellIndex } = msg.data || {};
        const match = matches[matchId];
        const player = players[playerId];
        
        if (!match || !player) {
          console.error(`[game-server] Invalid move: match=${!!match}, player=${!!player}`);
          return;
        }
        
        const playerSymbol = match.symbols[playerId];
        if (!playerSymbol || match.winner) {
          console.log(`[game-server] Move rejected: no symbol or game over`);
          return;
        }
        
        if (match.turn !== playerSymbol) {
          console.log(`[game-server] Move rejected: not player's turn`);
          return;
        }
        
        if (match.board[cellIndex] !== null) {
          console.log(`[game-server] Move rejected: cell occupied`);
          return;
        }
        
        // Make the move
        match.board[cellIndex] = playerSymbol;
        match.turn = playerSymbol === 'X' ? 'O' : 'X';
        
        console.log(`[game-server] Move made by ${player.username}: ${playerSymbol} at ${cellIndex}`);
        
        const winner = calcWinner(match.board);
        if (winner) {
          match.winner = winner;
          broadcast(match, { type: 'game_end', data: { winner, board: match.board } });
          
          // Update player statistics
          match.players.forEach(pid => {
            const p = players[pid];
            if (p) {
              const pSymbol = match.symbols[pid];
              if (winner === 'draw') {
                updatePlayerStats(p.username, 'draw');
              } else if (pSymbol === winner) {
                updatePlayerStats(p.username, 'win');
              } else {
                updatePlayerStats(p.username, 'loss');
              }
              p.currentMatch = undefined;
            }
          });
          
          // Send updated leaderboard
          const leaderboard = buildLeaderboard();
          broadcast(match, { type: 'leaderboard_update', data: { entries: leaderboard } });
          
          console.log(`[game-server] Match ${matchId} ended: ${winner}`);
        } else {
          broadcast(match, { type: 'game_update', data: { board: match.board, currentTurn: match.turn } });
        }
        break;
      }
      
      case 'leave_match': {
        const { matchId } = msg.data || {};
        const match = matches[matchId];
        const player = players[playerId];
        
        if (match && player) {
          // Notify other player and clean up
          match.players.forEach(pid => {
            const p = players[pid];
            if (p && p.id !== playerId) {
              p.ws.send(JSON.stringify({ type: 'opponent_left' }));
              p.currentMatch = undefined;
            }
          });
          
          delete matches[matchId];
          player.currentMatch = undefined;
          console.log(`[game-server] Player ${player.username} left match ${matchId}`);
        }
        break;
      }
      
      case 'get_leaderboard': {
        ws.send(JSON.stringify({ 
          type: 'leaderboard_update', 
          data: { entries: buildLeaderboard() } 
        }));
        break;
      }
      
      default:
        console.log(`[game-server] Unknown message type: ${msg.type}`);
    }
  });

  ws.on('close', () => {
    const player = players[playerId];
    if (player) {
      console.log(`[game-server] Player disconnected: ${player.username} (${playerId})`);
      
      // Remove from matchmaking queue
      const queueIndex = matchmakingQueue.findIndex(p => p.id === playerId);
      if (queueIndex !== -1) {
        matchmakingQueue.splice(queueIndex, 1);
      }
      
      // Handle active match
      if (player.currentMatch) {
        const match = matches[player.currentMatch];
        if (match) {
          // Notify other player
          match.players.forEach(pid => {
            const p = players[pid];
            if (p && p.id !== playerId) {
              p.ws.send(JSON.stringify({ type: 'opponent_disconnected' }));
              p.currentMatch = undefined;
            }
          });
          
          delete matches[player.currentMatch];
        }
      }
      
      delete players[playerId];
    }
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down mock server...');
  wss.close();
  process.exit(0);
});
