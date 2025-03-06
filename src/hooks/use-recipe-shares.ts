
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe, Category, SubCategory } from "@/types/recipe";

export interface RecipeShare {
  id: string;
  recipe_id: string;
  from_user_id: string;
  recipient_email: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  share_code?: string | null;
  recipe?: Recipe;
}

export function useRecipeShares() {
  const [isLoading, setIsLoading] = useState(false);
  const [shareCodeInput, setShareCodeInput] = useState("");
  const { toast } = useToast();

  const importRecipeByCode = useCallback(async (shareCode: string) => {
    if (!shareCode.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un code de partage",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Vérifier que l'utilisateur est connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour importer une recette",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log("Recherche de la recette avec le code:", shareCode);
      
      // Récupérer le partage avec ce code
      const { data: shares, error: shareError } = await supabase
        .from("recipe_shares")
        .select(`
          *,
          recipe:recipes(*)
        `)
        .eq("share_code", shareCode)
        .eq("status", "pending");

      if (shareError) {
        console.error("Erreur lors de la recherche du code:", shareError);
        throw shareError;
      }

      if (!shares || shares.length === 0) {
        toast({
          title: "Erreur",
          description: "Code de partage invalide ou expiré",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const share = shares[0];

      if (!share.recipe) {
        toast({
          title: "Erreur",
          description: "La recette partagée n'existe plus",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Processus de validation des types comme avant
      const validCategory = [
        "Apéros", "Entrées", "Plats", "Salades", 
        "Desserts", "Soupes", "Autres"
      ].includes(share.recipe.category) 
        ? share.recipe.category as Category 
        : "Autres";
        
      const validSubCategory = share.recipe.sub_category 
        ? ([
            "Viande", "Volaille", "Poisson", 
            "Fruits de mer", "Légumes"
          ].includes(share.recipe.sub_category)
            ? share.recipe.sub_category as SubCategory
            : undefined)
        : undefined;
      
      // 1. Créer une copie de la recette
      const { data: newRecipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          ...share.recipe,
          id: undefined, // Pour générer un nouvel ID
          user_id: session.user.id,
          category: validCategory,
          sub_category: validSubCategory,
          shared_by_name: "Importée"
        })
        .select()
        .single();

      if (recipeError) {
        console.error("Erreur lors de la copie de la recette:", recipeError);
        throw recipeError;
      }

      // 2. Marquer le partage comme accepté
      const { error: updateError } = await supabase
        .from("recipe_shares")
        .update({ status: "accepted" })
        .eq("id", share.id);

      if (updateError) {
        console.error("Erreur lors de la mise à jour du statut:", updateError);
        // On continue même si cette étape échoue car la recette a été copiée
      }

      toast({
        title: "Succès",
        description: "La recette a été importée avec succès",
      });

      setShareCodeInput("");
      
    } catch (error) {
      console.error("Erreur complète lors de l'importation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'importer la recette",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    isLoading,
    shareCodeInput,
    setShareCodeInput,
    importRecipeByCode
  };
}
