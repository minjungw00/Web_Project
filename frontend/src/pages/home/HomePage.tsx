import {
  RiArticleLine,
  RiBookOpenLine,
  RiBriefcase4Line,
  RiGamepadLine,
} from '@remixicon/react';
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

const HomePage = (): React.ReactElement => (
  <div className="home-page">
    <section className="home-hero">
      <h1>
        Structured <br />
        <span className="home-hero-accent">Intelligence.</span>
      </h1>
      <p>
        Archiving the thought process, not just the code. A networked approach
        to development. Archiving the thought process, not just the code. A
        networked approach to development.
      </p>
    </section>

    <section aria-label="home sections" className="home-card-grid">
      {sections.map((section) => (
        <Link key={section.title} className="home-card-link" to={section.to}>
          <Card
            description={section.description}
            icon={HOME_ICONS[section.iconName]}
            title={section.title}
          />
        </Link>
      ))}
    </section>
  </div>
);

export default HomePage;
