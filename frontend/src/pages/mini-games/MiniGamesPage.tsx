import { Link } from 'react-router-dom';

import listMiniGames from '@/application/mini-games/usecases';
import '@/pages/mini-games/mini-games.css';
import { ProjectCard } from '@/shared/ui';

const miniGames = listMiniGames();

const MiniGamesPage = (): React.ReactElement => (
  <div className="mini-games-page">
    <section className="mini-games-hero">
      <h1>
        Mini Games
        <span className="mini-games-hero-accent">.</span>
      </h1>
      <p>
        A collection of technical experiments and full-stack solutions.
        Documenting the journey of building scalable web architecture.
      </p>
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

export default MiniGamesPage;
