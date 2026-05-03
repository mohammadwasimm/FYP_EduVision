import { studentsApi } from '../../../store/apiClients/studentsClient';
import type { Student, CreateStudentRequest, UpdateStudentRequest, Assignment } from '../../../store/apiClients/studentsClient';

// Fetch all students
export const fetchStudents = async (params?: { search?: string, page?: number, limit?: number }) : Promise<{ data: Student[]; meta?: any }> => {
  const response = await studentsApi.getAllStudents(params as any);
  const body = (response as any).data;
  const posts = body && body.data && body.data.posts ? body.data.posts : (body && body.posts ? body.posts : []);
  const pagination = body && body.data && body.data.pagination ? body.data.pagination : (body && body.pagination ? body.pagination : undefined);
  return { data: posts, pagination } as any;
};

// Fetch single student by ID
export const fetchStudentById = async (id: string): Promise<Student> => {
  const response = await studentsApi.getStudentById(id);
  const body = (response as any).data;
  return body && body.data ? body.data : body;
};

// Create student
export const createStudent = async (data: CreateStudentRequest): Promise<Student> => {
  const response = await studentsApi.createStudent(data);
  const body = (response as any).data;
  return body && body.data ? body.data : body;
};

// Update student
export const updateStudent = async (id: string, data: UpdateStudentRequest): Promise<Student> => {
  const response = await studentsApi.updateStudent(id, data);
  const body = (response as any).data;
  return body && body.data ? body.data : body;
};

// Delete student
export const deleteStudent = async (id: string): Promise<void> => {
  await studentsApi.deleteStudent(id);
};

// Fetch student assignments (submitted papers)
export const fetchStudentAssignments = async (id: string): Promise<Assignment[]> => {
  const response = await studentsApi.getStudentAssignments(id);
  const body = (response as any).data;
  // server returns { data: { student, assignments } }
  if (body && body.data) {
    return body.data.assignments || [];
  }
  // fallback: if body itself contains assignments
  if (body && body.assignments) return body.assignments;
  return [];
};

// Bulk import students (CSV text or JSON array)
export const importStudents = async (body: string | object[]) => {
  const response = await studentsApi.importStudents(body);
  return response.data;
};
