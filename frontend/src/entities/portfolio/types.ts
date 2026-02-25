export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: string;
}

export interface PortfolioProjectDto {
  id: string;
  title: string;
  description: string;
  badges: string[];
  mediaSrc?: string;
  mediaAlt?: string;
}
