import type { MiniGame, MiniGameDto } from '@/entities/mini-games/types';
import type { SupportedLanguage } from '@/shared/i18n/language';

const toMiniGame = (
  dto: MiniGameDto,
  language: SupportedLanguage,
): MiniGame => ({
  id: dto.id,
  to: dto.to,
  title: dto.title[language],
  description: dto.description[language],
  badges: dto.badges,
  mediaSrc: dto.mediaSrc,
  mediaAlt: dto.mediaAlt?.[language],
});

export default toMiniGame;
