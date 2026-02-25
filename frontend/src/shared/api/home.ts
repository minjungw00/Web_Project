interface HomeSectionDto {
  to: string;
  title: string;
  description: string;
  iconName: 'portfolio' | 'blog' | 'docs' | 'miniGames';
}

const HOME_SECTION_DTOS: HomeSectionDto[] = [
  {
    to: '/portfolio',
    title: 'Portfolio',
    description: '실제 프로젝트 결과물과 설계 의사결정을 한눈에 정리합니다.',
    iconName: 'portfolio',
  },
  {
    to: '/blog',
    title: 'Blog',
    description: '개발 과정에서 얻은 인사이트와 트러블슈팅 기록을 공유합니다.',
    iconName: 'blog',
  },
  {
    to: '/cs-docs',
    title: 'CS Docs',
    description:
      '핵심 CS 개념과 학습 노트를 주제별로 빠르게 찾아볼 수 있습니다.',
    iconName: 'docs',
  },
  {
    to: '/mini-games',
    title: 'Mini Games',
    description:
      '작은 인터랙티브 실험으로 UI 패턴과 아이디어를 가볍게 검증합니다.',
    iconName: 'miniGames',
  },
];

const getHomeSectionDtos = (): HomeSectionDto[] => HOME_SECTION_DTOS;

export default getHomeSectionDtos;
