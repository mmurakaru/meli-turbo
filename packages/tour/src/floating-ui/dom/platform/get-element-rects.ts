import type { Platform } from "../dom.types";
import { getRectRelativeToOffsetParent } from "../utils/get-rect-relative-to-offset-parent.util";
import { getOffsetParent } from "./get-offset-parent";

export const getElementRects: Platform["getElementRects"] = async function (
  this: Platform,
  data,
) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);

  return {
    reference: getRectRelativeToOffsetParent(
      data.reference,
      await getOffsetParentFn(data.floating),
      data.strategy,
    ),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height,
    },
  };
};
