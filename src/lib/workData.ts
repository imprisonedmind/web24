import { workItems, type WorkItem } from "@web24/content";

export interface WorkCardData {
  title: string;
  link: string;
  tag: string;
  type: string;
  src: string;
  alt: string;
  internal?: boolean;
  favourite?: boolean;
  description?: string;
  year?: string;
}

export const workData = (): WorkCardData[] =>
  workItems.map((item: WorkItem) => ({
    ...item,
    src: item.image
  }));
