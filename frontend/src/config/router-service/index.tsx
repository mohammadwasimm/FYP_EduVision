import type {
  AnyRouteConfig,
  PublicRouteConfig,
  RouteKey,
  SidebarRouteConfig,
} from "./types";
import { sidebarRoutes } from "./sidebar";
import { publicRoutes } from "./public";
import { findRouteByKey, findRouteByPath } from "./utils";

export type {
  AnyRouteConfig,
  PublicRouteConfig,
  RouteKey,
  SidebarRouteConfig,
};

export { sidebarRoutes, publicRoutes };

export const allPrivateRoutes: SidebarRouteConfig[] = sidebarRoutes;
export const allPublicRoutes: PublicRouteConfig[] = publicRoutes;
export const allRoutes: AnyRouteConfig[] = [...publicRoutes, ...sidebarRoutes];

export function getRouteByKey(key: RouteKey): AnyRouteConfig | undefined {
  return findRouteByKey(allRoutes, key);
}

export function getRouteByPath(path: string): AnyRouteConfig | undefined {
  return findRouteByPath(allRoutes, path);
}


