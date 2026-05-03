import { dispatch } from '../../../store/store';
import {
  fetchStudents as fetchStudentsApi,
  fetchStudentById as fetchStudentByIdApi,
  createStudent as createStudentApi,
  updateStudent as updateStudentApi,
  deleteStudent as deleteStudentApi,
  fetchStudentAssignments as fetchStudentAssignmentsApi,
} from './apis';
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
  IMPORT_STUDENTS_REQUEST,
  IMPORT_STUDENTS_SUCCESS,
  IMPORT_STUDENTS_FAILURE,
} from './actionTypes';
import type { CreateStudentRequest, UpdateStudentRequest } from '../../../store/apiClients/studentsClient';
import { importStudents as importStudentsApi } from './apis';

// Fetch all students
export const fetchStudents = async (params?: { search?: string, page?: number, limit?: number }) => {
  try {
    dispatch({ type: FETCH_STUDENTS_REQUEST });
  const response = await fetchStudentsApi(params as any);
  dispatch({ type: FETCH_STUDENTS_SUCCESS, payload: response });
  return response;
  } catch (error: any) {
    dispatch({ type: FETCH_STUDENTS_FAILURE, payload: error.message });
    throw error;
  }
};

// Fetch single student by ID
export const fetchStudentById = async (id: string) => {
  try {
    dispatch({ type: FETCH_STUDENT_REQUEST });
    const response = await fetchStudentByIdApi(id);
    dispatch({ type: FETCH_STUDENT_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: FETCH_STUDENT_FAILURE, payload: error.message });
    throw error;
  }
};

// Create student
export const createStudent = async (studentData: CreateStudentRequest) => {
  try {
    dispatch({ type: CREATE_STUDENT_REQUEST });
    const response = await createStudentApi(studentData);
    dispatch({ type: CREATE_STUDENT_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: CREATE_STUDENT_FAILURE, payload: error.detail || error.message });
    throw error;
  }
};

// Update student
export const updateStudent = async (id: string, studentData: UpdateStudentRequest) => {
  try {
    dispatch({ type: UPDATE_STUDENT_REQUEST });
    const response = await updateStudentApi(id, studentData);
    dispatch({ type: UPDATE_STUDENT_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: UPDATE_STUDENT_FAILURE, payload: error.error || error.message });
    throw error;
  }
};

// Delete student
export const deleteStudent = async (id: string) => {
  try {
    dispatch({ type: DELETE_STUDENT_REQUEST });
    await deleteStudentApi(id);
    dispatch({ type: DELETE_STUDENT_SUCCESS, payload: id });
  } catch (error: any) {
    dispatch({ type: DELETE_STUDENT_FAILURE, payload: error.message });
    throw error;
  }
};

// Fetch student assignments (submitted papers)
export const fetchStudentAssignments = async (id: string) => {
  try {
    dispatch({ type: FETCH_STUDENT_ASSIGNMENTS_REQUEST });
    const response = await fetchStudentAssignmentsApi(id);
    dispatch({ 
      type: FETCH_STUDENT_ASSIGNMENTS_SUCCESS, 
      payload: { id, assignments: response } 
    });
    return response;
  } catch (error: any) {
    dispatch({ type: FETCH_STUDENT_ASSIGNMENTS_FAILURE, payload: error.message });
    throw error;
  }
};

// UI Actions
export const setSelectedStudent = (student: any) => {
  dispatch({ type: SET_SELECTED_STUDENT, payload: student });
};

export const clearSelectedStudent = () => {
  dispatch({ type: CLEAR_SELECTED_STUDENT });
};

export const setSearchQuery = (query: string) => {
  dispatch({ type: SET_SEARCH_QUERY, payload: query });
};

// Import students (CSV text or JSON array)
export const importStudents = async (body: string | object[]) => {
  try {
    dispatch({ type: IMPORT_STUDENTS_REQUEST });
    const response = await importStudentsApi(body);
    dispatch({ type: IMPORT_STUDENTS_SUCCESS, payload: response });
    return response;
  } catch (error: any) {
    dispatch({ type: IMPORT_STUDENTS_FAILURE, payload: error?.message || 'Import failed' });
    throw error;
  }
};
