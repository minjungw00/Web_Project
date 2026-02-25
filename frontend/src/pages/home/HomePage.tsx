import {
  RiArticleLine,
  RiBookOpenLine,
  RiBriefcase4Line,
  RiGamepadLine,
} from '@remixicon/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import listHomeSections from '@/application/home/usecases';
import '@/pages/home/home.css';
import { Card } from '@/shared/ui';

import type { HomeSection } from '@/entities/home/types';

const sections = listHomeSections();

const HOME_ICONS: Record<HomeSection['iconName'], React.ReactNode> = {
  portfolio: <RiBriefcase4Line aria-hidden="true" className="home-card-icon" />,
  blog: <RiArticleLine aria-hidden="true" className="home-card-icon" />,
  docs: <RiBookOpenLine aria-hidden="true" className="home-card-icon" />,
  miniGames: <RiGamepadLine aria-hidden="true" className="home-card-icon" />,
};

const HomePage = (): React.ReactElement => {
  const { t } = useTranslation();

  return (
    <div className="home-page">
      <section className="home-hero">
        <h1>
          {t('home.hero.title')} <br />
          <span className="home-hero-accent">{t('home.hero.accent')}</span>
        </h1>
        <p>{t('home.hero.description')}</p>
      </section>

      <section aria-label="home sections" className="home-card-grid">
        {sections.map((section) => (
          <Link key={section.to} className="home-card-link" to={section.to}>
            <Card
              description={t(`home.cards.${section.iconName}.description`)}
              icon={HOME_ICONS[section.iconName]}
              title={t(`home.cards.${section.iconName}.title`)}
            />
          </Link>
        ))}
      </section>
    </div>
  );
};

export default HomePage;
