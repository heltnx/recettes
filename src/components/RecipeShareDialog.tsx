
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
import { Send } from "lucide-react";

interface RecipeShareDialogProps {
  recipe: Recipe;
  onShareSuccess?: () => void;
}

export function RecipeShareDialog({ recipe, onShareSuccess }: RecipeShareDialogProps) {
  const [email, setEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!email) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer une adresse email",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Obtenir l'utilisateur actuellement connecté
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

      // Rechercher l'utilisateur destinataire par email en utilisant la méthode compatible
      const { data: userList, error: userError } = await supabase.auth.admin.listUsers()
        .catch(() => ({ data: null, error: new Error("Impossible d'accéder à la liste des utilisateurs") }));

      // Trouver l'utilisateur avec l'email correspondant si userList est disponible
      const userFound = userList?.users?.find(user => user.email === email);

      if (userError || !userFound) {
        // Essayons une approche alternative - rechercher dans les recettes
        const { data: recipes, error: recipesError } = await supabase
          .from("recipes")
          .select("user_id")
          .eq("user_id", email)
          .limit(1);

        if (recipesError || !recipes || recipes.length === 0) {
          toast({
            title: "Utilisateur non trouvé",
            description: "Cette adresse email n'est pas associée à un compte",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // Créer un enregistrement de partage
        const { error: shareError } = await supabase
          .from("recipe_shares")
          .insert({
            recipe_id: recipe.id,
            from_user_id: session.user.id,
            to_user_id: recipes[0].user_id,
            status: "pending"
          });

        if (shareError) {
          console.error("Erreur lors du partage:", shareError);
          toast({
            title: "Erreur",
            description: "Impossible de partager la recette",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } else {
        // L'utilisateur existe dans auth.users
        const toUserId = userFound.id;

        // Créer un enregistrement de partage
        const { error: shareError } = await supabase
          .from("recipe_shares")
          .insert({
            recipe_id: recipe.id,
            from_user_id: session.user.id,
            to_user_id: toUserId,
            status: "pending"
          });

        if (shareError) {
          console.error("Erreur lors du partage:", shareError);
          toast({
            title: "Erreur",
            description: "Impossible de partager la recette",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      }

      toast({
        title: "Succès",
        description: "La recette a été partagée avec succès",
      });

      setIsOpen(false);
      setEmail("");
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex gap-2">
          <Send className="h-4 w-4" />
          Envoyer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Partager "{recipe.title}"</DialogTitle>
          <DialogDescription>
            Envoyez cette recette à un autre utilisateur inscrit sur la plateforme.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Adresse email du destinataire
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
            {isLoading ? "Envoi en cours..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
