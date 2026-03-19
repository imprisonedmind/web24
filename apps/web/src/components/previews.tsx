import type { WorkItem, WritingPost } from "@web24/content";
import { getWritingRoutePath } from "@web24/content";
import { Link } from "@tanstack/react-router";

import { CFImage } from "./cf-image";
import { HoverPreviewPortal, useHoverPreview } from "./hover-preview";
import { ReviewScoreBadge, SmallLink } from "./legacy";

export function WorkPreviewLink({ item }: { item: WorkItem }) {
  const { ref, isHovering, hasEntered, position, portalNode, open, close } =
    useHoverPreview();

  return (
    <span
      ref={ref}
      className="flex items-center justify-between gap-3 text-sm text-neutral-600"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <SmallLink href={item.link} label={item.description ?? item.alt} external={!item.internal} />
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs tracking-wide text-neutral-600">
          {item.tag}
        </span>
        {item.year ? <span className="text-xs text-neutral-500">{item.year}</span> : null}
      </div>

      <HoverPreviewPortal
        isOpen={isHovering}
        portalNode={portalNode}
        position={position}
        hasEntered={hasEntered}
        contentClassName="pointer-events-none w-[min(360px,calc(100vw-32px))] translate-y-2 opacity-0 drop-shadow-2xl transition duration-150 ease-in data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100"
      >
        <WorkPreviewCard item={item} />
      </HoverPreviewPortal>
    </span>
  );
}

export function WritingPreviewLink({ item }: { item: WritingPost }) {
  const { ref, isHovering, hasEntered, position, portalNode, open, close } =
    useHoverPreview();

  return (
    <span
      ref={ref}
      className="flex items-center justify-between gap-3"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <SmallLink href={getWritingRoutePath(item)} label={item.title} />
      <div className="flex items-center gap-3">
        <span className="text-xs text-neutral-500">{item.date}</span>
        {item.score !== undefined ? <ReviewScoreBadge score={item.score} /> : null}
      </div>

      <HoverPreviewPortal
        isOpen={isHovering}
        portalNode={portalNode}
        position={position}
        hasEntered={hasEntered}
      >
        <div className="pointer-events-none">
          <WritingPreviewCard item={item} />
        </div>
      </HoverPreviewPortal>
    </span>
  );
}

function WorkPreviewCard({ item }: { item: WorkItem }) {
  return (
    <div className="flex w-full flex-col gap-4 overflow-hidden rounded-xl bg-white p-2 shadow-sm transition duration-300 ease-in-out hover:shadow-md">
      <div className="relative h-64 w-full overflow-hidden rounded-lg">
        <CFImage
          className="h-full w-full bg-gray-200 object-cover"
          src={item.image}
          alt={item.alt}
          preset="previewCard"
        />
      </div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <p className="font-medium text-neutral-900">{item.title}</p>
        <span className="flex-shrink-0 rounded-full bg-neutral-100 p-1 px-2 text-xs tracking-wide text-neutral-600">
          {item.tag}
        </span>
      </div>
    </div>
  );
}

function WritingPreviewCard({ item }: { item: WritingPost }) {
  return (
    <Link
      className="flex w-full flex-col gap-4 overflow-hidden rounded-xl bg-white p-2 text-inherit no-underline shadow-sm transition duration-300 ease-in-out hover:shadow-md"
      to={getWritingRoutePath(item)}
    >
      <CFImage
        className="max-h-[160px] w-full rounded-lg bg-gray-200 object-cover"
        src={`/${item.openGraph}`}
        alt={item.title}
        preset="previewCard"
      />

      <div className="flex flex-col gap-1 px-1 pb-2">
        <div className="flex flex-row items-center justify-between">
          <p className="line-clamp-1 font-medium">{item.title}</p>
          <p className="flex-shrink-0 text-xs">{item.date}</p>
        </div>

        <p className="line-clamp-3 text-sm text-neutral-500">{item.description}</p>

        {item.score !== undefined ? (
          <span className="mt-1">
            <ReviewScoreBadge score={item.score} />
          </span>
        ) : null}
      </div>
    </Link>
  );
}
