import { RiSearchLine } from '@remixicon/react';

import cn from '@/shared/ui/utils';

import type { InputHTMLAttributes, ReactNode } from 'react';

export interface SearchBarProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  icon?: ReactNode;
  wrapperClassName?: string;
}

const SearchBar = ({
  className,
  icon = <RiSearchLine aria-hidden="true" className="ui-search-icon-svg" />,
  placeholder = 'Search...',
  wrapperClassName,
  ...rest
}: SearchBarProps): React.ReactElement => (
  <div className={cn('ui-searchbar', wrapperClassName)}>
    <div className="ui-searchbar-wrap">
      <span aria-hidden="true" className="ui-search-icon">
        {icon}
      </span>
      <input
        {...rest}
        className={cn('ui-search-input', className)}
        placeholder={placeholder}
        type={rest.type ?? 'search'}
      />
    </div>
  </div>
);

SearchBar.defaultProps = {
  icon: <RiSearchLine aria-hidden="true" className="ui-search-icon-svg" />,
  wrapperClassName: undefined,
};

export default SearchBar;
