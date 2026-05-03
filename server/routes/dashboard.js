const express = require('express');
const db = require('../db/database');

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  const totalStudents = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
  const activeExams   = db.prepare(`SELECT COUNT(*) as c FROM exams`).get().c;
  const liveSessions  = db.prepare(`SELECT COUNT(*) as c FROM exam_instances WHERE status='active'`).get().c;
  const today         = new Date().toISOString().slice(0, 10);
  const alertsToday   = db.prepare(`SELECT COUNT(*) as c FROM incidents WHERE date=?`).get(today).c;

  res.json({ data: { totalStudents, activeExams, liveSessions, alertsToday } });
});

// GET /api/dashboard/recent-exams
router.get('/recent-exams', (req, res) => {
  const exams = db.prepare('SELECT * FROM exams ORDER BY createdAt DESC LIMIT 10').all();

  const rows = exams.map(exam => {
    const studentCount = db.prepare('SELECT COUNT(*) as c FROM exam_instances WHERE examId=?').get(exam.id).c;
    const activeCount  = db.prepare(`SELECT COUNT(*) as c FROM exam_instances WHERE examId=? AND status='active'`).get(exam.id).c;
    const doneCount    = db.prepare(`SELECT COUNT(*) as c FROM exam_instances WHERE examId=? AND status='completed'`).get(exam.id).c;

    let statusLabel = 'Scheduled';
    if (activeCount > 0)  statusLabel = 'Ongoing';
    else if (doneCount > 0 && doneCount === studentCount) statusLabel = 'Completed';

    return {
      key: exam.id,
      name: exam.title,
      subject: exam.subject,
      students: studentCount,
      date: exam.scheduledAt ? new Date(exam.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—',
      status: { label: statusLabel },
    };
  });

  res.json({ data: rows });
});

// GET /api/dashboard/live-alerts  — latest 10 high/medium incidents from today
router.get('/live-alerts', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows  = db.prepare(`
    SELECT i.*, s.rollNumber as roll
    FROM incidents i
    LEFT JOIN students s ON i.rollNumber = s.rollNumber
    WHERE i.date = ? AND i.severity IN ('high','medium')
    ORDER BY i.timestamp DESC
    LIMIT 10
  `).all(today);

  const alerts = rows.map(r => ({
    name: r.studentName || 'Unknown',
    room: r.rollNumber  || '—',
    ago:  timeAgo(r.timestamp),
    tag:  r.cheatingType?.split('|')[0]?.trim() || r.cheatingType || 'Incident',
    tone: r.severity === 'high' ? 'danger' : 'warning',
  }));

  res.json({ data: alerts });
});

// GET /api/dashboard/subjects — distinct subjects from the exams table
router.get('/subjects', (req, res) => {
  const rows = db.prepare(`SELECT DISTINCT subject FROM exams WHERE subject IS NOT NULL AND subject != '' ORDER BY subject`).all();
  const subjects = rows.map(r => r.subject);
  res.json({ data: subjects });
});

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  return `${Math.floor(diff/3600)}h ago`;
}

module.exports = router;
