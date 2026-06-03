/**
 * Central definition of URL endpoints used by the app.
 *
 * These can be imported anywhere you need to build links or
 * navigate programmatically, so paths stay in one place.
 */
export const ROUTE_ENDPOINTS = {
  dashboard: "/dashboard",
  students: "/students",
  "student-enroll": "/student-enroll",
  "create-paper": "/create-paper",
  "generated-paper": "/create-paper/generated-paper",
  "live-monitoring": "/live-monitoring",
  reports: "/reports",
  settings: "/settings",
  logout: "/logout",
} as const;

export type EndpointKey = keyof typeof ROUTE_ENDPOINTS;


