import type { Dimensions } from "../../core";

import { getCssDimensions } from "../utils/get-css-dimensions.util";

export function getDimensions(element: Element): Dimensions {
  const { width, height } = getCssDimensions(element);
  return { width, height };
}
