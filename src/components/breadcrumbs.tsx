"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname?.split("/").filter((segment) => segment !== "");

  return (
    <div className={`flex w-full flex-row gap-2 truncate`}>
      <Link href={"/"}>home</Link>
      {pathSegments && <p>/</p>}
      {pathSegments && (
        <Link href={`/${pathSegments[0]}`}>{pathSegments[0]}</Link>
      )}
      {pathSegments && pathSegments[1] && <p>/</p>}
      {pathSegments && pathSegments[1] && (
        <p className={"truncate"}>{pathSegments[1]}</p>
      )}
    </div>
  );
}
