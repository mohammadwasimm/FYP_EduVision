import { queryClient } from '../store';
import { studentsApi } from '../apiClients/studentsClient';
import type { Student, CreateStudentRequest, UpdateStudentRequest, Assignment } from '../apiClients/studentsClient';

export const StudentsQueries = {
  // Get all students
  getAllStudents: (params?: { search?: string }) =>
    queryClient.fetchQuery({
      queryKey: ['students', params],
      queryFn: () => studentsApi.getAllStudents(params).then((res) => res.data),
    }),

  // Get student by ID
  getStudentById: (id: string) =>
    queryClient.fetchQuery({
      queryKey: ['student', id],
      queryFn: () => studentsApi.getStudentById(id).then((res) => res.data),
    }),

  // Create student
  createStudent: (data: CreateStudentRequest) =>
    queryClient.fetchQuery({
      queryKey: ['createStudent'],
      queryFn: () => studentsApi.createStudent(data).then((res) => res.data),
    }),

  // Update student
  updateStudent: (id: string, data: UpdateStudentRequest) =>
    queryClient.fetchQuery({
      queryKey: ['updateStudent', id],
      queryFn: () => studentsApi.updateStudent(id, data).then((res) => res.data),
    }),

  // Delete student
  deleteStudent: (id: string) =>
    queryClient.fetchQuery({
      queryKey: ['deleteStudent'],
      queryFn: () => studentsApi.deleteStudent(id).then((res) => res.data),
    }),

  // Get student assignments
  getStudentAssignments: (id: string) =>
    queryClient.fetchQuery({
      queryKey: ['studentAssignments', id],
      queryFn: () => studentsApi.getStudentAssignments(id).then((res) => res.data),
    }),
};
