import { PlaceholderPage } from "../../../pages/PlaceholderPage";
import type { PublicRouteConfig } from "../types";

/**
 * Public / guest routes.
 *
 * You can add things like `/login`, `/forgot-password`, etc. here later.
 * For now we expose a simple placeholder example route definition.
 */
export const publicRoutes: PublicRouteConfig[] = [
  {
    key: "dashboard",
    path: "/public-placeholder",
    title: "Public Placeholder",
    component: PlaceholderPage,
    isPrivate: false,
  },
];


