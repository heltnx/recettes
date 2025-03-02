
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareURL: string;
}

export function ShareDialog({ open, onOpenChange, shareURL }: ShareDialogProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareURL)
      .then(() => {
        toast({
          title: "Lien copié",
          description: "Le lien a été copié dans le presse-papier",
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien",
          variant: "destructive",
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager mes recettes</DialogTitle>
          <DialogDescription>
            Utilisez ce lien pour partager vos recettes en lecture seule
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 mt-4">
          <Input 
            value={shareURL} 
            readOnly 
            className="flex-1"
          />
          <Button onClick={copyToClipboard} variant="outline">
            Copier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
