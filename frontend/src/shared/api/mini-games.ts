import gamesImage from '@/assets/icons/card-games-bg.svg';
import portfolioImage from '@/assets/icons/card-portfolio-bg.svg';

interface LocalizedText {
  en: string;
  ko: string;
}

interface MiniGameDto {
  id: string;
  to: string;
  title: LocalizedText;
  description: LocalizedText;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: LocalizedText;
}

const MINI_GAME_DTOS: MiniGameDto[] = [
  {
    id: 'components-lab',
    to: '/mini-games/components',
    title: {
      en: 'Components Lab',
      ko: '컴포넌트 실험실',
    },
    description: {
      en: 'A test mini-game to review reusable UI components and their interactions.',
      ko: '재사용 가능한 UI 컴포넌트를 나열하고 상호작용을 점검하는 테스트 미니게임입니다.',
    },
    badges: ['UI', 'Components', 'Test'],
    mediaSrc: portfolioImage,
    mediaAlt: {
      en: 'Reusable components lab preview',
      ko: '재사용 컴포넌트 랩 미리보기 이미지',
    },
  },
  {
    id: 'reusable-ui-playground',
    to: '/mini-games',
    title: {
      en: 'Reusable UI Playground',
      ko: '재사용 UI 플레이그라운드',
    },
    description: {
      en: 'A playground mini-game for validating combinations of shared components like Button, Badge, and Search.',
      ko: 'Button, Badge, Search 등 공용 컴포넌트 조합을 검증하는 테스트형 미니게임입니다.',
    },
    badges: ['UI', 'Test', 'Playground'],
    mediaSrc: gamesImage,
    mediaAlt: {
      en: 'Reusable UI playground preview',
      ko: '재사용 UI 플레이그라운드 미리보기 이미지',
    },
  },
  {
    id: 'routing-memory-lab',
    to: '/mini-games',
    title: {
      en: 'Routing Memory Lab',
      ko: 'Routing Memory Lab',
    },
    description: {
      en: 'Check transition and state restoration flows by solving routing-state puzzles.',
      ko: '라우팅 상태 전환을 퍼즐처럼 풀며 화면 전이와 상태 복원을 점검합니다.',
    },
    badges: ['Router', 'State', 'Puzzle'],
    mediaSrc: portfolioImage,
    mediaAlt: {
      en: 'Routing memory lab preview',
      ko: '라우팅 메모리 랩 미리보기 이미지',
    },
  },
  {
    id: 'token-match-arena',
    to: '/mini-games',
    title: {
      en: 'Token Match Arena',
      ko: 'Token Match Arena',
    },
    description: {
      en: 'Gamifies design-token matching to quickly verify color and typography consistency.',
      ko: '디자인 토큰 매칭 규칙을 게임화해 컬러/타이포 일관성을 빠르게 확인합니다.',
    },
    badges: ['Design', 'Token', 'Match'],
    mediaSrc: gamesImage,
    mediaAlt: {
      en: 'Token match arena preview',
      ko: '토큰 매치 아레나 미리보기 이미지',
    },
  },
];

const getMiniGameDtos = (): MiniGameDto[] => MINI_GAME_DTOS;

export default getMiniGameDtos;
