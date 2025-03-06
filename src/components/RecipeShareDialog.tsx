
import { useState } from "react";
import { Recipe } from "@/types/recipe";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Send, Copy } from "lucide-react";

interface RecipeShareDialogProps {
  recipe: Recipe;
  onShareSuccess?: () => void;
}

export function RecipeShareDialog({ recipe, onShareSuccess }: RecipeShareDialogProps) {
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareCode, setShareCode] = useState("");
  const [showShareCode, setShowShareCode] = useState(false);
  const { toast } = useToast();

  // Générer un code de partage simple pour la recette
  const generateShareCode = async () => {
    setIsLoading(true);
    try {
      // Créer un code simple qui combine l'ID de la recette et un timestamp
      const code = `${recipe.id}_${Date.now().toString(36)}`;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour partager une recette",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Sauvegarder ce code dans la table recipe_shares
      const { error } = await supabase
        .from("recipe_shares")
        .insert({
          recipe_id: recipe.id,
          from_user_id: session.user.id,
          status: "pending",
          recipient_email: null, // Pas besoin d'email spécifique
          share_code: code // Nouveau champ pour stocker le code de partage
        });

      if (error) {
        console.error("Erreur lors de la génération du code:", error);
        toast({
          title: "Erreur",
          description: "Impossible de créer le code de partage",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      setShareCode(code);
      setShowShareCode(true);
      
      toast({
        title: "Succès",
        description: "Code de partage généré avec succès",
      });
      
      if (onShareSuccess) onShareSuccess();
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du partage de la recette",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareCode);
    toast({
      title: "Copié",
      description: "Le code de partage a été copié dans le presse-papier",
    });
  };

  const handleShare = async () => {
    if (!email.trim()) {
      toast({
        title: "Information",
        description: "Nous allons générer un code de partage pour cette recette.",
      });
    }
    
    await generateShareCode();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2">
          <Send className="h-4 w-4" />
          Envoyer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!showShareCode ? (
          <>
            <DialogHeader>
              <DialogTitle>Partager "{recipe.title}"</DialogTitle>
              <DialogDescription>
                Générez un code de partage pour cette recette
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Adresse email du destinataire (optionnel)
                </label>
                <Input
                  id="email"
                  placeholder="exemple@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={handleShare} 
                disabled={isLoading}
              >
                {isLoading ? "Génération en cours..." : "Générer un code"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Code de partage</DialogTitle>
              <DialogDescription>
                Partagez ce code avec la personne qui doit recevoir la recette
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2 mt-4">
              <Input 
                value={shareCode} 
                readOnly 
                className="flex-1"
              />
              <Button onClick={copyToClipboard} variant="outline">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              La personne devra utiliser ce code dans la section "Importer une recette" de son compte.
            </p>
            <DialogFooter className="mt-4">
              <Button onClick={() => setIsOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
