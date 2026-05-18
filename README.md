# EduVision - AI-Powered Exam Monitoring System

An intelligent, real-time exam proctoring system that uses computer vision and AI to detect suspicious behavior during online examinations. EduVision helps educational institutions maintain exam integrity by providing automated monitoring and instant incident alerts.

## 🎯 Features

### Admin Dashboard
- **Exam Management**: Create, configure, and manage exams with customizable settings
- **Live Monitoring**: Real-time webcam feed monitoring of all exam instances
- **Incident Alerts**: Instant notifications (audio, toast, email, and browser notifications) when suspicious activity is detected
- **Reports & Analytics**: Comprehensive reports on detected incidents and exam statistics
- **Student Management**: Track enrolled students and their exam performance

### Exam Monitoring
- **Real-Time Detection**: AI-powered computer vision to detect:
  - Multiple faces in frame
  - Phone usage
  - Suspicious head movements
  - Environmental anomalies
- **Live Webcam Streaming**: Continuous monitoring of student webcams during exams
- **Incident Logging**: Detailed incident records with timestamps and severity levels
- **Severity Levels**: Different alert thresholds (warning vs. critical)

### Student Interface
- **Exam Enrollment**: Secure enrollment with verification
- **Exam Participation**: Clean, focused exam interface
- **Verification**: Identity verification before exam start

### Settings & Configuration
- **Admin Settings**: Configure monitoring sensitivity, alert preferences
- **Notification Options**: Email alerts, browser notifications, audio alerts
- **User Management**: Create admin accounts and manage permissions

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Framework**: React 19 with TypeScript
- **State Management**: Redux Toolkit + Redux Persist
- **UI Components**: Ant Design (antd) + Custom Components
- **Styling**: Tailwind CSS + PostCSS
- **Real-Time**: Socket.io client for live updates
- **HTTP Client**: Axios + React Query
- **Routing**: React Router v6

### Backend (Node.js + Express)
- **Framework**: Express.js
- **Real-Time Communication**: Socket.io
- **Database**: SQLite (better-sqlite3)
- **Authentication**: JWT-based auth
- **File Upload**: Multer
- **Notifications**: Email notifications via Nodemailer
- **Environment**: dotenv for configuration

### AI/ML
- **TensorFlow.js**: Client-side ML inference
- **COCO-SSD**: Object detection for identifying suspicious items/behaviors
- **Real-Time Processing**: In-browser video frame analysis

## 📁 Project Structure

```
edu-vision-ai-monitor/
├── src/                          # Frontend (React)
│   ├── components/               # Reusable React components
│   │   ├── layout/              # Layout components (AppShell, etc.)
│   │   ├── forms/               # Form components
│   │   └── ...                  # Feature-specific components
│   ├── pages/                    # Page components
│   │   ├── auth/                # Authentication pages (SignIn, SignUp)
│   │   ├── Dashboard.jsx        # Admin dashboard
│   │   ├── LiveMonitoring.jsx   # Real-time monitoring view
│   │   ├── Students.jsx         # Student management
│   │   ├── Reports.jsx          # Reports & analytics
│   │   ├── Settings.jsx         # Settings management
│   │   └── ...
│   ├── store/                   # Redux store configuration
│   ├── config/                  # Configuration files
│   ├── utils/                   # Utility functions & hooks
│   ├── App.tsx                  # Main app component
│   └── index.tsx                # Entry point
│
├── server/                       # Backend (Express)
│   ├── routes/                  # API route handlers
│   │   ├── auth.js             # Authentication endpoints
│   │   ├── exams.js            # Exam management endpoints
│   │   ├── students.js         # Student endpoints
│   │   ├── reports.js          # Reports endpoints
│   │   ├── dashboard.js        # Dashboard data endpoints
│   │   └── settings.js         # Settings endpoints
│   ├── db/                      # Database
│   │   ├── database.js         # DB initialization
│   │   └── migrate.js          # JSON to SQLite migration
│   ├── middleware/              # Express middleware
│   │   └── auth.js             # JWT authentication middleware
│   ├── utils/                   # Utility functions
│   │   └── notifications.js    # Email notification service
│   ├── data/                    # Data storage
│   │   └── snapshots/          # Student webcam snapshots
│   └── index.js                # Express server entry point
│
├── public/                       # Static assets
├── data/                         # Local data files
├── package.json                 # Dependencies & scripts
└── tsconfig.json               # TypeScript configuration
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- A modern web browser with webcam support

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd edu-vision-ai-monitor
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
# Edit .env with your configuration (see Configuration section below)
```

4. **Start the development server**
```bash
npm start
```

This command runs both the backend server (port 5000) and frontend (port 3000) concurrently:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Individual Development

To run backend and frontend separately:

```bash
# Terminal 1: Backend
npm run start:server

# Terminal 2: Frontend
npm run start
```

## ⚙️ Configuration

Create a `.env` file in the project root:

```env
# Backend Configuration
BACKEND_PORT=5000
NODE_ENV=development

# Database
DB_PATH=./data/database.sqlite

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRY=24h

# Email Configuration (for incident alerts)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
ADMIN_EMAIL=admin@example.com

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

## 📝 Available Scripts

### Development
```bash
# Start both frontend and backend
npm start

# Start only the backend
npm run start:server
npm run dev:server

# Run tests
npm test

# Build for production
npm run build
```

### API Endpoints

#### Authentication
- `POST /api/auth/admin/signup` - Register new admin
- `POST /api/auth/admin/signin` - Admin login
- `POST /api/auth/logout` - Logout

#### Exams
- `GET /api/exams` - List all exams (admin)
- `POST /api/exams` - Create new exam (admin)
- `GET /api/exams/:id` - Get exam details
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `GET /api/exams/instances/:code` - Get exam instance (student)

#### Students
- `GET /api/students` - List all students (admin)
- `POST /api/students` - Add student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Remove student

#### Reports
- `GET /api/reports` - Get incident reports (admin)
- `GET /api/reports/:examId` - Get reports for specific exam

#### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/incidents` - Get recent incidents

#### Settings
- `GET /api/settings` - Get app settings
- `PUT /api/settings` - Update settings

## 🔌 Real-Time Features (Socket.io)

The application uses Socket.io for real-time communication:

### Student Events
- `join_exam` - Student joins exam room
- `student_frame` - Send webcam frame for monitoring

### Admin Events
- `join_monitoring` - Admin starts monitoring
- `student_frame` - Receive student frames
- `incident_created` - New incident detected

### Broadcast Events
- `new_incident` - Alert about new incident
- `student_frame` - Real-time video frames

## 🎬 How It Works

1. **Admin Setup**: Admin creates an exam and configures monitoring settings
2. **Student Enrollment**: Students enroll with verification
3. **Exam Start**: Student verifies identity and starts exam
4. **Live Monitoring**: 
   - Student webcam continuously streams to backend
   - AI analyzes frames for suspicious behavior
   - Incidents are flagged in real-time
5. **Incident Alerts**: Admins receive instant alerts via multiple channels
6. **Post-Exam**: Reports and analytics generated automatically

## 🛡️ Security Features

- **JWT Authentication**: Secure admin authentication
- **CORS Configuration**: Restricted cross-origin requests
- **Request Validation**: Input validation on all endpoints
- **Environment Variables**: Sensitive config stored in .env
- **Password Hashing**: Secure password storage (via auth middleware)

## 📊 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Redux Toolkit, Ant Design, Tailwind CSS |
| **Backend** | Node.js, Express, Socket.io |
| **Database** | SQLite |
| **ML/AI** | TensorFlow.js, COCO-SSD |
| **Real-Time** | Socket.io |
| **Build Tools** | Create React App, Webpack, Babel |
| **Styling** | Tailwind CSS, PostCSS |

## 🧪 Testing

```bash
# Run test suite
npm test

# Run tests in watch mode
npm test -- --watch
```

## 📦 Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder. The bundle is minified and filenames include hashes for caching.

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change backend port
BACKEND_PORT=5001 npm run start:server

# Change frontend port (must be in .env.local or via CRA)
PORT=3001 npm start
```

### Database Issues
- Remove `data/database.sqlite` and restart to reinitialize
- Check server logs for migration errors

### Webcam Permission Denied
- Check browser permissions for camera access
- Ensure HTTPS is used in production (required for camera access)

### Socket.io Connection Issues
- Verify backend is running on configured port
- Check CORS settings in `server/index.js`
- Look for firewall/proxy blocking WebSocket connections

## 📝 License

Specify your license here (e.g., MIT, Apache 2.0, etc.)

## 👥 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📞 Support

For issues, questions, or feature requests, please create an issue in the repository.

## 🔗 Related Resources

- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [Socket.io Documentation](https://socket.io/docs/)
- [TensorFlow.js Documentation](https://www.tensorflow.org/js)
- [Ant Design Components](https://ant.design/)
