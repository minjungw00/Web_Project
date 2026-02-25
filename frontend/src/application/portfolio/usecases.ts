import toPortfolioProject from '@/entities/portfolio/mapper';
import getPortfolioProjectDtos from '@/shared/api/portfolio';

import type { PortfolioProject } from '@/entities/portfolio/types';

const listPortfolioProjects = (): PortfolioProject[] =>
  getPortfolioProjectDtos().map(toPortfolioProject);

export default listPortfolioProjects;
