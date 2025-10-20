import { Card } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import type { LeaderboardEntry } from "@/hooks/useNakama";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  onRefresh: () => void;
}

const Leaderboard = ({ entries, onRefresh }: LeaderboardProps) => {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-orange-400" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  return (
    <Card className="p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Leaderboard
        </h2>
        <button
          onClick={onRefresh}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No rankings yet. Be the first to play!
          </div>
        ) : (
          entries.map((entry) => (
            <div
              key={entry.username}
              className="flex items-center gap-4 p-3 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors"
            >
              <div className="flex-shrink-0">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{entry.username}</p>
                <p className="text-sm text-muted-foreground">
                  {entry.wins}W - {entry.losses}L
                </p>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-primary">
                  {entry.wins + entry.losses} Games
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.wins + entry.losses > 0
                    ? `${Math.round((entry.wins / (entry.wins + entry.losses)) * 100)}% WR`
                    : '0% WR'}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default Leaderboard;
