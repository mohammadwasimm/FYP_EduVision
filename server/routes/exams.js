const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

const router = express.Router();
router.use(express.text({ type: ['text/csv', 'text/plain'], limit: '5mb' }));

const SNAP_DIR = path.resolve(__dirname, '..', 'data', 'snapshots');

// ─── Helpers ───────────────────────────────────────────────────────────────

function nextExamId() {
  const row = db.prepare(`SELECT id FROM exams WHERE id LIKE 'exam-%' ORDER BY id DESC LIMIT 1`).get();
  if (!row) return 'exam-001';
  const n = parseInt(row.id.split('-')[1], 10) + 1;
  return `exam-${String(n).padStart(3,'0')}`;
}

function nextInstanceId() {
  const row = db.prepare(`SELECT id FROM exam_instances WHERE id LIKE 'inst-%' ORDER BY id DESC LIMIT 1`).get();
  if (!row) return 'inst-0001';
  const n = parseInt(row.id.split('-')[1], 10) + 1;
  return `inst-${String(n).padStart(4,'0')}`;
}

function rowToExam(r) {
  return { id: r.id, title: r.title, subject: r.subject, totalQuestions: r.totalQuestions, timeLimitMinutes: r.timeLimitMinutes, scheduledAt: r.scheduledAt };
}

function rowToInstance(r) {
  return {
    ...r,
    answers: typeof r.answers === 'string' ? JSON.parse(r.answers||'[]') : (r.answers||[]),
    metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics||'{}') : (r.metrics||{}),
  };
}

function normalizeLink(raw) {
  if (!raw) return '';
  let s = String(raw);
  try { s = decodeURIComponent(s); } catch(e){}
  try { const u = new URL(s); s = u.pathname; } catch(e){}
  return s.toLowerCase().trim().replace(/\/+/g,'/').replace(/\/$/,'').replace(/^https?:\/\//,'');
}

// ─── Middleware: redirect encoded-link paths to by-link handler ───────────
router.use((req, res, next) => {
  try {
    const p = (req.path||'').replace(/^\//,'');
    if (!p) return next();
    const first = p.split('/')[0];
    const skip = ['papers','instances','import','questions'];
    if (skip.includes(first)) return next();
    const looksLikeLink = s => s && (s.includes('http')||s.includes('edu-vision.')||s.includes('%2f'));
    if (!looksLikeLink(p)) return next();
    let lc = p; try { lc = decodeURIComponent(lc); } catch(e){}
    req.query = req.query || {};
    req.query.link = lc;
    req.url = '/instances/by-link' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '');
    return next();
  } catch(e) { return next(); }
});

// ─── GET /api/exams ────────────────────────────────────────────────────────
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM exams ORDER BY createdAt DESC').all();
  res.json({ data: rows.map(rowToExam) });
});

// ─── POST /api/exams ───────────────────────────────────────────────────────
router.post('/', (req, res) => {
  const { title, subject, totalQuestions, timeLimitMinutes, scheduledAt } = req.body || {};
  if (!title || !subject) return res.status(400).json({ error: 'Missing required fields: title, subject' });
  const id = nextExamId();
  db.prepare('INSERT INTO exams (id,title,subject,totalQuestions,timeLimitMinutes,scheduledAt) VALUES (?,?,?,?,?,?)')
    .run(id, title, subject, totalQuestions||0, timeLimitMinutes||60, scheduledAt||null);
  res.status(201).json({ data: rowToExam(db.prepare('SELECT * FROM exams WHERE id=?').get(id)) });
});

// ─── POST /api/exams/papers ────────────────────────────────────────────────
router.post('/papers', (req, res) => {
  const { title, subject, scheduledAt, studentIds, timeLimitMinutes, totalQuestions } = req.body || {};
  if (!title || !subject || !Array.isArray(studentIds) || !studentIds.length)
    return res.status(400).json({ error: 'Missing required fields: title, subject, studentIds' });

  const examId = nextExamId();
  db.prepare('INSERT INTO exams (id,title,subject,totalQuestions,timeLimitMinutes,scheduledAt) VALUES (?,?,?,?,?,?)')
    .run(examId, title, subject, totalQuestions||0, timeLimitMinutes||60, scheduledAt||null);

  const exam = rowToExam(db.prepare('SELECT * FROM exams WHERE id=?').get(examId));
  const instances = [];

  studentIds.forEach(sid => {
    const student = db.prepare('SELECT * FROM students WHERE id=?').get(sid);
    const sCode = student?.studentId || sid;
    const link = `https://edu-vision.exam/${encodeURIComponent(title.replace(/\s+/g,'-').toLowerCase())}/${examId}/${sCode.toLowerCase()}`;
    const instId = nextInstanceId();
    db.prepare('INSERT INTO exam_instances (id,examId,studentId,link,scheduledAt,status) VALUES (?,?,?,?,?,?)')
      .run(instId, examId, sid, link, scheduledAt||null, 'created');
    instances.push(rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(instId)));
  });

  res.status(201).json({ exam, instances });
});

// ─── DELETE /api/exams/papers/:id ─────────────────────────────────────────
router.delete('/papers/:id', (req, res) => {
  const { id } = req.params;
  const exam = db.prepare('SELECT id FROM exams WHERE id=?').get(id);
  if (!exam) return res.status(404).json({ error: 'Paper not found' });
  // CASCADE deletes instances + questions automatically
  db.prepare('DELETE FROM exams WHERE id=?').run(id);
  res.json({ data: { id, deleted: true } });
});

// ─── GET /api/exams/papers/list ───────────────────────────────────────────
router.get('/papers/list', (req, res) => {
  const exams = db.prepare('SELECT * FROM exams ORDER BY createdAt DESC').all();
  const papers = exams.map(exam => {
    const instances = db.prepare('SELECT ei.*, s.name as studentName, s.rollNumber, s.studentId as studentCode FROM exam_instances ei LEFT JOIN students s ON ei.studentId=s.id WHERE ei.examId=?').all(exam.id);
    return {
      ...rowToExam(exam),
      studentCount: instances.length,
      instances: instances.map(inst => ({
        ...rowToInstance(inst),
        studentName: inst.studentName || null,
        rollNumber: inst.rollNumber || null,
        studentCode: inst.studentCode || null,
      })),
    };
  });
  res.json({ data: papers });
});

// ─── GET /api/exams/instances/by-link ────────────────────────────────────
router.get('/instances/by-link', (req, res) => {
  const link = req.query.link;
  if (!link) return res.status(400).json({ error: 'Missing link query parameter' });

  const normQuery = normalizeLink(link);
  const allInst = db.prepare('SELECT * FROM exam_instances').all();

  const match = allInst.find(inst => {
    if (!inst.link) return false;
    const n = normalizeLink(inst.link);
    if (n === normQuery) return true;
    // last 2 path segments fallback
    const segs = (s) => s.split('/').filter(Boolean).slice(-2).join('/').toLowerCase();
    if (segs(n) && segs(n) === segs(normQuery)) return true;
    if (inst.id && normQuery.includes(inst.id.toLowerCase())) return true;
    return false;
  });

  if (!match) return res.status(404).json({ error: 'Instance not found for provided link', normalizedQuery: normQuery });

  // ── Guard: terminated session ─────────────────────────────────────────────
  if (match.status === 'terminated') {
    return res.status(403).json({
      error: 'terminated',
      message: 'Your session has been terminated by the administrator. You cannot re-enter this exam.',
    });
  }

  // ── Guard: exam not yet scheduled ──────────────────────────────────────────
  const exam = db.prepare('SELECT * FROM exams WHERE id=?').get(match.examId);
  const scheduledAt = match.scheduledAt || exam?.scheduledAt || null;
  if (scheduledAt) {
    const scheduled = new Date(scheduledAt);
    if (!isNaN(scheduled.getTime()) && Date.now() < scheduled.getTime()) {
      const dateStr = scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const timeStr = scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const examTitle = exam?.title ? `"${exam.title}"` : 'Your exam';
      return res.status(403).json({
        error: 'not_yet_scheduled',
        message: `${dateStr} at ${timeStr} — ${examTitle} will start.`,
        scheduledAt,
      });
    }
  }

  const questions = db.prepare('SELECT * FROM exam_questions WHERE examId=? ORDER BY sortOrder').all(match.examId);
  const examPayload = exam ? {
    ...rowToExam(exam),
    questions: questions.map(q => ({ id: q.id, question: q.question, options: JSON.parse(q.options||'[]'), correct: q.correct, marks: q.marks, explanation: q.explanation, category: q.category, mediaURL: q.mediaURL })),
  } : null;

  res.json({ data: { exam: examPayload, instance: rowToInstance(match) } });
});

// ─── POST /api/exams/instances/:id/start ─────────────────────────────────
router.post('/instances/:id/start', (req, res) => {
  const inst = db.prepare('SELECT * FROM exam_instances WHERE id=?').get(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Instance not found' });
  if (inst.status === 'terminated') {
    return res.status(403).json({ error: 'terminated', message: 'Session has been terminated.' });
  }
  db.prepare(`UPDATE exam_instances SET status='active', startedAt=COALESCE(startedAt, datetime('now')) WHERE id=?`).run(req.params.id);
  res.json({ data: rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(req.params.id)) });
});

// ─── POST /api/exams/instances/:id/terminate ──────────────────────────────
// Admin forces a student out of an active exam session.
router.post('/instances/:id/terminate', (req, res) => {
  const inst = db.prepare('SELECT * FROM exam_instances WHERE id=?').get(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Instance not found' });

  db.prepare(`UPDATE exam_instances SET status='terminated', completedAt=datetime('now') WHERE id=?`)
    .run(req.params.id);

  // Notify the student's browser via Socket.io immediately
  if (global._io) {
    global._io.emit('session_terminated', {
      instanceId: req.params.id,
      studentId: inst.studentId,
      message: 'Your session has been terminated by the administrator.',
    });
  }

  const updated = rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(req.params.id));
  res.json({ data: updated });
});

// ─── POST /api/exams/instances ────────────────────────────────────────────
router.post('/instances', (req, res) => {
  const { examId, studentId, link, scheduledAt } = req.body || {};
  if (!examId) return res.status(400).json({ error: 'Missing examId' });

  // Guard: if examId is a full link URL (client bug), do a by-link lookup and
  // return the existing instance instead of trying to create one with a bogus examId.
  const looksLikeLink = (s) => s && (s.includes('http') || s.includes('edu-vision') || s.includes('/'));
  if (looksLikeLink(examId)) {
    const normQuery = normalizeLink(examId);
    const allInst = db.prepare('SELECT * FROM exam_instances').all();
    const match = allInst.find(inst => {
      if (!inst.link) return false;
      const n = normalizeLink(inst.link);
      if (n === normQuery) return true;
      const segs = (s) => s.split('/').filter(Boolean).slice(-2).join('/').toLowerCase();
      if (segs(n) && segs(n) === segs(normQuery)) return true;
      return false;
    });
    if (match) {
      // Mark active and return the existing instance
      db.prepare(`UPDATE exam_instances SET status='active', startedAt=COALESCE(startedAt, datetime('now')) WHERE id=?`).run(match.id);
      return res.status(200).json({ data: rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(match.id)) });
    }
    return res.status(400).json({ error: 'examId looks like a link URL but no matching instance was found. Use GET /instances/by-link instead.' });
  }

  // Verify the exam exists before inserting
  const examRow = db.prepare('SELECT id FROM exams WHERE id=?').get(examId);
  if (!examRow) return res.status(404).json({ error: `Exam '${examId}' not found` });

  const instId = nextInstanceId();
  const instLink = link || `https://edu-vision.exam/${encodeURIComponent(examId)}/${(studentId||'').toLowerCase()}`;
  db.prepare('INSERT INTO exam_instances (id,examId,studentId,link,scheduledAt,status) VALUES (?,?,?,?,?,?)')
    .run(instId, examId, studentId||null, instLink, scheduledAt||null, 'created');
  res.status(201).json({ data: rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(instId)) });
});

// ─── POST /api/exams/instances/:id/answer ─────────────────────────────────
router.post('/instances/:id/answer', (req, res) => {
  const { id } = req.params;
  const { questionId, selectedIndex, selectedValue, complete } = req.body || {};
  if (!questionId) return res.status(400).json({ error: 'Missing questionId' });

  const inst = db.prepare('SELECT * FROM exam_instances WHERE id=?').get(id);
  if (!inst) return res.status(404).json({ error: 'Instance not found' });

  // find question
  const questions = db.prepare('SELECT * FROM exam_questions WHERE examId=? ORDER BY sortOrder').all(inst.examId);
  let question = questions.find(q => String(q.id)===String(questionId));
  if (!question && Number.isInteger(Number(questionId))) question = questions[Number(questionId)-1];
  if (!question) return res.status(404).json({ error: 'Question not found' });

  let selIndex = null;
  if (typeof selectedIndex !== 'undefined' && selectedIndex !== null) {
    const p = Number(selectedIndex); selIndex = isNaN(p) ? null : p;
  } else if (typeof selectedValue !== 'undefined') {
    const opts = JSON.parse(question.options||'[]');
    const fi = opts.findIndex(o => {
      if (o == null) return false;
      if (typeof o === 'object') return String(o.value)===String(selectedValue)||String(o.text)===String(selectedValue);
      return String(o)===String(selectedValue);
    });
    selIndex = fi >= 0 ? fi : null;
  }

  const correctIndex = question.correct ?? null;
  const isCorrect = correctIndex !== null && selIndex !== null ? Number(selIndex)===Number(correctIndex) : false;
  const marksEarned = isCorrect ? (Number(question.marks)||1) : 0;

  const answers = JSON.parse(inst.answers||'[]');
  const existingIdx = answers.findIndex(a => String(a.questionId)===String(question.id));
  const record = { questionId: question.id, selectedIndex: selIndex, isCorrect, marksEarned, answeredAt: new Date().toISOString() };
  if (existingIdx===-1) answers.push(record); else answers[existingIdx] = record;

  const newScore = answers.reduce((s,a) => s+(Number(a.marksEarned)||0), 0);
  const updates = [`answers=?, score=?`];
  const params = [JSON.stringify(answers), newScore];
  if (complete) { updates.push(`status='completed'`, `completedAt=datetime('now')`); }
  db.prepare(`UPDATE exam_instances SET ${updates.join(',')} WHERE id=?`).run(...params, id);

  const updated = rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(id));
  res.json({ data: { instance: updated, result: { questionId: question.id, isCorrect, marksEarned, correctIndex } } });
});

// ─── POST /api/exams/instances/:id/metrics ────────────────────────────────
router.post('/instances/:id/metrics', (req, res) => {
  const { id } = req.params;
  const { metrics } = req.body || {};
  if (!metrics) return res.status(400).json({ error: 'Missing metrics object' });

  const inst = db.prepare('SELECT * FROM exam_instances WHERE id=?').get(id);
  if (!inst) return res.status(404).json({ error: 'Instance not found' });

  const merged = { ...JSON.parse(inst.metrics||'{}'), ...metrics };
  db.prepare(`UPDATE exam_instances SET metrics=?, lastMetricsAt=datetime('now') WHERE id=?`)
    .run(JSON.stringify(merged), id);

  // ── Auto-incident: only for genuinely suspicious signals ─────────────────
  // Fix: mobileDetected='No' is NOT suspicious — only 'Yes' counts.
  const mobileYes = String(metrics.mobileDetected || '').toLowerCase() === 'yes';
  const headCrit  = String(metrics.headMovement   || '').toLowerCase().includes('critical');
  const highMotion = typeof metrics.motionScore === 'number' && metrics.motionScore > 0.08; // raised threshold
  const tabSwitch  = metrics.tabActive === false;

  const suspicious = mobileYes || headCrit || tabSwitch || highMotion;

  if (suspicious) {
    const student = db.prepare('SELECT * FROM students WHERE id=?').get(inst.studentId);
    const exam    = db.prepare('SELECT * FROM exams WHERE id=?').get(inst.examId);

    // Build cheating type — only include what was actually detected
    const cheatingTypeParts = [];
    if (mobileYes)  cheatingTypeParts.push('Mobile Phone Detected');
    if (headCrit)   cheatingTypeParts.push(`Head: ${metrics.headMovement}`);
    if (tabSwitch)  cheatingTypeParts.push('Tab Switch');
    if (highMotion) cheatingTypeParts.push(`Motion: ${metrics.motionScore.toFixed(3)}`);
    const cheatingType = cheatingTypeParts.join(' | ');
    const severity = (mobileYes || headCrit || tabSwitch) ? 'high' : 'medium';

    // ── DEDUPLICATION: 5-minute cooldown per instance ────────────────────
    // If a recent incident exists for this instance within the last 5 minutes,
    // just append the new snapshot to its gallery — don't create a duplicate.
    const recentIncident = db.prepare(`
      SELECT * FROM incidents
      WHERE instanceId = ?
        AND datetime(timestamp) > datetime('now', '-5 minutes')
      ORDER BY timestamp DESC
      LIMIT 1
    `).get(id);

    const currentSnapshot = inst.snapshot || null;

    if (recentIncident) {
      // Add snapshot to gallery and update timestamp + cheating type if escalated
      const snaps = JSON.parse(recentIncident.snapshots || '[]');
      if (currentSnapshot && !snaps.includes(currentSnapshot)) snaps.push(currentSnapshot);
      // Escalate severity if needed
      const newSeverity = severity === 'high' ? 'high' : recentIncident.severity;
      // Also backfill evidenceFile if it was null when the incident was first created
      const newEvidenceFile = recentIncident.evidenceFile || currentSnapshot;
      db.prepare(`
        UPDATE incidents
        SET snapshots=?, timestamp=datetime('now'), cheatingType=?, severity=?, evidenceFile=?
        WHERE id=?
      `).run(JSON.stringify(snaps), cheatingType, newSeverity, newEvidenceFile, recentIncident.id);
    } else {
      // Create a new incident
      const row   = db.prepare(`SELECT id FROM incidents WHERE id LIKE 'inc-%' ORDER BY id DESC LIMIT 1`).get();
      const incId = row ? `inc-${String(parseInt(row.id.split('-')[1],10)+1).padStart(4,'0')}` : 'inc-0001';
      const initSnaps = currentSnapshot ? JSON.stringify([currentSnapshot]) : '[]';

      db.prepare(`
        INSERT OR IGNORE INTO incidents
          (id,studentName,rollNumber,exam,subject,cheatingType,timestamp,date,severity,evidenceFile,instanceId,snapshots)
        VALUES (?,?,?,?,?,?,datetime('now'),date('now'),?,?,?,?)
      `).run(
        incId, student?.name||null, student?.rollNumber||null,
        inst.examId, exam?.subject||null, cheatingType,
        severity, currentSnapshot, id, initSnaps
      );

      const newIncident = db.prepare('SELECT * FROM incidents WHERE id=?').get(incId);
      if (newIncident) {
        if (global._io)         global._io.emit('new_incident', newIncident);
        if (global._emitIncident) global._emitIncident(newIncident);
      }
    }
  }

  // Emit metrics update to live monitoring room
  if (global._io) {
    global._io.to(`exam:${inst.examId}`).emit('metrics_update', { instanceId: id, studentId: inst.studentId, metrics: merged, timestamp: new Date().toISOString() });
    global._io.emit('metrics_update', { instanceId: id, studentId: inst.studentId, metrics: merged, timestamp: new Date().toISOString() });
  }

  const updated = rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(id));
  res.json({ data: { instance: updated } });
});

// ─── POST /api/exams/instances/:id/snapshot ───────────────────────────────
router.post('/instances/:id/snapshot', (req, res) => {
  const { id } = req.params;
  const { image } = req.body || {};
  if (!image) return res.status(400).json({ error: 'Missing image in body' });

  const inst = db.prepare('SELECT * FROM exam_instances WHERE id=?').get(id);
  if (!inst) return res.status(404).json({ error: 'Instance not found' });

  try { if (!fs.existsSync(SNAP_DIR)) fs.mkdirSync(SNAP_DIR, { recursive: true }); } catch(e){}

  const m = image.match(/^data:(image\/(png|jpe?g));base64,(.+)$/);
  const ext = m ? (m[2]==='png'?'png':'jpg') : 'jpg';
  const b64 = m ? m[3] : image.replace(/^data:.*;base64,/,'');
  const filename = `${id}.${ext}`;
  const filePath = path.resolve(SNAP_DIR, filename);

  try { fs.writeFileSync(filePath, Buffer.from(b64,'base64')); } catch(e) {
    return res.status(500).json({ error: 'Failed to save snapshot' });
  }

  const snapUrl = `/api/exams/instances/${id}/snapshot/file/${filename}`;
  db.prepare(`UPDATE exam_instances SET snapshot=?, lastSnapshotAt=datetime('now') WHERE id=?`).run(snapUrl, id);

  // Backlink: add this snapshot to any existing incident for this instance
  // so the evidence gallery is populated even when the snapshot arrives after incident creation.
  const existingIncident = db.prepare(
    `SELECT * FROM incidents WHERE instanceId = ? ORDER BY timestamp DESC LIMIT 1`
  ).get(id);
  if (existingIncident) {
    const snaps = JSON.parse(existingIncident.snapshots || '[]');
    if (!snaps.includes(snapUrl)) snaps.push(snapUrl);
    const newEvidenceFile = existingIncident.evidenceFile || snapUrl;
    db.prepare(`UPDATE incidents SET snapshots=?, evidenceFile=? WHERE id=?`)
      .run(JSON.stringify(snaps), newEvidenceFile, existingIncident.id);
  }

  // Call Python AI if available
  if (process.env.AI_SERVICE_URL) {
    callAiAnalysis(filePath, id).catch(()=>{});
  }

  const updated = rowToInstance(db.prepare('SELECT * FROM exam_instances WHERE id=?').get(id));
  if (global._io) global._io.emit('snapshot_update', { instanceId: id, snapshot: snapUrl });
  res.json({ data: { instance: updated, snapshot: snapUrl } });
});

// ─── GET /api/exams/instances/:id/snapshot/file/:filename ─────────────────
router.get('/instances/:id/snapshot/file/:filename', (req, res) => {
  const filePath = path.resolve(SNAP_DIR, req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', ext==='.png'?'image/png':'image/jpeg');
  res.sendFile(filePath);
});

// ─── GET /api/exams/:id/monitoring ────────────────────────────────────────
router.get('/:id/monitoring', (req, res) => {
  const { id } = req.params;
  const exam = db.prepare('SELECT * FROM exams WHERE id=?').get(id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const instances = db.prepare('SELECT * FROM exam_instances WHERE examId=?').all(id);
  const live = instances.filter(i => i.status==='active');

  const withMetrics = live.map(inst => {
    const student = db.prepare('SELECT * FROM students WHERE id=?').get(inst.studentId);
    const metrics = JSON.parse(inst.metrics||'{}');
    let status = 'normal';
    if (metrics.mobileDetected?.toLowerCase().includes('yes') || metrics.headMovement?.toLowerCase().includes('critical')) status = 'critical';
    else if (metrics.motionScore > 0.04 || metrics.headMovement?.toLowerCase().includes('warning')) status = 'warning';
    return {
      instanceId: inst.id, studentId: inst.studentId,
      name: student?.name || inst.studentId,
      rollNumber: student?.rollNumber || '',
      studentCode: student?.studentId || inst.studentId,
      status, metrics, snapshot: inst.snapshot, lastMetricsAt: inst.lastMetricsAt,
    };
  });

  res.json({ data: {
    examId: id,
    totalLive: live.length,
    normal:   withMetrics.filter(s=>s.status==='normal').length,
    warnings: withMetrics.filter(s=>s.status==='warning').length,
    critical: withMetrics.filter(s=>s.status==='critical').length,
    students: withMetrics,
  }});
});

// ─── GET /api/exams/:id ───────────────────────────────────────────────────
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const looksLikeLink = s => s&&(s.includes('http')||s.includes('%2f')||s.includes('edu-vision.'));
  if (looksLikeLink(id)) {
    // delegate to by-link
    req.query = req.query || {};
    req.query.link = id;
    req.url = '/instances/by-link';
    return router.handle(req, res, ()=>{});
  }
  const exam = db.prepare('SELECT * FROM exams WHERE id=?').get(id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });
  const questions = db.prepare('SELECT * FROM exam_questions WHERE examId=? ORDER BY sortOrder').all(id);
  res.json({ data: { ...rowToExam(exam), questions: questions.map(q=>({ id:q.id, question:q.question, options:JSON.parse(q.options||'[]'), correct:q.correct, marks:q.marks })) }});
});

// ─── POST /api/exams/:id/questions/import ─────────────────────────────────
router.post('/:id/questions/import', (req, res) => {
  const { id: examId } = req.params;
  const exam = db.prepare('SELECT id FROM exams WHERE id=?').get(examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const existing = db.prepare('SELECT COUNT(*) as c FROM exam_questions WHERE examId=?').get(examId).c;
  const created = [], errors = [];

  const mapRow = (obj, rowIdx) => {
    const qText = obj['Question']||obj['question']||obj['QuestionText']||'';
    const opts = [obj['Option A']||obj['A']||'', obj['Option B']||obj['B']||'', obj['Option C']||obj['C']||'', obj['Option D']||obj['D']||''];
    const correct = (obj['Correct']||obj['Answer']||'').toString().trim();
    let correctIndex = null;
    if (/^[ABCDabcd]$/.test(correct)) correctIndex = {A:0,B:1,C:2,D:3,a:0,b:1,c:2,d:3}[correct];
    else if (correct) { const ci = opts.findIndex(o=>o.trim()===correct); if (ci>=0) correctIndex=ci; }
    if (!qText||opts.every(o=>!o)||correctIndex===null) return { error: 'Missing question/options/correct' };
    return { question: { id:`${examId}-q-${existing+created.length+1}`, examId, question:qText, options:JSON.stringify(opts), correct:correctIndex, marks:Number(obj['Marks']||1)||1, explanation:obj['Explanation']||null, category:obj['Category']||null, mediaURL:obj['MediaURL']||null, sortOrder:rowIdx } };
  };

  const insertQ = db.prepare('INSERT OR IGNORE INTO exam_questions (id,examId,question,options,correct,marks,explanation,category,mediaURL,sortOrder) VALUES (@id,@examId,@question,@options,@correct,@marks,@explanation,@category,@mediaURL,@sortOrder)');

  if (Array.isArray(req.body)) {
    req.body.forEach((raw,i) => { const m=mapRow(raw,i); if(m.error) errors.push({row:i+1,error:m.error}); else { insertQ.run(m.question); created.push(m.question); }});
    // update totalQuestions on exam
    db.prepare('UPDATE exams SET totalQuestions=? WHERE id=?').run(db.prepare('SELECT COUNT(*) as c FROM exam_questions WHERE examId=?').get(examId).c, examId);
    return res.status(201).json({ data: created, errors });
  }

  if (typeof req.body === 'string' && req.body.trim()) {
    const rows = parseCsv(req.body.trim());
    if (!rows||!rows.length) return res.status(400).json({ error: 'Empty CSV' });
    const header = rows.shift();
    rows.forEach((r,i) => { const obj={}; header.forEach((h,j)=>{obj[h]=(r[j]||'').trim();}); const m=mapRow(obj,i); if(m.error) errors.push({row:i+1,error:m.error}); else { insertQ.run(m.question); created.push(m.question); }});
    db.prepare('UPDATE exams SET totalQuestions=? WHERE id=?').run(db.prepare('SELECT COUNT(*) as c FROM exam_questions WHERE examId=?').get(examId).c, examId);
    return res.status(201).json({ data: created, errors });
  }
  return res.status(400).json({ error: 'Unsupported format' });
});

// ─── GET /api/exams/:id/questions/csv ────────────────────────────────────
router.get('/:id/questions/csv', (req, res) => {
  const questions = db.prepare('SELECT * FROM exam_questions WHERE examId=? ORDER BY sortOrder').all(req.params.id);
  const esc = v => { const s=String(v??''); return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s; };
  const letters = ['A','B','C','D'];
  const header = ['Question','Option A','Option B','Option C','Option D','Correct','Marks','Explanation','Category','MediaURL'];
  const lines = [header.join(',')];
  questions.forEach(q => {
    const opts = JSON.parse(q.options||'[]');
    const row = [q.question, opts[0]||'', opts[1]||'', opts[2]||'', opts[3]||'', letters[q.correct]||'', q.marks??1, q.explanation||'', q.category||'', q.mediaURL||''];
    lines.push(row.map(esc).join(','));
  });
  res.setHeader('Content-Type','text/csv; charset=utf-8');
  res.send(lines.join('\n'));
});

// ─── POST /api/exams/import ───────────────────────────────────────────────
router.post('/import', (req, res) => {
  const created=[], errors=[];
  const mapKey = k => { const n=k.toLowerCase().replace(/[^a-z0-9]/g,''); if(n.includes('title'))return 'title'; if(n.includes('subject'))return 'subject'; if(n.includes('question'))return 'totalQuestions'; if(n.includes('timelimit'))return 'timeLimitMinutes'; if(n.includes('scheduled'))return 'scheduledAt'; return k; };

  const addOne = (obj,i) => {
    if(!obj.title||!obj.subject){errors.push({row:i+1,error:'Missing title/subject'}); return;}
    const id=nextExamId();
    db.prepare('INSERT INTO exams (id,title,subject,totalQuestions,timeLimitMinutes,scheduledAt) VALUES (?,?,?,?,?,?)').run(id,obj.title,obj.subject,Number(obj.totalQuestions)||0,Number(obj.timeLimitMinutes)||60,obj.scheduledAt||null);
    created.push(rowToExam(db.prepare('SELECT * FROM exams WHERE id=?').get(id)));
  };

  if (Array.isArray(req.body)) { req.body.forEach((r,i)=>{ const o={}; Object.keys(r).forEach(k=>{o[mapKey(k)]=r[k];}); addOne(o,i); }); return res.status(201).json({data:created,errors}); }
  if (typeof req.body==='string'&&req.body.trim()) {
    const lines=req.body.trim().split(/\r?\n/).filter(l=>l.trim());
    if(!lines.length) return res.status(400).json({error:'Empty CSV'});
    const headers=lines.shift().split(/,|\t/).map(mapKey);
    lines.forEach((l,i)=>{ const cols=l.split(/,|\t/); const o={}; headers.forEach((h,j)=>{o[h]=(cols[j]||'').trim();}); addOne(o,i); });
    return res.status(201).json({data:created,errors});
  }
  return res.status(400).json({error:'Unsupported format'});
});

// ─── CSV parser ────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows=[], len=text.length; let i=0,row=[],cur='',inQ=false;
  while(i<len){const ch=text[i]; if(inQ){if(ch==='"'){if(i+1<len&&text[i+1]==='"'){cur+='"';i+=2;continue;}inQ=false;i++;continue;}cur+=ch;i++;continue;} if(ch==='"'){inQ=true;i++;continue;} if(ch===','){row.push(cur);cur='';i++;continue;} if(ch==='\r'){i++;continue;} if(ch==='\n'){row.push(cur);rows.push(row);row=[];cur='';i++;continue;} cur+=ch;i++;}
  if(cur||inQ)row.push(cur); if(row.length)rows.push(row); return rows;
}

// ─── AI analysis helper ────────────────────────────────────────────────────
async function callAiAnalysis(imagePath, instanceId) {
  try {
    const FormData = require('form-data');
    const axios = require('axios');
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));
    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL}/api/ai/analyze-frame`, form, {
      headers: form.getHeaders(), timeout: 8000,
    });
    const aiResult = aiRes.data || {};

    // Map AI output to the metrics fields the rest of the system understands
    const aiMetrics = {
      gazeDirection:   aiResult.gaze_direction   || null,
      headDirection:   aiResult.head_direction   || null,
      mobileDetected:  aiResult.mobile_detected  ? 'Yes' : 'No',
      aiModelsAvailable: aiResult.ai_models_available || false,
      aiProcessedAt:   new Date().toISOString(),
    };

    // Derive headMovement severity from AI output
    const nonScreen = ['Looking Left','Looking Right','Looking Up','Looking Down','Tilted'];
    if (nonScreen.includes(aiMetrics.headDirection)) aiMetrics.headMovement = 'Critical';
    else if (aiMetrics.gazeDirection && aiMetrics.gazeDirection !== 'Looking Center') aiMetrics.headMovement = 'Warning';

    // Merge into instance
    const inst = db.prepare('SELECT metrics FROM exam_instances WHERE id=?').get(instanceId);
    if (inst) {
      const merged = { ...JSON.parse(inst.metrics || '{}'), ...aiMetrics };
      db.prepare('UPDATE exam_instances SET metrics=?, lastMetricsAt=datetime(\'now\') WHERE id=?')
        .run(JSON.stringify(merged), instanceId);

      // Broadcast the AI-enriched metrics to live monitoring
      if (global._io) {
        global._io.emit('metrics_update', {
          instanceId,
          metrics: merged,
          timestamp: new Date().toISOString(),
          source: 'ai',
        });
      }

      // Auto-create incident if AI detects mobile or critical head pose
      if (aiMetrics.mobileDetected === 'Yes' || aiMetrics.headMovement === 'Critical') {
        const instRow = db.prepare('SELECT * FROM exam_instances WHERE id=?').get(instanceId);
        if (instRow) {
          const student = db.prepare('SELECT * FROM students WHERE id=?').get(instRow.studentId);
          const exam    = db.prepare('SELECT * FROM exams WHERE id=?').get(instRow.examId);
          const incId   = (() => {
            const row = db.prepare(`SELECT id FROM incidents WHERE id LIKE 'inc-%' ORDER BY id DESC LIMIT 1`).get();
            if (!row) return 'inc-0001';
            const n = parseInt(row.id.split('-')[1],10) + 1;
            return `inc-${String(n).padStart(4,'0')}`;
          })();
          const cheatingTypeParts = [];
          if (aiMetrics.mobileDetected === 'Yes') cheatingTypeParts.push('Mobile Detected (AI)');
          if (aiMetrics.headDirection && aiMetrics.headDirection !== 'Looking at Screen') cheatingTypeParts.push(`Head: ${aiMetrics.headDirection}`);
          if (aiMetrics.gazeDirection && aiMetrics.gazeDirection !== 'Looking Center') cheatingTypeParts.push(`Gaze: ${aiMetrics.gazeDirection}`);

          db.prepare(`INSERT OR IGNORE INTO incidents (id,studentName,rollNumber,exam,subject,cheatingType,timestamp,date,severity,instanceId) VALUES (?,?,?,?,?,?,datetime('now'),date('now'),?,?)`)
            .run(incId, student?.name||null, student?.rollNumber||null, instRow.examId, exam?.subject||null, cheatingTypeParts.join(' | '), 'high', instanceId);

          const newInc = db.prepare('SELECT * FROM incidents WHERE id=?').get(incId);
          if (global._emitIncident && newInc) global._emitIncident(newInc);
        }
      }
    }
  } catch(e) {
    // AI service is optional — log once in verbose mode
    if (process.env.DEBUG_AI) console.warn('[AI]', e.message);
  }
}

// ─── Export addExam helper (used by students import) ──────────────────────
const addExam = (obj) => {
  const title = obj.title||obj.Title||''; const subject = obj.subject||obj.Subject||'';
  if (!title||!subject) return null;
  const id = nextExamId();
  db.prepare('INSERT INTO exams (id,title,subject,totalQuestions,timeLimitMinutes,scheduledAt) VALUES (?,?,?,?,?,?)').run(id,title,subject,Number(obj.totalQuestions)||0,Number(obj.timeLimitMinutes)||60,obj.scheduledAt||null);
  return rowToExam(db.prepare('SELECT * FROM exams WHERE id=?').get(id));
};

module.exports = { examsRouter: router, addExam };
