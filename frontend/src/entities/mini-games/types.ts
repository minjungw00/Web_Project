import type { SupportedLanguage } from '@/shared/i18n/language';

export type LocalizedText = Record<SupportedLanguage, string>;

export interface MiniGame {
  id: string;
  to: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: string;
}

export interface MiniGameDto {
  id: string;
  to: string;
  title: LocalizedText;
  description: LocalizedText;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: LocalizedText;
}
