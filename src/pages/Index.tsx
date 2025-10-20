import { useState } from "react";
import { useGame } from "@/hooks/useGame";
import GameBoard from "@/components/GameBoard";
import Matchmaking from "@/components/Matchmaking";
import GameModeSelection, { type GameMode, type Difficulty } from "@/components/GameModeSelection";
import Leaderboard from "@/components/Leaderboard";
import ConnectionStatus from "@/components/ConnectionStatus";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gamepad2, LogOut, ArrowLeft } from "lucide-react";

const Index = () => {
  const {
    connected,
    matchmaking,
    currentMatch,
    leaderboard,
    startGame,
    cancelMatchmaking,
    makeMove,
    leaveMatch,
    fetchLeaderboard,
  } = useGame();

  const [activeTab, setActiveTab] = useState<"play" | "leaderboard">("play");
  const [showModeSelection, setShowModeSelection] = useState(true);

  const handleModeSelect = (mode: GameMode, difficulty?: Difficulty) => {
    if (mode === 'multiplayer') {
      setShowModeSelection(false);
      startGame(mode);
    } else {
      setShowModeSelection(false);
      startGame(mode, difficulty);
    }
  };

  const handleBackToModeSelection = () => {
    leaveMatch();
    setShowModeSelection(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <ConnectionStatus connected={connected} />

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gamepad2 className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Tic-Tac-Toe Arena
              </h1>
            </div>
            
            {currentMatch && (
              <div className="flex gap-2">
                <Button
                  onClick={handleBackToModeSelection}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
                <Button
                  onClick={leaveMatch}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Leave Game
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentMatch ? (
          <div className="max-w-2xl mx-auto">
            <GameBoard match={currentMatch} onCellClick={makeMove} />
          </div>
        ) : showModeSelection ? (
          <GameModeSelection 
            connected={connected}
            onModeSelect={handleModeSelect}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "play" | "leaderboard")} className="max-w-2xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="play">Play</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="play">
              <div className="space-y-4">
                <Button
                  onClick={handleBackToModeSelection}
                  variant="outline"
                  className="gap-2 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Mode Selection
                </Button>
                <Matchmaking
                  isMatchmaking={matchmaking}
                  onStartMatchmaking={() => startGame('multiplayer')}
                  onCancelMatchmaking={cancelMatchmaking}
                />
              </div>
            </TabsContent>

            <TabsContent value="leaderboard">
              <div className="space-y-4">
                <Button
                  onClick={handleBackToModeSelection}
                  variant="outline"
                  className="gap-2 mb-4"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Mode Selection
                </Button>
                <Leaderboard entries={leaderboard} onRefresh={fetchLeaderboard} />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/50 backdrop-blur-sm py-3">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built with React + Nakama + Railway
        </div>
      </footer>
    </div>
  );
};

export default Index;
