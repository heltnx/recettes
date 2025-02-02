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

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  ingredients: z.string().min(1, "Les ingrédients sont requis"),
  description: z.string().min(1, "La description est requise"),
  category: z.string().min(1, "La catégorie est requise"),
  subCategory: z.string().optional(),
});

export default function Index() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      ingredients: "",
      description: "",
      category: "",
      subCategory: "",
    },
  });

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase.from("recipes").insert({
      ...values,
      user_id: session.user.id,
    });

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

    form.reset();
    setIsAddingRecipe(false);
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
          <div className="mb-8 flex justify-between items-center">
            <Input
              type="search"
              placeholder="Rechercher une recette..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
            <Button onClick={() => setIsAddingRecipe(!isAddingRecipe)}>
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
                            <SelectItem value="Desserts">Desserts</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subCategory"
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
                            <SelectItem value="Crustacés">Crustacés</SelectItem>
                            <SelectItem value="Légumes">Légumes</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit">Ajouter la recette</Button>
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
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}