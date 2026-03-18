import { Link, useRouterState } from "@tanstack/react-router";

type TopLevelRoute = "/" | "/work" | "/writing" | "/activity" | "/watched" | "/tech";

export function Breadcrumbs() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const pathSegments = pathname.split("/").filter((segment) => segment !== "");
  const topLevelPath = pathSegments[0] ? (`/${pathSegments[0]}` as TopLevelRoute) : null;

  return (
    <div className="flex w-fit flex-row gap-2 truncate">
      <Link to="/">home</Link>
      {pathSegments.length > 0 ? <p>/</p> : null}
      {pathSegments[0] && topLevelPath ? <Link to={topLevelPath}>{pathSegments[0]}</Link> : null}
      {pathSegments[1] ? <p>/</p> : null}
      {pathSegments[1] ? <p className="truncate">{pathSegments[1]}</p> : null}
    </div>
  );
}
