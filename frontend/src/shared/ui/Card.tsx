import { RiArrowRightSLine } from '@remixicon/react';

import Icon from '@/shared/ui/Icon';
import cn from '@/shared/ui/utils';

import type { HTMLAttributes, ReactNode } from 'react';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  title: string;
  description: string;
  icon?: ReactNode;
  footerIcon?: ReactNode;
}

const Card = ({
  className,
  description,
  footerIcon = (
    <RiArrowRightSLine aria-hidden="true" className="ui-inline-icon" />
  ),
  icon,
  title,
  ...rest
}: CardProps): React.ReactElement => (
  <article className={cn('ui-card', className)} {...rest}>
    <Icon icon={icon} />
    <h3 className="ui-card-title">{title}</h3>
    <p className="ui-card-description">{description}</p>
    <div aria-label="read-more" className="ui-card-footer">
      <span aria-hidden="true">{footerIcon}</span>
    </div>
  </article>
);

Card.defaultProps = {
  footerIcon: (
    <RiArrowRightSLine aria-hidden="true" className="ui-inline-icon" />
  ),
  icon: undefined,
};

export default Card;
