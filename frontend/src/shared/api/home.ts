interface HomeSectionDto {
  to: string;
  title: string;
  description: string;
  iconName: 'portfolio' | 'blog' | 'docs' | 'miniGames';
}

const HOME_SECTION_DTOS: HomeSectionDto[] = [
  {
    to: '/portfolio',
    title: 'Portfolio',
    description: 'Knowledge graph based on neuron-synapse connections.',
    iconName: 'portfolio',
  },
  {
    to: '/blog',
    title: 'Blog',
    description: 'Knowledge graph based on neuron-synapse connections.',
    iconName: 'blog',
  },
  {
    to: '/cs-docs',
    title: 'CS Docs',
    description: 'Knowledge graph based on neuron-synapse connections.',
    iconName: 'docs',
  },
  {
    to: '/mini-games',
    title: 'Mini Games',
    description: 'Knowledge graph based on neuron-synapse connections.',
    iconName: 'miniGames',
  },
];

const getHomeSectionDtos = (): HomeSectionDto[] => HOME_SECTION_DTOS;

export default getHomeSectionDtos;
