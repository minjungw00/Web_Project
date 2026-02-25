import type {
  PortfolioProject,
  PortfolioProjectDto,
} from '@/entities/portfolio/types';

const toPortfolioProject = (dto: PortfolioProjectDto): PortfolioProject => ({
  id: dto.id,
  title: dto.title,
  description: dto.description,
  badges: dto.badges,
  mediaSrc: dto.mediaSrc,
  mediaAlt: dto.mediaAlt,
});

export default toPortfolioProject;
