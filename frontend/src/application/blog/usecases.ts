import toBlogPost from '@/entities/blog/mapper';
import getBlogPostDtos from '@/shared/api/blog';
import { resolveSupportedLanguage } from '@/shared/i18n/language';

import type { BlogPost } from '@/entities/blog/types';
import type { SupportedLanguage } from '@/shared/i18n/language';

export const listBlogPosts = (language?: string): BlogPost[] => {
  const supportedLanguage: SupportedLanguage =
    resolveSupportedLanguage(language);

  return getBlogPostDtos().map((dto) => toBlogPost(dto, supportedLanguage));
};

export const filterBlogPosts = (
  posts: BlogPost[],
  query: string,
  category: string,
): BlogPost[] =>
  posts.filter((post) => {
    const categoryMatches = category === 'all' || post.category === category;
    const queryMatches =
      query.trim().length === 0 ||
      post.title.toLowerCase().includes(query.toLowerCase()) ||
      post.description.toLowerCase().includes(query.toLowerCase());

    return categoryMatches && queryMatches;
  });
