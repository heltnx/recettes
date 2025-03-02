
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Recipe } from "@/types/recipe";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RecipeList } from "@/components/recipe-list/RecipeList";
import { Loader2 } from "lucide-react";

const SharedRecipes = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSharedRecipes = async () => {
      if (!userId) {
        toast({
          title: "Erreur",
          description: "Aucun identifiant d'utilisateur trouvé dans l'URL",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        // Get recipes for the shared user
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq('user_id', userId)
          .order('title', { ascending: true });

        if (error) {
          console.error("Error fetching shared recipes:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les recettes partagées",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        // For simplicity, we'll extract a display name from the userId
        // This avoids needing to access the auth table which is problematic
        setUserDisplayName(`Utilisateur ${userId.substring(0, 6)}`);
        
        setRecipes(data as Recipe[]);
      } catch (error) {
        console.error("Exception when fetching recipes:", error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des recettes partagées",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedRecipes();
  }, [userId, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (recipes.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Aucune recette trouvée</h1>
          <p className="text-gray-600">
            {userDisplayName 
              ? `${userDisplayName} n'a pas encore partagé de recettes.` 
              : "Cet utilisateur n'a pas encore partagé de recettes."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b p-4 shadow-sm">
        <h1 className="text-2xl font-bold text-center">
          {userDisplayName 
            ? `Les recettes de ${userDisplayName}` 
            : "Recettes partagées"}
        </h1>
      </header>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <RecipeList 
            recipes={recipes}
            selectedCategory={null}
            selectedSubCategory={null}
            searchQuery=""
            onEdit={async () => {}} 
            onDelete={async () => {}}
            onImageUpload={async () => {}}
            isReadOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SharedRecipes;
