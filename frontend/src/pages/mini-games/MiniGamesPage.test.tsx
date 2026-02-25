import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import MiniGamesPage from '@/pages/mini-games/MiniGamesPage';

describe('MiniGamesPage', () => {
  it('renders hero and project cards', () => {
    render(
      <MemoryRouter>
        <MiniGamesPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /mini games\s*\./i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Small interactive experiments for testing UI patterns/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Components Lab/i)).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(
      screen.getByRole('link', { name: /Components Lab/i }),
    ).toHaveAttribute('href', '/mini-games/components');
  });
});
