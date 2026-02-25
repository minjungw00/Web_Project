import type { MiniGame, MiniGameDto } from '@/entities/mini-games/types';

const toMiniGame = (dto: MiniGameDto): MiniGame => ({
  id: dto.id,
  to: dto.to,
  title: dto.title,
  description: dto.description,
  badges: dto.badges,
  mediaSrc: dto.mediaSrc,
  mediaAlt: dto.mediaAlt,
});

export default toMiniGame;
