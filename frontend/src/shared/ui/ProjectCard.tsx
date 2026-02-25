import { RiArrowRightSLine } from '@remixicon/react';

import Badge from '@/shared/ui/Badge';
import cn from '@/shared/ui/utils';

import type { HTMLAttributes, ReactNode } from 'react';

export interface ProjectCardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description: string;
  badges?: string[];
  mediaAlt?: string;
  mediaSrc?: string;
  footerIcon?: ReactNode;
  footerLabel?: string;
}

const ProjectCard = ({
  badges = [],
  className,
  description,
  footerIcon = (
    <RiArrowRightSLine aria-hidden="true" className="ui-inline-icon" />
  ),
  footerLabel = 'View project',
  mediaAlt = '',
  mediaSrc,
  title,
  ...rest
}: ProjectCardProps): React.ReactElement => (
  <article className={cn('ui-project-card', className)} {...rest}>
    {mediaSrc ? (
      <img alt={mediaAlt} className="ui-project-media" src={mediaSrc} />
    ) : null}
    <h3 className="ui-project-card-title">{title}</h3>
    <p className="ui-project-card-description">{description}</p>
    <div className="ui-badge-list">
      {badges.map((badge) => (
        <Badge key={badge}>{badge}</Badge>
      ))}
    </div>
    <div aria-label="project-link" className="ui-project-card-footer">
      {footerLabel ? <span>{footerLabel}</span> : null}
      <span aria-hidden="true">{footerIcon}</span>
    </div>
  </article>
);

ProjectCard.defaultProps = {
  badges: [],
  footerIcon: (
    <RiArrowRightSLine aria-hidden="true" className="ui-inline-icon" />
  ),
  footerLabel: 'View project',
  mediaAlt: '',
  mediaSrc: undefined,
};

export default ProjectCard;
