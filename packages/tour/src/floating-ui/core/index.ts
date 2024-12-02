export type {
  AlignedPlacement,
  Alignment,
  Axis,
  ClientRectObject,
  Coords,
  Dimensions,
  ElementRects,
  Length,
  Padding,
  Placement,
  Rect,
  Side,
  SideObject,
  Strategy,
  VirtualElement,
} from "../utils";
export { computePosition } from "./compute-position";
export type {
  Boundary,
  ComputePosition,
  ComputePositionConfig,
  ComputePositionReturn,
  Derivable,
  ElementContext,
  Elements,
  FloatingElement,
  Middleware,
  MiddlewareArguments,
  MiddlewareData,
  MiddlewareReturn,
  MiddlewareState,
  Platform,
  ReferenceElement,
  RootBoundary,
} from "./core.types";
export { DetectOverflowOptions, detectOverflow } from "./detect-overflow";
export { arrow } from "./middleware/arrow.middleware";
export type { ArrowOptions } from "./middleware/arrow.middleware";
export { autoPlacement } from "./middleware/auto-placement.middleware";
export type { AutoPlacementOptions } from "./middleware/auto-placement.middleware";
export { flip } from "./middleware/flip.middleware";
export type { FlipOptions } from "./middleware/flip.middleware";
export { hide } from "./middleware/hide.middleware";
export type { HideOptions } from "./middleware/hide.middleware";
export { inline } from "./middleware/inline.middleware";
export type { InlineOptions } from "./middleware/inline.middleware";
export { offset } from "./middleware/offset.middleware";
export type { OffsetOptions } from "./middleware/offset.middleware";
export { limitShift, shift } from "./middleware/shift.middleware";
export type {
  LimitShiftOptions,
  ShiftOptions,
} from "./middleware/shift.middleware";
export { size } from "./middleware/size.middleware";
export type { SizeOptions } from "./middleware/size.middleware";
// This export exists only for backwards compatibility. It will be removed in
// the next major version.
export { rectToClientRect } from "../utils";
