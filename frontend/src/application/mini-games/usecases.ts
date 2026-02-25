import toMiniGame from '@/entities/mini-games/mapper';
import getMiniGameDtos from '@/shared/api/mini-games';
import { resolveSupportedLanguage } from '@/shared/i18n/language';

import type { MiniGame } from '@/entities/mini-games/types';
import type { SupportedLanguage } from '@/shared/i18n/language';

const listMiniGames = (language?: string): MiniGame[] => {
  const supportedLanguage: SupportedLanguage =
    resolveSupportedLanguage(language);

  return getMiniGameDtos().map((dto) => toMiniGame(dto, supportedLanguage));
};

export default listMiniGames;
