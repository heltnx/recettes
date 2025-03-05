
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Recipe } from "@/types/recipe";

export interface RecipeShare {
  id: string;
  recipe_id: string;
  from_user_id: string;
  to_user_id: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  recipient_email: string | null;
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
    
    if (!session) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch shares that have to_user_id matching our user ID
      const { data: directShares, error: directError } = await supabase
        .from("recipe_shares")
        .select(`
          *,
          recipe:recipes(*)
        `)
        .eq("to_user_id", session.user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (directError) {
        console.error("Erreur lors de la récupération des partages directs:", directError);
        throw directError;
      }

      // Fetch shares that have our email as recipient_email but to_user_id is null
      const { data: userEmail } = await supabase.auth.getUser();
      if (!userEmail?.user?.email) {
        setIncomingShares(directShares as RecipeShare[]);
        setHasNewShares(directShares.length > 0);
        setIsLoading(false);
        return;
      }

      const { data: emailShares, error: emailError } = await supabase
        .from("recipe_shares")
        .select(`
          *,
          recipe:recipes(*)
        `)
        .eq("recipient_email", userEmail.user.email)
        .eq("status", "pending")
        .is("to_user_id", null)
        .order("created_at", { ascending: false });

      if (emailError) {
        console.error("Erreur lors de la récupération des partages par email:", emailError);
        throw emailError;
      }

      // Combine both types of shares
      const allShares = [...directShares, ...emailShares];
      setIncomingShares(allShares as RecipeShare[]);
      setHasNewShares(allShares.length > 0);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les partages de recettes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const acceptShare = async (share: RecipeShare) => {
    if (!share.recipe) {
      toast({
        title: "Erreur",
        description: "Impossible de trouver la recette partagée",
        variant: "destructive",
      });
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour accepter une recette",
        variant: "destructive",
      });
      return;
    }

    try {
      // Update the share to link it with current user if it wasn't already
      if (!share.to_user_id) {
        const { error: updateShareError } = await supabase
          .from("recipe_shares")
          .update({ to_user_id: session.user.id })
          .eq("id", share.id);

        if (updateShareError) {
          console.error("Erreur lors de la mise à jour du partage:", updateShareError);
          throw updateShareError;
        }
      }

      // Create a copy of the recipe for the user
      const { error: recipeError } = await supabase
        .from("recipes")
        .insert({
          ...share.recipe,
          id: undefined, // To generate a new ID
          user_id: session.user.id,
          shared_by_name: "Partagée"
        });

      if (recipeError) {
        console.error("Erreur lors de la copie de la recette:", recipeError);
        throw recipeError;
      }

      // Update share status to accepted
      const { error: shareError } = await supabase
        .from("recipe_shares")
        .update({ status: "accepted" })
        .eq("id", share.id);

      if (shareError) {
        console.error("Erreur lors de la mise à jour du partage:", shareError);
        throw shareError;
      }

      toast({
        title: "Succès",
        description: "La recette a été ajoutée à votre collection",
      });

      // Refresh shares list
      fetchIncomingShares();
    } catch (error) {
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

      if (error) {
        console.error("Erreur lors du rejet du partage:", error);
        throw error;
      }

      toast({
        title: "Information",
        description: "La recette a été refusée",
      });

      // Rafraîchir la liste des partages
      fetchIncomingShares();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de refuser la recette partagée",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIncomingShares();

    // Subscribe to changes in the recipe_shares table
    const sharesSubscription = supabase
      .channel('recipe_shares_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recipe_shares',
        },
        (payload) => {
          fetchIncomingShares();
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
