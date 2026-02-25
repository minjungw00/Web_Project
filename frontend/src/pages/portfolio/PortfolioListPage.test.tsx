import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import PortfolioListPage from '@/pages/portfolio/PortfolioListPage';

describe('PortfolioListPage', () => {
  it('renders hero and project cards', () => {
    render(<PortfolioListPage />);

    expect(
      screen.getByRole('heading', { name: /^portfolio\s*\.$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /a collection of technical experiments and full-stack solutions/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /edge runtime migration/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /observability platform/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /blue green delivery/i, level: 3 }),
    ).toBeInTheDocument();
  });
});
