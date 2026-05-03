import { queryClient } from '../store';
import { reportsApi } from '../apiClients/reportsClient';
import type { Incident } from '../apiClients/reportsClient';

export const ReportsQueries = {
  // Get all reports
  getAllReports: (params?: Record<string, any>) =>
    queryClient.fetchQuery({
      queryKey: ['reports', params],
      queryFn: () => reportsApi.getAll(params).then((res) => {
        const body = (res as any).data;
        return body && body.data ? body.data : body;
      }),
    }),

  // Get report by id
  getReportById: (id: string) =>
    queryClient.fetchQuery({
      queryKey: ['report', id],
      queryFn: () => reportsApi.getById(id).then((res) => {
        const body = (res as any).data;
        return body && body.data ? body.data : body;
      }),
    }),

  // Create report
  createReport: (payload: Incident) =>
    queryClient.fetchQuery({
      queryKey: ['createReport', payload],
      queryFn: () => reportsApi.create(payload).then((res) => {
        const body = (res as any).data;
  // Invalidate list/stats after creating a report
  try { queryClient.invalidateQueries({ queryKey: ['reports'] }); queryClient.invalidateQueries({ queryKey: ['reportsStats'] }); } catch(e) {}
        return body && body.data ? body.data : body;
      }),
    }),

  // Delete report
  deleteReport: (id: string) =>
    queryClient.fetchQuery({
      queryKey: ['deleteReport', id],
      queryFn: () => reportsApi.remove(id).then((res) => res.data),
    }),

  // Note: invalidate after delete
  deleteReportAndInvalidate: async (id: string) => {
    const r = await reportsApi.remove(id).then((res) => res.data);
    try { queryClient.invalidateQueries({ queryKey: ['reports'] }); queryClient.invalidateQueries({ queryKey: ['reportsStats'] }); } catch(e) {}
    return r;
  },

  // Upload evidence file for a report
  uploadEvidence: (id: string, file: File) =>
    queryClient.fetchQuery({
      queryKey: ['uploadEvidence', id, file.name],
      queryFn: () => reportsApi.uploadEvidence(id, file).then((res) => {
        // Invalidate report and reports list so UI refreshes
        try { queryClient.invalidateQueries({ queryKey: ['report', id] }); queryClient.invalidateQueries({ queryKey: ['reports'] }); } catch(e) {}
        const body = (res as any).data;
        return body && body.data ? body.data : body;
      }),
    }),

  // Stats
  getReportsStats: () =>
    queryClient.fetchQuery({
      queryKey: ['reportsStats'],
      queryFn: () => reportsApi.stats().then((res) => {
        const body = (res as any).data;
        return body && body.data ? body.data : body;
      }),
    }),

  // Export CSV (returns blob)
  exportCsv: (params?: Record<string, any>) =>
    queryClient.fetchQuery({
      queryKey: ['reportsExport', params],
      queryFn: () => reportsApi.exportCsv(params).then((res) => res.data),
    }),

  // Get evidence blob (returns full Axios response so caller can read headers)
  getEvidence: (id: string) =>
    queryClient.fetchQuery({
      queryKey: ['reportEvidence', id],
      queryFn: () => reportsApi.evidence(id, true).then((res) => res),
    }),
};

export default ReportsQueries;
