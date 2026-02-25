import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

type SupportedLanguage = 'en' | 'ko';

const resources = {
  en: {
    translation: {
      navigation: {
        ariaLabel: 'Primary',
        portfolio: 'Portfolio',
        blog: 'Blog',
        docs: 'Docs',
        miniGames: 'Mini Games',
      },
      footer: {
        rights: '© 2026. minjungw00. All rights reserved.',
        legal: {
          ariaLabel: 'legal',
          privacy: 'Privacy',
          cookie: 'Cookie',
        },
        language: {
          label: 'Language',
          ko: '한국어',
          en: 'English',
        },
      },
      home: {
        hero: {
          title: 'Structured Thinking,',
          accent: 'Proven by Building.',
          description:
            'More than a portfolio—this is an engineering archive that documents problem framing, design decisions, and measurable outcomes.\n\nAt this early development stage, portfolio projects, blog articles, and mini games are currently temporary placeholders.',
        },
        cards: {
          portfolio: {
            title: 'Portfolio',
            description:
              'Explore real project outcomes and the architecture decisions behind them.',
          },
          blog: {
            title: 'Blog',
            description:
              'Read practical notes, troubleshooting stories, and lessons from real development work.',
          },
          docs: {
            title: 'CS Docs',
            description:
              'Find core computer science concepts and study notes organized by topic.',
          },
          miniGames: {
            title: 'Mini Games',
            description:
              'Try small interactive experiments to validate UI patterns and ideas quickly.',
          },
        },
      },
      portfolio: {
        hero: {
          title: 'Portfolio',
          description:
            'Production-minded projects that turn ideas into usable products, with architecture decisions and trade-offs documented.\n\nCurrent portfolio projects are temporary placeholders in this early development stage.',
        },
      },
      blog: {
        hero: {
          title: 'Blog',
          description:
            'Notes from real development work: architecture decisions, debugging stories, and practical lessons I want to remember.\n\nCurrent blog articles are temporary placeholders in this early development stage.',
        },
        categories: {
          all: 'All',
          frontend: 'Frontend',
          engineering: 'Engineering',
          ops: 'Ops',
        },
        searchPlaceholder: 'Search...',
      },
      miniGames: {
        hero: {
          title: 'Mini Games',
          description:
            'Small interactive experiments for testing UI patterns, game mechanics, and frontend ideas in a playful way.\n\nExcept for the dedicated component lab page, current mini games are temporary placeholders in this early development stage.',
        },
      },
      status: {
        error: {
          title: 'Something went wrong.',
          fallbackMessage: 'Unexpected error',
          notFound: '404 Not Found',
          goHome: 'Back to Home',
        },
        working: {
          imageAlt: 'Work in progress image',
          title: 'This page is currently under construction.',
          description:
            'We are preparing better content. Please check back soon.',
        },
      },
    },
  },
  ko: {
    translation: {
      navigation: {
        ariaLabel: '주요 메뉴',
        portfolio: '포트폴리오',
        blog: '블로그',
        docs: '문서',
        miniGames: '미니게임',
      },
      footer: {
        rights: '© 2026. minjungw00. All rights reserved.',
        legal: {
          ariaLabel: '정책 링크',
          privacy: '개인정보',
          cookie: '쿠키',
        },
        language: {
          label: '언어',
          ko: '한국어',
          en: 'English',
        },
      },
      home: {
        hero: {
          title: '구조적 사고를',
          accent: '구현으로 증명합니다.',
          description:
            '단순 포트폴리오가 아니라 문제 정의, 설계 판단, 그리고 측정 가능한 결과까지 기록하는 Engineering 아카이브입니다.\n\n개발 초기 단계인 현재, 포트폴리오 프로젝트와 블로그 아티클, 미니게임은 임시 데이터로 구성되어 있습니다.',
        },
        cards: {
          portfolio: {
            title: '포트폴리오',
            description:
              '실제 프로젝트 결과물과 설계 의사결정을 한눈에 정리합니다.',
          },
          blog: {
            title: '블로그',
            description:
              '개발 과정에서 얻은 인사이트와 트러블슈팅 기록을 공유합니다.',
          },
          docs: {
            title: 'CS 문서',
            description:
              '핵심 CS 개념과 학습 노트를 주제별로 빠르게 찾아볼 수 있습니다.',
          },
          miniGames: {
            title: '미니게임',
            description:
              '작은 인터랙티브 실험으로 UI 패턴과 아이디어를 가볍게 검증합니다.',
          },
        },
      },
      portfolio: {
        hero: {
          title: '포트폴리오',
          description:
            '아이디어를 실제 제품으로 구현한 프로젝트를 설계 근거와 트레이드오프까지 함께 정리했습니다.\n\n현재 포트폴리오 프로젝트는 개발 초기 단계의 임시 데이터로 구성되어 있습니다.',
        },
      },
      blog: {
        hero: {
          title: '블로그',
          description:
            '실제 개발 과정에서의 아키텍처 선택, 디버깅 경험, 그리고 다시 참고할 실전 교훈을 기록합니다.\n\n현재 블로그 아티클은 개발 초기 단계의 임시 데이터로 구성되어 있습니다.',
        },
        categories: {
          all: '전체',
          frontend: 'Frontend',
          engineering: 'Engineering',
          ops: 'Ops',
        },
        searchPlaceholder: '검색...',
      },
      miniGames: {
        hero: {
          title: '미니게임',
          description:
            'UI 패턴, 게임 메커닉, Frontend 아이디어를 가볍게 실험해보는 작은 인터랙티브 프로젝트 모음입니다.\n\n전용 컴포넌트 실험 페이지를 제외한 현재 미니게임은 개발 초기 단계의 임시 데이터로 구성되어 있습니다.',
        },
      },
      status: {
        error: {
          title: '문제가 발생했습니다.',
          fallbackMessage: '예기치 않은 오류가 발생했습니다.',
          notFound: '404 페이지를 찾을 수 없습니다.',
          goHome: '홈으로 이동',
        },
        working: {
          imageAlt: '작업 중 안내 이미지',
          title: '현재 작업 중인 페이지입니다.',
          description: '더 나은 내용으로 준비 중입니다. 조금만 기다려 주세요.',
        },
      },
    },
  },
} as const;

const STORAGE_KEY = 'lang';

const isSupportedLanguage = (
  value: string | null,
): value is SupportedLanguage => value === 'en' || value === 'ko';

const getInitialLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (isSupportedLanguage(saved)) {
    return saved;
  }

  const browserLanguage = window.navigator.language.toLowerCase();
  return browserLanguage.startsWith('ko') ? 'ko' : 'en';
};

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export { STORAGE_KEY };
export default i18n;
