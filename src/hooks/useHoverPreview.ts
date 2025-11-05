"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Position = {
  top: number;
  left: number;
};

interface HoverPreviewResult {
  ref: React.RefObject<HTMLElement>;
  isHovering: boolean;
  hasEntered: boolean;
  position: Position | null;
  portalNode: HTMLElement | null;
  open: () => void;
  close: () => void;
}

export function useHoverPreview(): HoverPreviewResult {
  const wrapperRef = useRef<HTMLElement>(null);
  const supportsHover = useRef(true);

  const [isHovering, setIsHovering] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setPortalNode(document.getElementById("modal") as HTMLElement | null);

    if (window.matchMedia) {
      const mq =
        window.matchMedia("(hover: hover)") ||
        window.matchMedia("(pointer: fine)");
      supportsHover.current = mq?.matches ?? true;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const open = useCallback(() => {
    if (!supportsHover.current) return;
    updatePosition();
    setIsHovering(true);
  }, [updatePosition]);

  const close = useCallback(() => {
    setIsHovering(false);
  }, []);

  useEffect(() => {
    if (!isHovering) return;

    updatePosition();
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    const raf = requestAnimationFrame(() => setHasEntered(true));

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(raf);
      setHasEntered(false);
    };
  }, [isHovering, updatePosition]);

  return {
    ref: wrapperRef,
    isHovering,
    hasEntered,
    position,
    portalNode,
    open,
    close,
  };
}
