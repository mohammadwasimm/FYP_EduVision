import { ReportsQueries } from '../../../store/serviceQueries/reportsQueries';
import type { Incident } from '../../../store/apiClients/reportsClient';

export const fetchIncidents = async (params?: Record<string, any>): Promise<Incident[]> => {
  const resp = await ReportsQueries.getAllReports(params);
  return resp as Incident[];
};

export const fetchIncidentById = async (id: string): Promise<Incident> => {
  const resp = await ReportsQueries.getReportById(id);
  return resp as Incident;
};

export const createIncident = async (payload: Incident): Promise<Incident> => {
  const resp = await ReportsQueries.createReport(payload);
  return resp as Incident;
};

export const deleteIncident = async (id: string): Promise<void> => {
  await ReportsQueries.deleteReport(id);
};

export const fetchReportsStats = async () => {
  const resp = await ReportsQueries.getReportsStats();
  return resp;
};
