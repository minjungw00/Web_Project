import { createBrowserRouter } from 'react-router-dom';

import ErrorBoundary from '@/app/providers/ErrorBoundary';
import AppLayout from '@/features/layout/AppLayout';
import BlogDetailPage from '@/pages/blog/BlogDetailPage';
import BlogListPage from '@/pages/blog/BlogListPage';
import HomePage from '@/pages/home/HomePage';
import PortfolioDetailPage from '@/pages/portfolio/PortfolioDetailPage';
import PortfolioListPage from '@/pages/portfolio/PortfolioListPage';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/portfolio', element: <PortfolioListPage /> },
      { path: '/portfolio/:id', element: <PortfolioDetailPage /> },
      { path: '/blog', element: <BlogListPage /> },
      { path: '/blog/:id', element: <BlogDetailPage /> },
    ],
  },
]);

export default router;
