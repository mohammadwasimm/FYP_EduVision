import {
  FETCH_STUDENTS_REQUEST,
  FETCH_STUDENTS_SUCCESS,
  FETCH_STUDENTS_FAILURE,
  FETCH_STUDENT_REQUEST,
  FETCH_STUDENT_SUCCESS,
  FETCH_STUDENT_FAILURE,
  CREATE_STUDENT_REQUEST,
  CREATE_STUDENT_SUCCESS,
  CREATE_STUDENT_FAILURE,
  UPDATE_STUDENT_REQUEST,
  UPDATE_STUDENT_SUCCESS,
  UPDATE_STUDENT_FAILURE,
  DELETE_STUDENT_REQUEST,
  DELETE_STUDENT_SUCCESS,
  DELETE_STUDENT_FAILURE,
  FETCH_STUDENT_ASSIGNMENTS_REQUEST,
  FETCH_STUDENT_ASSIGNMENTS_SUCCESS,
  FETCH_STUDENT_ASSIGNMENTS_FAILURE,
  SET_SELECTED_STUDENT,
  CLEAR_SELECTED_STUDENT,
  SET_SEARCH_QUERY,
} from './actionTypes';
import type { Student, Assignment } from '../../../store/apiClients/studentsClient';

const initialStudentsState = {
  // Students list state
  students: {
  loading: false,
  data: [] as Student[],
  error: null as string | null,
  pagination: undefined as any,
  },

  // Create student state
  createStudent: {
    loading: false,
    data: null as Student | null,
    error: null as string | null,
  },

  // Update student state
  updateStudent: {
    loading: false,
    data: null as Student | null,
    error: null as string | null,
  },

  // Delete student state
  deleteStudent: {
    loading: false,
    error: null as string | null,
  },

  // Student details state
  studentDetails: {
    loading: false,
    data: null as Student | null,
    error: null as string | null,
  },

  // Student assignments state
  assignments: {
    loading: false,
    data: {} as Record<string, Assignment[]>,
    error: null as string | null,
  },

  // UI state
  selectedStudent: null as Student | null,
  searchQuery: '' as string,
};

interface Action {
  type: string;
  payload?: any;
}

const StudentsReducer = (
  state = initialStudentsState,
  action: Action
) => {
  switch (action.type) {
    // Fetch Students
    case FETCH_STUDENTS_REQUEST:
      return {
        ...state,
        students: { ...state.students, loading: true, error: null }
      };

  case FETCH_STUDENTS_SUCCESS: {
      const rawPagination = action.payload && action.payload.pagination ? action.payload.pagination : undefined;
      return {
        ...state,
        students: {
          ...state.students,
          data: action.payload && action.payload.data ? action.payload.data : [],
          pagination: rawPagination ?? state.students.pagination,
          loading: false,
          error: null,
        }
      };
    }

    case FETCH_STUDENTS_FAILURE:
      return {
        ...state,
        students: {
          ...state.students,
          loading: false,
          error: action.payload,
        }
      };

    // Fetch Single Student
    case FETCH_STUDENT_REQUEST:
      return {
        ...state,
        studentDetails: { ...state.studentDetails, loading: true, error: null }
      };

    case FETCH_STUDENT_SUCCESS:
      return {
        ...state,
        studentDetails: {
          ...state.studentDetails,
          data: action.payload,
          loading: false,
          error: null,
        }
      };

    case FETCH_STUDENT_FAILURE:
      return {
        ...state,
        studentDetails: {
          ...state.studentDetails,
          loading: false,
          error: action.payload,
        }
      };

    // Create Student
    case CREATE_STUDENT_REQUEST:
      return {
        ...state,
        createStudent: { ...state.createStudent, loading: true, error: null }
      };

    case CREATE_STUDENT_SUCCESS:
      return {
        ...state,
        students: {
          ...state.students,
          data: [...state.students.data, action.payload],
        },
        createStudent: {
          ...state.createStudent,
          data: action.payload,
          loading: false,
          error: null,
        }
      };

    case CREATE_STUDENT_FAILURE:
      return {
        ...state,
        createStudent: {
          ...state.createStudent,
          loading: false,
          error: action.payload,
        }
      };

    // Update Student
    case UPDATE_STUDENT_REQUEST:
      return {
        ...state,
        updateStudent: { ...state.updateStudent, loading: true, error: null }
      };

    case UPDATE_STUDENT_SUCCESS:
      return {
        ...state,
        students: {
          ...state.students,
          data: state.students.data.map((s) =>
            s.id === action.payload.id ? action.payload : s
          ),
        },
        studentDetails: {
          ...state.studentDetails,
          data: state.studentDetails.data?.id === action.payload.id
            ? action.payload
            : state.studentDetails.data,
        },
        selectedStudent:
          state.selectedStudent?.id === action.payload.id
            ? action.payload
            : state.selectedStudent,
        updateStudent: {
          ...state.updateStudent,
          data: action.payload,
          loading: false,
          error: null,
        }
      };

    case UPDATE_STUDENT_FAILURE:
      return {
        ...state,
        updateStudent: {
          ...state.updateStudent,
          loading: false,
          error: action.payload,
        }
      };

    // Delete Student
    case DELETE_STUDENT_REQUEST:
      return {
        ...state,
        deleteStudent: { ...state.deleteStudent, loading: true, error: null }
      };

    case DELETE_STUDENT_SUCCESS:
      return {
        ...state,
        students: {
          ...state.students,
          data: state.students.data.filter((s) => s.id !== action.payload),
        },
        selectedStudent:
          state.selectedStudent?.id === action.payload
            ? null
            : state.selectedStudent,
        studentDetails:
          state.studentDetails.data?.id === action.payload
            ? { ...state.studentDetails, data: null }
            : state.studentDetails,
        deleteStudent: {
          ...state.deleteStudent,
          loading: false,
          error: null,
        }
      };

    case DELETE_STUDENT_FAILURE:
      return {
        ...state,
        deleteStudent: {
          ...state.deleteStudent,
          loading: false,
          error: action.payload,
        }
      };

    // Fetch Student Assignments
    case FETCH_STUDENT_ASSIGNMENTS_REQUEST:
      return {
        ...state,
        assignments: { ...state.assignments, loading: true, error: null }
      };

    case FETCH_STUDENT_ASSIGNMENTS_SUCCESS:
      return {
        ...state,
        assignments: {
          ...state.assignments,
          data: {
            ...state.assignments.data,
            [action.payload.id]: action.payload.assignments,
          },
          loading: false,
          error: null,
        }
      };

    case FETCH_STUDENT_ASSIGNMENTS_FAILURE:
      return {
        ...state,
        assignments: {
          ...state.assignments,
          loading: false,
          error: action.payload,
        }
      };

    // UI Actions
    case SET_SELECTED_STUDENT:
      return {
        ...state,
        selectedStudent: action.payload,
      };

    case CLEAR_SELECTED_STUDENT:
      return {
        ...state,
        selectedStudent: null,
      };

    case SET_SEARCH_QUERY:
      return {
        ...state,
        searchQuery: action.payload,
      };

    default:
      return state;
  }
};

export default StudentsReducer;
