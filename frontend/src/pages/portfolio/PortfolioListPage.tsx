import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

import listPortfolioProjects from '@/application/portfolio/usecases';
import '@/pages/portfolio/portfolio.css';
import { ProjectCard } from '@/shared/ui';

const PortfolioListPage = (): React.ReactElement => {
  const { i18n, t } = useTranslation();
  const projectCards = useMemo(
    () => listPortfolioProjects(i18n.resolvedLanguage),
    [i18n.resolvedLanguage],
  );

  return (
    <div className="portfolio-page">
      <section className="portfolio-hero">
        <h1>
          {t('portfolio.hero.title')}
          <span className="portfolio-hero-accent">.</span>
        </h1>
        <p>{t('portfolio.hero.description')}</p>
      </section>

      <section aria-label="portfolio projects" className="portfolio-list">
        {projectCards.map((project) => (
          <ProjectCard
            key={project.id}
            badges={project.badges}
            className="portfolio-project-card"
            description={project.description}
            footerLabel=""
            mediaAlt={project.mediaAlt}
            mediaSrc={project.mediaSrc}
            title={project.title}
          />
        ))}
      </section>
    </div>
  );
};

export default PortfolioListPage;
