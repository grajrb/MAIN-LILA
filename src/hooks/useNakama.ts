import { useState, useEffect, useCallback, useRef } from 'react';

export type GameState = 'X' | 'O' | null;
export type Board = GameState[];

export interface GameMatch {
  matchId: string;
  board: Board;
  currentTurn: 'X' | 'O';
  playerSymbol: 'X' | 'O';
  opponentId: string | null;
  winner: 'X' | 'O' | 'draw' | null;
  isMyTurn: boolean;
}

export interface LeaderboardEntry {
  username: string;
  wins: number;
  losses: number;
  rank: number;
}

export const useNakama = () => {
  const [connected, setConnected] = useState(false);
  const [matchmaking, setMatchmaking] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<GameMatch | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const matchIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Connect to Nakama WebSocket
    const connectWebSocket = () => {
      try {
        // Allow overriding server URL via env (e.g. import.meta.env.VITE_NAKAMA_WS_URL) with fallback to local mock
        const serverUrl = (import.meta as any).env?.VITE_NAKAMA_WS_URL || 'ws://localhost:7350/ws';
        const ws = new WebSocket(serverUrl);
        
        ws.onopen = () => {
          console.log('Connected to Nakama server');
          setConnected(true);
          
          // Authenticate (in production, use proper authentication)
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
          console.log('Disconnected from Nakama server');
          setConnected(false);
          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to connect to Nakama:', error);
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
        isMyTurn: data.currentTurn === prev.playerSymbol,
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

  const startMatchmaking = useCallback(() => {
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
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    if (!currentMatch || !currentMatch.isMyTurn || currentMatch.winner) {
      console.log('Cannot make move:', { currentMatch, isMyTurn: currentMatch?.isMyTurn });
      return;
    }

    if (currentMatch.board[cellIndex] !== null) {
      console.log('Cell already occupied');
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
  }, [currentMatch]);

  const leaveMatch = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && matchIdRef.current) {
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
  }, []);

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
    startMatchmaking,
    cancelMatchmaking,
    makeMove,
    leaveMatch,
    fetchLeaderboard,
  };
};
