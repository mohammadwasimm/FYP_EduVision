import { lazy } from 'react';
import type { SidebarRouteConfig } from "../types";
import { ROUTE_ENDPOINTS } from "../utils/endpoints";

const Dashboard = lazy(() => import('../../../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Students = lazy(() => import('../../../pages/students/Students').then(m => ({ default: m.Students })));
const StudentEnroll = lazy(() => import('../../../pages/StudentEnroll').then(m => ({ default: m.StudentEnroll })));
const CreatePaper = lazy(() => import('../../../pages/CreatePaper').then(m => ({ default: m.CreatePaper })));
const GeneratedPaper = lazy(() => import('../../../pages/GeneratedPaper').then(m => ({ default: m.GeneratedPaper })));
const LiveMonitoring = lazy(() => import('../../../pages/LiveMonitoring').then(m => ({ default: m.LiveMonitoring })));
const Reports = lazy(() => import('../../../pages/Reports').then(m => ({ default: m.Reports })));
const Settings = lazy(() => import('../../../pages/Settings').then(m => ({ default: m.Settings })));

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
    key: "generated-paper",
    path: ROUTE_ENDPOINTS["generated-paper"],
    title: "Generated Paper",
    component: GeneratedPaper,
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
