import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  connected: boolean;
}

const ConnectionStatus = ({ connected }: ConnectionStatusProps) => {
  return (
    <div
      className={cn(
        "fixed top-4 right-4 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium transition-all",
        connected
          ? "bg-green-500/20 text-green-400 border border-green-500/50"
          : "bg-destructive/20 text-destructive border border-destructive/50"
      )}
    >
      {connected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
};

export default ConnectionStatus;
