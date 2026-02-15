import { NavLink } from 'react-router-dom';

const Navigation = (): React.ReactElement => (
  <nav aria-label="Primary">
    <NavLink to="/">Home</NavLink>
    {' | '}
    <NavLink to="/portfolio">Portfolio</NavLink>
    {' | '}
    <NavLink to="/blog">Blog</NavLink>
  </nav>
);

export default Navigation;
