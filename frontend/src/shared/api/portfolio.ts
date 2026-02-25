import gamesImage from '@/assets/icons/card-games-bg.svg';
import portfolioImage from '@/assets/icons/card-portfolio-bg.svg';

interface LocalizedText {
  en: string;
  ko: string;
}

interface PortfolioProjectDto {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: LocalizedText;
}

const PORTFOLIO_PROJECT_DTOS: PortfolioProjectDto[] = [
  {
    id: 'edge-runtime',
    title: {
      en: 'Edge Runtime Migration',
      ko: 'Edge Runtime Migration',
    },
    description: {
      en: 'Migrated Node.js workloads to Rust edge functions for better latency and efficiency.',
      ko: 'Node.js 기반 워크로드를 Rust Edge 함수로 이전한 프로젝트입니다.',
    },
    badges: ['Rust', 'Edge', 'Perf'],
    mediaSrc: portfolioImage,
    mediaAlt: {
      en: 'Portfolio architecture background',
      ko: '포트폴리오 아키텍처 배경 이미지',
    },
  },
  {
    id: 'monitoring',
    title: {
      en: 'Observability Platform',
      ko: 'Observability Platform',
    },
    description: {
      en: 'Built an observability pipeline that unifies logs, metrics, and traces for operations.',
      ko: '로그/메트릭/트레이스를 통합한 Observability 파이프라인입니다.',
    },
    badges: ['Grafana', 'Loki', 'SRE'],
    mediaSrc: gamesImage,
    mediaAlt: {
      en: 'Observability platform project visual',
      ko: '옵저버빌리티 플랫폼 프로젝트 이미지',
    },
  },
  {
    id: 'blue-green',
    title: {
      en: 'Blue Green Delivery',
      ko: 'Blue Green Delivery',
    },
    description: {
      en: 'Implemented automated Blue/Green switching to enable zero-downtime deployments.',
      ko: '무중단 배포를 위한 Blue/Green 전환 자동화를 구현했습니다.',
    },
    badges: ['Docker', 'Nginx', 'Deploy'],
  },
];

const getPortfolioProjectDtos = (): PortfolioProjectDto[] =>
  PORTFOLIO_PROJECT_DTOS;

export default getPortfolioProjectDtos;
