import { Recipe } from "@/types/recipe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  isExpanded: boolean;
  onClick: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
}

export function RecipeCard({ recipe, isExpanded, onClick, onEdit, onDelete }: RecipeCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-300 hover:shadow-md",
        isExpanded && "ring-2 ring-recipe-300"
      )}
    >
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle 
          className="text-lg font-medium cursor-pointer"
          onClick={onClick}
        >
          {recipe.title}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(recipe);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(recipe);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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