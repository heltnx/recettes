
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Recipe } from "@/types/recipe";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image, Link } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  ingredients: z.string().min(1, "Les ingrédients sont requis"),
  description: z.string().min(1, "La description est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  sub_category: z.string().optional(),
  image_url: z.string().optional(),
});

interface RecipeFormProps {
  editingRecipe: Recipe | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function RecipeForm({ editingRecipe, onSuccess, onCancel }: RecipeFormProps) {
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [useImageUrl, setUseImageUrl] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingRecipe?.title || "",
      ingredients: editingRecipe?.ingredients || "",
      description: editingRecipe?.description || "",
      category: editingRecipe?.category || "",
      sub_category: editingRecipe?.sub_category || "",
      image_url: editingRecipe?.image_url || "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const recipeData = {
      ...values,
      user_id: session.user.id,
    } as Recipe;

    if (editingRecipe) {
      const { error } = await supabase
        .from("recipes")
        .update(recipeData)
        .eq('id', editingRecipe.id);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de modifier la recette",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "La recette a été modifiée",
      });
    } else {
      const { error } = await supabase
        .from("recipes")
        .insert(recipeData);

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter la recette",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Succès",
        description: "La recette a été ajoutée",
      });
    }

    form.reset();
    onSuccess();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file);

      if (uploadError) {
        toast({
          title: "Erreur",
          description: "Impossible d'uploader l'image",
          variant: "destructive",
        });
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      form.setValue("image_url", publicUrl);
      setShowImageDialog(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Titre</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ingredients"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ingrédients</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Un ingrédient par ligne" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instructions</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Les étapes de la recette" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Catégorie</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une catégorie" />
                    </SelectTrigger>
                  </FormControl>
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
                <FormMessage />
              </FormItem>
            )}
          />

          {form.watch("category") === "Plats" && (
            <FormField
              control={form.control}
              name="sub_category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sous-catégorie</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une sous-catégorie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Viande">Viande</SelectItem>
                      <SelectItem value="Volaille">Volaille</SelectItem>
                      <SelectItem value="Poisson">Poisson</SelectItem>
                      <SelectItem value="Fruits de mer">Fruits de mer</SelectItem>
                      <SelectItem value="Légumes">Légumes</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="image_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {field.value && (
                      <img 
                        src={field.value} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-md"
                      />
                    )}
                    <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          {field.value ? "Modifier l'image" : "Ajouter une image"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Ajouter une image</DialogTitle>
                          <DialogDescription>
                            Choisissez comment ajouter votre image
                          </DialogDescription>
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
                                  const fileExt = file.name.split('.').pop();
                                  const filePath = `${Date.now()}.${fileExt}`;
                                  
                                  supabase.storage
                                    .from('recipe-images')
                                    .upload(filePath, file)
                                    .then(({ data, error }) => {
                                      if (error) {
                                        toast({
                                          title: "Erreur",
                                          description: "Impossible d'uploader l'image",
                                          variant: "destructive",
                                        });
                                        return;
                                      }
                                      
                                      const { data: { publicUrl } } = supabase.storage
                                        .from('recipe-images')
                                        .getPublicUrl(filePath);
                                      
                                      field.onChange(publicUrl);
                                      setShowImageDialog(false);
                                    });
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
                                field.onChange(e.target.value);
                              }}
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                field.onChange(imageUrl);
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
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button type="submit">
              {editingRecipe ? "Modifier la recette" : "Ajouter la recette"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default RecipeForm;
