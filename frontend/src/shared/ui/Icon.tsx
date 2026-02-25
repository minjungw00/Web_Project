import { RiShapesLine } from '@remixicon/react';

import cn from '@/shared/ui/utils';

import type { HTMLAttributes, ReactNode } from 'react';

export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  icon?: ReactNode;
}

const Icon = ({
  className,
  icon = <RiShapesLine aria-hidden="true" className="ui-icon-glyph" />,
  ...rest
}: IconProps): React.ReactElement => (
  <span {...rest} className={cn('ui-icon', className)}>
    {icon}
  </span>
);

Icon.defaultProps = {
  icon: <RiShapesLine aria-hidden="true" className="ui-icon-glyph" />,
};

export default Icon;
