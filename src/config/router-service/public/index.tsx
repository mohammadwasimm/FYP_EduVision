import React, { lazy } from 'react';
import type { PublicRouteConfig } from "../types";

const LandingAuth = lazy(() => import('../../../pages/LandingAuth').then(m => ({ default: m.LandingAuth })));
const AdminSignUp = lazy(() => import('../../../pages/AdminSignUp').then(m => ({ default: m.AdminSignUp })));
const AdminSignIn = lazy(() => import('../../../pages/AdminSignIn').then(m => ({ default: m.AdminSignIn })));
const StudentSignUp = lazy(() => import('../../../pages/StudentSignUp').then(m => ({ default: m.StudentSignUp })));
const StudentEnroll = lazy(() => import('../../../pages/StudentEnroll').then(m => ({ default: m.StudentEnroll })));
const PlaceholderPage = lazy(() => import('../../../pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));

/**
 * Public / guest routes.
 */
export const publicRoutes: PublicRouteConfig[] = [
  {
    key: "landing",
    path: "/",
    title: "Landing",
    component: LandingAuth,
    isPrivate: false,
  },
  {
    key: "admin-signup",
    path: "/admin-signup",
    title: "Admin Sign Up",
    component: AdminSignUp,
    isPrivate: false,
  },
  {
    key: "student-signup",
    path: "/student-signup",
    title: "Student Sign Up",
    component: StudentSignUp,
    isPrivate: false,
  },
  {
    key: "student-enroll",
    path: "/student-enroll",
    title: "Student Enroll",
    component: StudentEnroll,
    isPrivate: false,
  },
  {
    key: "admin-signin",
    path: "/admin-signin",
    title: "Admin Sign In",
    component: AdminSignIn,
    isPrivate: false,
  },
  {
    key: "admin-dashboard",
    path: "/admin-dashboard",
    title: "Admin Dashboard",
    component: AdminSignIn,
    isPrivate: false,
  },
  {
    key: "dashboard",
    path: "/public-placeholder",
    title: "Public Placeholder",
    component: PlaceholderPage,
    isPrivate: false,
  },
];
