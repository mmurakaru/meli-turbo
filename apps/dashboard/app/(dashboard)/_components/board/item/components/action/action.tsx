import React, { CSSProperties, forwardRef } from 'react';

import { cn } from '@workspace/ui/lib/utils';
import styles from './action.module.scss';

export interface Props extends React.HTMLAttributes<HTMLButtonElement> {
  active?: {
    fill: string;
    background: string;
  };
  cursor?: CSSProperties['cursor'];
  type?: 'button' | 'submit';
}

export const Action = forwardRef<HTMLButtonElement, Props>(
  ({ active, className, cursor, style, type = 'button', ...props }, ref) => {
    return (
      <button
        ref={ref}
        {...props}
        className={cn(styles.Action, className)}
        tabIndex={0}
        type={type}
        style={
          {
            ...style,
            cursor,
            '--fill': active?.fill,
            '--background': active?.background,
          } as CSSProperties
        }
      />
    );
  },
);
