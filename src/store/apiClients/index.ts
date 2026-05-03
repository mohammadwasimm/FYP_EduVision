export { default as studentsClient, studentsApi } from './studentsClient';
export { default as examsClient, examsApi } from './examsClient';
export { default as authClient, authApi } from './authClient';
export { createBaseClient } from './baseClient';
export type { ApiErrorData } from './baseClient';
export type { Student, CreateStudentRequest, UpdateStudentRequest, Assignment } from './studentsClient';
