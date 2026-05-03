const express = require('express');
const db = require('../db/database');
const { addExam } = require('./exams');

const router = express.Router();
router.use(express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }));

// ─── Helpers ───────────────────────────────────────────────────────────────

function nextStudentId() {
  const row = db.prepare(`SELECT id FROM students WHERE id LIKE 'stu-%' ORDER BY id DESC LIMIT 1`).get();
  if (!row) return { id: 'stu-001', studentId: 'STU001' };
  const num = parseInt(row.id.split('-')[1], 10) + 1;
  return { id: `stu-${String(num).padStart(3,'0')}`, studentId: `STU${String(num).padStart(3,'0')}` };
}

function rowToStudent(r) {
  return { id: r.id, name: r.name, rollNumber: r.rollNumber, className: r.className, email: r.email || '-', studentId: r.studentId };
}

// ─── GET /api/students ──────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const { search, page, limit } = req.query;
  const p = Math.max(1, parseInt(page) || 1);
  const l = Math.max(1, parseInt(limit) || 10);

  let rows, total;
  if (search && String(search).trim()) {
    const q = `%${String(search).trim().toLowerCase()}%`;
    rows  = db.prepare(`SELECT * FROM students WHERE lower(name) LIKE ? OR lower(rollNumber) LIKE ? OR lower(className) LIKE ? OR lower(email) LIKE ? OR lower(studentId) LIKE ? LIMIT ? OFFSET ?`).all(q,q,q,q,q, l, (p-1)*l);
    total = db.prepare(`SELECT COUNT(*) as c FROM students WHERE lower(name) LIKE ? OR lower(rollNumber) LIKE ? OR lower(className) LIKE ? OR lower(email) LIKE ? OR lower(studentId) LIKE ?`).get(q,q,q,q,q).c;
  } else {
    rows  = db.prepare('SELECT * FROM students LIMIT ? OFFSET ?').all(l, (p-1)*l);
    total = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
  }

  const totalPages = Math.max(1, Math.ceil(total / l));
  res.json({ data: { posts: rows.map(rowToStudent), pagination: { page: p, perPage: l, totalRecords: total, totalPages, hasNext: p < totalPages, hasPrevious: p > 1 } } });
});

// ─── GET /api/students/:id ─────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const val = req.params.id;
  const row = db.prepare('SELECT * FROM students WHERE id=? OR lower(studentId)=lower(?) OR lower(rollNumber)=lower(?)').get(val, val, val);
  if (!row) return res.status(404).json({ error: 'Student not found' });
  res.json({ data: rowToStudent(row) });
});

// ─── POST /api/students ────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const raw = req.body || {};
  const name       = (raw.name || '').trim();
  const rollNumber = (raw.rollNumber || raw['roll-number'] || '').trim();
  const className  = (raw.className || raw['class-name'] || '').trim();
  const email      = (raw.email || '').trim();

  if (!name || !rollNumber || !className)
    return res.status(400).json({ error: 'Missing required fields: name, rollNumber, className' });

  const dup = db.prepare('SELECT id FROM students WHERE lower(rollNumber)=lower(?)').get(rollNumber);
  if (dup) return res.status(400).json({ error: `Roll number '${rollNumber}' already exists` });

  const { id, studentId } = nextStudentId();
  db.prepare('INSERT INTO students (id,name,rollNumber,className,email,studentId) VALUES (?,?,?,?,?,?)')
    .run(id, name, rollNumber, className, email || '-', studentId);

  res.status(201).json({ data: rowToStudent(db.prepare('SELECT * FROM students WHERE id=?').get(id)) });
});

// ─── POST /api/students/import ─────────────────────────────────────────────
router.post('/import', (req, res) => {
  const created = [], createdExams = [], errors = [];

  const normalizeKey = (k='') => k.toString().toLowerCase().replace(/[^a-z0-9]/g,'');
  const mapKey = (k) => {
    const n = normalizeKey(k);
    if (n.includes('studentid')||n==='student') return 'studentId';
    if (n.includes('class')) return 'className';
    if (n.includes('roll'))  return 'rollNumber';
    if (n.includes('name'))  return 'name';
    if (n.includes('email')) return 'email';
    return k;
  };

  const insertOne = (obj, idx) => {
    const name       = (obj.name||'').trim();
    const rollNumber = (obj.rollNumber||'').trim();
    const className  = (obj.className||'').trim();
    const email      = (obj.email||'').trim();

    if (!name||!rollNumber||!className) { errors.push({row:idx+1,error:'Missing required fields',raw:obj}); return; }
    if (db.prepare('SELECT id FROM students WHERE lower(rollNumber)=lower(?)').get(rollNumber)) {
      errors.push({row:idx+1,error:`Duplicate rollNumber ${rollNumber}`,raw:obj}); return;
    }
    const { id, studentId } = nextStudentId();
    db.prepare('INSERT INTO students (id,name,rollNumber,className,email,studentId) VALUES (?,?,?,?,?,?)')
      .run(id, name, rollNumber, className, email||'-', studentId);
    created.push(rowToStudent(db.prepare('SELECT * FROM students WHERE id=?').get(id)));
  };

  if (Array.isArray(req.body)) {
    req.body.forEach((raw, i) => {
      const obj = {};
      Object.keys(raw||{}).forEach(k => { obj[mapKey(k)] = raw[k]; });
      if (obj.title||obj.subject) { const ex = addExam(obj); if (ex) createdExams.push(ex); }
      insertOne(obj, i);
    });
    return res.status(201).json({ students: created, exams: createdExams, errors });
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    const lines = req.body.trim().split(/\r?\n/).filter(l=>l.trim());
    if (!lines.length) return res.status(400).json({ error: 'Empty CSV' });
    const headers = lines.shift().split(/,|\t/).map(mapKey);
    lines.forEach((line, i) => {
      const cols = line.split(/,|\t/);
      const obj = {};
      headers.forEach((h,j) => { obj[h] = (cols[j]||'').trim(); });
      if (obj.title||obj.subject) { const ex = addExam(obj); if (ex) createdExams.push(ex); }
      insertOne(obj, i);
    });
    return res.status(201).json({ students: created, exams: createdExams, errors });
  }

  return res.status(400).json({ error: 'Unsupported format. Send JSON array or CSV text.' });
});

// ─── PUT /api/students/:id ─────────────────────────────────────────────────
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const row = db.prepare('SELECT * FROM students WHERE id=?').get(id);
  if (!row) return res.status(404).json({ error: 'Student not found' });

  const raw = req.body || {};
  const name       = (raw.name || row.name).trim();
  const rollNumber = (raw.rollNumber || raw['roll-number'] || row.rollNumber).trim();
  const className  = (raw.className || raw['class-name'] || row.className).trim();
  const email      = raw.email !== undefined ? raw.email.trim() : row.email;

  // duplicate rollNumber check (exclude self)
  const dup = db.prepare('SELECT id FROM students WHERE lower(rollNumber)=lower(?) AND id!=?').get(rollNumber, id);
  if (dup) return res.status(400).json({ error: `Roll number '${rollNumber}' already used` });

  db.prepare('UPDATE students SET name=?,rollNumber=?,className=?,email=? WHERE id=?')
    .run(name, rollNumber, className, email||'-', id);
  res.json({ data: rowToStudent(db.prepare('SELECT * FROM students WHERE id=?').get(id)) });
});

// ─── DELETE /api/students/:id ──────────────────────────────────────────────
router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM students WHERE id=?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Student not found' });
  res.status(204).send();
});

// ─── GET /api/students/:id/assignments ────────────────────────────────────
router.get('/:id/assignments', (req, res) => {
  const student = db.prepare('SELECT * FROM students WHERE id=? OR studentId=?').get(req.params.id, req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const instances = db.prepare(`SELECT * FROM exam_instances WHERE studentId=?`).all(student.id);

  const assignments = instances.map(inst => {
    const exam = db.prepare('SELECT * FROM exams WHERE id=?').get(inst.examId);
    const answers = JSON.parse(inst.answers || '[]');
    const totalObtained = answers.reduce((s,a) => s + (Number(a.marksEarned)||0), 0);

    const questions = db.prepare('SELECT marks FROM exam_questions WHERE examId=?').all(inst.examId);
    const maxMarks = questions.reduce((s,q)=>s+(Number(q.marks)||1),0);
    const total = maxMarks || 0;
    const percent = total > 0 ? `${Math.round((totalObtained/total)*100)}%` : '0%';

    return {
      key: inst.id, instanceId: inst.id, examId: inst.examId,
      title: exam?.title || inst.examId, subject: exam?.subject || '',
      link: inst.link, dateTime: inst.scheduledAt || exam?.scheduledAt || null,
      scheduledAt: inst.scheduledAt || null, status: inst.status || 'created',
      answers, totalObtained, maxMarks, score: totalObtained, total, percent,
      completedAt: inst.completedAt || null,
    };
  });

  res.json({ data: { student: { id: student.id, name: student.name, studentId: student.studentId }, assignments } });
});

module.exports = { studentsRouter: router };
