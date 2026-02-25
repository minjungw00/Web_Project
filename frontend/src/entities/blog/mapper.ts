import type { BlogPost, BlogPostDto } from '@/entities/blog/types';
import type { SupportedLanguage } from '@/shared/i18n/language';

const toBlogPost = (
  dto: BlogPostDto,
  language: SupportedLanguage,
): BlogPost => ({
  id: dto.id,
  date: dto.date,
  title: dto.title[language],
  description: dto.description[language],
  badges: dto.badges,
  category: dto.category,
  mediaSrc: dto.mediaSrc,
  mediaAlt: dto.mediaAlt?.[language],
});

export default toBlogPost;
