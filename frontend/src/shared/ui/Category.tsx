import cn from '@/shared/ui/utils';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface CategoryProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  selected?: boolean;
}

const Category = ({
  children,
  className,
  icon,
  selected = false,
  type,
  ...rest
}: CategoryProps): React.ReactElement => (
  <button
    {...rest}
    className={cn('ui-category', selected && 'is-selected', className)}
    type={type === 'submit' ? 'submit' : 'button'}
  >
    {icon ? <span aria-hidden="true">{icon}</span> : null}
    <span>{children ?? 'Category'}</span>
  </button>
);

Category.defaultProps = {
  icon: undefined,
  selected: false,
};

export default Category;
