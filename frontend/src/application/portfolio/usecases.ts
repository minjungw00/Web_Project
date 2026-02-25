import toPortfolioProject from '@/entities/portfolio/mapper';
import getPortfolioProjectDtos from '@/shared/api/portfolio';
import { resolveSupportedLanguage } from '@/shared/i18n/language';

import type { PortfolioProject } from '@/entities/portfolio/types';
import type { SupportedLanguage } from '@/shared/i18n/language';

const listPortfolioProjects = (language?: string): PortfolioProject[] => {
  const supportedLanguage: SupportedLanguage =
    resolveSupportedLanguage(language);

  return getPortfolioProjectDtos().map((dto) =>
    toPortfolioProject(dto, supportedLanguage),
  );
};

export default listPortfolioProjects;
