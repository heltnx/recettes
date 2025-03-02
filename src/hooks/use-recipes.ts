
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
    
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq('user_id', session.user.id)
      .order('title', { ascending: true });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les recettes",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    setRecipes(data as Recipe[]);
    setIsLoading(false);
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
