// AI logic for single-player Tic-Tac-Toe using minimax algorithm
import type { Board, GameState } from '../hooks/useNakama';

export type Difficulty = 'easy' | 'medium' | 'hard';

export class TicTacToeAI {
  private difficulty: Difficulty;

  constructor(difficulty: Difficulty = 'hard') {
    this.difficulty = difficulty;
  }

  // Get the best move for the AI
  getBestMove(board: Board, aiSymbol: 'X' | 'O'): number {
    switch (this.difficulty) {
      case 'easy':
        return this.getRandomMove(board);
      case 'medium':
        return Math.random() < 0.5 ? this.getRandomMove(board) : this.getMinimaxMove(board, aiSymbol);
      case 'hard':
      default:
        return this.getMinimaxMove(board, aiSymbol);
    }
  }

  private getRandomMove(board: Board): number {
    const availableMoves = this.getAvailableMoves(board);
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  private getMinimaxMove(board: Board, aiSymbol: 'X' | 'O'): number {
    const playerSymbol = aiSymbol === 'X' ? 'O' : 'X';
    let bestMove = -1;
    let bestScore = -Infinity;

    const availableMoves = this.getAvailableMoves(board);
    
    for (const move of availableMoves) {
      const newBoard = [...board];
      newBoard[move] = aiSymbol;
      
      const score = this.minimax(newBoard, 0, false, aiSymbol, playerSymbol);
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(
    board: Board, 
    depth: number, 
    isMaximizing: boolean, 
    aiSymbol: 'X' | 'O', 
    playerSymbol: 'X' | 'O'
  ): number {
    const winner = this.checkWinner(board);
    
    // Terminal states
    if (winner === aiSymbol) return 10 - depth;
    if (winner === playerSymbol) return depth - 10;
    if (this.isBoardFull(board)) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      const availableMoves = this.getAvailableMoves(board);
      
      for (const move of availableMoves) {
        const newBoard = [...board];
        newBoard[move] = aiSymbol;
        const evaluation = this.minimax(newBoard, depth + 1, false, aiSymbol, playerSymbol);
        maxEval = Math.max(maxEval, evaluation);
      }
      
      return maxEval;
    } else {
      let minEval = Infinity;
      const availableMoves = this.getAvailableMoves(board);
      
      for (const move of availableMoves) {
        const newBoard = [...board];
        newBoard[move] = playerSymbol;
        const evaluation = this.minimax(newBoard, depth + 1, true, aiSymbol, playerSymbol);
        minEval = Math.min(minEval, evaluation);
      }
      
      return minEval;
    }
  }

  private getAvailableMoves(board: Board): number[] {
    return board
      .map((cell, index) => cell === null ? index : -1)
      .filter(index => index !== -1);
  }

  private checkWinner(board: Board): GameState {
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

    return null;
  }

  private isBoardFull(board: Board): boolean {
    return board.every(cell => cell !== null);
  }
}