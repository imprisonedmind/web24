import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

type Position = {
  top: number;
  left: number;
};

export function useHoverPreview() {
  const wrapperRef = useRef<HTMLElement>(null);
  const supportsHover = useRef(true);

  const [isHovering, setIsHovering] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setPortalNode(document.getElementById("modal"));

    if (window.matchMedia) {
      const mq = window.matchMedia("(hover: hover)");
      supportsHover.current = mq.matches;
    }
  }, []);

  const updatePosition = useCallback(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setPosition({
      top: rect.top,
      left: rect.left + rect.width / 2
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

    const frame = requestAnimationFrame(() => setHasEntered(true));

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(frame);
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
    close
  };
}

export function HoverPreviewPortal({
  isOpen,
  portalNode,
  position,
  hasEntered,
  children,
  contentClassName = "pointer-events-none w-[min(320px,calc(100vw-32px))] translate-y-2 opacity-0 drop-shadow-2xl transition duration-150 ease-in data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100"
}: {
  isOpen: boolean;
  portalNode: HTMLElement | null;
  position: Position | null;
  hasEntered: boolean;
  children: ReactNode;
  contentClassName?: string;
}) {
  if (!isOpen || !portalNode || !position) {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed z-40"
      style={{
        top: position.top,
        left: position.left,
        transform: "translate(-50%, calc(-100% - 12px))"
      }}
    >
      <div data-visible={hasEntered} className={contentClassName}>
        {children}
      </div>
    </div>,
    portalNode
  );
}
