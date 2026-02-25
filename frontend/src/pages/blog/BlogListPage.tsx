import { useMemo, useState } from 'react';

import { filterBlogPosts, listBlogPosts } from '@/application/blog/usecases';
import '@/pages/blog/blog.css';
import { Article, SearchFilter } from '@/shared/ui';

import type { CategoryItem } from '@/shared/ui/types';

const BLOG_CATEGORIES: CategoryItem[] = [
  { id: 'all', label: 'All' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'ops', label: 'Ops' },
];

const BlogListPage = (): React.ReactElement => {
  const posts = useMemo(() => listBlogPosts(), []);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const filteredPosts = useMemo(
    () => filterBlogPosts(posts, query, category),
    [category, posts, query],
  );

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <h1>
          Blog
          <span className="blog-hero-accent">.</span>
        </h1>
        <p>
          Documentation of my engineering journey, architectural deep-dives, and
          insights into building performant web systems.
        </p>
      </section>

      <section aria-label="blog posts" className="blog-main">
        <SearchFilter
          categories={BLOG_CATEGORIES}
          mode="Desktop"
          onQueryChange={setQuery}
          onSelectCategory={setCategory}
          query={query}
          selectedCategoryId={category}
        />

        <div className="blog-list">
          {filteredPosts.map((post) => (
            <Article
              key={post.id}
              badges={post.badges}
              className="blog-post-card"
              date={post.date}
              description={post.description}
              mediaAlt={post.mediaAlt}
              mediaSrc={post.mediaSrc}
              mode="Desktop"
              title={post.title}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

export default BlogListPage;
