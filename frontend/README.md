# EduVision Frontend - React Dashboard & Student Interface

Modern, real-time exam monitoring dashboard built with React 19, TypeScript, and Tailwind CSS.

## 🏗️ Architecture

### Technology Stack
- **React 19** - UI framework with hooks
- **TypeScript** - Type safety
- **Redux Toolkit** - State management
- **Socket.io Client** - Real-time updates
- **Ant Design (antd)** - UI component library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Router v6** - Routing

### Key Features
- Real-time metrics streaming via Socket.io
- Live webcam monitoring dashboard
- Incident evidence viewer with snapshot gallery
- Comprehensive reports with filtering
- Student exam interface
- Admin settings and configuration

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── exam/
│   │   │   ├── ExamInterface.jsx          # Student exam page
│   │   │   ├── ExamHeader.jsx
│   │   │   ├── QuestionDisplay.jsx
│   │   │   └── ...
│   │   ├── monitoring/
│   │   │   ├── MonitoringCard.jsx         # Individual student card
│   │   │   ├── MonitoringModal.jsx        # Detailed view modal
│   │   │   ├── SummaryCards.jsx           # Summary statistics
│   │   │   └── ...
│   │   ├── reports/
│   │   │   ├── IncidentEvidenceModal.jsx  # Evidence viewer with sidebar
│   │   │   └── ...
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Checkbox.jsx
│   │   │   ├── DataTable.jsx              # Reusable table component
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── MainLayout.jsx
│   │   │   └── Navigation.jsx
│   │   └── ...
│   ├── pages/
│   │   ├── Dashboard.jsx                  # Main dashboard
│   │   ├── LiveMonitoring.jsx             # Monitoring dashboard
│   │   ├── Reports.jsx                    # Reports page
│   │   ├── StudentEnroll.jsx              # Student enrollment
│   │   ├── GeneratedPaper.jsx             # Exam paper
│   │   ├── Settings.jsx                   # Admin settings
│   │   └── ...
│   ├── store/
│   │   ├── index.js                       # Redux store config
│   │   ├── apiClients/
│   │   │   ├── baseClient.ts              # Axios instance
│   │   │   ├── examsClient.ts
│   │   │   ├── monitoringClient.ts
│   │   │   └── ...
│   │   ├── serviceQueries/
│   │   │   ├── reportsQueries.ts
│   │   │   └── ...
│   │   └── slices/                        # Redux slices
│   ├── config/
│   │   ├── env.ts                         # Environment config
│   │   └── ...
│   ├── utils/
│   │   ├── useSocket.js                   # Socket.io custom hook
│   │   ├── react-toastify-shim.js         # Toast notifications
│   │   └── ...
│   ├── App.jsx
│   └── index.tsx
├── public/
│   └── index.html
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- npm or yarn
- Modern browser with webcam support

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Development runs on http://localhost:3000
```

### Build for Production

```bash
npm run build

# Creates optimized production build in /build
```

## 🔑 Key Components

### 1. ExamInterface.jsx
**Student exam page** - Handles exam taking with real-time webcam monitoring.

**Features:**
- Captures webcam frames every 2 seconds
- Sends frames for AI detection (mobile, eye movement, head pose)
- Displays exam questions and timer
- Shows real-time metrics feedback
- Submits answers to backend
- Handles exam completion and termination

**Data Flow:**
```
ExamInterface renders → useSocket hooks → Frame capture loop
  ↓
POST /api/exams/instances/:id/detect-mobile (with base64 image)
  ↓
Backend processes (Python AI) → Socket.io metrics_update event
  ↓
ExamInterface receives metrics → Updates monitoring display
```

### 2. LiveMonitoring.jsx
**Admin monitoring dashboard** - Real-time view of all active exam sessions.

**Features:**
- Displays all active student sessions in grid
- Real-time metrics updates via Socket.io
- Search and filter by name/roll number/exam
- Status indicators (Normal/Warning/Critical)
- Click card to open detailed modal
- Refresh button with manual poll

**Metrics Display:**
- Mobile detection status with confidence %
- Head movement severity
- Eye gaze direction
- Motion score indicator

### 3. MonitoringCard.jsx & MonitoringModal.jsx
**Live monitoring components** - Display student status and detailed metrics.

**Features:**
- Live webcam feed display
- Real-time metric pills (Mobile/Head/Gaze)
- Danger/warning indicators
- Click to open modal for details
- Live metrics with color coding

### 4. IncidentEvidenceModal.jsx
**Incident evidence viewer** - View captured evidence with detection metrics.

**Features:**
- **Main image gallery** with navigation arrows
- **Right sidebar thumbnail gallery** - Click thumbnail to view in main area
- **Mobile detection snapshot** - Annotated image with detection bounding boxes
- **Detection metrics cards** - Shows actual violations from cheatingType:
  - Mobile detection (Yes/No) with confidence %
  - Head movement status (Normal/Warning/Critical)
  - Eye movement status
  - Head pose status
- **Color-coded severity** - Green (safe), Amber (warning), Red (critical)
- **Download button** - Export evidence snapshot

**Metrics Parsing:**
```javascript
// Parses cheatingType to extract metrics
cheatingType: "Mobile Phone Detected | Head: Critical | Tab Switch"
↓
displayMetrics: {
  mobileDetected: 'Yes',
  headMovement: 'Critical'
}
```

### 5. Reports.jsx
**Reports page** - View and manage all incidents.

**Features:**
- Searchable incident table with filters
- **Select all checkbox** in table header for bulk operations
- Filter by exam, subject, date, severity
- View incident details with evidence modal
- Bulk delete with confirmation
- Export to CSV
- Real-time metric display

## 🔌 Socket.io Integration

### Setup
```javascript
// useSocket.js - Custom hook for Socket.io
const { emit } = useSocket({
  metrics_update: (payload) => {
    setSessions(prev => {
      // Handle metrics update
    });
  },
  snapshot_update: (payload) => {
    // Handle snapshot update
  },
  new_incident: () => {
    // Reload incidents
  },
  session_terminated: (payload) => {
    // Remove student from active sessions
  }
});
```

### Events

| Event | Direction | Usage |
|-------|-----------|-------|
| `join_exam` | Client → Server | Student joins exam monitoring |
| `join_monitoring` | Client → Server | Admin joins monitoring room |
| `metrics_update` | Server → Client | Real-time metric updates |
| `snapshot_update` | Server → Client | Frame snapshot update |
| `new_incident` | Server → Client | New incident created |
| `session_terminated` | Server → Client | Student session terminated |

### Example Flow
```javascript
// Student exam component
const { emit } = useSocket({
  metrics_update: (payload) => {
    // Update display with new metrics
    setMetrics(payload.metrics);
  }
});

// Send frame for detection
const sendFrame = async (imageData) => {
  await axios.post(`/api/exams/instances/${instanceId}/detect-mobile`, {
    image: imageData
  });
  // Backend processes and emits metrics_update
};
```

## 🎨 Styling

### Tailwind CSS + Custom Theme
- Responsive grid layouts
- Color-coded severity indicators
- Smooth animations and transitions
- Custom component library built on top of antd

### Color Scheme
- **Red** (#dc2626, #ef4444) - Critical/Danger
- **Amber** (#f59e0b, #fbbf24) - Warning
- **Green** (#10b981, #34d399) - Normal/Safe
- **Blue** (#3b82f6, #60a5fa) - Primary

## 📊 Data Flow Examples

### Mobile Detection in Exam
```
1. Student taking exam
2. ExamInterface captures frame every 2s
3. POST /api/exams/instances/:id/detect-mobile { image: base64 }
4. Backend spawns Python process for AI detection
5. Python returns: { mobile_detected: true, confidence: 0.95 }
6. Backend updates database: metrics = { mobileDetected: 'Yes' }
7. Socket.io emits metrics_update to exam room
8. ExamInterface receives update
9. MonitoringCard re-renders with "Mobile: Detected" (red)
10. Admin sees update in LiveMonitoring dashboard
```

### Incident Evidence Viewing
```
1. Admin clicks "View" on incident in Reports table
2. IncidentEvidenceModal opens with incident data
3. parseDetectionMetrics() extracts values from cheatingType
4. Display metrics cards with correct colors and values
5. Sidebar shows all snapshots as thumbnails
6. Click thumbnail to switch main image
7. Admin can download evidence or navigate snapshots
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test ExamInterface
```

## 📱 Responsive Design

- **Mobile** (< 640px) - Single column layout
- **Tablet** (640px - 1024px) - 2 column grid
- **Desktop** (> 1024px) - 3-4 column grid for monitoring
- **Reports table** - Horizontal scroll on small screens

## 🔐 Environment Variables

Create `.env.local` file:
```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000

# Feature Flags
REACT_APP_ENABLE_AUDIO_ALERTS=true
REACT_APP_ENABLE_EMAIL_NOTIFICATIONS=true
```

## 🚀 Performance Optimization

- **Code Splitting** - React.lazy for route-based splitting
- **Memoization** - useMemo, useCallback for expensive computations
- **Image Optimization** - Lazy loading snapshots
- **Socket.io Room Broadcasting** - Only emit to relevant rooms
- **Debounced Search** - 400ms debounce on search input

## 🐛 Debugging

### Browser Console Checks
```javascript
// Check Socket.io connection
console.log(socket.connected);

// Check received metrics
socket.on('metrics_update', (payload) => {
  console.log('Metrics received:', payload);
});

// Check frame capture
console.log('Frame sent:', frameData.length);
```

### Redux DevTools
- Install Redux DevTools browser extension
- View all state changes and dispatch actions
- Time-travel debugging

### Network Tab
- Monitor WebSocket connections
- Check API request/response
- Verify base64 image size

## 📚 Component Documentation

### MonitoringCard Props
```typescript
interface MonitoringCardProps {
  student: {
    name: string;
    rollNumber: string;
    examTitle: string;
    status: 'normal' | 'warning' | 'critical';
    metrics: Metrics;
  };
  liveFrame?: string; // base64 image
  isExamExpired?: boolean;
  onClick: () => void;
}
```

### IncidentEvidenceModal Props
```typescript
interface IncidentEvidenceModalProps {
  incident: Incident;
  open: boolean;
  onClose: () => void;
}

// Incident has:
// - snapshots: string[] (array of snapshot URLs)
// - cheatingType: string (e.g., "Mobile Phone Detected | Head: Critical")
// - mobileDetected: 'Yes' | 'No'
// - headMovement: string
// - mobileConfidence: number
```

## 🎯 Best Practices

1. **Always join Socket.io rooms** before expecting events
2. **Parse detection metrics from cheatingType** not from hardcoded fields
3. **Use displayMetrics object** for rendering (parsed + fallback values)
4. **Memoize metric cards** to prevent unnecessary re-renders
5. **Handle socket connection failures** gracefully
6. **Clear timeouts/intervals** in cleanup functions
7. **Use TypeScript for new components** for type safety

## 🔗 Related Resources

- [React Documentation](https://react.dev/)
- [Redux Toolkit Guide](https://redux-toolkit.js.org/)
- [Socket.io Client Documentation](https://socket.io/docs/v4/client-api/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Ant Design Component Library](https://ant.design/components/overview/)
