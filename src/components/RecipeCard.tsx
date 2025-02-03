import { Recipe } from "@/types/recipe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface RecipeCardProps {
  recipe: Recipe;
  isExpanded: boolean;
  onClick: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onImageUpload: (recipe: Recipe, file: File) => Promise<void>;
}

export function RecipeCard({ 
  recipe, 
  isExpanded, 
  onClick, 
  onEdit, 
  onDelete,
  onImageUpload 
}: RecipeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);

  const handleEdit = () => {
    if (isEditing) {
      onEdit(editedRecipe);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImageUpload(recipe, file);
    }
  };

  return (
    <>
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-300 hover:shadow-md",
          isExpanded && "ring-2 ring-recipe-300"
        )}
        onClick={onClick}
      >
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {recipe.imageUrl && (
              <img 
                src={recipe.imageUrl} 
                alt={recipe.title}
                className="w-12 h-12 object-cover rounded-md"
              />
            )}
            <CardTitle className="text-lg font-medium">
              {recipe.title}
            </CardTitle>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent>
            <div className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Ingrédients</h4>
                    <Textarea
                      value={editedRecipe.ingredients}
                      onChange={(e) => setEditedRecipe({
                        ...editedRecipe,
                        ingredients: e.target.value
                      })}
                      className="min-h-[100px] resize-none appearance-none"
                    />
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Préparation</h4>
                    <Textarea
                      value={editedRecipe.description}
                      onChange={(e) => setEditedRecipe({
                        ...editedRecipe,
                        description: e.target.value
                      })}
                      className="min-h-[100px] resize-none appearance-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Ingrédients</h4>
                    <p className="text-sm whitespace-pre-line">{recipe.ingredients}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Préparation</h4>
                    <p className="text-sm whitespace-pre-line">{recipe.description}</p>
                  </div>
                </>
              )}
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit();
                    }}
                  >
                    {isEditing ? "Enregistrer" : "Modifier"}
                  </Button>
                  {isEditing && (
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsEditing(false);
                        setEditedRecipe(recipe);
                      }}
                    >
                      Annuler
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => handleImageUpload(e as React.ChangeEvent<HTMLInputElement>);
                      input.click();
                    }}
                  >
                    <Image className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cette recette ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La recette sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              onDelete(recipe);
              setShowDeleteDialog(false);
            }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}