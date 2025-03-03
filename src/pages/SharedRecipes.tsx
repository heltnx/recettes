
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Recipe, Category, SubCategory } from "@/types/recipe";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RecipeList } from "@/components/recipe-list/RecipeList";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/Sidebar";

const SharedRecipes = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("user");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  
  // Add search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);

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
        // For display name, we'll use a formatted version of the user ID
        // since we don't have a profiles table to get the email
        setUserDisplayName(`Utilisateur ${userId.substring(0, 6)}`);
        
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

  // Handle category and subcategory selection
  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
  };

  const handleSubCategorySelect = (subCategory: SubCategory | null) => {
    setSelectedSubCategory(subCategory);
  };

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
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 border-r bg-white">
        <Sidebar
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSelectCategory={handleCategorySelect}
          onSelectSubCategory={handleSubCategorySelect}
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b p-4 shadow-sm">
          <h1 className="text-2xl font-bold text-center">
            Les recettes de {userDisplayName}
          </h1>
        </header>

        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <Input
                type="search"
                placeholder="Rechercher une recette..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            <RecipeList 
              recipes={recipes}
              selectedCategory={selectedCategory}
              selectedSubCategory={selectedSubCategory}
              searchQuery={searchQuery}
              onEdit={async () => {}} 
              onDelete={async () => {}}
              onImageUpload={async () => {}}
              isReadOnly={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SharedRecipes;
