export type Category = 
  | "Apéros"
  | "Entrées"
  | "Plats"
  | "Salades"
  | "Desserts";

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
  subCategory?: SubCategory;
  imageUrl?: string;
}