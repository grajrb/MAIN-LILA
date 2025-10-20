import { cn } from "@/lib/utils";
import { X, Circle, Bot, User, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Board, GameMatch } from "@/hooks/useGame";

interface GameBoardProps {
  match: GameMatch;
  onCellClick: (index: number) => void;
}

const GameBoard = ({ match, onCellClick }: GameBoardProps) => {
  const { board, isMyTurn, winner, playerSymbol, mode, difficulty } = match;

  const getModeIcon = () => {
    switch (mode) {
      case 'multiplayer':
        return <Users className="w-4 h-4" />;
      case 'computer':
        return <Bot className="w-4 h-4" />;
      case 'single-player':
        return <User className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'multiplayer':
        return 'Multiplayer';
      case 'computer':
        return `vs AI (${difficulty})`;
      case 'single-player':
        return 'Practice Mode';
      default:
        return '';
    }
  };

  const renderCell = (value: 'X' | 'O' | null, index: number) => {
    const isClickable = isMyTurn && value === null && !winner;
    
    return (
      <button
        key={index}
        onClick={() => isClickable && onCellClick(index)}
        disabled={!isClickable}
        className={cn(
          "aspect-square bg-card border-2 border-border rounded-lg flex items-center justify-center transition-all duration-200",
          "hover:border-primary hover:bg-game-cellHover active:scale-95",
          "touch-manipulation select-none",
          "min-h-[60px] min-w-[60px] sm:min-h-[80px] sm:min-w-[80px]",
          isClickable && "cursor-pointer active:bg-primary/10",
          !isClickable && "cursor-not-allowed opacity-70"
        )}
      >
        {value === 'X' && (
          <X className="w-12 h-12 sm:w-16 sm:h-16 text-game-x animate-slide-in" strokeWidth={3} />
        )}
        {value === 'O' && (
          <Circle className="w-12 h-12 sm:w-16 sm:h-16 text-game-o animate-slide-in" strokeWidth={3} />
        )}
      </button>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Game Status */}
      <div className="mb-6 text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="gap-1">
            {getModeIcon()}
            {getModeLabel()}
          </Badge>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg">
          <span className="text-sm text-muted-foreground">You are</span>
          {playerSymbol === 'X' ? (
            <X className="w-5 h-5 text-game-x" strokeWidth={3} />
          ) : (
            <Circle className="w-5 h-5 text-game-o" strokeWidth={3} />
          )}
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="mb-4 text-center">
        {winner ? (
          <div className="text-2xl font-bold">
            {winner === 'draw' ? (
              <span className="text-muted-foreground">It's a Draw!</span>
            ) : winner === playerSymbol ? (
              <span className="text-game-win">You Won! 🎉</span>
            ) : (
              <span className="text-destructive">You Lost</span>
            )}
          </div>
        ) : (
          <div className="text-lg font-semibold">
            {isMyTurn ? (
              <span className="text-primary animate-pulse-glow">Your Turn</span>
            ) : (
              <span className="text-muted-foreground">Opponent's Turn...</span>
            )}
          </div>
        )}
      </div>

      {/* Game Board */}
            {/* Game Board */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-muted p-3 sm:p-4 rounded-xl max-w-xs sm:max-w-sm mx-auto">
        {board.map((value, index) => renderCell(value, index))}
      </div>
    </div>
  );
};

export default GameBoard;
