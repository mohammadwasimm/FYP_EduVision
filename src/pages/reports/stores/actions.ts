import { dispatch } from '../../../store/store';
import {
  FETCH_REPORTS_REQUEST,
  FETCH_REPORTS_SUCCESS,
  FETCH_REPORTS_FAILURE,
  FETCH_REPORT_REQUEST,
  FETCH_REPORT_SUCCESS,
  FETCH_REPORT_FAILURE,
  CREATE_REPORT_REQUEST,
  CREATE_REPORT_SUCCESS,
  CREATE_REPORT_FAILURE,
  DELETE_REPORT_REQUEST,
  DELETE_REPORT_SUCCESS,
  DELETE_REPORT_FAILURE,
  FETCH_REPORTS_STATS_REQUEST,
  FETCH_REPORTS_STATS_SUCCESS,
  FETCH_REPORTS_STATS_FAILURE,
  SET_SELECTED_INCIDENT,
  CLEAR_SELECTED_INCIDENT,
} from './actionTypes';

import {
  fetchIncidents as fetchIncidentsApi,
  fetchIncidentById as fetchIncidentByIdApi,
  createIncident as createIncidentApi,
  deleteIncident as deleteIncidentApi,
  fetchReportsStats as fetchReportsStatsApi,
} from './apis';

// Fetch incidents list
export const fetchReports = async (params?: Record<string, any>) => {
  try {
    dispatch({ type: FETCH_REPORTS_REQUEST });
    const response = await fetchIncidentsApi(params);
    dispatch({ type: FETCH_REPORTS_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: FETCH_REPORTS_FAILURE, payload: error.message });
    throw error;
  }
};

// Fetch single incident
export const fetchReportById = async (id: string) => {
  try {
    dispatch({ type: FETCH_REPORT_REQUEST });
    const response = await fetchIncidentByIdApi(id);
    dispatch({ type: FETCH_REPORT_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: FETCH_REPORT_FAILURE, payload: error.message });
    throw error;
  }
};

// Create incident
export const createReport = async (payload: any) => {
  try {
    dispatch({ type: CREATE_REPORT_REQUEST });
    const response = await createIncidentApi(payload);
    dispatch({ type: CREATE_REPORT_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: CREATE_REPORT_FAILURE, payload: error.message });
    throw error;
  }
};

// Delete incident
export const deleteReport = async (id: string) => {
  try {
    dispatch({ type: DELETE_REPORT_REQUEST });
    await deleteIncidentApi(id);
    dispatch({ type: DELETE_REPORT_SUCCESS, payload: id });
  } catch (error: any) {
    dispatch({ type: DELETE_REPORT_FAILURE, payload: error.message });
    throw error;
  }
};

// Fetch reports stats
export const fetchReportsStats = async () => {
  try {
    dispatch({ type: FETCH_REPORTS_STATS_REQUEST });
    const response = await fetchReportsStatsApi();
    dispatch({ type: FETCH_REPORTS_STATS_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: FETCH_REPORTS_STATS_FAILURE, payload: error.message });
    throw error;
  }
};

// UI selections
export const setSelectedIncident = (incident: any) => {
  dispatch({ type: SET_SELECTED_INCIDENT, payload: incident });
};

export const clearSelectedIncident = () => {
  dispatch({ type: CLEAR_SELECTED_INCIDENT });
};
