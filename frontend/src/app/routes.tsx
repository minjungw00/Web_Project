import { createBrowserRouter } from 'react-router-dom';

import ErrorBoundary from '@/app/providers/ErrorBoundary';
import AppLayout from '@/features/layout/AppLayout';
import BlogDetailPage from '@/pages/blog/BlogDetailPage';
import BlogListPage from '@/pages/blog/BlogListPage';
import ErrorPage from '@/pages/error/ErrorPage';
import HomePage from '@/pages/home/HomePage';
import ComponentsMiniGamePage from '@/pages/mini-games/components/ComponentsMiniGamePage';
import MiniGamesPage from '@/pages/mini-games/MiniGamesPage';
import PortfolioDetailPage from '@/pages/portfolio/PortfolioDetailPage';
import PortfolioListPage from '@/pages/portfolio/PortfolioListPage';
import WorkInProgressPage from '@/pages/working/WorkInProgressPage';

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      {
        errorElement: <ErrorBoundary />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'portfolio', element: <PortfolioListPage /> },
          { path: 'portfolio/:id', element: <PortfolioDetailPage /> },
          { path: 'blog', element: <BlogListPage /> },
          { path: 'blog/:id', element: <BlogDetailPage /> },
          { path: 'cs-docs', element: <WorkInProgressPage /> },
          { path: 'mini-games', element: <MiniGamesPage /> },
          {
            path: 'mini-games/components',
            element: <ComponentsMiniGamePage />,
          },
          { path: '*', element: <ErrorPage message="404 Not Found" /> },
        ],
      },
    ],
  },
]);

export default router;
