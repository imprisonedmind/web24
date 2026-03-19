import type { WorkItem } from "@web24/content";

import { CFImage } from "./cf-image";

export function WorkCard({ item }: { item: WorkItem }) {
  return (
    <a
      href={item.link}
      target={item.internal ? "_self" : "_blank"}
      rel={item.internal ? undefined : "noreferrer"}
      className="flex w-[185px] flex-shrink-0 flex-col gap-2 rounded-xl bg-white p-2 shadow-sm transition duration-150 ease-in-out hover:shadow-md"
    >
      <div className="relative h-36 w-full overflow-hidden rounded-lg">
        <CFImage
          src={item.image}
          alt={item.alt}
          className="h-full w-full bg-gray-200 object-cover"
          widths={[240, 370]}
          sizes="185px"
        />
      </div>
      <div className="flex justify-between gap-2">
        <p className="text-sm">{item.title}</p>
        <p className="rounded-full bg-neutral-100 p-1 px-2 text-xs">{item.tag}</p>
      </div>
    </a>
  );
}
