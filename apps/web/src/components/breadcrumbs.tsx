import { useRouterState } from "@tanstack/react-router";

export function Breadcrumbs() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");

  return (
    <div className="flex w-fit flex-row gap-2 truncate">
      <a href="/">home</a>
      {pathSegments.length > 0 ? <p>/</p> : null}
      {pathSegments[0] ? <a href={`/${pathSegments[0]}`}>{pathSegments[0]}</a> : null}
      {pathSegments[1] ? <p>/</p> : null}
      {pathSegments[1] ? <p className="truncate">{pathSegments[1]}</p> : null}
    </div>
  );
}
