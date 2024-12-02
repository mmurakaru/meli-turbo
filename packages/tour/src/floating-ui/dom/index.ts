import { computePosition as computePositionCore } from "../core";

import type {
  ComputePositionConfig,
  FloatingElement,
  ReferenceElement,
} from "./dom.types";
import { platform } from "./platform";

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 */
export const computePosition = (
  reference: ReferenceElement,
  floating: FloatingElement,
  options?: Partial<ComputePositionConfig>,
) => {
  // This caches the expensive `getClippingElementAncestors` function so that
  // multiple lifecycle resets re-use the same result. It only lives for a
  // single call. If other functions become expensive, we can add them as well.
  const cache = new Map<ReferenceElement, Array<Element>>();
  const mergedOptions = { platform, ...options };
  const platformWithCache = { ...mergedOptions.platform, _c: cache };
  return computePositionCore(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache,
  });
};

export type {
  AlignedPlacement,
  Alignment,
  Axis,
  ClientRectObject,
  ComputePositionReturn,
  Coords,
  Dimensions,
  ElementContext,
  ElementRects,
  InlineOptions,
  Length,
  LimitShiftOptions,
  MiddlewareData,
  MiddlewareReturn,
  Padding,
  Placement,
  Rect,
  RootBoundary,
  Side,
  SideObject,
  Strategy,
} from "../core";
export { autoUpdate } from "./auto-update";
export type {
  ArrowOptions,
  AutoPlacementOptions,
  AutoUpdateOptions,
  Boundary,
  ComputePositionConfig,
  Derivable,
  DetectOverflowOptions,
  Elements,
  FlipOptions,
  FloatingElement,
  HideOptions,
  Middleware,
  MiddlewareArguments,
  MiddlewareState,
  NodeScroll,
  OffsetOptions,
  Platform,
  ReferenceElement,
  ShiftOptions,
  SizeOptions,
  VirtualElement,
} from "./dom.types";
export {
  arrow,
  autoPlacement,
  detectOverflow,
  flip,
  hide,
  inline,
  limitShift,
  offset,
  shift,
  size,
} from "./middleware";
export { platform } from "./platform";
// This export exists only for backwards compatibility. It will be removed in
// the next major version.
export { getOverflowAncestors } from "../utils/dom.util";
