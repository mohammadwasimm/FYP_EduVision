import type { AnyRouteConfig } from "./types";

/**
 * Find a route config by its key.
 */
export function findRouteByKey<T extends AnyRouteConfig>(
  routes: T[],
  key: T["key"]
): T | undefined {
  return routes.find((route) => route.key === key);
}

/**
 * Find a route config by its path.
 */
export function findRouteByPath<T extends AnyRouteConfig>(
  routes: T[],
  path: string
): T | undefined {
  return routes.find((route) => route.path === path);
}


