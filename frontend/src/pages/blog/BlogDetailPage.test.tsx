import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import BlogDetailPage from '@/pages/blog/BlogDetailPage';

describe('BlogDetailPage', () => {
  it('renders post id from route params', () => {
    render(
      <MemoryRouter initialEntries={['/blog/frontend-architecture']}>
        <Routes>
          <Route element={<BlogDetailPage />} path="/blog/:id" />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: /blog detail/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/post id: frontend-architecture/i),
    ).toBeInTheDocument();
  });

  it('uses unknown when route param is missing', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <BlogDetailPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/post id: unknown/i)).toBeInTheDocument();
  });
});
