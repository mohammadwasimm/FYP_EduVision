import { createBaseClient } from './baseClient';
import { ENV_CONFIG } from '../../config/env';

const studentsClient = createBaseClient(ENV_CONFIG.API_BASE_URL);

export interface Student {
  id?: string;
  key?: string;
  name: string;
  'roll-number': string;
  'class-name': string;
  email: string;
  'student-id'?: string;
}

export interface CreateStudentRequest {
  name: string;
  'roll-number': string;
  'class-name': string;
  email?: string;
}

export interface UpdateStudentRequest {
  name?: string;
  'roll-number'?: string;
  'class-name'?: string;
  email?: string;
}

export interface Assignment {
  key: string;
  title: string;
  subject: string;
  dateTime: string;
  score: number;
  total: number;
  percent: string;
}

export const studentsApi = {
  // Get all students
  getAllStudents: (params?: { search?: string; page?: number; limit?: number }) =>
    studentsClient.get<Student[]>('/api/students', { params }),

  // Get student by ID
  getStudentById: (id: string) =>
    studentsClient.get<Student>(`/api/students/${id}`),

  // Create student
  createStudent: (data: CreateStudentRequest) =>
    studentsClient.post<Student>('/api/students', data),

  // Update student
  updateStudent: (id: string, data: UpdateStudentRequest) =>
    studentsClient.put<Student>(`/api/students/${id}`, data),

  // Delete student
  deleteStudent: (id: string) =>
    studentsClient.delete(`/api/students/${id}`),

  // Get student assignments (submitted papers)
  getStudentAssignments: (id: string) =>
    studentsClient.get<Assignment[]>(`/api/students/${id}/assignments`),

  // Bulk import students via CSV/text or JSON array
  importStudents: (body: string | object[]) => {
    if (typeof body === 'string') {
      return studentsClient.post('/api/students/import', body, { headers: { 'Content-Type': 'text/csv' } });
    }
    // JSON array will be sent as application/json by default
    return studentsClient.post('/api/students/import', body);
  },
};

export default studentsClient;
