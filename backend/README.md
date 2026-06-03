# EduVision Backend - Node.js + Express + Socket.io

High-performance real-time exam monitoring server with AI-powered detection integration.

## 🏗️ Architecture

### Technology Stack
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **SQLite (better-sqlite3)** - Database
- **Python** - AI detection engines (child processes)
- **Roboflow API** - Mobile phone detection
- **Nodemailer** - Email notifications
- **JWT** - Authentication

### Core Features
- RESTful API endpoints for exams, students, incidents
- Real-time metrics streaming via Socket.io
- AI-powered detection (mobile, eye movement, head pose)
- Incident auto-creation and deduplication
- Database persistence with WAL mode
- Email notifications and alerts

## 📁 Project Structure

```
backend/
├── api/
│   ├── routes/
│   │   ├── exams.js              # Core exam & detection endpoints
│   │   ├── students.js           # Student management
│   │   ├── reports.js            # Incident reports
│   │   ├── auth.js               # Authentication
│   │   ├── dashboard.js          # Dashboard statistics
│   │   └── settings.js           # Admin settings
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication middleware
│   │   └── cors.js               # CORS configuration
│   ├── db/
│   │   ├── database.js           # SQLite initialization & migrations
│   │   └── eduvision.db          # SQLite database file
│   ├── data/
│   │   └── snapshots/            # Student frame snapshots (images)
│   ├── utils/
│   │   └── ...
│   └── index.js                  # Express app & server setup
├── ai_engine/
│   ├── mobile_detection.py       # Roboflow phone detection
│   ├── eye_movement_detection.py # PyTorch gaze tracking
│   ├── head_pose_detection.py    # Head orientation detection
│   ├── model/                    # Pretrained models directory
│   └── requirements.txt          # Python dependencies
├── venv/                         # Python virtual environment
├── .env                          # Environment configuration
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- Python 3.10+
- npm or yarn

### Installation

#### 1. Install Node Dependencies
```bash
cd backend
npm install
```

#### 2. Set Up Python AI Engine
```bash
# Create virtual environment
python3 -m venv venv

# Activate venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
cd ai_engine
pip install -r requirements.txt
cd ..
```

#### 3. Configure Environment
```bash
cat > .env << EOF
# Server
SERVER_PORT=5000
NODE_ENV=development

# Database
DB_PATH=./api/data/exams.db

# Roboflow API (Required for mobile detection)
ROBOFLOW_API_KEY=your_key_here

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRY=24h

# Frontend URL
FRONTEND_URL=http://localhost:3000
EOF
```

#### 4. Start Server
```bash
npm start
# Server runs on http://localhost:5000
```

## 🔌 API Endpoints

### Authentication

#### Register Admin
```
POST /api/auth/register
Content-Type: application/json

{
  "fullName": "Admin Name",
  "email": "admin@example.com",
  "password": "password123"
}

Response: 201
{
  "data": { "id": 1, "email": "admin@example.com", "token": "jwt..." }
}
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

Response: 200
{
  "data": { "token": "jwt...", "admin": {...} }
}
```

### Exams & Papers

#### Create Exam Paper
```
POST /api/exams/papers
Content-Type: application/json

{
  "title": "Final Biology Exam",
  "subject": "Biology",
  "studentIds": ["st-001", "st-002"],
  "timeLimitMinutes": 60,
  "totalQuestions": 50
}

Response: 201
{
  "exam": { "id": "exam-001", ... },
  "instances": [
    { "id": "inst-0001", "studentId": "st-001", ... }
  ]
}
```

#### Get All Active Papers
```
GET /api/exams/papers/list

Response: 200
{
  "data": [
    {
      "id": "exam-001",
      "title": "Final Biology Exam",
      "instances": [
        {
          "id": "inst-0001",
          "status": "active",
          "studentName": "John Doe",
          "metrics": { "mobileDetected": "No", ... }
        }
      ]
    }
  ]
}
```

#### Start Exam Instance
```
POST /api/exams/instances/:id/start

Response: 200
{
  "data": {
    "id": "inst-0001",
    "status": "active",
    "startedAt": "2024-06-02T17:00:00Z"
  }
}
```

### AI Detection Endpoints

#### Mobile Phone Detection
```
POST /api/exams/instances/:id/detect-mobile
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}

Response: 200 (returns immediately)
{
  "data": {
    "instanceId": "inst-0001",
    "processing": true
  }
}

// Async Socket.io event (2-5 seconds later):
metrics_update: {
  "instanceId": "inst-0001",
  "metrics": {
    "mobileDetected": "Yes",
    "yoloConfidence": 0.95,
    "headMovement": "Normal",
    ...
  },
  "timestamp": "2024-06-02T17:00:05Z"
}
```

#### Eye Movement Detection
```
POST /api/exams/instances/:id/detect-eye-movement
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}

Response: 200 (async)
// Returns metrics: { eyeMovement: "Looking Center", ... }
```

#### Head Pose Detection
```
POST /api/exams/instances/:id/detect-head-pose
Content-Type: application/json

{
  "image": "data:image/jpeg;base64,..."
}

Response: 200 (async)
// Returns metrics: { headPose: "Looking at Screen", ... }
```

### Metrics Update
```
POST /api/exams/instances/:id/metrics
Content-Type: application/json

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

Response: 200
{
  "data": {
    "instance": { ... },
    "incident": { ... } // If suspicious metrics detected
  }
}
```

### Reports & Incidents

#### Get All Incidents
```
GET /api/reports?search=John&exam=exam-001&severity=high

Response: 200
{
  "data": [
    {
      "id": "inc-0001",
      "studentName": "John Doe",
      "rollNumber": "R001",
      "cheatingType": "Mobile Phone Detected | Head: Critical",
      "timestamp": "2024-06-02T17:05:00Z",
      "severity": "high",
      "mobileDetected": "Yes",
      "headMovement": "Critical",
      "snapshots": ["url1", "url2"],
      "mobileConfidence": 0.95,
      ...
    }
  ]
}
```

#### Export Incidents to CSV
```
GET /api/reports/export.csv?severity=high

Response: 200 (CSV file)
id,studentName,severity,mobileDetected,cheatingType,...
inc-0001,"John Doe",high,Yes,"Mobile Phone Detected | Head: Critical",...
```

#### Get Incident Evidence
```
GET /api/reports/:id/evidence

Response: 200 (Binary image file)
Content-Type: image/jpeg
[binary image data]
```

### Students

#### Create Student
```
POST /api/students
Content-Type: application/json

{
  "name": "John Doe",
  "rollNumber": "R001",
  "className": "Class A",
  "email": "john@example.com",
  "studentId": "STU-001"
}

Response: 201
{
  "data": { "id": "st-001", ... }
}
```

#### Get All Students
```
GET /api/students

Response: 200
{
  "data": [
    { "id": "st-001", "name": "John Doe", ... }
  ]
}
```

## 🗄️ Database Schema

### Tables

#### students
```sql
CREATE TABLE students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  rollNumber TEXT UNIQUE,
  className TEXT,
  email TEXT,
  studentId TEXT UNIQUE
);
```

#### exams
```sql
CREATE TABLE exams (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  totalQuestions INTEGER DEFAULT 0,
  timeLimitMinutes INTEGER DEFAULT 60,
  scheduledAt TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP
);
```

#### exam_instances
```sql
CREATE TABLE exam_instances (
  id TEXT PRIMARY KEY,
  examId TEXT REFERENCES exams(id),
  studentId TEXT REFERENCES students(id),
  link TEXT UNIQUE,
  status TEXT DEFAULT 'created',
  startedAt TEXT,
  completedAt TEXT,
  answers TEXT DEFAULT '[]',  -- JSON array
  score REAL DEFAULT 0,
  metrics TEXT DEFAULT '{}',  -- JSON metrics object
  lastMetricsAt TEXT,
  snapshot TEXT,              -- URL to snapshot
  lastSnapshotAt TEXT
);
```

#### incidents
```sql
CREATE TABLE incidents (
  id TEXT PRIMARY KEY,
  studentName TEXT,
  rollNumber TEXT,
  exam TEXT,
  subject TEXT,
  cheatingType TEXT,          -- e.g., "Mobile Phone Detected | Head: Critical"
  timestamp TEXT,
  date TEXT,
  severity TEXT,
  evidenceFile TEXT,
  instanceId TEXT,
  snapshots TEXT DEFAULT '[]', -- JSON array of snapshot URLs
  mobileDetected TEXT,
  headMovement TEXT,
  eyeMovement TEXT,
  headPose TEXT,
  mobileConfidence REAL,
  mobileDetectionSnapshot TEXT, -- Annotated detection image
  detectionMetrics TEXT       -- JSON with all metrics
);
```

## 🔌 Socket.io Events

### Server Emits

```javascript
// Metrics update (broadcast to exam room)
socket.to(`exam:${examId}`).emit('metrics_update', {
  instanceId: 'inst-0001',
  studentId: 'st-001',
  metrics: { mobileDetected: 'Yes', ... },
  timestamp: new Date().toISOString()
});

// New incident created
global._io.emit('new_incident', {
  id: 'inc-0001',
  studentName: 'John Doe',
  cheatingType: 'Mobile Phone Detected',
  ...
});

// Session terminated
socket.emit('session_terminated', {
  instanceId: 'inst-0001',
  message: 'Session terminated by admin'
});
```

### Client Events

```javascript
// Student joins exam
socket.emit('join_exam', examId);

// Admin joins monitoring
socket.emit('join_monitoring');

// Send frame (over HTTP, not Socket.io)
await axios.post('/api/exams/instances/:id/detect-mobile', { image });
```

## 🤖 AI Detection Flow

### Mobile Detection Process

```
1. Frontend sends: POST /api/exams/instances/:id/detect-mobile
   Body: { image: "data:image/jpeg;base64,..." }

2. Backend:
   - Decode base64 → save to temp file
   - Spawn Python: python3 mobile_detection.py /tmp/image.jpg
   - Wait for stdout (JSON response)

3. Python (mobile_detection.py):
   - Import Roboflow (suppress print statements)
   - Load model: workspace("d1156414").project("cellphone-0aodn")
   - Run inference: model.predict(image)
   - Parse predictions → return JSON

4. Backend receives JSON:
   - Update database: metrics.mobileDetected = 'Yes'
   - Check if suspicious (mobile=Yes OR head=Critical OR...)
   - If suspicious: create incident record
   - Emit Socket.io to exam room

5. Frontend receives metrics_update
   - Update dashboard display
   - Show red indicator for mobile detected
   - Show confidence percentage
```

### Error Handling

```javascript
// Timeout: Python takes >15s
python.on('close', (code) => {
  if (code !== 0 || !output.trim()) {
    resolve({ mobileDetected: false, confidence: 0 });
  }
});

// Parse error: Invalid JSON
try {
  const result = JSON.parse(output);
} catch (e) {
  resolve({ mobileDetected: false, confidence: 0 });
}
```

## 📊 Metrics Object Structure

```typescript
interface Metrics {
  // Mobile detection
  mobileDetected: 'Yes' | 'No';
  yoloConfidence: number; // 0-1

  // Head tracking
  headMovement: 'Normal' | 'Warning' | 'Critical';
  headPose: string; // 'Looking at Screen', 'Tilted', etc

  // Eye tracking
  eyeMovement: string; // 'Looking Center', 'Looking Away', etc
  gazeDirection: string;

  // Motion detection
  motionScore: number; // 0-1, threshold 0.08 for warning

  // Browser activity
  tabActive: boolean;

  // Timestamps
  lastUpdate: string; // ISO timestamp
}
```

## 🎯 Incident Auto-Creation

Incidents are created automatically when suspicious metrics are detected:

```javascript
const suspicious = 
  mobileDetected === 'Yes' ||           // Critical
  headMovement === 'Critical' ||        // Critical
  motionScore > 0.08 ||                 // Motion threshold
  tabActive === false;                  // Tab switch

if (suspicious) {
  // Build cheatingType from detected violations
  const cheatingType = [
    mobileDetected === 'Yes' ? 'Mobile Phone Detected' : null,
    headMovement === 'Critical' ? `Head: ${headMovement}` : null,
    tabActive === false ? 'Tab Switch' : null,
    motionScore > 0.08 ? `Motion: ${motionScore.toFixed(3)}` : null
  ].filter(Boolean).join(' | ');

  // Check for recent incident (deduplication: 5-minute cooldown)
  const recentIncident = db.prepare(`
    SELECT * FROM incidents
    WHERE instanceId = ?
      AND datetime(timestamp) > datetime('now', '-5 minutes')
    LIMIT 1
  `).get(id);

  if (recentIncident) {
    // Update existing incident
    db.prepare('UPDATE incidents SET snapshots=..., timestamp=now()')
      .run(JSON.stringify(snaps), recentIncident.id);
  } else {
    // Create new incident
    db.prepare('INSERT INTO incidents (...) VALUES (...)')
      .run(incId, studentName, ...);
  }
}
```

## 🛡️ Security

### Authentication
- **JWT tokens** with expiry (24h default)
- **Protected routes** require valid token in Authorization header
- **Password hashing** with bcrypt (built into SQLite auth)

### Input Validation
- **File upload** - Validate base64 image format
- **API parameters** - Validate exam/student/instance IDs
- **Metrics** - Type checking for metric values

### Database Safety
- **Parameterized queries** prevent SQL injection
- **Foreign key constraints** maintain referential integrity
- **WAL mode** enables concurrent read/write
- **Transactions** for multi-step operations

### Environment
- **API keys in .env** (never hardcoded)
- **CORS enabled** - Restrict origins
- **HTTPS** in production

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage

# Test specific endpoint
npm test -- routes/exams.test.js
```

### Manual Testing

```bash
# Test mobile detection
curl -X POST http://localhost:5000/api/exams/instances/inst-0001/detect-mobile \
  -H "Content-Type: application/json" \
  -d '{"image":"data:image/jpeg;base64,..."}' \
  -H "Authorization: Bearer token"

# Test metrics update
curl -X POST http://localhost:5000/api/exams/instances/inst-0001/metrics \
  -H "Content-Type: application/json" \
  -d '{"metrics":{"mobileDetected":"Yes","headMovement":"Critical"}}' \
  -H "Authorization: Bearer token"
```

## 📝 Environment Variables Reference

```env
# Server Configuration
SERVER_PORT=5000                    # Express server port
NODE_ENV=development|production     # Environment mode

# Database
DB_PATH=./api/data/exams.db        # SQLite database file path

# Roboflow API (Required)
ROBOFLOW_API_KEY=your_key          # Mobile detection API key

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@example.com

# JWT
JWT_SECRET=change-me-in-production
JWT_EXPIRY=24h

# Frontend
FRONTEND_URL=http://localhost:3000

# AI Engine
PYTHON_PATH=/path/to/venv/bin/python3
```

## 🐛 Troubleshooting

### Python Detection Not Working
```bash
# Activate venv and test
source venv/bin/activate
python backend/ai_engine/mobile_detection.py /path/to/image.jpg

# Check Python packages
pip list | grep -E "roboflow|torch|opencv"
```

### Roboflow Errors
```
Error: "This key is not authorized for serverless inference"
→ Use Private API Key (not Publishable Key)

Error: 401 Unauthorized
→ Check ROBOFLOW_API_KEY in .env

Error: Model not found
→ Check workspace/project IDs in mobile_detection.py
```

### Socket.io Events Not Received
```javascript
// Check if broadcasting to correct room
console.log(`Broadcasting to exam:${examId}`);

// Verify client joined room
socket.emit('join_exam', examId);
console.log('Rooms joined:', socket.rooms);
```

### Database Locks
```bash
# Delete WAL files and retry
rm backend/api/data/exams.db-wal
rm backend/api/data/exams.db-shm
```

## 📚 Related Resources

- [Express.js Documentation](https://expressjs.com/)
- [Socket.io Server API](https://socket.io/docs/v4/server-api/)
- [SQLite Documentation](https://sqlite.org/docs.html)
- [Roboflow API Docs](https://docs.roboflow.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

## 🔗 Frontend Integration

The backend provides APIs that the frontend consumes:

- **HTTP REST** - Exams, students, incidents, reports
- **Socket.io** - Real-time metrics, incidents, session updates
- **File serving** - Snapshots from `/api/exams/instances/:id/snapshot/file/:filename`

Frontend connects to:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('token') }
});
```

## 📄 License

MIT License
