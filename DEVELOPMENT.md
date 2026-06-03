# EduVision - Development Guide (Frontend & Backend)

Complete development documentation for the AI-powered exam monitoring system.

## 📋 Table of Contents

1. [Frontend Setup & Architecture](#frontend-setup--architecture)
2. [Backend Setup & Architecture](#backend-setup--architecture)
3. [API Endpoints](#api-endpoints)
4. [Database Schema](#database-schema)
5. [Socket.io Integration](#socketio-integration)
6. [AI Detection Flow](#ai-detection-flow)
7. [New Features](#new-features)
8. [Troubleshooting](#troubleshooting)

---

## 🎨 Frontend Setup & Architecture

### Tech Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Socket.io Client** - Real-time updates
- **Ant Design** - UI components
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Installation

```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

### Project Structure

```
frontend/src/
├── components/
│   ├── exam/
│   │   └── ExamInterface.jsx          # Student exam interface
│   ├── monitoring/
│   │   ├── MonitoringCard.jsx         # Student card with live metrics
│   │   ├── MonitoringModal.jsx        # Detailed monitoring view
│   │   └── SummaryCards.jsx
│   ├── reports/
│   │   └── IncidentEvidenceModal.jsx  # Evidence viewer (sidebar gallery)
│   └── ui/                            # Reusable UI components
├── pages/
│   ├── Dashboard.jsx
│   ├── LiveMonitoring.jsx             # Admin monitoring dashboard
│   ├── Reports.jsx                    # Reports with select-all checkbox
│   ├── StudentEnroll.jsx
│   └── Settings.jsx
├── store/
│   ├── apiClients/                    # API integration
│   └── serviceQueries/                # Redux slices
└── utils/
    └── useSocket.js                   # Socket.io custom hook
```

### Key Components

#### ExamInterface.jsx
**Student exam page** - Captures frames every 2 seconds for AI detection.

```javascript
// Sends frames for detection
POST /api/exams/instances/:id/detect-mobile { image: base64 }

// Receives metrics via Socket.io
socket.on('metrics_update', (payload) => {
  // Update display
});
```

#### LiveMonitoring.jsx
**Admin dashboard** - Real-time monitoring of all active exam sessions.

**Features:**
- Grid view of all students
- Real-time metrics updates
- Search & filter functionality
- Click card to open modal

#### IncidentEvidenceModal.jsx
**Evidence viewer** - View captured evidence with detection metrics.

**Features:**
- **Right sidebar thumbnail gallery** - Click thumbnail to view in main area
- **Mobile detection snapshot** - Annotated image with detection boxes
- **Detection metrics cards** - Color-coded status indicators
- **Parsed metrics** - Extracts violations from cheatingType string

### Socket.io Integration

```javascript
const { emit } = useSocket({
  metrics_update: (payload) => {
    // Handle real-time metrics
  },
  snapshot_update: (payload) => {
    // Handle frame update
  },
  new_incident: () => {
    // Load incidents
  },
  session_terminated: (payload) => {
    // Remove student
  }
});
```

### Styling

- **Tailwind CSS** for utility classes
- **Ant Design** for component library
- **Color scheme**:
  - Red (#dc2626) - Critical/Danger
  - Amber (#f59e0b) - Warning
  - Green (#10b981) - Normal
  - Blue (#3b82f6) - Primary

---

## 🛠️ Backend Setup & Architecture

### Tech Stack
- **Node.js + Express.js** - Web framework
- **Socket.io** - Real-time communication
- **SQLite (better-sqlite3)** - Database
- **Python** - AI detection engines
- **Roboflow API** - Mobile detection
- **JWT** - Authentication
- **Nodemailer** - Email notifications

### Installation

```bash
cd backend

# Install Node dependencies
npm install

# Setup Python AI engine
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
cd ai_engine
pip install -r requirements.txt
cd ..

# Configure environment
cat > .env << EOF
SERVER_PORT=5000
NODE_ENV=development
DB_PATH=./api/data/exams.db
ROBOFLOW_API_KEY=your_key_here
JWT_SECRET=change-me-in-production
FRONTEND_URL=http://localhost:3000
EOF

npm start
# Runs on http://localhost:5000
```

### Project Structure

```
backend/
├── api/
│   ├── routes/
│   │   ├── exams.js               # Core exam & detection endpoints
│   │   ├── reports.js             # Incident management
│   │   ├── students.js            # Student management
│   │   ├── auth.js                # Authentication
│   │   ├── dashboard.js           # Statistics
│   │   └── settings.js            # Admin settings
│   ├── middleware/
│   │   └── auth.js                # JWT middleware
│   ├── db/
│   │   ├── database.js            # SQLite initialization
│   │   └── eduvision.db           # Database file
│   ├── data/
│   │   └── snapshots/             # Student frame snapshots
│   └── index.js                   # Express app entry
├── ai_engine/
│   ├── mobile_detection.py        # Roboflow phone detection
│   ├── eye_movement_detection.py  # Gaze tracking
│   ├── head_pose_detection.py     # Head orientation
│   ├── model/                     # Pretrained models
│   └── requirements.txt           # Python dependencies
└── venv/                          # Python virtual environment
```

---

## 📡 API Endpoints

### Authentication

```bash
# Register
POST /api/auth/register
{ "fullName": "...", "email": "...", "password": "..." }

# Login
POST /api/auth/login
{ "email": "...", "password": "..." }
Response: { "token": "jwt...", "admin": {...} }
```

### Exams & Papers

```bash
# Create exam paper
POST /api/exams/papers
{
  "title": "Final Exam",
  "subject": "Biology",
  "studentIds": ["st-001", "st-002"],
  "timeLimitMinutes": 60,
  "totalQuestions": 50
}

# Get all papers with instances
GET /api/exams/papers/list
Response: [{ exam, instances: [...] }, ...]

# Start exam instance
POST /api/exams/instances/:id/start
Response: { instance with status: 'active' }

# Terminate session
POST /api/exams/instances/:id/terminate
Response: { instance with status: 'terminated' }
```

### AI Detection (Async)

```bash
# Mobile detection
POST /api/exams/instances/:id/detect-mobile
{ "image": "data:image/jpeg;base64,..." }
Response: { "instanceId": "...", "processing": true }

# Socket.io metrics_update (2-5 seconds later)
{
  "instanceId": "inst-0001",
  "metrics": {
    "mobileDetected": "Yes",
    "yoloConfidence": 0.95,
    "headMovement": "Normal",
    ...
  }
}

# Eye movement detection
POST /api/exams/instances/:id/detect-eye-movement
{ "image": "..." }

# Head pose detection
POST /api/exams/instances/:id/detect-head-pose
{ "image": "..." }
```

### Metrics Update

```bash
POST /api/exams/instances/:id/metrics
{
  "metrics": {
    "mobileDetected": "Yes",
    "headMovement": "Critical",
    "eyeMovement": "Looking Center",
    "headPose": "Looking at Screen",
    "motionScore": 0.12,
    "tabActive": true,
    "yoloConfidence": 0.95
  }
}
Response: { "instance": {...}, "incident": {...} }
```

### Reports & Incidents

```bash
# Get incidents with filters
GET /api/reports?search=John&exam=exam-001&severity=high
Response: { "data": [{ incident }, ...] }

# Export to CSV
GET /api/reports/export.csv

# Get evidence image
GET /api/reports/:id/evidence
Response: Binary image file

# Delete incident
DELETE /api/reports/:id
```

### Students

```bash
# Create student
POST /api/students
{
  "name": "John Doe",
  "rollNumber": "R001",
  "className": "Class A",
  "email": "john@example.com",
  "studentId": "STU-001"
}

# Get all students
GET /api/students
Response: { "data": [{ student }, ...] }
```

---

## 🗄️ Database Schema

### Tables

#### students
```sql
id TEXT PRIMARY KEY
name TEXT NOT NULL
rollNumber TEXT UNIQUE
className TEXT
email TEXT
studentId TEXT UNIQUE
```

#### exams
```sql
id TEXT PRIMARY KEY
title TEXT NOT NULL
subject TEXT NOT NULL
totalQuestions INTEGER DEFAULT 0
timeLimitMinutes INTEGER DEFAULT 60
scheduledAt TEXT
createdAt TEXT DEFAULT CURRENT_TIMESTAMP
```

#### exam_instances
```sql
id TEXT PRIMARY KEY
examId TEXT REFERENCES exams(id)
studentId TEXT REFERENCES students(id)
link TEXT UNIQUE
status TEXT DEFAULT 'created'
startedAt TEXT
completedAt TEXT
answers TEXT DEFAULT '[]'          -- JSON array
score REAL DEFAULT 0
metrics TEXT DEFAULT '{}'          -- JSON metrics object
lastMetricsAt TEXT
snapshot TEXT                      -- Snapshot URL
lastSnapshotAt TEXT
```

#### incidents
```sql
id TEXT PRIMARY KEY
studentName TEXT
rollNumber TEXT
exam TEXT
subject TEXT
cheatingType TEXT                  -- "Mobile Phone Detected | Head: Critical"
timestamp TEXT
date TEXT
severity TEXT
evidenceFile TEXT                  -- Main evidence image
instanceId TEXT
snapshots TEXT DEFAULT '[]'        -- JSON array of snapshot URLs
mobileDetected TEXT                -- 'Yes' or 'No'
headMovement TEXT                  -- 'Normal', 'Warning', 'Critical'
eyeMovement TEXT                   -- 'Looking Center', 'Looking Away'
headPose TEXT                      -- 'Looking at Screen', 'Tilted'
mobileConfidence REAL              -- 0-1 confidence score
mobileDetectionSnapshot TEXT       -- Annotated detection image URL
detectionMetrics TEXT              -- JSON with all metrics
```

---

## 🔌 Socket.io Integration

### Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_exam` | Client → Server | `examId` |
| `join_monitoring` | Client → Server | Empty |
| `metrics_update` | Server → Client | `{ instanceId, metrics, timestamp }` |
| `snapshot_update` | Server → Client | `{ instanceId, snapshot }` |
| `new_incident` | Server → Client | Incident data |
| `session_terminated` | Server → Client | `{ instanceId, message }` |

### Implementation

```javascript
// Frontend: Join exam room
socket.emit('join_exam', examId);

// Backend: Broadcast metrics to exam room
global._io.to(`exam:${examId}`).emit('metrics_update', {
  instanceId: id,
  metrics: currentMetrics,
  timestamp: new Date().toISOString()
});

// Frontend: Receive metrics
socket.on('metrics_update', (payload) => {
  setSessions(prev => {
    const idx = prev.findIndex(s => s.instanceId === payload.instanceId);
    if (idx === -1) return prev;
    
    const updated = [...prev];
    updated[idx] = { ...updated[idx], metrics: payload.metrics };
    return updated;
  });
});
```

---

## 🤖 AI Detection Flow

### Mobile Detection Process

```
1. Frontend: POST /api/exams/instances/:id/detect-mobile
   Body: { image: "data:image/jpeg;base64,..." }

2. Backend:
   - Decode base64 → save to temp file
   - Spawn Python: python3 mobile_detection.py /tmp/image.jpg
   
3. Python (mobile_detection.py):
   - Import Roboflow (suppress print statements)
   - Load model: workspace("d1156414").project("cellphone-0aodn")
   - Run inference: model.predict(image)
   - Return: {
       "mobile_detected": true/false,
       "confidence": 0-1,
       "annotated_image_path": "/tmp/annotated_xxx.jpg"
     }

4. Backend receives JSON:
   - Update metrics: mobileDetected = 'Yes'
   - Save annotated image → mobileDetectionSnapshot
   - Check if suspicious (mobile=Yes OR head=Critical OR...)
   - If suspicious: create/update incident
   - Emit Socket.io metrics_update

5. Frontend: Receives metrics_update
   - Update dashboard
   - Show detection status with confidence
   - Admin sees red indicator in LiveMonitoring

6. Admin: Opens IncidentEvidenceModal
   - View annotated detection snapshot
   - See parsed metrics from cheatingType
   - Browse all snapshots in right sidebar
```

### Metrics Object Structure

```javascript
{
  // Mobile detection
  mobileDetected: 'Yes' | 'No',
  yoloConfidence: 0-1,              // Confidence percentage

  // Head tracking
  headMovement: 'Normal' | 'Warning' | 'Critical',
  headPose: string,

  // Eye tracking
  eyeMovement: string,
  gazeDirection: string,

  // Motion
  motionScore: 0-1,                 // Threshold: 0.08

  // Browser
  tabActive: boolean,

  // Timestamps
  lastUpdate: ISO timestamp
}
```

---

## ✨ New Features

### 1. Mobile Detection Snapshots

**What**: Annotated images with detection bounding boxes saved alongside evidence.

**How it works**:
```
mobile_detection.py runs inference → returns annotated_image_path
→ Backend saves to snapshots directory
→ Stored as mobileDetectionSnapshot URL
→ Frontend displays in IncidentEvidenceModal
```

**Database columns**:
- `mobileDetectionSnapshot` - URL to annotated image
- `mobileConfidence` - Confidence score (0-1)

### 2. Detection Metrics Parsing

**What**: Automatically extract metrics from cheatingType string for consistent display.

**Implementation**:
```javascript
function parseDetectionMetrics(cheatingType) {
  const metrics = {};
  const parts = cheatingType.split('|').map(p => p.trim());

  parts.forEach(part => {
    if (part.includes('Mobile')) metrics.mobileDetected = 'Yes';
    if (part.includes('Head:')) {
      const match = part.match(/Head:\s*(.+)/);
      if (match) metrics.headMovement = match[1].trim();
    }
    if (part.includes('Eye:')) {
      const match = part.match(/Eye:\s*(.+)/);
      if (match) metrics.eyeMovement = match[1].trim();
    }
    if (part.includes('Pose:')) {
      const match = part.match(/Pose:\s*(.+)/);
      if (match) metrics.headPose = match[1].trim();
    }
  });

  return metrics;
}
```

**Usage**:
```
cheatingType: "Mobile Phone Detected | Head: Critical | Tab Switch"
↓
{ mobileDetected: 'Yes', headMovement: 'Critical' }
```

**Applied in**:
- `IncidentEvidenceModal.jsx` - Evidence viewing
- `Reports.jsx` - Reports table metrics column

### 3. Evidence Modal Right Sidebar

**What**: Vertical thumbnail gallery on the right side of the modal for quick snapshot navigation.

**Features**:
- Click thumbnail to view in main area
- Show shot number badge
- Current selection highlighted (white border + blue ring)
- Scrollable if many snapshots
- Square aspect ratio for previews

**Benefits**:
- Faster navigation through multiple snapshots
- Better visual organization
- Easy reference with numbered badges

### 4. Reports Select All Checkbox

**What**: Header checkbox in reports table to select/deselect all filtered incidents.

**States**:
- ✓ Checked: All visible items selected → Click to deselect all
- ⊘ Indeterminate: Some items selected → Click to select all
- ☐ Unchecked: No items selected → Click to select all

**Implementation**:
```javascript
const handleSelectAll = () => {
  if (selectedReports.size === filteredIncidents.length && filteredIncidents.length > 0) {
    setSelectedReports(new Set());
  } else {
    setSelectedReports(new Set(filteredIncidents.map(inc => inc.id)));
  }
};
```

**Use case**: Bulk delete multiple incidents at once.

### 5. Metrics Sync & Deduplication

**What**: Automatic capture and sync of detection metrics with incident deduplication.

**5-Minute Cooldown**:
```javascript
// Check for recent incident to prevent duplicates
const recentIncident = db.prepare(`
  SELECT * FROM incidents
  WHERE instanceId = ?
    AND datetime(timestamp) > datetime('now', '-5 minutes')
  LIMIT 1
`).get(id);

if (recentIncident) {
  // Update existing incident instead of creating new one
  db.prepare('UPDATE incidents SET snapshots=..., timestamp=now()');
} else {
  // Create new incident
  db.prepare('INSERT INTO incidents (...)');
}
```

---

## 🐛 Troubleshooting

### Frontend Issues

#### Metrics Not Updating in Real-Time
```javascript
// 1. Check Socket.io connection
console.log(socket.connected);

// 2. Verify correct room joined
socket.emit('join_exam', examId);
console.log('Rooms:', socket.rooms);

// 3. Check metrics event received
socket.on('metrics_update', (payload) => {
  console.log('Received:', payload);
});
```

#### Evidence Modal Not Showing Images
```javascript
// Check URL resolution
console.log('Snapshot URL:', incident.snapshots);

// Verify API_BASE_URL
console.log('Base URL:', ENV_CONFIG.API_BASE_URL);

// Check CORS headers
// Network tab → See if image request has CORS error
```

### Backend Issues

#### Python Detection Not Working
```bash
# Activate venv
source venv/bin/activate

# Test directly
python backend/ai_engine/mobile_detection.py /path/to/image.jpg

# Check packages
pip list | grep -E "roboflow|torch|opencv"
```

#### Roboflow Errors
```
Error: "This key is not authorized for serverless inference"
→ Use Private API Key (not Publishable Key)

Error: 401 Unauthorized
→ Check ROBOFLOW_API_KEY in .env

Error: Model not found
→ Verify workspace("d1156414").project("cellphone-0aodn") IDs
```

#### Socket.io Events Not Received
```javascript
// 1. Check broadcasting to correct room
console.log(`Broadcasting to exam:${examId}`);

// 2. Check client joined room
socket.emit('join_exam', examId);

// 3. Verify event names match
// Backend: emit('metrics_update', ...)
// Frontend: on('metrics_update', ...)
```

#### Database Locks
```bash
# SQLite WAL issue
rm backend/api/data/exams.db-wal
rm backend/api/data/exams.db-shm
npm start
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
SERVER_PORT=5001 npm start
```

---

## 🔐 Security

- **JWT Authentication** - Signed tokens with 24h expiry
- **Parameterized Queries** - Prevent SQL injection
- **Environment Secrets** - API keys in .env (not hardcoded)
- **CORS** - Restricted origins
- **Input Validation** - All endpoints validate input
- **Secure Headers** - HTTPS in production

---

## 📚 Environment Variables

```env
# Server
SERVER_PORT=5000
NODE_ENV=development|production

# Database
DB_PATH=./api/data/exams.db

# Roboflow API (Required)
ROBOFLOW_API_KEY=your_private_key_here

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT
JWT_SECRET=change-me-in-production
JWT_EXPIRY=24h

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 🧪 Testing

```bash
# Frontend
cd frontend
npm test                    # Run tests
npm test -- --coverage      # With coverage

# Backend
cd backend
npm test                    # Run tests
npm run test:coverage       # With coverage

# Manual API Testing
curl -X POST http://localhost:5000/api/exams/papers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{"title":"Exam","subject":"Biology","studentIds":[]}'
```

---

## 📖 Building for Production

```bash
# Frontend
cd frontend
npm run build
# Creates optimized /build directory

# Backend
npm start
# Runs Express server directly
```

---

## 🔗 Related Resources

- [React Documentation](https://react.dev/)
- [Express.js Guide](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Roboflow API Docs](https://docs.roboflow.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Ant Design Components](https://ant.design/)

---

## 📝 License

MIT License
