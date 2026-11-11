"use client";

import { createContext, useContext, type ReactNode } from "react";

/**
 * Where a template wants the SHIPPED stamp, when a spot relative to the whole window would not
 * hold at every width (content reflows). Render <StampSlot className="right-2 bottom-10" /> inside
 * a `relative` element of the template and set the template's `stamp` to "slot"; the MiniUI
 * supplies the stamp (its ref, size and animation) through this context.
 */
export const StampSlotContext = createContext<((className: string) => ReactNode) | null>(null);

export function StampSlot({ className }: { className: string }) {
  const render = useContext(StampSlotContext);
  return render ? render(className) : null;
}
