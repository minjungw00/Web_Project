import cn from '@/shared/ui/utils';

import type { HTMLAttributes } from 'react';

export type BadgeColor =
  | 'DarkBlue'
  | 'SkyBlue'
  | 'White'
  | 'LightGray'
  | 'BlueGray';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
}

const colorClassMap: Record<BadgeColor, string> = {
  DarkBlue: 'ui-badge-darkblue',
  SkyBlue: 'ui-badge-skyblue',
  White: 'ui-badge-white',
  LightGray: 'ui-badge-lightgray',
  BlueGray: 'ui-badge-bluegray',
};

const Badge = ({
  children,
  className,
  color = 'White',
  ...rest
}: BadgeProps): React.ReactElement => (
  <span {...rest} className={cn('ui-badge', colorClassMap[color], className)}>
    {children ?? 'Badge'}
  </span>
);

Badge.defaultProps = {
  color: 'White',
};

export default Badge;
