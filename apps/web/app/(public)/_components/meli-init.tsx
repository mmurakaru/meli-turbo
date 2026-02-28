'use client'

import meli, { type Meli } from 'meli.js'
import { useEffect } from 'react'

declare global {
	interface Window {
		meli: Meli
	}
}

export interface MeliInitProps {
	debug?: boolean
}

export function MeliInit(props: MeliInitProps) {
	// biome-ignore lint/correctness/useExhaustiveDependencies: init should only run once on mount
	useEffect(() => {
		meli.init('9')

		// biome-ignore lint/suspicious/noConsole: debug logging is intentional
		if (props.debug) console.log('MeliInitComponent: initialized')
	}, [])

	return null
}
