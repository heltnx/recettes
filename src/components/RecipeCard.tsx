
import { Recipe, Category, SubCategory } from "@/types/recipe";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Link, Trash } from "lucide-react";
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
import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RecipeCardProps {
  recipe: Recipe;
  isExpanded: boolean;
  onClick: () => void;
  onEdit: (recipe: Recipe) => void;
  onDelete: (recipe: Recipe) => void;
  onImageUpload: (recipe: Recipe, file: File) => Promise<void>;
  isReadOnly?: boolean;
}

export function RecipeCard({ 
  recipe, 
  isExpanded, 
  onClick, 
  onEdit, 
  onDelete,
  onImageUpload,
  isReadOnly = false
}: RecipeCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editedRecipe, setEditedRecipe] = useState(recipe);
  const [imageUrl, setImageUrl] = useState(recipe.image_url || "");
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);

  useEffect(() => {
    setEditedRecipe(recipe);
    setImageUrl(recipe.image_url || "");
  }, [recipe]);

  useEffect(() => {
    if (!isExpanded && isEditing) {
      handleEdit();
    }
  }, [isExpanded]);

  const handleEdit = () => {
    if (isEditing) {
      const updatedRecipe = {
        ...editedRecipe,
        image_url: useImageUrl ? imageUrl : editedRecipe.image_url
      };
      onEdit(updatedRecipe);
      setIsEditing(false);
    } else {
      setIsEditing(true);
      setImageUrl(recipe.image_url || "");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file) {
      await onImageUpload(recipe, file);
      setShowImageDialog(false);
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
      >
        <CardHeader 
          className="pb-3 flex flex-row items-center justify-between"
          onClick={onClick}
        >
          <CardTitle className="text-lg font-medium">
            {isEditing ? (
              <Input
                value={editedRecipe.title}
                onChange={(e) => setEditedRecipe({
                  ...editedRecipe,
                  title: e.target.value
                })}
                onClick={stopPropagation}
                autoFocus
              />
            ) : (
              editedRecipe.title
            )}
          </CardTitle>
          {editedRecipe.image_url && (
            <div className="relative">
              <img 
                src={editedRecipe.image_url} 
                alt={editedRecipe.title}
                className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-75 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowImagePreview(true);
                }}
              />
            </div>
          )}
        </CardHeader>
        <CardContent onClick={stopPropagation}>
          {isExpanded && (
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
                          <SelectItem value="Fruits de mer">Fruits de mer</SelectItem>
                          <SelectItem value="Légumes">Légumes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium mb-2">Image</h4>
                    <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          {editedRecipe.image_url ? "Modifier l'image" : "Ajouter une image"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter une image</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => {
                                const target = e.target as HTMLInputElement;
                                const file = target.files?.[0];
                                if (file) {
                                  handleFileUpload(file);
                                }
                              };
                              input.click();
                            }}
                          >
                            <Image className="h-4 w-4 mr-2" />
                            Télécharger une image
                          </Button>
                          <div className="flex items-center gap-2">
                            <Input
                              type="url"
                              placeholder="Lien de l'image"
                              value={imageUrl}
                              onChange={(e) => {
                                setImageUrl(e.target.value);
                                setUseImageUrl(true);
                                setEditedRecipe({
                                  ...editedRecipe,
                                  image_url: e.target.value
                                });
                              }}
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditedRecipe({
                                  ...editedRecipe,
                                  image_url: imageUrl
                                });
                                setShowImageDialog(false);
                              }}
                            >
                              <Link className="h-4 w-4 mr-2" />
                              Utiliser
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium mb-2">Ingrédients</h4>
                    <p className="text-sm whitespace-pre-line">{editedRecipe.ingredients}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Préparation</h4>
                    <p className="text-sm whitespace-pre-line">{editedRecipe.description}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {editedRecipe.category} {editedRecipe.sub_category && `- ${editedRecipe.sub_category}`}
                  </div>
                </>
              )}
              {!isReadOnly && (
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
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editedRecipe.title}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-[80vh]">
            <img 
              src={editedRecipe.image_url} 
              alt={editedRecipe.title}
              className="w-full h-full object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

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
              <Trash className="h-4 w-4 text-red-500 mr-2" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
