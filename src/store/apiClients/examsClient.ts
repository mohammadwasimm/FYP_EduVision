import { createBaseClient } from './baseClient';
import { ENV_CONFIG } from '../../config/env';

const examsClient = createBaseClient(ENV_CONFIG.API_BASE_URL);

export interface CreatePaperRequest {
  title: string;
  subject: string;
  scheduledAt: string;
  studentIds: string[];
  timeLimitMinutes?: number;
  totalQuestions?: number;
}

export interface PaperInstance {
  id: string;
  examId: string;
  studentId: string;
  link: string;
  scheduledAt: string | null;
}

export interface CreatePaperResponse {
  exam: {
    id: string;
    title: string;
    subject: string;
    totalQuestions: number;
    timeLimitMinutes: number;
    scheduledAt: string | null;
  };
  instances: PaperInstance[];
}

export interface Paper {
  id: string;
  title: string;
  subject: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  scheduledAt: string | null;
  studentCount: number;
  instances: PaperInstance[];
}

export interface GetPapersResponse {
  data: Paper[];
}

export const examsApi = {
  createPaper: (data: CreatePaperRequest) =>
    examsClient.post<CreatePaperResponse>('/api/exams/papers', data),

  importExamQuestions: (examId: string, csvText: string) =>
    examsClient.post(`/api/exams/${examId}/questions/import`, csvText, {
      headers: { 'Content-Type': 'text/csv' },
    }),

  getPapers: () =>
    examsClient.get<GetPapersResponse>('/api/exams/papers/list'),

  deletePaper: (examId: string) =>
    examsClient.delete(`/api/exams/papers/${examId}`),

  getExamQuestionsCsv: (examId: string) =>
    examsClient.get<string>(`/api/exams/${examId}/questions/csv`, {
      responseType: 'text',
    }),

  // Fetch full exam payload (meta + questions)
  getExam: (examId: string) => examsClient.get(`/api/exams/${encodeURIComponent(examId)}`),
  getExamByLink: (link: string) => examsClient.get(`/api/exams/instances/by-link`, { params: { link } }),
  // Submit an answer for an instance: { questionId, selectedIndex }
  submitAnswer: (instanceId: string, payload: any) => examsClient.post(`/api/exams/instances/${encodeURIComponent(instanceId)}/answer`, payload),
  // Optionally finish/complete an instance (same endpoint can be used with complete flag)
  finishInstance: (instanceId: string) => examsClient.post(`/api/exams/instances/${encodeURIComponent(instanceId)}/answer`, { complete: true }),
  // Create a new instance for an exam
  createInstance: (data: { examId: string; studentId?: string; link?: string; scheduledAt?: string }) => examsClient.post(`/api/exams/instances`, data),

  // Post live monitoring metrics for an instance
  postMetrics: (instanceId: string, metrics: any) => examsClient.post(`/api/exams/instances/${encodeURIComponent(instanceId)}/metrics`, { metrics }),
  sendMetrics: (instanceId: string, metrics: any) => examsClient.post(`/api/exams/instances/${encodeURIComponent(instanceId)}/metrics`, { metrics }),
  // Upload a small base64 snapshot for live preview
  uploadSnapshot: (instanceId: string, imageBase64: string) => examsClient.post(`/api/exams/instances/${encodeURIComponent(instanceId)}/snapshot`, { image: imageBase64 }),

  updateExamQuestionsCsv: (examId: string, csvText: string) =>
    examsClient.put(`/api/exams/${examId}/questions/csv`, csvText, {
      headers: { 'Content-Type': 'text/csv' },
    }),
  // Mark an exam instance as started
  startInstance: (instanceId: string) => examsClient.post(`/api/exams/instances/${encodeURIComponent(instanceId)}/start`),
  // Admin force-terminates a student session
  terminateInstance: (instanceId: string) => examsClient.post(`/api/exams/instances/${encodeURIComponent(instanceId)}/terminate`),
};

export default examsClient;
