import { cn } from '@workspace/ui/lib/utils'
import type React from 'react'
import { type CSSProperties, forwardRef } from 'react'
import styles from './action.module.css'

export interface Props extends React.HTMLAttributes<HTMLButtonElement> {
	active?: {
		fill: string
		background: string
	}
	cursor?: CSSProperties['cursor']
}

export const Action = forwardRef<HTMLButtonElement, Props>(
	({ active, className, cursor, style, ...props }, ref) => {
		return (
			<button
				ref={ref}
				{...props}
				className={cn(styles.Action, className)}
				tabIndex={0}
				style={
					{
						...style,
						cursor,
						'--fill': active?.fill,
						'--background': active?.background,
					} as CSSProperties
				}
			/>
		)
	},
)
