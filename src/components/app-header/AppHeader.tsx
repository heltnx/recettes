
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface AppHeaderProps {
  username: string;
  onShare: () => void;
  onLogout: () => void;
}

export function AppHeader({ username, onShare, onLogout }: AppHeaderProps) {
  return (
    <header className="bg-white border-b p-4 shadow-sm flex justify-between items-center">
      <div className="flex-1"></div>
      <h1 className="text-2xl font-bold text-center flex-1">Les recettes de {username}</h1>
      <div className="flex-1 flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onShare}
          className="flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Partager
        </Button>
      </div>
    </header>
  );
}

export default AppHeader;
