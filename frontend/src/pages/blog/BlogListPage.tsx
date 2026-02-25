import { useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { filterBlogPosts, listBlogPosts } from '@/application/blog/usecases';
import '@/pages/blog/blog.css';
import { Article, SearchFilter } from '@/shared/ui';

import type { CategoryItem } from '@/shared/ui/types';

const BlogListPage = (): React.ReactElement => {
  const { i18n, t } = useTranslation();
  const posts = useMemo(
    () => listBlogPosts(i18n.resolvedLanguage),
    [i18n.resolvedLanguage],
  );
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const categories: CategoryItem[] = [
    { id: 'all', label: t('blog.categories.all') },
    { id: 'frontend', label: t('blog.categories.frontend') },
    { id: 'engineering', label: t('blog.categories.engineering') },
    { id: 'ops', label: t('blog.categories.ops') },
  ];

  const filteredPosts = useMemo(
    () => filterBlogPosts(posts, query, category),
    [category, posts, query],
  );

  return (
    <div className="blog-page">
      <section className="blog-hero">
        <h1>
          {t('blog.hero.title')}
          <span className="blog-hero-accent">.</span>
        </h1>
        <p>{t('blog.hero.description')}</p>
      </section>

      <section aria-label="blog posts" className="blog-main">
        <SearchFilter
          categories={categories}
          mode="Desktop"
          onQueryChange={setQuery}
          onSelectCategory={setCategory}
          placeholder={t('blog.searchPlaceholder')}
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
