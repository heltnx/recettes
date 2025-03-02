import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { RecipeCard } from "@/components/RecipeCard";
import { Category, Recipe, SubCategory } from "@/types/recipe";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Image, Link, Share2 } from "lucide-react";
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

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [useImageUrl, setUseImageUrl] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareURL, setShareURL] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      ingredients: "",
      description: "",
      category: "",
      sub_category: "",
      image_url: "",
    },
  });

  const fetchRecipes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const email = session.user.email || "";
    const username = email.split('@')[0];
    setUserDisplayName(username);
    
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq('user_id', session.user.id)
      .order('title', { ascending: true });

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les recettes",
        variant: "destructive",
      });
      return;
    }

    setRecipes(data as Recipe[]);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

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
    setIsAddingRecipe(false);
    setEditingRecipe(null);
    fetchRecipes();
  };

  const handleEdit = async (recipe: Recipe) => {
    const { error } = await supabase
      .from("recipes")
      .update({
        ...recipe,
        image_url: recipe.image_url
      })
      .eq('id', recipe.id);

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

    fetchRecipes();
  };

  const handleDelete = async (recipe: Recipe) => {
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq('id', recipe.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la recette",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Succès",
      description: "La recette a été supprimée",
    });

    fetchRecipes();
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

  const handleRecipeImageUpload = async (recipe: Recipe, file: File) => {
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

    const updatedRecipe = {
      ...recipe,
      image_url: publicUrl
    };
    
    await handleEdit(updatedRecipe);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Erreur lors de la déconnexion:", error);
        toast({
          title: "Erreur",
          description: "Impossible de se déconnecter",
          variant: "destructive",
        });
        return;
      }
      
      navigate("/auth");
    } catch (error) {
      console.error("Exception lors de la déconnexion:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    setSelectedSubCategory(null);
    setExpandedRecipeId(null);
  };

  const handleSubCategorySelect = (subCategory: SubCategory | null) => {
    setSelectedSubCategory(subCategory);
    setExpandedRecipeId(null);
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
    const matchesSubCategory = !selectedSubCategory || recipe.sub_category === selectedSubCategory;
    const matchesSearch = recipe.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSubCategory && matchesSearch;
  });

  const generateShareLink = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const shareUrl = `${window.location.origin}/shared?user=${session.user.id}`;
    setShareURL(shareUrl);
    setShowShareDialog(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareURL)
      .then(() => {
        toast({
          title: "Lien copié",
          description: "Le lien a été copié dans le presse-papier",
        });
      })
      .catch(() => {
        toast({
          title: "Erreur",
          description: "Impossible de copier le lien",
          variant: "destructive",
        });
      });
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
        <header className="bg-white border-b p-4 shadow-sm flex justify-between items-center">
          <div className="flex-1"></div>
          <h1 className="text-2xl font-bold text-center flex-1">Les recettes de {userDisplayName}</h1>
          <div className="flex-1 flex justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateShareLink}
              className="flex items-center gap-2"
            >
              <Share2 className="h-4 w-4" />
              Partager
            </Button>
          </div>
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
              <Button onClick={() => {
                setIsAddingRecipe(!isAddingRecipe);
                if (!isAddingRecipe) {
                  setEditingRecipe(null);
                  form.reset();
                }
              }}>
                {isAddingRecipe ? "Annuler" : "Ajouter une recette"}
              </Button>
            </div>

            {isAddingRecipe ? (
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

                    <Button type="submit">
                      {editingRecipe ? "Modifier la recette" : "Ajouter la recette"}
                    </Button>
                  </form>
                </Form>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isExpanded={expandedRecipeId === recipe.id}
                    onClick={() => setExpandedRecipeId(
                      expandedRecipeId === recipe.id ? null : recipe.id
                    )}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onImageUpload={handleRecipeImageUpload}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Partager mes recettes</DialogTitle>
            <DialogDescription>
              Utilisez ce lien pour partager vos recettes en lecture seule
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-4">
            <Input 
              value={shareURL} 
              readOnly 
              className="flex-1"
            />
            <Button onClick={copyToClipboard} variant="outline">
              Copier
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
