import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { Category, Recipe } from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Données temporaires pour la démo
const demoRecipes: Recipe[] = [
  {
    id: "1",
    title: "Tarte aux pommes",
    ingredients: "4 pommes\n150g de farine\n100g de beurre\n2 œufs",
    description: "1. Préparer la pâte\n2. Éplucher les pommes\n3. Cuire 30min",
    category: "Desserts"
  },
  {
    id: "2",
    title: "Salade César",
    ingredients: "Laitue\nPoulet\nParmesan\nCroûtons",
    description: "1. Laver la salade\n2. Griller le poulet\n3. Assembler",
    category: "Salades"
  }
];

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    }
  };

  const filteredRecipes = demoRecipes.filter(recipe => {
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 border-r bg-white">
        <div className="p-4">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Se déconnecter
          </Button>
        </div>
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Input
              type="search"
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          <div className="grid gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isExpanded={expandedRecipeId === recipe.id}
                onClick={() => setExpandedRecipeId(
                  expandedRecipeId === recipe.id ? null : recipe.id
                )}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
