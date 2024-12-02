import type { Coords } from "../../core";
import { createCoords, round } from "../../utils";
import { isHTMLElement } from "../../utils/dom.util";

import type { VirtualElement } from "../dom.types";
import { getCssDimensions } from "../utils/get-css-dimensions.util";
import { unwrapElement } from "../utils/unwrap-element.util";

export function getScale(element: Element | VirtualElement): Coords {
  const domElement = unwrapElement(element);

  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }

  const rect = domElement.getBoundingClientRect();
  const { width, height, $ } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;

  // 0, NaN, or Infinity should always fallback to 1.

  if (!x || !Number.isFinite(x)) {
    x = 1;
  }

  if (!y || !Number.isFinite(y)) {
    y = 1;
  }

  return {
    x,
    y,
  };
}
