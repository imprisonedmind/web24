"use client";

import { HoverPreviewPortal } from "@/components/preview/hoverPreviewPortal";
import { SmallLink } from "@/components/smallLink";
import { useHoverPreview } from "@/hooks/useHoverPreview";
import { type WorkCardData } from "@/lib/workData";
import { WorkCard } from "@/components/workCard";
import { WorkPreviewCard } from "@/components/work/workPreviewCard";

type WorkPreviewLinkProps = {
  item: WorkCardData;
};

export function WorkPreviewLink({ item }: WorkPreviewLinkProps) {
  const { ref, isHovering, hasEntered, position, portalNode, open, close } =
    useHoverPreview();

  const preview = (
    <HoverPreviewPortal
      isOpen={isHovering}
      portalNode={portalNode}
      position={position}
      hasEntered={hasEntered}
      contentClassName="pointer-events-none w-[min(360px,calc(100vw-32px))] translate-y-2 opacity-0 drop-shadow-2xl transition duration-150 ease-in data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100"
    >
      <WorkPreviewCard item={item} />
    </HoverPreviewPortal>
  );

  const openInNewTab = !item.internal;

  return (
    <span
      ref={ref}
      className="flex items-center justify-between gap-3 text-sm text-neutral-600"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <SmallLink
        title={item.description ?? item.alt}
        link={item.link}
        target={openInNewTab}
      />
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs tracking-wide text-neutral-600">
          {item.tag}
        </span>

        {item.year ? (
          <span className="text-xs text-neutral-400">{item.year}</span>
        ) : null}
      </div>
      {preview}
    </span>
  );
}
