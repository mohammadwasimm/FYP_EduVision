import type { ComponentType } from "react";

export type RouteKey =
  | "dashboard"
  | "landing"
  | "admin-signup"
  | "admin-signin"
  | "admin-dashboard"
  | "student-signup"
  | "students"
  | "student-enroll"
  | "create-paper"
  | "generated-paper"
  | "live-monitoring"
  | "reports"
  | "settings"
  | "logout";

export interface BaseRouteConfig {
  key: RouteKey;
  /** URL path, e.g. "/" or "/students" */
  path: string;
  /** Human readable title for headers, breadcrumbs, etc. */
  title: string;
}

export interface SidebarRouteConfig extends BaseRouteConfig {
  /** Sidebar routes are always private/authenticated. */
  isPrivate: true;
  /** React page component that will be rendered for this route. */
  component: ComponentType<any>;
}

export interface PublicRouteConfig extends BaseRouteConfig {
  /** Public routes are accessible without authentication. */
  isPrivate?: false;
  component: ComponentType<any>;
}

export type AnyRouteConfig = SidebarRouteConfig | PublicRouteConfig;


