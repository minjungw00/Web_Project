import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import PortfolioDetailPage from '@/pages/portfolio/PortfolioDetailPage';

describe('PortfolioDetailPage', () => {
  it('renders project id from route params', () => {
    render(
      <MemoryRouter initialEntries={['/portfolio/edge-runtime']}>
        <Routes>
          <Route element={<PortfolioDetailPage />} path="/portfolio/:id" />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /portfolio detail/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/project id: edge-runtime/i)).toBeInTheDocument();
  });

  it('uses unknown when route param is missing', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <PortfolioDetailPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/project id: unknown/i)).toBeInTheDocument();
  });
});
