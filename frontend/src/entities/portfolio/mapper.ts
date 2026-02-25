import type {
  PortfolioProject,
  PortfolioProjectDto,
} from '@/entities/portfolio/types';
import type { SupportedLanguage } from '@/shared/i18n/language';

const toPortfolioProject = (
  dto: PortfolioProjectDto,
  language: SupportedLanguage,
): PortfolioProject => ({
  id: dto.id,
  title: dto.title[language],
  description: dto.description[language],
  badges: dto.badges,
  mediaSrc: dto.mediaSrc,
  mediaAlt: dto.mediaAlt?.[language],
});

export default toPortfolioProject;
