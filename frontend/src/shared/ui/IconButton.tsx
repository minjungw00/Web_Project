import { RiMenuLine } from '@remixicon/react';

import cn from '@/shared/ui/utils';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

const IconButton = ({
  className,
  disabled = false,
  icon = <RiMenuLine aria-hidden="true" className="ui-icon-glyph" />,
  type,
  ...rest
}: IconButtonProps): React.ReactElement => (
  <button
    className={cn('ui-icon-button', className)}
    disabled={disabled}
    type={type === 'submit' ? 'submit' : 'button'}
    {...rest}
  >
    <span aria-hidden="true" className="ui-icon-button-glyph">
      {icon}
    </span>
  </button>
);

IconButton.defaultProps = {
  icon: <RiMenuLine aria-hidden="true" className="ui-icon-glyph" />,
};

export default IconButton;
