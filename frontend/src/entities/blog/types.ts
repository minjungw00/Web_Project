import type { SupportedLanguage } from '@/shared/i18n/language';

export type LocalizedText = Record<SupportedLanguage, string>;

export interface BlogPost {
  id: string;
  date: string;
  title: string;
  description: string;
  badges: string[];
  category: string;
  mediaSrc?: string;
  mediaAlt?: string;
}

export interface BlogPostDto {
  id: string;
  date: string;
  title: LocalizedText;
  description: LocalizedText;
  badges: string[];
  category: string;
  mediaSrc?: string;
  mediaAlt?: LocalizedText;
}
