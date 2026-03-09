import { Dashboard } from "../../../pages/Dashboard";
import { Students } from "../../../pages/Students";
import { StudentEnroll } from "../../../pages/StudentEnroll";
import { CreatePaper } from "../../../pages/CreatePaper";
import { LiveMonitoring } from "../../../pages/LiveMonitoring";
import { Reports } from "../../../pages/Reports";
import { Settings } from "../../../pages/Settings";
import type { SidebarRouteConfig } from "../types";
import { ROUTE_ENDPOINTS } from "../utils/endpoints";

/**
 * Private routes that are shown inside the main sidebar layout.
 *
 * Keys here are intentionally kept in sync with the Sidebar's `nav`
 * configuration so that each sidebar item maps 1:1 to a route.
 */
export const sidebarRoutes: SidebarRouteConfig[] = [
  {
    key: "dashboard",
    path: ROUTE_ENDPOINTS.dashboard,
    title: "Dashboard",
    component: Dashboard,
    isPrivate: true,
  },
  {
    key: "students",
    path: ROUTE_ENDPOINTS.students,
    title: "Students",
    component: Students,
    isPrivate: true,
  },
  {
    key: "student-enroll",
    path: ROUTE_ENDPOINTS["student-enroll"],
    title: "Student Enroll",
    component: StudentEnroll,
    isPrivate: true,
  },
  {
    key: "create-paper",
    path: ROUTE_ENDPOINTS["create-paper"],
    title: "Create Paper",
    component: CreatePaper,
    isPrivate: true,
  },
  {
    key: "live-monitoring",
    path: ROUTE_ENDPOINTS["live-monitoring"],
    title: "Live Monitoring",
    component: LiveMonitoring,
    isPrivate: true,
  },
  {
    key: "reports",
    path: ROUTE_ENDPOINTS.reports,
    title: "Reports",
    component: Reports,
    isPrivate: true,
  },
  {
    key: "settings",
    path: ROUTE_ENDPOINTS.settings,
    title: "Settings",
    component: Settings,
    isPrivate: true,
  },
];


