import { Category } from '@/types/pos';
import { cn } from '@/lib/utils';
import { Utensils, Coffee, Cookie, Cake, LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  utensils: Utensils,
  coffee: Coffee,
  cookie: Cookie,
  cake: Cake,
};

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelectCategory(null)}
        className={cn(
          'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200',
          selectedCategory === null
            ? 'gradient-primary text-primary-foreground shadow-lg pos-shadow'
            : 'bg-secondary text-secondary-foreground hover:bg-muted'
        )}
      >
        <LayoutGrid className="h-4 w-4" />
        Semua
      </button>
      {categories.map((category) => {
        const Icon = category.icon ? iconMap[category.icon] : LayoutGrid;
        return (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200',
              selectedCategory === category.id
                ? 'gradient-primary text-primary-foreground shadow-lg pos-shadow'
                : 'bg-secondary text-secondary-foreground hover:bg-muted'
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {category.name}
          </button>
        );
      })}
    </div>
  );
}
