export function getLoginPathForCurrentLocation(location: { pathname: string; search: string }): string {
  return `/login?next=${encodeURIComponent(`${location.pathname}${location.search}`)}`;
}

export function getSafeDashboardReturnPath(search: string): string {
  const requestedPath = new URLSearchParams(search).get("next");
  return requestedPath?.startsWith("/dashboard") && !requestedPath.startsWith("//")
    ? requestedPath
    : "/dashboard";
}
