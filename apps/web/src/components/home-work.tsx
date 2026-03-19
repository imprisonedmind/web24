import type { WorkItem } from "@web24/content";

import { CFImage } from "./cf-image";
import { SectionHeader, SmallLink } from "./legacy";
import { WorkPreviewLink } from "./previews";

export function HomeWorkSection({ items }: { items: WorkItem[] }) {
  return (
    <section className="-mt-4 flex w-full flex-col gap-1 md:mt-0">
      <SectionHeader title="work" action={<SmallLink href="/work" label="more" />} />
      <div className="hidden flex-col gap-1 md:flex">
        {items.map((item) => (
          <WorkPreviewLink key={item.link} item={item} />
        ))}
      </div>
      <div className="md:hidden">
        <HomeWorkCardStrip items={items.slice(0, 3)} />
      </div>
    </section>
  );
}

function HomeWorkCardStrip({ items }: { items: WorkItem[] }) {
  return (
    <div className="flex flex-row gap-2 overflow-x-auto pb-4">
      {items.map((item) => (
        <a
          key={item.link}
          className="flex min-w-[185px] flex-col gap-2 rounded-xl bg-white p-2 text-inherit no-underline shadow-sm transition duration-150 ease-in-out hover:shadow-md"
          href={item.link}
          target={item.internal ? "_self" : "_blank"}
          rel={item.internal ? undefined : "noreferrer"}
        >
          <div className="relative h-36 w-full overflow-hidden rounded-lg">
            <CFImage
              className="h-full w-full bg-gray-200 object-cover"
              src={item.image}
              alt={item.alt}
              preset="workCard"
            />
          </div>
          <div className="flex justify-between gap-2">
            <p className="text-sm">{item.title}</p>
            <p className="rounded-full bg-neutral-100 p-1 px-2 text-xs">{item.tag}</p>
          </div>
        </a>
      ))}
    </div>
  );
}
