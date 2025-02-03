import { Recipe, Category, SubCategory } from "@/types/recipe";
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
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [imageUrl, setImageUrl] = useState("");
  const [useImageUrl, setUseImageUrl] = useState(false);

  const handleEdit = () => {
    if (isEditing) {
      onEdit({
        ...editedRecipe,
        image_url: useImageUrl ? imageUrl : editedRecipe.image_url
      });
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setImageUrl(recipe.image_url || "");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await onImageUpload(recipe, file);
    }
  };

  const stopPropagation = (e: React.MouseEvent) => {
    if (isEditing) {
      e.stopPropagation();
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
            {recipe.image_url && (
              <img 
                src={recipe.image_url} 
                alt={recipe.title}
                className="w-12 h-12 object-cover rounded-md"
              />
            )}
            <CardTitle className="text-lg font-medium">
              {recipe.title}
            </CardTitle>
          </div>
          <div className="text-sm text-gray-500">
            {recipe.category} {recipe.sub_category && `- ${recipe.sub_category}`}
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent onClick={stopPropagation}>
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
                  <div>
                    <h4 className="font-medium mb-2">Catégorie</h4>
                    <Select
                      value={editedRecipe.category}
                      onValueChange={(value) => setEditedRecipe({
                        ...editedRecipe,
                        category: value as Category,
                        sub_category: value === "Plats" ? editedRecipe.sub_category : undefined
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Apéros">Apéros</SelectItem>
                        <SelectItem value="Entrées">Entrées</SelectItem>
                        <SelectItem value="Plats">Plats</SelectItem>
                        <SelectItem value="Salades">Salades</SelectItem>
                        <SelectItem value="Soupes">Soupes</SelectItem>
                        <SelectItem value="Desserts">Desserts</SelectItem>
                        <SelectItem value="Autres">Autres</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editedRecipe.category === "Plats" && (
                    <div>
                      <h4 className="font-medium mb-2">Sous-catégorie</h4>
                      <Select
                        value={editedRecipe.sub_category || ""}
                        onValueChange={(value) => setEditedRecipe({
                          ...editedRecipe,
                          sub_category: value as SubCategory
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une sous-catégorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Viande">Viande</SelectItem>
                          <SelectItem value="Volaille">Volaille</SelectItem>
                          <SelectItem value="Poisson">Poisson</SelectItem>
                          <SelectItem value="Crustacés">Crustacés</SelectItem>
                          <SelectItem value="Légumes">Légumes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium mb-2">Image</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useImageUrl"
                          checked={useImageUrl}
                          onChange={(e) => setUseImageUrl(e.target.checked)}
                        />
                        <label htmlFor="useImageUrl">Utiliser une URL d'image</label>
                      </div>
                      {useImageUrl ? (
                        <Input
                          type="url"
                          placeholder="URL de l'image"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                        />
                      ) : (
                        <Button
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => handleImageUpload(e as React.ChangeEvent<HTMLInputElement>);
                            input.click();
                          }}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Uploader une image
                        </Button>
                      )}
                    </div>
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
                {!isEditing && (
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
                )}
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
