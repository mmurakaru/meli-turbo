import { getNodeScroll } from "../../utils/dom.util";

import { getDocumentElement } from "../platform/get-document-element";
import { getBoundingClientRect } from "./get-bounding-client-rec.util";

// If <html> has a CSS width greater than the viewport, then this will be
// incorrect for RTL.
export function getWindowScrollBarX(element: Element, rect?: DOMRect): number {
  const leftScroll = getNodeScroll(element).scrollLeft;

  if (!rect) {
    return getBoundingClientRect(getDocumentElement(element)).left + leftScroll;
  }

  return rect.left + leftScroll;
}
