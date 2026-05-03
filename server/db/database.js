const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_DIR = path.resolve(__dirname, '..', 'data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const DB_PATH = path.join(DB_DIR, 'eduvision.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName  TEXT    NOT NULL,
    email     TEXT    NOT NULL UNIQUE,
    password  TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS students (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    rollNumber  TEXT NOT NULL UNIQUE,
    className   TEXT NOT NULL,
    email       TEXT,
    studentId   TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS exams (
    id                TEXT    PRIMARY KEY,
    title             TEXT    NOT NULL,
    subject           TEXT    NOT NULL,
    totalQuestions    INTEGER DEFAULT 0,
    timeLimitMinutes  INTEGER DEFAULT 60,
    scheduledAt       TEXT,
    createdAt         TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS exam_instances (
    id              TEXT    PRIMARY KEY,
    examId          TEXT    NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    studentId       TEXT    REFERENCES students(id) ON DELETE SET NULL,
    link            TEXT    NOT NULL,
    scheduledAt     TEXT,
    status          TEXT    DEFAULT 'created',
    startedAt       TEXT,
    completedAt     TEXT,
    answers         TEXT    DEFAULT '[]',
    score           REAL    DEFAULT 0,
    metrics         TEXT    DEFAULT '{}',
    lastMetricsAt   TEXT,
    snapshot        TEXT,
    lastSnapshotAt  TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_instances_examId    ON exam_instances(examId);
  CREATE INDEX IF NOT EXISTS idx_instances_studentId ON exam_instances(studentId);
  CREATE INDEX IF NOT EXISTS idx_instances_status    ON exam_instances(status);

  CREATE TABLE IF NOT EXISTS exam_questions (
    id          TEXT PRIMARY KEY,
    examId      TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question    TEXT NOT NULL,
    options     TEXT NOT NULL,
    correct     INTEGER NOT NULL,
    marks       INTEGER DEFAULT 1,
    explanation TEXT,
    category    TEXT,
    mediaURL    TEXT,
    sortOrder   INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_questions_examId ON exam_questions(examId);

  CREATE TABLE IF NOT EXISTS incidents (
    id            TEXT    PRIMARY KEY,
    studentName   TEXT,
    rollNumber    TEXT,
    exam          TEXT,
    subject       TEXT,
    cheatingType  TEXT,
    timestamp     TEXT    DEFAULT (datetime('now')),
    date          TEXT,
    severity      TEXT    DEFAULT 'low',
    evidenceFile  TEXT,
    instanceId    TEXT,
    snapshots     TEXT    DEFAULT '[]'
  );

  CREATE INDEX IF NOT EXISTS idx_incidents_date     ON incidents(date);
  CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
  CREATE INDEX IF NOT EXISTS idx_incidents_exam     ON incidents(exam);

  CREATE TABLE IF NOT EXISTS settings (
    id    INTEGER PRIMARY KEY CHECK (id = 1),
    data  TEXT    NOT NULL DEFAULT '{}'
  );
`);

// ── Migrations: add columns that didn't exist in earlier schema versions ──────
const incidentCols = db.prepare(`PRAGMA table_info(incidents)`).all().map(c => c.name);
if (!incidentCols.includes('snapshots')) {
  db.exec(`ALTER TABLE incidents ADD COLUMN snapshots TEXT DEFAULT '[]'`);
}

// Seed default settings if missing
const existing = db.prepare('SELECT id FROM settings WHERE id = 1').get();
if (!existing) {
  const defaults = {
    notifications: { emailAlerts: true, criticalOnly: false, dailyDigest: true, soundAlerts: true },
    security: { passwordStrength: 'medium' },
  };
  db.prepare('INSERT INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(defaults));
}

module.exports = db;
