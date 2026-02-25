import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import BlogListPage from '@/pages/blog/BlogListPage';

describe('BlogListPage', () => {
  it('renders hero and initial posts', () => {
    render(<BlogListPage />);

    expect(
      screen.getByRole('heading', { name: /^blog\s*\.$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/documentation of my engineering journey/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /moving to the edge: why rust is the future of serverless/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /building monitoring with docker compose/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: /feature-first frontend architecture notes/i,
        level: 3,
      }),
    ).toBeInTheDocument();
  });

  it('filters posts by search query and category', () => {
    render(<BlogListPage />);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'monitoring' },
    });

    expect(
      screen.getByRole('heading', {
        name: /building monitoring with docker compose/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /moving to the edge: why rust is the future of serverless/i,
        level: 3,
      }),
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /frontend/i }));

    expect(
      screen.getByRole('heading', {
        name: /feature-first frontend architecture notes/i,
        level: 3,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: /building monitoring with docker compose/i,
        level: 3,
      }),
    ).not.toBeInTheDocument();
  });
});
