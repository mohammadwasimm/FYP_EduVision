# EduVision - AI-Powered Exam Monitoring System

An intelligent, real-time exam proctoring system that uses computer vision and AI to detect suspicious behavior during online examinations. EduVision helps educational institutions maintain exam integrity by providing automated monitoring and instant incident alerts.

## 🎯 Features

### Admin Dashboard
- **Exam Management**: Create, configure, and manage exams with customizable settings
- **Live Monitoring**: Real-time webcam feed monitoring of all exam instances with multi-metric tracking
- **Incident Alerts**: Instant notifications (audio, toast, email, and browser notifications) when suspicious activity is detected
- **Reports & Analytics**: Comprehensive reports on detected incidents with evidence snapshots
- **Student Management**: Track enrolled students and their exam performance
- **Batch Operations**: Select all incidents for bulk deletion with checkbox in table header

### Incident Evidence Modal
- **Right Sidebar Gallery**: Vertical thumbnail strip showing all snapshots with quick preview
- **Mobile Detection Snapshots**: View annotated images with AI detection bounding boxes
- **Detection Metrics Display**: Real-time metrics parsed from cheatingType showing:
  - Mobile detection status (Yes/No) with confidence percentage
  - Head movement severity (Normal/Warning/Critical)
  - Eye movement direction (Looking Center/Away)
  - Head pose orientation (Looking at Screen/Tilted/etc)
- **Color-Coded Indicators**: Visual severity indicators (green=safe, amber=warning, red=critical)

### AI-Powered Detection
- **Real-Time Detection**: Multiple computer vision models analyzing webcam frames:
  - **Mobile Phone Detection**: Roboflow-trained YOLO model (cellphone-0aodn)
  - **Head Pose Detection**: Custom PyTorch model detecting head orientation
  - **Eye Movement Detection**: Gaze direction and eye contact monitoring
- **Metric Tracking**: Real-time collection of:
  - Mobile detected status
  - Head movement (Normal/Warning/Critical)
  - Head pose (Looking at Screen/Tilted/Looking Right/Looking Left)
  - Eye movement (Looking Center/Looking Away)
  - Motion score (0-1 scale)
  - Tab active status

### Exam Monitoring
- **Live Webcam Streaming**: Continuous monitoring of student webcams during exams
- **Incident Logging**: Detailed incident records with timestamps, severity, and evidence snapshots
- **Severity Levels**: Different alert thresholds (warning vs. critical)
- **Real-Time Metrics Update**: WebSocket-based metrics flowing from detection to monitoring dashboard

### Student Interface
- **Exam Enrollment**: Secure enrollment with verification
- **Exam Participation**: Clean, focused exam interface
- **Verification**: Identity verification before exam start

### Settings & Configuration
- **Admin Settings**: Configure monitoring sensitivity, alert preferences
- **Notification Options**: Email alerts, browser notifications, audio alerts
- **User Management**: Create admin accounts and manage permissions

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ExamInterface (Student) / LiveMonitoring (Admin)    │   │
│  │  - Captures webcam frames                           │   │
│  │  - Sends frames to backend via HTTP                 │   │
│  │  - Receives metrics via Socket.io (metrics_update)  │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────────────────────────────┘
                 │ HTTP POST (frame) + WebSocket
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND (Node.js + Express)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Route: POST /api/exams/instances/:id/detect-mobile │   │
│  │ Route: POST /api/exams/instances/:id/detect-eye... │   │
│  │ Route: POST /api/exams/instances/:id/detect-head..│   │
│  └──────────────────────────────────────────────────────┘   │
│              │                                                │
│              ├─→ Save image to temp file                     │
│              ├─→ Spawn Python process with image path        │
│              └─→ Parse JSON response                         │
└────────────────┬──────────────────────────────────────────────┘
                 │ Child process spawn
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          AI ENGINE (Python subprocess)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  mobile_detection.py:                               │   │
│  │  - Initialize Roboflow client                       │   │
│  │  - Load cellphone-0aodn model                       │   │
│  │  - Run inference: model.predict(image)              │   │
│  │  - Return: {mobile_detected, confidence, ...}       │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  eye_movement_detection.py:                         │   │
│  │  - Detect eye gaze direction                        │   │
│  │  - Return: {gazeDirection, confidence}              │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  head_pose_detection.py:                            │   │
│  │  - Detect head orientation (yaw, pitch, roll)       │   │
│  │  - Return: {headDirection, confidence}              │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────────────────────────────┘
                 │ JSON stdout
                 ▼
┌─────────────────────────────────────────────────────────────┐
│          BACKEND (continued)                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Parse JSON, Update metrics in database              │   │
│  │  Emit Socket.io event to exam room                   │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────┬──────────────────────────────────────────────┘
                 │ Socket.io to(`exam:${examId}`)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (Monitoring Dashboard)                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Receive metrics_update on Socket.io                │   │
│  │  Update MonitoringCard & MonitoringModal display    │   │
│  │  Show: "Mobile Detected: Yes/No" + visual indicators │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

**Framework**: React 19 with TypeScript
- **State Management**: Redux Toolkit + Redux Persist
- **UI Components**: Ant Design (antd) + Custom Components
- **Styling**: Tailwind CSS + PostCSS
- **Real-Time**: Socket.io client for live metrics updates
- **HTTP Client**: Axios + React Query
- **Routing**: React Router v6

**Key Components**:
- `ExamInterface.jsx` - Student exam page (captures frames, listens to metrics)
- `LiveMonitoring.jsx` - Admin monitoring dashboard
- `MonitoringCard.jsx` - Individual student card with live metrics
- `MonitoringModal.jsx` - Detailed student monitoring modal

### Backend Architecture

**Framework**: Express.js on Node.js
- **Real-Time Communication**: Socket.io for bidirectional messaging
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT-based auth
- **File Upload/Storage**: Multer + filesystem (snapshots in `backend/api/data/snapshots/`)
- **Notifications**: Email via Nodemailer
- **Child Process Management**: Node.js `child_process.spawn()` for Python AI engines
- **Environment**: dotenv for configuration

**Key Routes**:
- `backend/api/routes/exams.js` - All exam and detection endpoints
- `backend/api/routes/auth.js` - Authentication
- `backend/api/routes/reports.js` - Incident reporting
- `backend/api/routes/dashboard.js` - Dashboard statistics

### AI/ML Engine Architecture

**Technology Stack**:
- **Roboflow API** (Cloud-based inference) for mobile detection
- **PyTorch** for head pose and eye movement detection
- **Python 3.10+** with virtual environment
- **OpenCV** for image processing
- **NumPy, SciPy** for numerical computations

**Detection Models**:

#### 1. Mobile Detection (`backend/ai_engine/mobile_detection.py`)
```python
# Roboflow workspace: d1156414
# Project: cellphone-0aodn (YOLO v8 trained model)
# Version: 1

Input: Image file path
Process:
  1. Initialize Roboflow client with API key
  2. Load workspace and project
  3. Run inference with confidence=40, overlap=30
  4. Parse predictions
  5. Return: {
       "mobile_detected": true/false,
       "confidence": 0-1,
       "detections": ["phone:0.95"],
       "error": null
     }
Output: JSON (stdout)
```

#### 2. Eye Movement Detection (`backend/ai_engine/eye_movement_detection.py`)
```
Input: Image file path
Process:
  1. Load pre-trained eye detection model
  2. Detect facial landmarks
  3. Calculate gaze direction
  4. Classify: Looking Center / Looking Away
  5. Return: {
       "gazeDirection": "Looking Center",
       "confidence": 0.92
     }
Output: JSON (stdout)
```

#### 3. Head Pose Detection (`backend/ai_engine/head_pose_detection.py`)
```
Input: Image file path
Process:
  1. Detect head in frame
  2. Estimate head orientation (yaw, pitch, roll)
  3. Classify: Looking at Screen / Tilted / Looking Right / Looking Left
  4. Return: {
       "headDirection": "Looking at Screen",
       "confidence": 0.88
     }
Output: JSON (stdout)
```

## 📁 Project Structure

```
edu-vision-ai-monitor/
│
├── frontend/                         # React frontend (CRA)
│   ├── src/
│   │   ├── components/
│   │   │   ├── exam/                # Exam-related components
│   │   │   │   └── ExamInterface.jsx # Student exam page
│   │   │   ├── monitoring/          # Monitoring components
│   │   │   │   ├── MonitoringCard.jsx
│   │   │   │   ├── MonitoringModal.jsx
│   │   │   │   └── LiveMonitoring.jsx
│   │   │   ├── ui/                  # Reusable UI components
│   │   │   ├── layout/              # Layout components
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Admin dashboard
│   │   │   ├── Reports.jsx          # Reports page
│   │   │   ├── StudentEnroll.jsx    # Student enrollment
│   │   │   └── ...
│   │   ├── store/                   # Redux store
│   │   ├── config/                  # Configuration
│   │   ├── utils/                   # Utilities & custom hooks
│   │   └── index.tsx
│   ├── public/
│   └── package.json
│
├── backend/                          # Node.js + Express backend
│   ├── api/
│   │   ├── routes/
│   │   │   ├── exams.js             # Exam & detection endpoints
│   │   │   ├── auth.js
│   │   │   ├── students.js
│   │   │   ├── reports.js
│   │   │   ├── dashboard.js
│   │   │   └── settings.js
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication
│   │   ├── db/
│   │   │   ├── database.js          # SQLite initialization
│   │   │   └── exams.db             # SQLite database
│   │   ├── data/
│   │   │   └── snapshots/           # Student frame snapshots
│   │   ├── utils/
│   │   └── index.js                 # Express app entry
│   │
│   ├── ai_engine/                   # Python AI detection models
│   │   ├── mobile_detection.py      # Roboflow phone detection
│   │   ├── eye_movement_detection.py
│   │   ├── head_pose_detection.py
│   │   └── requirements.txt         # Python dependencies
│   │
│   └── venv/                        # Python virtual environment
│
├── .env                             # Environment configuration
├── README.md
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14+ 
- Python 3.10+
- npm or yarn
- Modern browser with webcam support

### Installation

#### 1. Clone and install dependencies
```bash
cd edu-vision-ai-monitor
npm install
```

#### 2. Set up Python AI engine
```bash
# Create Python virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install Python dependencies
cd backend/ai_engine
pip install -r requirements.txt
cd ../..
```

#### 3. Configure environment
```bash
# Create .env file
cat > .env << EOF
# Backend
SERVER_PORT=5000
NODE_ENV=development

# Database
DB_PATH=./backend/api/db/exams.db

# Roboflow API (for mobile detection)
ROBOFLOW_API_KEY=your_roboflow_api_key_here

# Email (optional, for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
ADMIN_EMAIL=admin@example.com

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
EOF
```

#### 4. Start the application
```bash
# Start both backend and frontend
npm start

# Or start separately:
# Terminal 1: Backend
npm run start:server

# Terminal 2: Frontend
cd frontend
npm start
```

**Access**:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## ⚙️ Configuration

### .env Variables
```env
# Backend Port
SERVER_PORT=5000

# Database Path
DB_PATH=./backend/api/db/exams.db

# Roboflow API Key (Required for mobile detection)
# Get from: https://roboflow.com
# Must be a Private API Key (not Publishable Key)
ROBOFLOW_API_KEY=pcndB82wtZYn7744ZH5n8

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
ADMIN_EMAIL=admin@example.com

# JWT Configuration
JWT_SECRET=change-me-in-production
JWT_EXPIRY=24h

# Environment
NODE_ENV=development
```

## 🔌 Real-Time Communication (Socket.io)

### Connection Flow

1. **Student joins exam**:
   ```javascript
   // ExamInterface.jsx
   socket.emit('join_exam', examId);
   ```

2. **Backend creates Socket.io room**:
   ```javascript
   // exams.js route
   socket.on('join_exam', (examId) => {
     socket.join(`exam:${examId}`);
   });
   ```

3. **Frontend sends frame for detection**:
   ```javascript
   // ExamInterface.jsx - every 2 seconds
   await examsApi.post(`/instances/${id}/detect-mobile`, { image: base64Frame });
   ```

4. **Backend processes detection**:
   ```javascript
   // exams.js - POST /instances/:id/detect-mobile
   detectMobileYOLO(imagePath).then(result => {
     db.prepare('UPDATE exam_instances SET metrics=...')
       .run(JSON.stringify(currentMetrics), id);
     
     global._io.to(`exam:${examId}`).emit('metrics_update', {
       instanceId: id,
       metrics: currentMetrics
     });
   });
   ```

5. **Frontend receives metrics update**:
   ```javascript
   // ExamInterface.jsx
   socket.on('metrics_update', (payload) => {
     setMonitoringMetrics({
       mobileDetected: payload.metrics.mobileDetected,
       headMovement: payload.metrics.headMovement,
       // ... other metrics
     });
   });
   ```

6. **Dashboard displays updated metrics**:
   ```jsx
   // MonitoringCard.jsx
   <MetricPill
     icon={<MdPhoneIphone />}
     value={metrics.mobileDetected === 'Yes' ? 'Detected' : 'None'}
     danger={metrics.mobileDetected === 'Yes'}
   />
   ```

### Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `join_exam` | Client → Server | `examId` |
| `metrics_update` | Server → Client | `{ instanceId, metrics, timestamp }` |
| `new_incident` | Server → Client | Incident data |
| `student_frame` | Client → Server | Frame data |

## 📊 Data Flow - Mobile Detection Example

```
1. Student exam running (2-second interval)
   ↓
2. Frontend captures webcam frame → base64 encode
   ↓
3. POST /api/exams/instances/:id/detect-mobile
   Request body: { image: "data:image/jpeg;base64,..." }
   ↓
4. Backend receives request
   - Save base64 to temp file
   - Spawn Python process: python3 mobile_detection.py /tmp/image.jpg
   ↓
5. Python process (mobile_detection.py)
   - Suppress Roboflow SDK print statements (using contextlib.redirect_stdout)
   - Initialize Roboflow client with API key
   - Load model: workspace("d1156414").project("cellphone-0aodn").version(1)
   - Run inference: model.predict(image, confidence=40, overlap=30)
   - Parse predictions array
   - Return JSON: {"mobile_detected": true, "confidence": 0.95, ...}
   ↓
6. Backend receives JSON from Python stdout
   - Parse JSON result
   - Update database: UPDATE exam_instances SET metrics = '{"mobileDetected":"Yes",...}'
   - Clean up temp file
   ↓
7. Backend emits Socket.io event
   - global._io.to(`exam:${examId}`).emit('metrics_update', {
       instanceId: id,
       metrics: { mobileDetected: 'Yes', ... },
       timestamp: now
     })
   ↓
8. Frontend receives metrics_update event
   - Update state: setMonitoringMetrics({mobileDetected: 'Yes'})
   ↓
9. MonitoringCard & MonitoringModal re-render
   - Display: "Mobile Detected: Detected" (in red)
   - Show danger indicator
   ↓
10. Admin monitoring dashboard updates in real-time
```

## 🎬 Complete Exam Flow

### Setup Phase
1. **Admin creates exam**
   - Configures exam details, duration, enrollment code
   - Sets monitoring preferences (sensitivity, alert channels)

2. **Students enroll**
   - Enter enrollment code
   - Verify identity (webcam verification)
   - System captures baseline metrics

### Exam Execution Phase
3. **Student starts exam**
   - Frontend initializes WebSocket connection
   - Emits `join_exam` to create Socket.io room: `exam:${examId}`
   - Starts capturing frames every 2 seconds

4. **Continuous monitoring**
   - Each frame triggers 3 detection API calls in parallel:
     - `/detect-mobile` - Phone detection
     - `/detect-eye-movement` - Gaze tracking
     - `/detect-head-pose` - Head orientation
   - Backend spawns Python subprocess for each
   - Results parsed and aggregated into metrics object
   - Metrics broadcast via Socket.io to exam room

5. **Admin monitoring**
   - Admin opens Live Monitoring dashboard
   - Joins Socket.io room to receive metric updates
   - MonitoringCard shows real-time status:
     - Mobile indicator (green/red)
     - Head movement (Normal/Warning/Critical)
     - Gaze direction (Center/Away)
     - Motion score percentage
   - Clicking card opens MonitoringModal with detailed view

6. **Incident detection**
   - System flags incidents when:
     - Mobile detected = true
     - Head movement = Critical
     - Tab active = false (student switched tabs)
     - Motion score exceeds threshold
   - Incident recorded with timestamp and evidence snapshot

7. **Alerts**
   - Admin receives notifications:
     - Browser notification (in-app alert)
     - Toast notification (bottom right)
     - Audio alert (if enabled)
     - Email notification (optional)
   - Incident saved with evidence image

### Post-Exam Phase
8. **Reports generated**
   - Incident timeline with all detected events
   - Evidence snapshots for each incident
   - Statistics and summary

## ✨ Recent Updates

### Evidence Modal Enhancements
- **Right Sidebar Snapshot Gallery**: Vertical thumbnail strip for quick navigation
- **Mobile Detection Snapshots**: View annotated images with detection bounding boxes
- **Metrics from CheatingType**: Automatically parse cheatingType string to extract actual violations:
  ```
  cheatingType: "Mobile Phone Detected | Head: Critical | Tab Switch"
  ↓
  Display: Mobile: 🚨 YES, Head: Critical
  ```

### Reports Table Improvements
- **Select All Checkbox**: Header checkbox to select/deselect all filtered incidents
- **Batch Operations**: Delete multiple incidents at once
- **Correct Metrics Display**: Shows actual violations from cheatingType, not defaults

### Incident Data Sync
- **Metrics Capture**: All detection metrics saved with incidents
- **Confidence Scores**: Mobile detection confidence percentage stored
- **Detection Snapshots**: Annotated AI detection images saved alongside evidence
- **Deduplication**: 5-minute cooldown prevents duplicate incidents for same student

## 🐛 Important Implementation Details

### Mobile Detection Fix
The Roboflow SDK prints "loading Roboflow workspace..." to stdout, which corrupts JSON output. **Solution**:
```python
# mobile_detection.py
from contextlib import redirect_stdout, redirect_stderr
import io

devnull = io.StringIO()
with redirect_stdout(devnull), redirect_stderr(devnull):
    from roboflow import Roboflow
    rf = Roboflow(api_key=api_key)
    project = rf.workspace(...).project(...)
    prediction = model.predict(image_path).json()
```

### Socket.io Room Broadcasting
Metrics must be broadcast to the **specific exam room**, not all connected clients:
```javascript
// ✅ Correct: Only clients in this exam room receive update
global._io.to(`exam:${examId}`).emit('metrics_update', {...});

// ❌ Wrong: All connected clients receive update
global._io.emit('metrics_update', {...});
```

### Frontend Socket.io Subscription
Frontend must join the **exam room**, not instance room:
```javascript
// ✅ Correct
socket.emit('join_exam', examId);

// ❌ Wrong
socket.emit('join_exam', instanceId);
```

## 🆕 New Features Documentation

### Detection Metrics Parsing
All detection metrics are now **extracted from the cheatingType field**, ensuring consistency across the application:

```javascript
// Parsing function used in IncidentEvidenceModal and Reports
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

**Example CheatingType Strings**:
- `"Mobile Phone Detected | Head: Critical | Tab Switch"`
- `"Head: Critical | Motion: 0.101"`
- `"Mobile Phone Detected"`
- `"Head: Warning | Eye: Looking Away"`

### Mobile Detection Snapshots
When mobile detection occurs, the annotated image with bounding boxes is saved:

```
Flow:
1. Frontend sends frame → POST /api/exams/instances/:id/detect-mobile
2. Backend spawns Python → runs Roboflow inference
3. Python returns annotated_image_path (if available)
4. Backend saves annotated image → `mobileDetectionSnapshot` column
5. Frontend displays in IncidentEvidenceModal
```

**Display**:
- Shows annotated image with detection boxes
- Displays confidence percentage
- Color-coded by severity (red = detected)

### Reports Table Enhancements

#### Select All Checkbox
```jsx
<th>
  <Checkbox
    checked={selectedReports.size === filteredIncidents.length}
    indeterminate={selectedReports.size > 0 && selectedReports.size < filteredIncidents.length}
    onChange={handleSelectAll}
  />
</th>
```

**States**:
- ✓ Checked: All visible items selected → Click to deselect all
- ⊘ Indeterminate: Some items selected → Click to select all
- ☐ Unchecked: No items selected → Click to select all

#### Corrected Metrics Display
Metrics column now shows parsed values from cheatingType:

**Before**:
```
Mobile: No
Head: Normal
Eye: Unknown
```

**After** (for same incident):
```
Mobile: Yes (95%) ← Parsed from "Mobile Phone Detected"
Head: Critical    ← Parsed from "Head: Critical"
Eye: Unknown
```

## 📝 API Endpoints

### Exam Detection Endpoints

#### Mobile Detection
```
POST /api/exams/instances/:id/detect-mobile
Content-Type: application/json

Request:
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}

Response:
{
  "data": {
    "instanceId": "inst-0857",
    "processing": true
  }
}

Socket.io metrics_update (async):
{
  "instanceId": "inst-0857",
  "metrics": {
    "mobileDetected": "Yes",
    "yoloConfidence": 0.95,
    "headMovement": "Normal",
    ...
  },
  "timestamp": "2024-06-02T17:32:39Z"
}
```

#### Eye Movement Detection
```
POST /api/exams/instances/:id/detect-eye-movement
Similar to mobile detection, returns gaze direction
```

#### Head Pose Detection
```
POST /api/exams/instances/:id/detect-head-pose
Similar to mobile detection, returns head orientation
```

## 🛡️ Security Features

- **JWT Authentication**: Signed tokens with expiry
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: All endpoints validate input
- **CORS**: Restricted origins
- **Environment Secrets**: API keys in .env (not in code)
- **Database Encryption**: SQLite with parameterized queries (prevents SQL injection)
- **Secure Headers**: HTTPS in production

## 🧪 Testing

```bash
# Run test suite
npm test

# Run backend only tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

## 📦 Building for Production

```bash
# Build frontend
npm run build

# Backend runs directly (no build needed)
npm run start:server
```

## 🐛 Troubleshooting

### Python Detection Not Working
```bash
# Check Python virtual environment
source venv/bin/activate
python -c "import roboflow; print('Roboflow OK')"

# Test mobile detection directly
python backend/ai_engine/mobile_detection.py /path/to/image.jpg
```

### Metrics Not Updating
1. Check browser console for Socket.io errors
2. Verify backend is emitting to correct room: `exam:${examId}`
3. Check that frontend joined correct room
4. Look for Python subprocess errors in backend logs

### Roboflow API Errors
```
Error: "This key is not authorized for serverless inference"
→ Use Private API Key, not Publishable Key

Error: 401 Unauthorized
→ Check ROBOFLOW_API_KEY in .env is correct

Error: Timeout after 15 seconds
→ Roboflow API taking too long, increase spawn timeout
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or use different port
SERVER_PORT=5001 npm run start:server
```

## 📚 Documentation

- [Roboflow API Documentation](https://docs.roboflow.com/)
- [Socket.io Guide](https://socket.io/docs/v4/server-api/)
- [Express.js Guide](https://expressjs.com/en/api.html)
- [React Documentation](https://react.dev/)

## 📞 Support

For issues or questions:
1. Check troubleshooting section above
2. Review backend logs: `npm run start:server`
3. Check browser console for frontend errors
4. Create GitHub issue with:
   - Error message
   - Steps to reproduce
   - Backend logs
   - Browser console logs

## 🔗 Related Resources

- [Roboflow Website](https://roboflow.com/)
- [YOLO Documentation](https://docs.ultralytics.com/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [Express.js](https://expressjs.com/)
- [React 19](https://react.dev/)

## 📝 License

MIT License

## 👥 Contributors

- Development Team
