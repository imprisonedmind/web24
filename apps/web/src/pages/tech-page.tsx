import { Breadcrumbs } from "../components/breadcrumbs";
import { SmallLink } from "../components/legacy";
import { orderedTechItems } from "../lib/tech";

export function TechPage() {
  return (
    <section className="flex flex-col gap-4 px-[calc(min(16px,8vw))] py-4">
      <Breadcrumbs />
      <div className="flex flex-col gap-1">
        {orderedTechItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-3 text-sm text-neutral-600"
          >
            <SmallLink href={item.href} label={item.label} external />
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs tracking-wide text-neutral-600">
              {item.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
