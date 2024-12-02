import type { NodeScroll } from "../dom.types";
import { getWindowScrollBarX } from "./get-window-scroll-bar-x.util";

export function getHTMLOffset(
  documentElement: HTMLElement,
  scroll: NodeScroll,
  ignoreScrollbarX = false,
) {
  const htmlRect = documentElement.getBoundingClientRect();
  const x =
    htmlRect.left +
    scroll.scrollLeft -
    (ignoreScrollbarX
      ? 0
      : // RTL <body> scrollbar.
        getWindowScrollBarX(documentElement, htmlRect));
  const y = htmlRect.top + scroll.scrollTop;

  return {
    x,
    y,
  };
}
