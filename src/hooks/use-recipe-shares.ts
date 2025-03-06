
import { useState, useEffect, useCallback } from "react";
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
  recipe?: Recipe;
}

export function useRecipeShares() {
  const [incomingShares, setIncomingShares] = useState<RecipeShare[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasNewShares, setHasNewShares] = useState(false);
  const { toast } = useToast();

  const fetchIncomingShares = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.email) {
      setIsLoading(false);
      return [];
    }

    try {
      console.log("Vérification des partages pour l'email:", session.user.email);
      
      // Simplification : on ne cherche que par email
      const { data: shares, error } = await supabase
        .from("recipe_shares")
        .select(`
          *,
          recipe:recipes(*)
        `)
        .eq("recipient_email", session.user.email)
        .eq("status", "pending");

      if (error) {
        console.error("Erreur lors de la récupération des partages:", error);
        throw error;
      }

      console.log("Partages trouvés:", shares?.length || 0);
      
      // Vérifier que les partages existent et les convertir avec des types corrects
      const typedShares: RecipeShare[] = shares?.map(share => {
        const validStatus = (share.status === 'pending' || 
                            share.status === 'accepted' || 
                            share.status === 'rejected') 
          ? share.status as 'pending' | 'accepted' | 'rejected'
          : 'pending';
          
        let typedRecipe = undefined;
        if (share.recipe) {
          // Assurons-nous que la catégorie est valide
          const validCategory = [
            "Apéros", "Entrées", "Plats", "Salades", 
            "Desserts", "Soupes", "Autres"
          ].includes(share.recipe.category) 
            ? share.recipe.category as Category 
            : "Autres";
            
          // Vérification de la sous-catégorie
          const validSubCategory = share.recipe.sub_category 
            ? ([
                "Viande", "Volaille", "Poisson", 
                "Fruits de mer", "Légumes"
              ].includes(share.recipe.sub_category)
                ? share.recipe.sub_category as SubCategory
                : undefined)
            : undefined;
            
          typedRecipe = {
            ...share.recipe,
            category: validCategory,
            sub_category: validSubCategory
          };
        }
        
        return {
          ...share,
          status: validStatus,
          recipe: typedRecipe
        } as RecipeShare;
      }) || [];
      
      setIncomingShares(typedShares);
      setHasNewShares(typedShares.length > 0);
      setIsLoading(false);
      return typedShares;
    } catch (error) {
      console.error("Erreur complète:", error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const acceptShare = async (share: RecipeShare) => {
    if (!share.recipe) {
      toast({
        title: "Erreur",
        description: "Impossible de trouver la recette partagée",
        variant: "destructive",
      });
      return;
    }

    try {
      // 1. Créer une copie de la recette
      const { data: newRecipe, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          ...share.recipe,
          id: undefined, // Pour générer un nouvel ID
          user_id: (await supabase.auth.getSession()).data.session?.user.id,
          shared_by_name: "Partagée"
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // 2. Marquer le partage comme accepté
      const { error: shareError } = await supabase
        .from("recipe_shares")
        .update({ status: "accepted" })
        .eq("id", share.id);

      if (shareError) throw shareError;

      toast({
        title: "Succès",
        description: "La recette a été ajoutée à votre collection",
      });

      fetchIncomingShares();
    } catch (error) {
      console.error("Erreur lors de l'acceptation:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'accepter la recette partagée",
        variant: "destructive",
      });
    }
  };

  const rejectShare = async (share: RecipeShare) => {
    try {
      const { error } = await supabase
        .from("recipe_shares")
        .update({ status: "rejected" })
        .eq("id", share.id);

      if (error) throw error;

      toast({
        title: "Information",
        description: "La recette a été refusée",
      });

      fetchIncomingShares();
    } catch (error) {
      console.error("Erreur lors du rejet:", error);
      toast({
        title: "Erreur",
        description: "Impossible de refuser la recette partagée",
        variant: "destructive",
      });
    }
  };

  // Chargement initial des partages
  useEffect(() => {
    fetchIncomingShares().catch(error => {
      console.error("Erreur lors du chargement initial des partages:", error);
    });

    // Rafraîchissement périodique toutes les 30 secondes
    const intervalId = setInterval(() => {
      fetchIncomingShares().catch(console.error);
    }, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchIncomingShares]);

  return {
    incomingShares,
    isLoading,
    hasNewShares,
    fetchIncomingShares,
    acceptShare,
    rejectShare,
    clearNewSharesFlag: () => setHasNewShares(false)
  };
}
