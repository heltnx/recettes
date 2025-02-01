import { Recipe } from "@/types/recipe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  isExpanded: boolean;
  onClick: () => void;
}

export function RecipeCard({ recipe, isExpanded, onClick }: RecipeCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-md",
        isExpanded && "ring-2 ring-recipe-300"
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium">{recipe.title}</CardTitle>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Ingrédients</h4>
              <p className="text-sm whitespace-pre-line">{recipe.ingredients}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Préparation</h4>
              <p className="text-sm whitespace-pre-line">{recipe.description}</p>
            </div>
            {recipe.imageUrl && (
              <img 
                src={recipe.imageUrl} 
                alt={recipe.title}
                className="w-full h-48 object-cover rounded-md"
              />
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}