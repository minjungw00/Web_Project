import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import Article from '@/shared/ui/Article';
import Card from '@/shared/ui/Card';
import IconButton from '@/shared/ui/IconButton';
import ProjectCard from '@/shared/ui/ProjectCard';
import SearchFilter from '@/shared/ui/SearchFilter';

describe('shared ui components', () => {
  it('renders custom icon in icon button', () => {
    render(<IconButton aria-label="menu" icon="★" />);

    expect(screen.getByRole('button', { name: /menu/i })).toHaveTextContent(
      '★',
    );
  });

  it('renders card with custom icon slot', () => {
    render(<Card description="description" icon="⚡" title="Architecture" />);

    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('⚡')).toBeInTheDocument();
  });

  it('renders search filter desktop mode and handles interactions', () => {
    const onQueryChange = vi.fn();
    const onSelectCategory = vi.fn();

    render(
      <SearchFilter
        mode="Desktop"
        onQueryChange={onQueryChange}
        onSelectCategory={onSelectCategory}
        query=""
        selectedCategoryId="all"
        categories={[
          { id: 'all', label: 'All' },
          { id: 'frontend', label: 'Frontend' },
        ]}
      />,
    );

    const wrapper = screen.getByRole('searchbox').closest('section');
    expect(wrapper).toHaveClass('desktop');

    fireEvent.click(screen.getByRole('button', { name: /frontend/i }));
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'react' },
    });

    expect(onSelectCategory).toHaveBeenCalledWith('frontend');
    expect(onQueryChange).toHaveBeenCalledWith('react');
  });

  it('renders article with desktop mode class', () => {
    const { container } = render(
      <Article
        badges={['React']}
        date="Jan 01, 2026"
        description="description"
        mode="Desktop"
        title="title"
      />,
    );

    expect(screen.getByText('title').closest('article')).toHaveClass('desktop');
    expect(
      container.querySelector('.ui-article-media'),
    ).not.toBeInTheDocument();
  });

  it('renders article media only when media source exists', () => {
    const { container } = render(
      <Article
        badges={['React']}
        date="Jan 01, 2026"
        description="description"
        mediaAlt="article media"
        mediaSrc="/vite.svg"
        mode="Mobile"
        title="title"
      />,
    );

    expect(screen.getAllByAltText('article media')).toHaveLength(2);

    const content = container.querySelector('.ui-article-content');
    const media = content?.querySelector('.ui-article-media.mobile-only');
    const badgeList = content?.querySelector('.ui-badge-list');

    expect(media).toBeInTheDocument();
    expect(badgeList).toBeInTheDocument();
    expect(media?.compareDocumentPosition(badgeList as Node)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('supports empty project card footer label', () => {
    const { container } = render(
      <ProjectCard
        badges={['React']}
        description="description"
        footerLabel=""
        title="Portfolio Item"
      />,
    );

    expect(screen.queryByText(/view project/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText('project-link')).toBeInTheDocument();
    expect(
      container.querySelector('.ui-project-media'),
    ).not.toBeInTheDocument();
  });

  it('renders project media only when media source exists', () => {
    render(
      <ProjectCard
        description="description"
        mediaAlt="project media"
        mediaSrc="/vite.svg"
        title="Portfolio Item"
      />,
    );

    expect(screen.getByAltText('project media')).toBeInTheDocument();
  });
});
