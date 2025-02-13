export type Category = 
  | "Apéros"
  | "Entrées"
  | "Plats"
  | "Salades"
  | "Desserts"
  | "Soupes"
  | "Autres";

export type SubCategory = 
  | "Viande"
  | "Volaille"
  | "Poisson"
  | "Crustacés"
  | "Légumes";

export interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  description: string;
  category: Category;
  sub_category?: SubCategory;
  image_url?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}