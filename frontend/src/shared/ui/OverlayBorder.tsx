import cn from '@/shared/ui/utils';

import type { HTMLAttributes, ReactNode } from 'react';

type OverlayTone = 'default' | 'info' | 'success' | 'warning' | 'danger';

export interface OverlayBorderProps extends HTMLAttributes<HTMLDivElement> {
  tone?: OverlayTone;
  label?: string;
  indicator?: ReactNode;
}

const toneClassMap: Record<OverlayTone, string> = {
  default: 'ui-tone-default',
  info: 'ui-tone-info',
  success: 'ui-tone-success',
  warning: 'ui-tone-warning',
  danger: 'ui-tone-danger',
};

const OverlayBorder = ({
  className,
  indicator,
  label = 'badge',
  tone = 'default',
  ...rest
}: OverlayBorderProps): React.ReactElement => (
  <div
    {...rest}
    className={cn('ui-overlay-badge', toneClassMap[tone], className)}
  >
    <span aria-hidden="true" className="ui-overlay-dot">
      {indicator}
    </span>
    <span>{label}</span>
  </div>
);

OverlayBorder.defaultProps = {
  indicator: undefined,
  label: 'badge',
  tone: 'default',
};

export default OverlayBorder;
