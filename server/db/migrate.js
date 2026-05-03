/**
 * One-time migration: reads existing JSON data files and inserts into SQLite.
 * Safe to run multiple times — uses INSERT OR IGNORE.
 */
const db = require('./database');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '..', 'data');

const readJson = (file) => {
  try {
    const p = path.join(DATA_DIR, file);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) { /* ignore */ }
  return null;
};

function migrateStudents() {
  const list = readJson('students.json');
  if (!Array.isArray(list)) return;
  const ins = db.prepare(`
    INSERT OR IGNORE INTO students (id, name, rollNumber, className, email, studentId)
    VALUES (@id, @name, @rollNumber, @className, @email, @studentId)
  `);
  const run = db.transaction((rows) => rows.forEach(r => ins.run({
    id: r.id,
    name: r.name,
    rollNumber: r.rollNumber || r['roll-number'] || '',
    className: r.className || r['class-name'] || '',
    email: r.email || null,
    studentId: r.studentId || r['student-id'] || r.id,
  })));
  run(list);
  console.log(`[migrate] students: ${list.length} rows`);
}

function migrateExams() {
  const list = readJson('exams.json');
  if (!Array.isArray(list)) return;
  const ins = db.prepare(`
    INSERT OR IGNORE INTO exams (id, title, subject, totalQuestions, timeLimitMinutes, scheduledAt)
    VALUES (@id, @title, @subject, @totalQuestions, @timeLimitMinutes, @scheduledAt)
  `);
  const run = db.transaction((rows) => rows.forEach(r => ins.run({
    id: r.id, title: r.title, subject: r.subject,
    totalQuestions: r.totalQuestions || 0,
    timeLimitMinutes: r.timeLimitMinutes || 60,
    scheduledAt: r.scheduledAt || null,
  })));
  run(list);
  console.log(`[migrate] exams: ${list.length} rows`);
}

function migrateInstances() {
  const list = readJson('exam-instances.json');
  if (!Array.isArray(list)) return;
  const ins = db.prepare(`
    INSERT OR IGNORE INTO exam_instances
      (id, examId, studentId, link, scheduledAt, status, startedAt, completedAt, answers, score, metrics, lastMetricsAt, snapshot, lastSnapshotAt)
    VALUES
      (@id,@examId,@studentId,@link,@scheduledAt,@status,@startedAt,@completedAt,@answers,@score,@metrics,@lastMetricsAt,@snapshot,@lastSnapshotAt)
  `);
  const run = db.transaction((rows) => rows.forEach(r => {
    // Skip instances whose examId does not exist in exams table
    const examExists = db.prepare('SELECT id FROM exams WHERE id = ?').get(r.examId);
    if (!examExists) return;
    // Set studentId to null if the student no longer exists (avoids FK violation)
    const studentExists = r.studentId
      ? db.prepare('SELECT id FROM students WHERE id = ?').get(r.studentId)
      : null;
    ins.run({
      id: r.id, examId: r.examId,
      studentId: studentExists ? r.studentId : null,
      link: r.link || '',
      scheduledAt: r.scheduledAt || null,
      status: r.status || 'created',
      startedAt: r.startedAt || null,
      completedAt: r.completedAt || null,
      answers: JSON.stringify(r.answers || []),
      score: r.score || 0,
      metrics: JSON.stringify(r.metrics || {}),
      lastMetricsAt: r.lastMetricsAt || null,
      snapshot: r.snapshot || null,
      lastSnapshotAt: r.lastSnapshotAt || null,
    });
  }));
  run(list);
  console.log(`[migrate] instances: ${list.length} rows`);
}

function migrateQuestions() {
  // Scan for all exam-questions-*.json files
  let count = 0;
  const ins = db.prepare(`
    INSERT OR IGNORE INTO exam_questions
      (id, examId, question, options, correct, marks, explanation, category, mediaURL, sortOrder)
    VALUES
      (@id,@examId,@question,@options,@correct,@marks,@explanation,@category,@mediaURL,@sortOrder)
  `);
  const run = db.transaction((rows) => rows.forEach(r => ins.run(r)));

  const files = fs.existsSync(DATA_DIR)
    ? fs.readdirSync(DATA_DIR).filter(f => f.startsWith('exam-questions-') && f.endsWith('.json'))
    : [];

  files.forEach(file => {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      const questions = Array.isArray(raw.questions) ? raw.questions : [];
      const examId = file.replace('exam-questions-', '').replace('.json', '');
      const examExists = db.prepare('SELECT id FROM exams WHERE id = ?').get(examId);
      if (!examExists) return;
      const rows = questions.map((q, i) => ({
        id: q.id || `${examId}-q-${i + 1}`,
        examId,
        question: q.question,
        options: JSON.stringify(Array.isArray(q.options) ? q.options : []),
        correct: q.correct ?? 0,
        marks: q.marks || 1,
        explanation: q.explanation || null,
        category: q.category || null,
        mediaURL: q.mediaURL || null,
        sortOrder: i,
      }));
      run(rows);
      count += rows.length;
    } catch (e) { /* ignore */ }
  });
  console.log(`[migrate] questions: ${count} rows`);
}

function migrateIncidents() {
  const list = readJson('incidents.json');
  if (!Array.isArray(list)) return;
  const ins = db.prepare(`
    INSERT OR IGNORE INTO incidents
      (id, studentName, rollNumber, exam, subject, cheatingType, timestamp, date, severity, evidenceFile, instanceId)
    VALUES
      (@id,@studentName,@rollNumber,@exam,@subject,@cheatingType,@timestamp,@date,@severity,@evidenceFile,@instanceId)
  `);
  const run = db.transaction((rows) => rows.forEach(r => ins.run({
    id: r.id, studentName: r.studentName || null, rollNumber: r.rollNumber || null,
    exam: r.exam || null, subject: r.subject || null, cheatingType: r.cheatingType || null,
    timestamp: r.timestamp || new Date().toISOString(),
    date: r.date || new Date().toISOString().slice(0, 10),
    severity: r.severity || 'low', evidenceFile: r.evidenceFile || null,
    instanceId: r.instanceId || null,
  })));
  run(list);
  console.log(`[migrate] incidents: ${list.length} rows`);
}

function migrateAdmins() {
  const list = readJson('admins.json');
  if (!Array.isArray(list)) return;
  const ins = db.prepare(`INSERT OR IGNORE INTO admins (fullName, email, password) VALUES (@fullName,@email,@password)`);
  const run = db.transaction((rows) => rows.forEach(r => ins.run({
    fullName: r.fullName || r.name || 'Admin',
    email: r.email,
    password: typeof r.password === 'object' ? JSON.stringify(r.password) : r.password,
  })));
  run(list);
  console.log(`[migrate] admins: ${list.length} rows`);
}

// Run all migrations
migrateAdmins();
migrateStudents();
migrateExams();
migrateInstances();
migrateQuestions();
migrateIncidents();

console.log('[migrate] done');
