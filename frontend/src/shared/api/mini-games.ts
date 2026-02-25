import gamesImage from '@/assets/icons/card-games-bg.svg';
import portfolioImage from '@/assets/icons/card-portfolio-bg.svg';

interface MiniGameDto {
  id: string;
  to: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc: string;
  mediaAlt: string;
}

const MINI_GAME_DTOS: MiniGameDto[] = [
  {
    id: 'components-lab',
    to: '/mini-games/components',
    title: 'Components Lab',
    description:
      '재사용 가능한 UI 컴포넌트를 나열하고 상호작용을 점검하는 테스트 미니게임입니다.',
    badges: ['UI', 'Components', 'Test'],
    mediaSrc: portfolioImage,
    mediaAlt: 'Reusable components lab preview',
  },
  {
    id: 'reusable-ui-playground',
    to: '/mini-games',
    title: 'Reusable UI Playground',
    description:
      'Button, Badge, Search 등 공용 컴포넌트 조합을 검증하는 테스트형 미니게임입니다.',
    badges: ['UI', 'Test', 'Playground'],
    mediaSrc: gamesImage,
    mediaAlt: 'Reusable UI playground preview',
  },
  {
    id: 'routing-memory-lab',
    to: '/mini-games',
    title: 'Routing Memory Lab',
    description:
      '라우팅 상태 전환을 퍼즐처럼 풀며 화면 전이와 상태 복원을 점검합니다.',
    badges: ['Router', 'State', 'Puzzle'],
    mediaSrc: portfolioImage,
    mediaAlt: 'Routing memory lab preview',
  },
  {
    id: 'token-match-arena',
    to: '/mini-games',
    title: 'Token Match Arena',
    description:
      '디자인 토큰 매칭 규칙을 게임화해 컬러/타이포 일관성을 빠르게 확인합니다.',
    badges: ['Design', 'Token', 'Match'],
    mediaSrc: gamesImage,
    mediaAlt: 'Token match arena preview',
  },
];

const getMiniGameDtos = (): MiniGameDto[] => MINI_GAME_DTOS;

export default getMiniGameDtos;
