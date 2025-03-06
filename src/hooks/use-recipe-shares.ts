
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/types/recipe";

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
      
      // Conversion explicite du statut pour s'assurer qu'il correspond au type attendu
      const typedShares = shares?.map(share => ({
        ...share,
        status: share.status as 'pending' | 'accepted' | 'rejected'
      })) || [];
      
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

  useEffect(() => {
    fetchIncomingShares().catch(error => {
      console.error("Erreur lors du chargement initial des partages:", error);
    });

    // On simplifie la souscription aux changements
    const sharesSubscription = supabase
      .channel('recipe_shares_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recipe_shares',
        },
        () => {
          console.log("Changement détecté dans les partages");
          fetchIncomingShares().catch(console.error);
        }
      )
      .subscribe();

    return () => {
      sharesSubscription.unsubscribe();
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
