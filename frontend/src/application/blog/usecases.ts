import toBlogPost from '@/entities/blog/mapper';
import getBlogPostDtos from '@/shared/api/blog';

import type { BlogPost } from '@/entities/blog/types';

export const listBlogPosts = (): BlogPost[] =>
  getBlogPostDtos().map(toBlogPost);

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
