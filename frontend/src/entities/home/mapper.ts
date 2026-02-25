import type { HomeSection, HomeSectionDto } from '@/entities/home/types';

const toHomeSection = (dto: HomeSectionDto): HomeSection => ({
  to: dto.to,
  title: dto.title,
  description: dto.description,
  iconName: dto.iconName,
});

export default toHomeSection;
