
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
          title: "Error",
          description: "No user ID found in the URL",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        // Get user information to display name
        const { data: userData, error: userError } = await supabase
          .from("auth")
          .select("email")
          .eq("id", userId)
          .single();

        if (userError) {
          console.error("Error fetching user:", userError);
          // Try to fetch recipes even if we can't get the username
        } else if (userData && userData.email) {
          const username = userData.email.split('@')[0];
          setUserDisplayName(username);
        }

        // Get recipes for the shared user
        const { data, error } = await supabase
          .from("recipes")
          .select("*")
          .eq('user_id', userId)
          .order('title', { ascending: true });

        if (error) {
          console.error("Error fetching shared recipes:", error);
          toast({
            title: "Error",
            description: "Could not load shared recipes",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }

        setRecipes(data as Recipe[]);
      } catch (error) {
        console.error("Exception when fetching recipes:", error);
        toast({
          title: "Error",
          description: "An error occurred while loading shared recipes",
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
          <h1 className="text-2xl font-bold mb-4">No Recipes Found</h1>
          <p className="text-gray-600">
            {userDisplayName 
              ? `${userDisplayName} hasn't shared any recipes yet.` 
              : "This user hasn't shared any recipes yet."}
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
            : "Shared Recipes"}
        </h1>
      </header>

      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <RecipeList 
            recipes={recipes}
            selectedCategory={null}
            selectedSubCategory={null}
            searchQuery=""
            isReadOnly={true}
          />
        </div>
      </div>
    </div>
  );
};

export default SharedRecipes;
