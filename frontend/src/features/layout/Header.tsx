import { useState } from 'react';

import { RiMenuLine } from '@remixicon/react';
import { Link } from 'react-router-dom';

import Navigation from '@/features/layout/Navigation';

const Header = (): React.ReactElement => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="app-header">
      <div className="app-header-inner app-header-mobile">
        <Link className="app-brand" to="/">
          <span aria-hidden="true" className="app-brand-dot" />
          <span className="app-brand-name">minjungw00</span>
        </Link>
        <button
          aria-label="toggle navigation"
          className="app-menu-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          type="button"
        >
          <RiMenuLine aria-hidden="true" className="app-menu-icon" />
        </button>
      </div>
      <div className="app-header-inner app-header-desktop">
        <Link className="app-brand" to="/">
          <span aria-hidden="true" className="app-brand-dot" />
          <span className="app-brand-name">minjungw00</span>
        </Link>
        <Navigation />
      </div>
      {menuOpen ? (
        <div className="app-header-menu-mobile">
          <Navigation />
        </div>
      ) : null}
    </header>
  );
};

export default Header;
