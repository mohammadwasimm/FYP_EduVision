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

const initialState = {
  list: { loading: false, data: [], error: null },
  details: { loading: false, data: null, error: null },
  create: { loading: false, data: null, error: null },
  delete: { loading: false, error: null },
  stats: { loading: false, data: null, error: null },
  selectedIncident: null,
};

const ReportsReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case FETCH_REPORTS_REQUEST:
      return { ...state, list: { ...state.list, loading: true, error: null } };
    case FETCH_REPORTS_SUCCESS:
      return { ...state, list: { ...state.list, data: action.payload, loading: false, error: null } };
    case FETCH_REPORTS_FAILURE:
      return { ...state, list: { ...state.list, loading: false, error: action.payload } };

    case FETCH_REPORT_REQUEST:
      return { ...state, details: { ...state.details, loading: true, error: null } };
    case FETCH_REPORT_SUCCESS:
      return { ...state, details: { ...state.details, data: action.payload, loading: false, error: null } };
    case FETCH_REPORT_FAILURE:
      return { ...state, details: { ...state.details, loading: false, error: action.payload } };

    case CREATE_REPORT_REQUEST:
      return { ...state, create: { ...state.create, loading: true, error: null } };
    case CREATE_REPORT_SUCCESS:
      return { ...state, list: { ...state.list, data: [...state.list.data, action.payload] }, create: { ...state.create, data: action.payload, loading: false, error: null } };
    case CREATE_REPORT_FAILURE:
      return { ...state, create: { ...state.create, loading: false, error: action.payload } };

    case DELETE_REPORT_REQUEST:
      return { ...state, delete: { ...state.delete, loading: true, error: null } };
    case DELETE_REPORT_SUCCESS: {
      const existing = Array.isArray(state.list.data) ? state.list.data : [];
      return {
        ...state,
        list: { ...state.list, data: existing.filter((r: any) => r?.id !== action.payload) },
        delete: { ...state.delete, loading: false, error: null },
  selectedIncident: (state.selectedIncident && (state.selectedIncident as any).id) === action.payload ? null : state.selectedIncident,
      };
    }
    case DELETE_REPORT_FAILURE:
      return { ...state, delete: { ...state.delete, loading: false, error: action.payload } };

    case FETCH_REPORTS_STATS_REQUEST:
      return { ...state, stats: { ...state.stats, loading: true, error: null } };
    case FETCH_REPORTS_STATS_SUCCESS:
      return { ...state, stats: { ...state.stats, data: action.payload, loading: false, error: null } };
    case FETCH_REPORTS_STATS_FAILURE:
      return { ...state, stats: { ...state.stats, loading: false, error: action.payload } };

    case SET_SELECTED_INCIDENT:
      return { ...state, selectedIncident: action.payload };
    case CLEAR_SELECTED_INCIDENT:
      return { ...state, selectedIncident: null };

    default:
      return state;
  }
};

export default ReportsReducer;
