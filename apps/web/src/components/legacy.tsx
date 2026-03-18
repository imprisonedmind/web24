import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export function SectionHeader({
  title,
  action
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex w-full items-center justify-between pr-3">
      <h3 className="w-fit text-lg font-medium">{title}</h3>
      {action}
    </div>
  );
}

export function BulletPoint({
  title,
  date
}: {
  title: string;
  date: string;
}) {
  return (
    <div className="ml-3 flex flex-row items-center gap-2">
      <div className="h-1 w-1 rounded-full bg-neutral-300" />
      <p className="text-xs italic tracking-wide text-neutral-500">{title}</p>
      <p className="text-xs italic tracking-wide text-neutral-500">{date}</p>
    </div>
  );
}

export function SmallLink({
  href,
  label,
  external = false
}: {
  href: string;
  label: string;
  external?: boolean;
}) {
  const className =
    "flex w-max text-sm text-neutral-500 underline-offset-4 hover:underline";

  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  }

  return (
    <Link className={className} to={href}>
      {label}
    </Link>
  );
}

export function MediaCard({
  children,
  className = ""
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[1.4rem] border border-[rgba(19,38,28,0.12)] bg-[rgba(255,255,255,0.78)] shadow-[0_16px_36px_rgba(19,38,28,0.08)] ${className}`.trim()}
    >
      {children}
    </div>
  );
}

export function ReviewScoreBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-1 text-xs tracking-wide text-neutral-600">
      {score.toFixed(1)}
    </span>
  );
}
