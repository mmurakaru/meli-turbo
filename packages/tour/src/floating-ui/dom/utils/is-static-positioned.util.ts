import { getComputedStyle } from "../../utils/dom.util";

export function isStaticPositioned(element: Element): boolean {
  return getComputedStyle(element).position === "static";
}
