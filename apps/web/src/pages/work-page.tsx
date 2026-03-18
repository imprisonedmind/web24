import { workItems } from "@web24/content";

import { WorkSection } from "../components/catalog";

export function WorkPage() {
  const sections = [
    { title: "professional", items: workItems.filter((item) => item.type === "professional") },
    { title: "personal", items: workItems.filter((item) => item.type === "personal") },
    { title: "college", items: workItems.filter((item) => item.type === "college") },
  ].filter((section) => section.items.length);

  return (
    <section className="flex flex-col gap-8 px-[calc(min(16px,8vw))] py-4">
      {sections.map((section) => (
        <WorkSection key={section.title} title={section.title} items={section.items} />
      ))}
    </section>
  );
}
