import { useState, useEffect } from "react";
import { Recipe } from "@/types/recipe";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchRecipes = async () => {
    setIsLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }
    
    const email = session.user.email || "";
    const username = email.split('@')[0];
    setUserDisplayName(username);
    
    try {
      // Fetch user's own recipes
      const { data: ownRecipes, error: ownError } = await supabase
        .from("recipes")
        .select("*")
        .eq('user_id', session.user.id)
        .order('title', { ascending: true });

      if (ownError) {
        console.error("Erreur lors du chargement des recettes personnelles:", ownError);
        throw ownError;
      }

      // Fetch recipes shared with user and accepted
      const { data: sharedRecipes, error: sharedError } = await supabase
        .from("recipe_shares")
        .select(`
          *,
          recipe:recipes(*)
        `)
        .eq("to_user_id", session.user.id)
        .eq("status", "accepted");

      if (sharedError) {
        console.error("Erreur lors du chargement des recettes partagées:", sharedError);
        throw sharedError;
      }

      // Extract recipes from shared recipes and mark them as shared
      const formattedSharedRecipes = sharedRecipes.map(share => {
        if (!share.recipe) return null;
        
        return {
          ...share.recipe,
          shared_by_name: "Partagée", // We can add the name of the sharer if needed
        };
      }).filter(Boolean) as Recipe[];

      // Combine user's own recipes with shared recipes
      setRecipes([...ownRecipes, ...formattedSharedRecipes]);
      setIsLoading(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les recettes",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleEdit = async (recipe: Recipe) => {
    const { error } = await supabase
      .from("recipes")
      .update({
        ...recipe,
        image_url: recipe.image_url
      })
      .eq('id', recipe.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier la recette",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "La recette a été modifiée",
    });

    fetchRecipes();
  };

  const handleDelete = async (recipe: Recipe) => {
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq('id', recipe.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la recette",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "La recette a été supprimée",
    });

    fetchRecipes();
  };

  const handleRecipeImageUpload = async (recipe: Recipe, file: File) => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('recipe-images')
      .upload(filePath, file);

    if (uploadError) {
      toast({
        title: "Erreur",
        description: "Impossible d'uploader l'image",
        variant: "destructive",
      });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('recipe-images')
      .getPublicUrl(filePath);

    const updatedRecipe = {
      ...recipe,
      image_url: publicUrl
    };
    
    await handleEdit(updatedRecipe);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  return {
    recipes,
    userDisplayName,
    isLoading,
    fetchRecipes,
    handleEdit,
    handleDelete,
    handleRecipeImageUpload
  };
}
