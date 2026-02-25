import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import BlogListPage from '@/pages/blog/BlogListPage';
import HomePage from '@/pages/home/HomePage';
import MiniGamesPage from '@/pages/mini-games/MiniGamesPage';
import PortfolioListPage from '@/pages/portfolio/PortfolioListPage';

describe('HomePage', () => {
  it('renders new home hero heading and section cards', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Structured/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligence\./i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Mini Games/i }),
    ).toBeInTheDocument();
  });

  it('moves component sandbox content to mini games page', () => {
    render(
      <MemoryRouter>
        <MiniGamesPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Mini Games/i)).toBeInTheDocument();
  });

  it('renders project cards on portfolio page', () => {
    render(
      <MemoryRouter>
        <PortfolioListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Portfolio/i)).not.toBeNull();
    expect(
      screen.getByText(/A collection of technical experiments/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Edge Runtime Migration/i)).not.toBeNull();
  });

  it('renders article list on blog page', () => {
    render(
      <MemoryRouter>
        <BlogListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Blog/i)).not.toBeNull();
    expect(screen.getByText(/Moving to the Edge/i)).not.toBeNull();
  });
});
