
import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Category, SubCategory } from "@/types/recipe";
import { RecipeForm } from "@/components/recipe-form/RecipeForm";
import { RecipeList } from "@/components/recipe-list/RecipeList";
import { AppHeader } from "@/components/app-header/AppHeader";
import { ShareDialog } from "@/components/share/ShareDialog";
import { ImportRecipeDialog } from "@/components/ImportRecipeDialog";
import { useRecipes } from "@/hooks/use-recipes";
import { useShare } from "@/hooks/use-share";
import { useAuth } from "@/hooks/use-auth";

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  const { recipes, userDisplayName, fetchRecipes, handleEdit, handleDelete, handleRecipeImageUpload } = useRecipes();
  const { showShareDialog, setShowShareDialog, shareURL, generateShareLink } = useShare();
  const { handleLogout } = useAuth();

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
  };

  const handleSubCategorySelect = (subCategory: SubCategory | null) => {
    setSelectedSubCategory(subCategory);
  };

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
          selectedSubCategory={selectedSubCategory}
          onSelectCategory={handleCategorySelect}
          onSelectSubCategory={handleSubCategorySelect}
        />
      </aside>

      <main className="flex-1 overflow-y-auto">
        <AppHeader 
          username={userDisplayName} 
          onShare={() => generateShareLink(userDisplayName)}
          onLogout={handleLogout}
        />

        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Input
                  type="search"
                  placeholder="Rechercher une recette..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
                <ImportRecipeDialog onImportSuccess={fetchRecipes} />
              </div>
              <Button onClick={() => {
                setIsAddingRecipe(!isAddingRecipe);
                if (!isAddingRecipe) {
                  setEditingRecipe(null);
                }
              }}>
                {isAddingRecipe ? "Annuler" : "Ajouter une recette"}
              </Button>
            </div>

            {isAddingRecipe ? (
              <RecipeForm 
                editingRecipe={editingRecipe}
                onSuccess={() => {
                  fetchRecipes();
                  setIsAddingRecipe(false);
                }}
                onCancel={() => {
                  setIsAddingRecipe(false);
                  setEditingRecipe(null);
                }}
              />
            ) : (
              <RecipeList 
                recipes={recipes}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                searchQuery={searchQuery}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onImageUpload={handleRecipeImageUpload}
              />
            )}
          </div>
        </div>
      </main>

      <ShareDialog 
        open={showShareDialog} 
        onOpenChange={setShowShareDialog} 
        shareURL={shareURL} 
      />
    </div>
  );
}
