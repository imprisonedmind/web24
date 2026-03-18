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
