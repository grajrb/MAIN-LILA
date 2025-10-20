import { useState, useEffect, useCallback, useRef } from 'react';
import { TicTacToeAI, type Difficulty } from '@/lib/ai';

export type GameState = 'X' | 'O' | null;
export type Board = GameState[];
export type GameMode = 'multiplayer' | 'single-player' | 'computer';

export interface GameMatch {
  matchId: string;
  board: Board;
  currentTurn: 'X' | 'O';
  playerSymbol: 'X' | 'O';
  opponentId: string | null;
  winner: 'X' | 'O' | 'draw' | null;
  isMyTurn: boolean;
  mode: GameMode;
  difficulty?: Difficulty;
}

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  rank: number;
}

export const useGame = () => {
  const [connected, setConnected] = useState(false);
  const [matchmaking, setMatchmaking] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<GameMatch | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const aiRef = useRef<TicTacToeAI | null>(null);

  useEffect(() => {
    // Connect to WebSocket server for multiplayer
    const connectWebSocket = () => {
      try {
        // Allow overriding server URL via env with fallback to local mock
        const serverUrl = (import.meta as any).env?.VITE_NAKAMA_WS_URL || 'ws://localhost:7350/ws';
        const ws = new WebSocket(serverUrl);
        
        ws.onopen = () => {
          console.log('Connected to game server');
          setConnected(true);
          
          // Authenticate
          const authPayload = {
            type: 'authenticate',
            data: {
              username: `Player_${Math.random().toString(36).substring(7)}`,
            }
          };
          ws.send(JSON.stringify(authPayload));
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);
          console.log('Received message:', message);

          switch (message.type) {
            case 'match_found':
              handleMatchFound(message.data);
              break;
            case 'game_update':
              handleGameUpdate(message.data);
              break;
            case 'game_end':
              handleGameEnd(message.data);
              break;
            case 'leaderboard_update':
              setLeaderboard(message.data.entries);
              break;
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnected(false);
        };

        ws.onclose = () => {
          console.log('Disconnected from game server');
          setConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect to game server:', error);
        setConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleMatchFound = (data: any) => {
    console.log('Match found:', data);
    setMatchmaking(false);
    matchIdRef.current = data.matchId;
    
    setCurrentMatch({
      matchId: data.matchId,
      board: Array(9).fill(null),
      currentTurn: 'X',
      playerSymbol: data.playerSymbol,
      opponentId: data.opponentId,
      winner: null,
      isMyTurn: data.playerSymbol === 'X',
      mode: 'multiplayer',
    });
  };

  const handleGameUpdate = (data: any) => {
    console.log('Game update:', data);
    setCurrentMatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        board: data.board,
        currentTurn: data.currentTurn,
        isMyTurn: data.currentTurn === prev.playerSymbol && prev.mode === 'multiplayer',
      };
    });
  };

  const handleGameEnd = (data: any) => {
    console.log('Game ended:', data);
    setCurrentMatch(prev => {
      if (!prev) return null;
      return {
        ...prev,
        winner: data.winner,
        board: data.board,
        isMyTurn: false,
      };
    });
  };

  // Check for winner locally
  const checkWinner = useCallback((board: Board): GameState => {
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

    if (board.every(cell => cell !== null)) {
      return 'draw' as any;
    }

    return null;
  }, []);

  // Start different game modes
  const startGame = useCallback((mode: GameMode, difficulty?: Difficulty) => {
    switch (mode) {
      case 'multiplayer':
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.error('WebSocket not connected');
          return;
        }
        setMatchmaking(true);
        const payload = {
          type: 'start_matchmaking',
          data: {}
        };
        wsRef.current.send(JSON.stringify(payload));
        break;
        
      case 'computer':
        if (difficulty) {
          aiRef.current = new TicTacToeAI(difficulty);
        }
        setCurrentMatch({
          matchId: `ai_${Date.now()}`,
          board: Array(9).fill(null),
          currentTurn: 'X',
          playerSymbol: 'X',
          opponentId: 'AI',
          winner: null,
          isMyTurn: true,
          mode: 'computer',
          difficulty,
        });
        break;
        
      case 'single-player':
        setCurrentMatch({
          matchId: `local_${Date.now()}`,
          board: Array(9).fill(null),
          currentTurn: 'X',
          playerSymbol: 'X',
          opponentId: null,
          winner: null,
          isMyTurn: true,
          mode: 'single-player',
        });
        break;
    }
  }, []);

  const cancelMatchmaking = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    setMatchmaking(false);
    const payload = {
      type: 'cancel_matchmaking',
      data: {}
    };
    wsRef.current.send(JSON.stringify(payload));
  }, []);

  const makeMove = useCallback((cellIndex: number) => {
    if (!currentMatch || currentMatch.winner) {
      return;
    }

    if (currentMatch.board[cellIndex] !== null) {
      console.log('Cell already occupied');
      return;
    }

    const newBoard = [...currentMatch.board];
    
    switch (currentMatch.mode) {
      case 'multiplayer':
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.error('WebSocket not connected');
          return;
        }

        if (!currentMatch.isMyTurn) {
          console.log('Not your turn');
          return;
        }

        const payload = {
          type: 'make_move',
          data: {
            matchId: currentMatch.matchId,
            cellIndex,
          }
        };
        
        console.log('Making move:', payload);
        wsRef.current.send(JSON.stringify(payload));
        break;
        
      case 'single-player':
        newBoard[cellIndex] = currentMatch.currentTurn;
        const nextTurn = currentMatch.currentTurn === 'X' ? 'O' : 'X';
        const gameWinner = checkWinner(newBoard);
        
        setCurrentMatch(prev => prev ? {
          ...prev,
          board: newBoard,
          currentTurn: gameWinner ? prev.currentTurn : nextTurn,
          winner: gameWinner,
          isMyTurn: !gameWinner,
        } : null);
        break;
        
      case 'computer':
        if (!currentMatch.isMyTurn) return;
        
        // Player move
        newBoard[cellIndex] = currentMatch.playerSymbol;
        let aiWinner = checkWinner(newBoard);
        
        if (!aiWinner && aiRef.current) {
          // AI move
          const aiSymbol = currentMatch.playerSymbol === 'X' ? 'O' : 'X';
          const aiMove = aiRef.current.getBestMove(newBoard, aiSymbol);
          if (aiMove !== -1) {
            newBoard[aiMove] = aiSymbol;
            aiWinner = checkWinner(newBoard);
          }
        }
        
        setCurrentMatch(prev => prev ? {
          ...prev,
          board: newBoard,
          currentTurn: aiWinner ? prev.currentTurn : (prev.currentTurn === 'X' ? 'O' : 'X'),
          winner: aiWinner,
          isMyTurn: !aiWinner,
        } : null);
        break;
    }
  }, [currentMatch, checkWinner]);

  const leaveMatch = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && matchIdRef.current && currentMatch?.mode === 'multiplayer') {
      const payload = {
        type: 'leave_match',
        data: {
          matchId: matchIdRef.current,
        }
      };
      wsRef.current.send(JSON.stringify(payload));
    }
    
    setCurrentMatch(null);
    matchIdRef.current = null;
    aiRef.current = null;
  }, [currentMatch]);

  const fetchLeaderboard = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      type: 'get_leaderboard',
      data: {}
    };
    wsRef.current.send(JSON.stringify(payload));
  }, []);

  return {
    connected,
    matchmaking,
    currentMatch,
    leaderboard,
    startGame,
    cancelMatchmaking,
    makeMove,
    leaveMatch,
    fetchLeaderboard,
  };
};

// Legacy export for compatibility
export const useNakama = useGame;