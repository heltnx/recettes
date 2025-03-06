
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRecipeShares } from "@/hooks/use-recipe-shares";
import { Download, Loader2 } from "lucide-react";

export function ImportRecipeDialog({ onImportSuccess }: { onImportSuccess?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, shareCodeInput, setShareCodeInput, importRecipeByCode } = useRecipeShares();

  const handleImport = async () => {
    await importRecipeByCode(shareCodeInput);
    if (onImportSuccess) onImportSuccess();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2">
          <Download className="h-4 w-4" />
          Importer une recette
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importer une recette</DialogTitle>
          <DialogDescription>
            Entrez le code de partage qui vous a été communiqué
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="shareCode" className="text-sm font-medium">
              Code de partage
            </label>
            <Input
              id="shareCode"
              placeholder="Entrez le code de partage"
              value={shareCodeInput}
              onChange={(e) => setShareCodeInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isLoading || !shareCodeInput.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importation...
              </>
            ) : (
              "Importer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
