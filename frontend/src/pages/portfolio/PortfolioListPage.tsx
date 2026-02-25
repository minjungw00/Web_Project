import listPortfolioProjects from '@/application/portfolio/usecases';
import '@/pages/portfolio/portfolio.css';
import { ProjectCard } from '@/shared/ui';

const projectCards = listPortfolioProjects();

const PortfolioListPage = (): React.ReactElement => (
  <div className="portfolio-page">
    <section className="portfolio-hero">
      <h1>
        Portfolio
        <span className="portfolio-hero-accent">.</span>
      </h1>
      <p>
        A collection of technical experiments and full-stack solutions.
        Documenting the journey of building scalable web architecture.
      </p>
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

export default PortfolioListPage;
