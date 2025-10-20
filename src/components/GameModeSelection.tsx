import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Bot, Wifi, WifiOff } from "lucide-react";

export type GameMode = 'multiplayer' | 'single-player' | 'computer';
export type Difficulty = 'easy' | 'medium' | 'hard';

interface GameModeSelectionProps {
  connected: boolean;
  onModeSelect: (mode: GameMode, difficulty?: Difficulty) => void;
}

const GameModeSelection = ({ connected, onModeSelect }: GameModeSelectionProps) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Choose Game Mode</h2>
        <div className="flex items-center justify-center gap-2">
          {connected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-green-500 text-sm">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-red-500 text-sm">Offline</span>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Multiplayer Mode */}
        <Card className={`cursor-pointer transition-all hover:shadow-lg ${!connected ? 'opacity-50' : ''}`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="flex items-center gap-2 justify-center">
              Multiplayer
              {!connected && <Badge variant="destructive">Offline</Badge>}
            </CardTitle>
            <CardDescription>
              Play against real players online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => onModeSelect('multiplayer')}
              disabled={!connected}
            >
              {connected ? 'Find Match' : 'Connection Required'}
            </Button>
          </CardContent>
        </Card>

        {/* Computer Mode */}
        <Card className="cursor-pointer transition-all hover:shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <Bot className="w-12 h-12 text-blue-500" />
            </div>
            <CardTitle>vs Computer</CardTitle>
            <CardDescription>
              Challenge our AI opponent
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onModeSelect('computer', 'easy')}
                className="text-xs"
              >
                Easy
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onModeSelect('computer', 'medium')}
                className="text-xs"
              >
                Medium
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onModeSelect('computer', 'hard')}
                className="text-xs"
              >
                Hard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Single Player Practice Mode */}
      <Card className="cursor-pointer transition-all hover:shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center gap-2 justify-center">
            <span>Practice Mode</span>
            <Badge variant="secondary">Local</Badge>
          </CardTitle>
          <CardDescription>
            Play locally without any opponent - perfect for testing moves
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => onModeSelect('single-player')}
          >
            Start Practice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GameModeSelection;