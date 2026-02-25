import Category from '@/shared/ui/Category';
import SearchBar from '@/shared/ui/SearchBar';
import cn from '@/shared/ui/utils';

import type { CategoryItem, UiMode } from '@/shared/ui/types';

export interface SearchFilterProps {
  mode?: Extract<UiMode, 'Mobile' | 'Desktop'>;
  categories: CategoryItem[];
  selectedCategoryId?: string;
  query: string;
  placeholder?: string;
  onSelectCategory?: (id: string) => void;
  onQueryChange?: (query: string) => void;
  searchIcon?: React.ReactNode;
}

const SearchFilter = ({
  categories,
  mode = 'Mobile',
  onQueryChange,
  onSelectCategory,
  placeholder,
  query,
  searchIcon,
  selectedCategoryId,
}: SearchFilterProps): React.ReactElement => {
  const isDesktop = mode === 'Desktop';

  return (
    <section
      className={cn('ui-search-filter', isDesktop ? 'desktop' : 'mobile')}
    >
      <div className="ui-search-filter-categories">
        {categories.map((category) => {
          const selected = category.id === selectedCategoryId;

          return (
            <Category
              key={category.id}
              icon={category.icon}
              onClick={() => onSelectCategory?.(category.id)}
              selected={selected}
            >
              {category.label}
            </Category>
          );
        })}
      </div>

      <SearchBar
        icon={searchIcon}
        onChange={(event) => onQueryChange?.(event.target.value)}
        placeholder={placeholder}
        value={query}
      />
    </section>
  );
};

SearchFilter.defaultProps = {
  mode: 'Mobile',
  onQueryChange: undefined,
  onSelectCategory: undefined,
  placeholder: undefined,
  searchIcon: undefined,
  selectedCategoryId: undefined,
};

export default SearchFilter;
