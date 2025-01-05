import { forwardRef } from 'react';

import { Action, ActionProps } from '../action';

export const Handle = forwardRef<HTMLButtonElement, ActionProps>((props, ref) => {
  return (
    <Action
      ref={ref}
      cursor="grab"
      data-cypress="draggable-handle"
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle
          cx="9"
          cy="12"
          r="1"
        />
        <circle
          cx="9"
          cy="5"
          r="1"
        />
        <circle
          cx="9"
          cy="19"
          r="1"
        />
        <circle
          cx="15"
          cy="12"
          r="1"
        />
        <circle
          cx="15"
          cy="5"
          r="1"
        />
        <circle
          cx="15"
          cy="19"
          r="1"
        />
      </svg>
    </Action>
  );
});
