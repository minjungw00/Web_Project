import { Outlet } from 'react-router-dom';

import Footer from '@/features/layout/Footer';
import Header from '@/features/layout/Header';
import '@/features/layout/layout.css';

const AppLayout = (): React.ReactElement => (
  <div className="app-shell">
    <Header />
    <main className="app-main">
      <div className="app-main-content">
        <Outlet />
      </div>
    </main>
    <Footer />
  </div>
);

export default AppLayout;
