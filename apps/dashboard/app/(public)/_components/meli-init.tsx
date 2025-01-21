'use client';

import meli, { Meli } from 'meli.js';
//import meli from 'meli.js';
import { useEffect } from 'react';

declare global {
  interface Window {
    meli: Meli;
  }
}

export interface MeliInitProps {
  debug?: boolean;
}

export function MeliInit(props: MeliInitProps) {
  useEffect(() => {
    meli.init('9');

    if (props.debug) console.log('meli-init - initialized');
  }, []);

  return null;
}
