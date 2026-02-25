import type { SupportedLanguage } from '@/shared/i18n/language';

export type LocalizedText = Record<SupportedLanguage, string>;

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: string;
}

export interface PortfolioProjectDto {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: LocalizedText;
}
