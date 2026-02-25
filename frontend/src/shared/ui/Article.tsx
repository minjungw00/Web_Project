import { RiArrowRightSLine } from '@remixicon/react';

import Badge from '@/shared/ui/Badge';
import cn from '@/shared/ui/utils';

import type { HTMLAttributes, ReactNode } from 'react';

import type { UiMode } from '@/shared/ui/types';

export interface ArticleProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description: string;
  date: string;
  badges?: string[];
  mode?: UiMode;
  mediaAlt?: string;
  mediaSrc?: string;
  readMoreIcon?: ReactNode;
}

const Article = ({
  badges = [],
  className,
  date,
  description,
  mediaAlt = '',
  mediaSrc,
  mode = 'Mobile',
  readMoreIcon = (
    <RiArrowRightSLine aria-hidden="true" className="ui-inline-icon" />
  ),
  title,
  ...rest
}: ArticleProps): React.ReactElement => {
  const modeClass = mode.toLowerCase();

  return (
    <article className={cn('ui-article', modeClass, className)} {...rest}>
      <div className="ui-article-grid">
        <p className="ui-article-date">{date}</p>

        <div className="ui-article-content">
          {mediaSrc ? (
            <img
              alt={mediaAlt}
              className="ui-article-media mobile-only"
              src={mediaSrc}
            />
          ) : null}

          <div className="ui-badge-list">
            {badges.map((badge) => (
              <Badge key={badge} color="SkyBlue">
                {badge}
              </Badge>
            ))}
          </div>

          <h3 className="ui-article-title">{title}</h3>
          <p className="ui-article-description">{description}</p>

          <div aria-label="read-full-contents" className="ui-article-link">
            <span>Read full contents</span>
            <span aria-hidden="true">{readMoreIcon}</span>
          </div>
        </div>

        {mediaSrc ? (
          <img
            alt={mediaAlt}
            className="ui-article-media side-media"
            src={mediaSrc}
          />
        ) : null}
      </div>
    </article>
  );
};

Article.defaultProps = {
  badges: [],
  mediaAlt: '',
  mediaSrc: undefined,
  mode: 'Mobile',
  readMoreIcon: (
    <RiArrowRightSLine aria-hidden="true" className="ui-inline-icon" />
  ),
};

export default Article;
