import { Category, SubCategory } from "@/types/recipe";
import { cn } from "@/lib/utils";

interface SidebarProps {
  selectedCategory: Category | null;
  onSelectCategory: (category: Category) => void;
}

const categories: { name: Category; subCategories?: SubCategory[] }[] = [
  { name: "Apéros" },
  { name: "Entrées" },
  { 
    name: "Plats",
    subCategories: ["Viande", "Volaille", "Poisson", "Crustacés", "Légumes"]
  },
  { name: "Salades" },
  { name: "Desserts" }
];

export function Sidebar({ selectedCategory, onSelectCategory }: SidebarProps) {
  return (
    <div className="pb-12 w-64">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Catégories
          </h2>
          <div className="space-y-1">
            {categories.map((category) => (
              <div key={category.name}>
                <button
                  onClick={() => onSelectCategory(category.name)}
                  className={cn(
                    "w-full flex items-center justify-between py-2 px-4 text-sm font-medium rounded-md hover:bg-recipe-100 transition-colors",
                    selectedCategory === category.name && "bg-recipe-200"
                  )}
                >
                  {category.name}
                </button>
                {category.subCategories && selectedCategory === category.name && (
                  <div className="ml-4 space-y-1 mt-1">
                    {category.subCategories.map((sub) => (
                      <button
                        key={sub}
                        className="w-full text-left py-1 px-4 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}