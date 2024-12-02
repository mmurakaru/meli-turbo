import { getComputedStyle } from "../../utils/dom.util";

export function isRTL(element: Element) {
  return getComputedStyle(element).direction === "rtl";
}
