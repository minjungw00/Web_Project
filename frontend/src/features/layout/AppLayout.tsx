import { Outlet } from 'react-router-dom';

import Footer from '@/features/layout/Footer';
import Header from '@/features/layout/Header';

const AppLayout = (): React.ReactElement => (
  <div>
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default AppLayout;
