import { isElement } from "../../utils/dom.util";
import { VirtualElement } from "../dom.types";

export function unwrapElement(element: Element | VirtualElement) {
  return !isElement(element) ? element.contextElement : element;
}
