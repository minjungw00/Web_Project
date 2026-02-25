import cn from '@/shared/ui/utils';

import type { ButtonHTMLAttributes } from 'react';

type ButtonColor = 'Light' | 'Gray' | 'Dark' | 'BlueGray';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  color?: ButtonColor;
}

const colorClassMap: Record<ButtonColor, string> = {
  Light: 'ui-button-light',
  Gray: 'ui-button-gray',
  Dark: 'ui-button-dark',
  BlueGray: 'ui-button-bluegray',
};

const Button = ({
  children,
  className,
  color = 'Light',
  disabled = false,
  type,
  ...rest
}: ButtonProps): React.ReactElement => (
  <button
    {...rest}
    className={cn('ui-button', colorClassMap[color], className)}
    disabled={disabled}
    type={type === 'submit' ? 'submit' : 'button'}
  >
    {children}
  </button>
);

Button.defaultProps = {
  color: 'Light',
};

export default Button;
