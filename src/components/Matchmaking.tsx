import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Users, Gamepad2 } from "lucide-react";

interface MatchmakingProps {
  isMatchmaking: boolean;
  onStartMatchmaking: () => void;
  onCancelMatchmaking: () => void;
}

const Matchmaking = ({
  isMatchmaking,
  onStartMatchmaking,
  onCancelMatchmaking,
}: MatchmakingProps) => {
  return (
    <Card className="p-8 max-w-md mx-auto">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          {isMatchmaking ? (
            <Loader2 className="w-16 h-16 text-primary animate-spin" />
          ) : (
            <Gamepad2 className="w-16 h-16 text-primary" />
          )}
        </div>

        <div>
          <h2 className="text-3xl font-bold mb-2">
            {isMatchmaking ? "Finding Opponent..." : "Ready to Play?"}
          </h2>
          <p className="text-muted-foreground">
            {isMatchmaking
              ? "Searching for a worthy opponent"
              : "Join the matchmaking queue to start a game"}
          </p>
        </div>

        {isMatchmaking ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Players online: 42</span>
            </div>
            <Button
              onClick={onCancelMatchmaking}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            onClick={onStartMatchmaking}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            <Users className="w-5 h-5 mr-2" />
            Find Match
          </Button>
        )}
      </div>
    </Card>
  );
};

export default Matchmaking;
