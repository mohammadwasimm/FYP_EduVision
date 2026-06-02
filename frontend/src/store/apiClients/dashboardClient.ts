import { createBaseClient } from './baseClient';
import { ENV_CONFIG } from '../../config/env';

const client = createBaseClient(ENV_CONFIG.API_BASE_URL);

export const dashboardApi = {
  getStats: () =>
    client.get('/api/dashboard/stats').then(r => r.data?.data),

  getRecentExams: () =>
    client.get('/api/dashboard/recent-exams').then(r => r.data?.data ?? []),

  getLiveAlerts: () =>
    client.get('/api/dashboard/live-alerts').then(r => r.data?.data ?? []),

  /** Returns distinct subject strings already used in exams (e.g. ["Mathematics","Physics"]) */
  getSubjects: () =>
    client.get('/api/dashboard/subjects').then(r => r.data?.data ?? []),
};
