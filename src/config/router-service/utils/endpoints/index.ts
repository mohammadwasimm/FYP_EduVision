/**
 * Central definition of URL endpoints used by the app.
 *
 * These can be imported anywhere you need to build links or
 * navigate programmatically, so paths stay in one place.
 */
export const ROUTE_ENDPOINTS = {
  dashboard: "/",
  students: "/students",
  "create-paper": "/create-paper",
  "live-monitoring": "/live-monitoring",
  reports: "/reports",
  settings: "/settings",
  logout: "/logout",
} as const;

export type EndpointKey = keyof typeof ROUTE_ENDPOINTS;


