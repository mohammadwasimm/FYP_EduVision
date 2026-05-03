require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const express   = require('express');
const http      = require('http');
const { Server } = require('socket.io');
const path      = require('path');

// ── Run one-time JSON → SQLite migration ──────────────────────────────────
require('./db/migrate');

// ── Routes ────────────────────────────────────────────────────────────────
const { studentsRouter } = require('./routes/students');
const { examsRouter }    = require('./routes/exams');
const { reportsRouter }  = require('./routes/reports');
const settingsRouter     = require('./routes/settings');
const authRouter         = require('./routes/auth');
const dashboardRouter    = require('./routes/dashboard');
const { requireAuth }    = require('./middleware/auth');
const { sendIncidentAlert } = require('./utils/notifications');

// ── CORS helper ────────────────────────────────────────────────────────────
let cors;
try { cors = require('cors'); } catch(e) { cors = null; }

const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
  ],
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS','PATCH'],
  allowedHeaders: ['Content-Type','Authorization','Accept','Cache-Control','Pragma','X-Requested-With'],
};

const app    = express();
const server = http.createServer(app);

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(server, { cors: corsOptions });
global._io = io;

io.on('connection', (socket) => {
  console.log('[socket] client connected:', socket.id);

  // Student joins an exam room
  socket.on('join_exam', (examId) => {
    socket.join(`exam:${examId}`);
  });

  // Admin joins monitoring room
  socket.on('join_monitoring', () => {
    socket.join('monitoring');
  });

  // Student emits a webcam frame every ~2s for live monitoring.
  // Server relays it to all connected admin clients immediately.
  socket.on('student_frame', (data) => {
    // data: { instanceId, examId, studentId, imageData (base64 JPEG), timestamp }
    socket.broadcast.emit('student_frame', data);
  });

  socket.on('disconnect', () => {
    console.log('[socket] client disconnected:', socket.id);
  });
});

// Broadcast incident alert emails when a new incident fires
io.on('connection', (socket) => {
  socket.on('incident_created', (incident) => {
    sendIncidentAlert(incident).catch(() => {});
  });
});

// Watch for new incidents from the DB layer and send emails
global._emitIncident = (incident) => {
  io.emit('new_incident', incident);
  sendIncidentAlert(incident).catch(() => {});
};

// ── Middleware ─────────────────────────────────────────────────────────────
if (cors) app.use(cors(corsOptions));
else {
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (corsOptions.origin.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    res.setHeader('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve snapshot images statically
app.use('/snapshots', express.static(path.resolve(__dirname, 'data', 'snapshots')));

// ── Public routes (no auth required) ──────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'edu-vision-backend' }));
app.use('/api/auth', authRouter);

// ── Exam routes: instance paths are public (students), everything else is admin ──
// Mount examsRouter ONCE. Conditionally apply requireAuth based on the sub-path.
app.use('/api/exams', (req, res, next) => {
  // These sub-paths are student-facing (no login required)
  const isPublicInstanceRoute = req.path.startsWith('/instances');
  if (isPublicInstanceRoute) return next();
  // All other exam routes require admin JWT
  requireAuth(req, res, next);
}, examsRouter);

// ── Other protected routes (JWT required) ─────────────────────────────────
app.use('/api/students',  requireAuth, studentsRouter);
app.use('/api/reports',   requireAuth, reportsRouter);
app.use('/api/settings',  requireAuth, settingsRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);

// ── 404 fallback for unknown API routes ───────────────────────────────────
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ──────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Use a backend-specific env var to avoid clashing with CRA's PORT.
const PORT = Number(process.env.BACKEND_PORT) || 5000;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Socket.io ready`);
});
