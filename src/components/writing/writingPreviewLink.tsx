"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { SmallLink } from "@/components/smallLink";
import { ReviewScore } from "@/components/writing/reviewScore";
import { WritingCard } from "@/components/writing/writingCard";
import { Post } from "@/lib/types";
import { spaceToHyphen } from "@/lib/util";

type Position = {
  top: number;
  left: number;
};

type WritingPreviewLinkProps = {
  item: Post;
};

export function WritingPreviewLink({ item }: WritingPreviewLinkProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const supportsHover = useRef(true);

  const [isHovering, setIsHovering] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  const isReview = item.score !== undefined;
  const href = useMemo(
    () => `/writing/${spaceToHyphen(item.title)}/${item.id}`,
    [item.id, item.title]
  );

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
      left: rect.left + rect.width / 2
    });
  }, []);

  const openPreview = useCallback(() => {
    if (!supportsHover.current) return;
    updatePosition();
    setIsHovering(true);
  }, [updatePosition]);

  const closePreview = useCallback(() => {
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

  const preview =
    isHovering && portalNode && position
      ? createPortal(
          <div
            className="pointer-events-none fixed z-40"
            style={{
              top: position.top,
              left: position.left,
              transform: "translate(-50%, calc(-100% - 12px))"
            }}
          >
            <div
              data-visible={hasEntered}
              className="pointer-events-none w-[min(320px,calc(100vw-32px))] opacity-0 translate-y-2 transition duration-150 ease-in data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100 drop-shadow-2xl"
            >
              <div className="pointer-events-none">
                <WritingCard item={item} isReview={isReview} />
              </div>
            </div>
          </div>,
          portalNode
        )
      : null;

  return (
    <span
      ref={wrapperRef}
      className="flex items-center justify-between"
      onMouseEnter={openPreview}
      onMouseLeave={closePreview}
      onFocus={openPreview}
      onBlur={closePreview}
    >
      <SmallLink title={item.title} link={href} />
      {isReview && <ReviewScore score={item.score!} />}
      {preview}
    </span>
  );
}
