import { createBaseClient } from './baseClient';
import { ENV_CONFIG } from '../../config/env';

const client = createBaseClient(ENV_CONFIG.API_BASE_URL);

export const monitoringApi = {
  /** Returns all active instances across all exams with student info + metrics */
  getAllActiveSessions: async () => {
    // We pull papers/list which includes all instances
    const resp = await client.get('/api/exams/papers/list');
    const papers: any[] = resp.data?.data ?? [];

    const sessions: any[] = [];
    papers.forEach((paper: any) => {
      (paper.instances || []).forEach((inst: any) => {
        if (inst.status !== 'active') return;
        console.log(inst);
        const metrics = typeof inst.metrics === 'string' ? JSON.parse(inst.metrics || '{}') : (inst.metrics || {});
        let status: 'normal' | 'warning' | 'critical' = 'normal';
        if (
          String(metrics.mobileDetected || '').toLowerCase().includes('yes') ||
          String(metrics.headMovement || '').toLowerCase().includes('critical')
        ) status = 'critical';
        else if (
          (typeof metrics.motionScore === 'number' && metrics.motionScore > 0.04) ||
          String(metrics.headMovement || '').toLowerCase().includes('warning')
        ) status = 'warning';

        // Get duration in minutes and convert to seconds
        const durationMinutes = inst.duration || paper.timeLimitMinutes || paper.timeLimit || 0;
        const durationSeconds = typeof durationMinutes === 'number' ? durationMinutes * 60 : 0;

        sessions.push({
          id: inst.id,
          instanceId: inst.id,
          examId: paper.id,
          examTitle: paper.title,
          name: inst.studentName || inst.studentId || '—',
          rollNumber: inst.rollNumber || '—',
          studentId: inst.studentCode || inst.studentId || '—',
          status,
          metrics,
          snapshot: inst.snapshot || null,
          lastMetricsAt: inst.lastMetricsAt || null,
          startedAt: inst.startedAt || null,
          duration: durationSeconds, // Always in seconds for consistency
          completedAt: inst.completedAt || null,
        });
      });
    });
    return sessions;
  },

  getExamMonitoring: (examId: string) =>
    client.get(`/api/exams/${examId}/monitoring`).then(r => r.data?.data),
};
