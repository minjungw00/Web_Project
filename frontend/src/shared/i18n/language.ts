export type SupportedLanguage = 'en' | 'ko';

export const resolveSupportedLanguage = (
  language?: string,
): SupportedLanguage =>
  language?.toLowerCase().startsWith('ko') ? 'ko' : 'en';
