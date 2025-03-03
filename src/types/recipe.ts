
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
  | "Fruits de mer"
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
  shared_by_name?: string;
  created_at?: string;
  updated_at?: string;
}
