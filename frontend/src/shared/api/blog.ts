import blogImage from '@/assets/icons/card-blog-bg.svg';
import docsImage from '@/assets/icons/card-docs-bg.svg';

interface BlogPostDto {
  id: string;
  date: string;
  title: string;
  description: string;
  badges: string[];
  category: string;
  mediaSrc?: string;
  mediaAlt?: string;
}

const BLOG_POST_DTOS: BlogPostDto[] = [
  {
    id: 'edge-rust',
    date: 'Sep 12, 2023',
    title: 'Moving to the Edge: Why Rust is the Future of Serverless',
    description:
      '콜드스타트와 메모리 사용량 개선을 중심으로 서버리스 런타임 전환 전략을 정리했습니다.',
    badges: ['Rust', 'Serverless', 'Edge'],
    category: 'engineering',
    mediaSrc: blogImage,
    mediaAlt: 'Rust edge runtime architecture visual',
  },
  {
    id: 'docker-metrics',
    date: 'Jan 09, 2024',
    title: 'Building Monitoring with Docker Compose',
    description:
      'Prometheus, Loki, Grafana 조합으로 로컬/운영 환경의 관측성을 통일하는 방법을 다룹니다.',
    badges: ['Monitoring', 'Docker', 'Ops'],
    category: 'ops',
    mediaSrc: docsImage,
    mediaAlt: 'Monitoring dashboard on development environment',
  },
  {
    id: 'frontend-architecture',
    date: 'May 20, 2024',
    title: 'Feature-First Frontend Architecture Notes',
    description:
      '라우팅, shared/ui, application 계층 분리를 실제 적용한 과정을 기록했습니다.',
    badges: ['Frontend', 'Architecture', 'React'],
    category: 'frontend',
  },
];

const getBlogPostDtos = (): BlogPostDto[] => BLOG_POST_DTOS;

export default getBlogPostDtos;
