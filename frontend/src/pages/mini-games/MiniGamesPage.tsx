import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import listMiniGames from '@/application/mini-games/usecases';
import '@/pages/mini-games/mini-games.css';
import { ProjectCard } from '@/shared/ui';

const MiniGamesPage = (): React.ReactElement => {
  const { i18n, t } = useTranslation();
  const miniGames = useMemo(
    () => listMiniGames(i18n.resolvedLanguage),
    [i18n.resolvedLanguage],
  );

  return (
    <div className="mini-games-page">
      <section className="mini-games-hero">
        <h1>
          {t('miniGames.hero.title')}
          <span className="mini-games-hero-accent">.</span>
        </h1>
        <p>{t('miniGames.hero.description')}</p>
      </section>

      <section aria-label="mini games list" className="mini-games-list">
        {miniGames.map((miniGame) => (
          <Link
            key={miniGame.id}
            className="mini-games-card-link"
            to={miniGame.to}
          >
            <ProjectCard
              badges={miniGame.badges}
              className="mini-games-project-card"
              description={miniGame.description}
              footerLabel=""
              mediaAlt={miniGame.mediaAlt}
              mediaSrc={miniGame.mediaSrc}
              title={miniGame.title}
            />
          </Link>
        ))}
      </section>
    </div>
  );
};

export default MiniGamesPage;
