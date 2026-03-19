import { appItems, type AppItem } from "@web24/content";

import { CFImage } from "./cf-image";
import { HoverPreviewPortal, useHoverPreview } from "./hover-preview";
import { SectionHeader } from "./legacy";

export function HomeAppsSection() {
  return (
    <section className="-mt-4 flex w-full flex-col gap-1 md:mt-0">
      <SectionHeader title="apps" />
      <div className="flex flex-row items-center gap-4 overflow-x-auto">
        {appItems.map((item) => (
          <HomeAppLogo key={item.link} item={item} />
        ))}
      </div>
    </section>
  );
}

function HomeAppLogo({ item }: { item: AppItem }) {
  const { ref, isHovering, hasEntered, position, portalNode, open, close } = useHoverPreview();

  return (
    <span
      ref={ref}
      className="flex-shrink-0"
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
    >
      <a
        href={item.link}
        target={item.internal ? "_self" : "_blank"}
        rel={item.internal ? undefined : "noreferrer"}
        className="flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-white text-inherit no-underline shadow-sm transition duration-150 ease-in-out hover:shadow-md"
        aria-label={item.title}
      >
        <CFImage
          className="h-full w-full object-cover"
          src={item.image}
          alt={item.alt}
          preset="appLogo"
        />
      </a>

      <HoverPreviewPortal
        isOpen={isHovering}
        portalNode={portalNode}
        position={position}
        hasEntered={hasEntered}
        contentClassName="pointer-events-none w-[220px] translate-y-2 opacity-0 drop-shadow-2xl transition duration-150 ease-in data-[visible=true]:translate-y-0 data-[visible=true]:opacity-100"
      >
        <div className="flex w-full flex-col gap-2 rounded-[1.2rem] bg-white p-2 shadow-sm">
          <div className="relative h-[176px] w-full overflow-hidden rounded-[0.95rem] bg-neutral-100">
            <CFImage
              className="h-full w-full object-cover object-top"
              src={item.previewImage}
              alt={item.alt}
              preset="appPreview"
            />
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <p className="line-clamp-1 text-sm font-medium tracking-tight text-neutral-900">
              {item.title}
            </p>
            <p className="flex-shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
              {item.tag}
            </p>
          </div>
        </div>
      </HoverPreviewPortal>
    </span>
  );
}
