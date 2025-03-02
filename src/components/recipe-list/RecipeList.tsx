
import { Recipe, Category, SubCategory } from "@/types/recipe";
import { RecipeCard } from "@/components/RecipeCard";
import { useState } from "react";

interface RecipeListProps {
  recipes: Recipe[];
  selectedCategory: Category | null;
  selectedSubCategory: SubCategory | null;
  searchQuery: string;
  onEdit: (recipe: Recipe) => Promise<void>;
  onDelete: (recipe: Recipe) => Promise<void>;
  onImageUpload: (recipe: Recipe, file: File) => Promise<void>;
  isReadOnly?: boolean;
}

export function RecipeList({ 
  recipes, 
  selectedCategory, 
  selectedSubCategory, 
  searchQuery,
  onEdit,
  onDelete,
  onImageUpload,
  isReadOnly = false
}: RecipeListProps) {
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    const matchesSubCategory = !selectedSubCategory || recipe.sub_category === selectedSubCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubCategory && matchesSearch;
  });

  return (
    <div className="grid gap-6">
      {filteredRecipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          isExpanded={expandedRecipeId === recipe.id}
          onClick={() => setExpandedRecipeId(
            expandedRecipeId === recipe.id ? null : recipe.id
          )}
          onEdit={onEdit}
          onDelete={onDelete}
          onImageUpload={onImageUpload}
          isReadOnly={isReadOnly}
        />
      ))}
    </div>
  );
}

export default RecipeList;
