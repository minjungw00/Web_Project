import {
  RiArticleLine,
  RiBookOpenLine,
  RiBriefcase4Line,
  RiGamepadLine,
} from '@remixicon/react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/shared/ui/index';

import type { ReactNode } from 'react';

interface NavigationItem {
  to: string;
  label: string;
  icon?: ReactNode;
}

interface NavigationProps {
  items?: NavigationItem[];
}

const defaultItems: NavigationItem[] = [
  {
    to: '/portfolio',
    label: 'Portfolio',
    icon: <RiBriefcase4Line aria-hidden="true" className="app-nav-icon" />,
  },
  {
    to: '/blog',
    label: 'Blog',
    icon: <RiArticleLine aria-hidden="true" className="app-nav-icon" />,
  },
  {
    to: '/cs-docs',
    label: 'Docs',
    icon: <RiBookOpenLine aria-hidden="true" className="app-nav-icon" />,
  },
  {
    to: '/mini-games',
    label: 'Mini Games',
    icon: <RiGamepadLine aria-hidden="true" className="app-nav-icon" />,
  },
];

const Navigation = ({
  items = defaultItems,
}: NavigationProps): React.ReactElement => (
  <nav aria-label="Primary" className="app-nav">
    <ul className="nav-list">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            className={({ isActive }) =>
              cn('nav-link', isActive && 'nav-link-active')
            }
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  </nav>
);

Navigation.defaultProps = {
  items: defaultItems,
};

export default Navigation;
