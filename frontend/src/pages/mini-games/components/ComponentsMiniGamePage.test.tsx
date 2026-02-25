import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ComponentsMiniGamePage from '@/pages/mini-games/components/ComponentsMiniGamePage';

describe('ComponentsMiniGamePage', () => {
  it('renders all reusable components and handles search interactions', () => {
    render(<ComponentsMiniGamePage />);

    expect(
      screen.getByRole('heading', { name: /components lab/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Card', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /badge, category & icon/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /buttons & status/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /button & iconbutton snapshots/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'ProjectCard & Article', level: 2 }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'ProjectCard & Article Snapshots',
        level: 2,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /search components/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /search snapshots/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Reusable Article Component/i)).toBeInTheDocument();
    expect(screen.getByText(/Components Playground/i)).toBeInTheDocument();
    expect(screen.getAllByText('Disabled').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^Hover$/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText(/Hover \(이미지 없음\)/i).length,
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/이미지 없음/i).length).toBeGreaterThan(0);

    const [searchInput] = screen.getAllByRole('searchbox');
    fireEvent.change(searchInput, { target: { value: 'infra' } });
    expect(searchInput).toHaveValue('infra');

    const searchComponentsHeading = screen.getByRole('heading', {
      name: /search components/i,
    });
    const searchComponentsSection = searchComponentsHeading.closest('section');

    expect(searchComponentsSection).not.toBeNull();

    const [frontendButton] = within(
      searchComponentsSection as HTMLElement,
    ).getAllByRole('button', { name: /frontend/i });

    fireEvent.click(frontendButton);
    expect(frontendButton).toHaveClass('is-selected');
  });
});
