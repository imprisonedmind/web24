import { Breadcrumbs } from "../components/breadcrumbs";
import { CFImage } from "../components/cf-image";
import { gadgetItems } from "../lib/gadgets";

export function GadgetsPage() {
  return (
    <section className="flex flex-col gap-4 px-[calc(min(16px,8vw))] py-4">
      <Breadcrumbs />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {gadgetItems.map((item) => (
          <div
            key={item.image}
            className="flex flex-col gap-2 rounded-xl bg-white p-2 shadow-sm"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
              <CFImage
                className="h-full w-full object-contain p-2"
                src={item.image}
                alt={item.title}
                preset="gadgetCard"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm text-neutral-800">{item.title}</p>
              <p className="flex-shrink-0 rounded-full bg-neutral-100 p-1 px-2 text-xs lowercase text-neutral-600">
                {item.tag}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
