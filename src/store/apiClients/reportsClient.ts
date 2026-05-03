import { createBaseClient } from './baseClient';
import { ENV_CONFIG } from '../../config/env';

const reportsClient = createBaseClient(ENV_CONFIG.API_BASE_URL);

export interface Incident {
  id?: string;
  studentName?: string;
  rollNumber?: string;
  exam?: string;
  subject?: string;
  cheatingType?: string;
  timestamp?: string;
  date?: string;
  severity?: 'low' | 'medium' | 'high';
  evidenceFile?: string | null;
  /** JSON-encoded array of snapshot URLs, e.g. '["/api/exams/instances/…"]' */
  snapshots?: string | null;
  instanceId?: string | null;
}

export const reportsApi = {
  getAll: (params?: Record<string, any>) =>
    reportsClient.get<Incident[]>('/api/reports', { params }),
  getById: (id: string) => reportsClient.get<Incident>(`/api/reports/${id}`),
  create: (data: Incident) => reportsClient.post('/api/reports', data),
  remove: (id: string) => reportsClient.delete(`/api/reports/${id}`),
  stats: () => reportsClient.get('/api/reports/stats/summary'),
  exportCsv: (params?: Record<string, any>) => reportsClient.get('/api/reports/export.csv', { params, responseType: 'blob' }),
  // if download=true, request with download param so server can set Content-Disposition
  evidence: (id: string, download: boolean = false) => reportsClient.get(`/api/reports/${id}/evidence`, { params: download ? { download: 1 } : undefined, responseType: 'blob' }),
  uploadEvidence: (id: string, file: File) => {
    // Default: try multipart via fetch
    const url = `${ENV_CONFIG.API_BASE_URL}/api/reports/${id}/evidence`;
    const form = new FormData();
    form.append('evidence', file, file.name);
    return fetch(url, { method: 'POST', body: form }).then(async (res) => {
      if (res.ok) return res.json();
      // if server rejects, try base64 JSON fallback
      const base = await fileToBase64(file);
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, data: base.split(',')[1] }) }).then(r => r.json());
    }).catch(async () => {
      // network or fetch failure: try base64 JSON fallback
      const base = /** @type {string} */ (await fileToBase64(file));
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ filename: file.name, data: base.split(',')[1] }) }).then(r => r.json());
    });
  },
};

export default reportsClient;

// helpers for client-side base64 reading
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
