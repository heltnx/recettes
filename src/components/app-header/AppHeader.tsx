
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/share/ShareDialog";
import { LogOut, Share2 } from "lucide-react";
import { ShareNotifications } from "@/components/ShareNotifications";

interface AppHeaderProps {
  username: string;
  onShare: () => void;
  onLogout: () => void;
}

export function AppHeader({ username, onShare, onLogout }: AppHeaderProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-4xl mx-auto h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Mes Recettes</h1>
          <span className="text-muted-foreground">
            Bonjour, {username}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ShareNotifications />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              onShare();
              setIsShareDialogOpen(true);
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
