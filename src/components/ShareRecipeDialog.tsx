import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Recipe } from "@/types/recipe";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2 } from "lucide-react";

interface ShareRecipeDialogProps {
  recipe: Recipe;
}

export function ShareRecipeDialog({ recipe }: ShareRecipeDialogProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
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

    // First, find the user by email
    const { data: users, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !users) {
      toast({
        title: "Erreur",
        description: "Utilisateur non trouvé",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Create the share record
    const { error: shareError } = await supabase
      .from('recipe_shares')
      .insert({
        recipe_id: recipe.id,
        from_user_id: recipe.user_id,
        to_user_id: users.id,
      });

    if (shareError) {
      toast({
        title: "Erreur",
        description: "Impossible de partager la recette",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "La recette a été partagée",
      });
      setIsOpen(false);
    }

    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Partager la recette</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Entrez l'adresse email de l'utilisateur avec qui vous souhaitez partager cette recette
          </p>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={handleShare} disabled={isLoading}>
              {isLoading ? "Envoi..." : "Partager"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}