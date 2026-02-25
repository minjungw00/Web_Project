import type { BlogPost, BlogPostDto } from '@/entities/blog/types';

const toBlogPost = (dto: BlogPostDto): BlogPost => ({
  id: dto.id,
  date: dto.date,
  title: dto.title,
  description: dto.description,
  badges: dto.badges,
  category: dto.category,
  mediaSrc: dto.mediaSrc,
  mediaAlt: dto.mediaAlt,
});

export default toBlogPost;
