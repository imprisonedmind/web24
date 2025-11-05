"use client";

import { SmallLink } from "@/components/smallLink";
import { ReviewScore } from "@/components/writing/reviewScore";
import { WritingCard } from "@/components/writing/writingCard";
import { Post } from "@/lib/types";
import { spaceToHyphen } from "@/lib/util";
import { useHoverPreview } from "@/hooks/useHoverPreview";
import { HoverPreviewPortal } from "@/components/preview/hoverPreviewPortal";
import { useMemo } from "react";

type Position = {
  top: number;
  left: number;
};

type WritingPreviewLinkProps = {
  item: Post;
};

export function WritingPreviewLink({ item }: WritingPreviewLinkProps) {
  const { ref, isHovering, hasEntered, position, portalNode, open, close } =
    useHoverPreview();
  const isReview = item.score !== undefined;
  const href = useMemo(
    () => `/writing/${spaceToHyphen(item.title)}/${item.id}`,
    [item.id, item.title],
  );

  const preview = (
    <HoverPreviewPortal
      isOpen={isHovering}
      portalNode={portalNode}
      position={position}
      hasEntered={hasEntered}
    >
      <div className="pointer-events-none">
        <WritingCard item={item} isReview={isReview} />
      </div>
    </HoverPreviewPortal>
  );

  return (
    <span
      ref={ref}
      className="flex items-center justify-between gap-3"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <SmallLink title={item.title} link={href} />
      <div className="flex items-center gap-3">
        {item.date ? (
          <span className="text-xs text-neutral-400">{item.date}</span>
        ) : null}
        {isReview && <ReviewScore score={item.score!} />}
      </div>
      {preview}
    </span>
  );
}
