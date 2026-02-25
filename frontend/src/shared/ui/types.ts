import type { ReactNode } from 'react';

export type UiMode = 'Mobile' | 'Tablet' | 'Desktop';

export interface CategoryItem {
  id: string;
  label: string;
  icon?: ReactNode;
}
