import toMiniGame from '@/entities/mini-games/mapper';
import getMiniGameDtos from '@/shared/api/mini-games';

import type { MiniGame } from '@/entities/mini-games/types';

const listMiniGames = (): MiniGame[] => getMiniGameDtos().map(toMiniGame);

export default listMiniGames;
