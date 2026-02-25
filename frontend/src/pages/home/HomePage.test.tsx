import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import HomePage from '@/pages/home/HomePage';

describe('HomePage', () => {
  it('renders hero text and section links', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /structured/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/intelligence\./i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /portfolio/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /blog/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /cs docs/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /mini games/i }),
    ).toBeInTheDocument();
  });
});
