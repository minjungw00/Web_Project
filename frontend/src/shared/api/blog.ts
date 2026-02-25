import blogImage from '@/assets/icons/card-blog-bg.svg';
import docsImage from '@/assets/icons/card-docs-bg.svg';

interface LocalizedText {
  en: string;
  ko: string;
}

interface BlogPostDto {
  id: string;
  date: string;
  title: LocalizedText;
  description: LocalizedText;
  badges: string[];
  category: string;
  mediaSrc?: string;
  mediaAlt?: LocalizedText;
}

const BLOG_POST_DTOS: BlogPostDto[] = [
  {
    id: 'edge-rust',
    date: 'Sep 12, 2023',
    title: {
      en: 'Moving to the Edge: Why Rust is the Future of Serverless',
      ko: 'Edge로 가는 이유: Rust가 Serverless의 미래인 이유',
    },
    description: {
      en: 'A practical migration strategy for serverless runtimes focused on cold starts and memory efficiency.',
      ko: '콜드스타트와 메모리 사용량 개선을 중심으로 서버리스 런타임 전환 전략을 정리했습니다.',
    },
    badges: ['Rust', 'Serverless', 'Edge'],
    category: 'engineering',
    mediaSrc: blogImage,
    mediaAlt: {
      en: 'Rust edge runtime architecture visual',
      ko: 'Rust 엣지 런타임 아키텍처 이미지',
    },
  },
  {
    id: 'docker-metrics',
    date: 'Jan 09, 2024',
    title: {
      en: 'Building Monitoring with Docker Compose',
      ko: 'Docker Compose로 모니터링 스택 구축하기',
    },
    description: {
      en: 'How to standardize observability across local and production environments with Prometheus, Loki, and Grafana.',
      ko: 'Prometheus, Loki, Grafana 조합으로 로컬/운영 환경의 관측성을 통일하는 방법을 다룹니다.',
    },
    badges: ['Monitoring', 'Docker', 'Ops'],
    category: 'ops',
    mediaSrc: docsImage,
    mediaAlt: {
      en: 'Monitoring dashboard on development environment',
      ko: '개발 환경 모니터링 대시보드 이미지',
    },
  },
  {
    id: 'frontend-architecture',
    date: 'May 20, 2024',
    title: {
      en: 'Feature-First Frontend Architecture Notes',
      ko: 'Feature-First Frontend 아키텍처 노트',
    },
    description: {
      en: 'Field notes on applying layered separation across routing, shared/ui, and application modules.',
      ko: '라우팅, shared/ui, application 계층 분리를 실제 적용한 과정을 기록했습니다.',
    },
    badges: ['Frontend', 'Architecture', 'React'],
    category: 'frontend',
  },
];

const getBlogPostDtos = (): BlogPostDto[] => BLOG_POST_DTOS;

export default getBlogPostDtos;
