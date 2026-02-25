import gamesImage from '@/assets/icons/card-games-bg.svg';
import portfolioImage from '@/assets/icons/card-portfolio-bg.svg';

interface PortfolioProjectDto {
  id: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: string;
}

const PORTFOLIO_PROJECT_DTOS: PortfolioProjectDto[] = [
  {
    id: 'edge-runtime',
    title: 'Edge Runtime Migration',
    description:
      'Node.js 기반 워크로드를 Rust 엣지 함수로 이전한 프로젝트입니다.',
    badges: ['Rust', 'Edge', 'Perf'],
    mediaSrc: portfolioImage,
    mediaAlt: 'Portfolio architecture background',
  },
  {
    id: 'monitoring',
    title: 'Observability Platform',
    description: '로그/메트릭/트레이스를 통합한 운영 관측성 파이프라인입니다.',
    badges: ['Grafana', 'Loki', 'SRE'],
    mediaSrc: gamesImage,
    mediaAlt: 'Observability platform project visual',
  },
  {
    id: 'blue-green',
    title: 'Blue Green Delivery',
    description: '무중단 배포를 위한 Blue/Green 전환 자동화를 구현했습니다.',
    badges: ['Docker', 'Nginx', 'Deploy'],
  },
];

const getPortfolioProjectDtos = (): PortfolioProjectDto[] =>
  PORTFOLIO_PROJECT_DTOS;

export default getPortfolioProjectDtos;
