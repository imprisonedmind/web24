"use client";

import { createPortal } from "react-dom";
import { type ReactNode } from "react";

type Position = {
  top: number;
  left: number;
};

interface HoverPreviewPortalProps {
  isOpen: boolean;
  portalNode: HTMLElement | null;
  position: Position | null;
  hasEntered: boolean;
  children: ReactNode;
  contentClassName?: string;
}

export function HoverPreviewPortal({
  isOpen,
  portalNode,
  position,
  hasEntered,
  children,
  contentClassName = "pointer-events-none w-[min(320px,calc(100vw-32px))] translate-y-2 opacity-0 drop-shadow-2xl transition duration-150 ease-in data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100",
}: HoverPreviewPortalProps) {
  if (!isOpen || !portalNode || !position) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed z-40"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, calc(-100% - 12px))",
      }}
    >
      <div data-visible={hasEntered} className={contentClassName}>
        {children}
      </div>
    </div>,
    portalNode
  );
}
