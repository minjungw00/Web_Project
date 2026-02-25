import toHomeSection from '@/entities/home/mapper';
import getHomeSectionDtos from '@/shared/api/home';

import type { HomeSection } from '@/entities/home/types';

const listHomeSections = (): HomeSection[] =>
  getHomeSectionDtos().map(toHomeSection);

export default listHomeSections;
