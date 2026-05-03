import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PiGraduationCapFill } from "react-icons/pi";
import { FiAlertCircle } from "react-icons/fi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ExamInterface } from "../components/exam/ExamInterface";
import { examsApi } from "../store/apiClients/examsClient";
import { fetchStudentById, fetchStudentAssignments } from "./students/stores/actions";
import { MonitoringModal } from "../components/monitoring/MonitoringModal";
import { toast } from "../utils/react-toastify-shim";

export function StudentEnroll() {
  const location = useLocation();
  const [examId, setExamId] = useState("");
  const [examStarted, setExamStarted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [studentLoginId, setStudentLoginId] = useState("");
  const [studentPassword, setStudentPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggedStudent, setLoggedStudent] = useState(null);
  const [paperInstance, setPaperInstance] = useState(null);
  const [paperModalOpen, setPaperModalOpen] = useState(false);
  const [loadingPaper, setLoadingPaper] = useState(false);
  const [autoProcessed, setAutoProcessed] = useState(false);
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState(null);
  const [cameraStreamObj, setCameraStreamObj] = useState(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);

  useEffect(() => {
    const stateLink = location?.state?.examLink;
    const params = new URLSearchParams(location.search);
    const queryLink = params.get("examLink");
    const prefill = stateLink || queryLink || "";
    if (prefill) {
      setExamId(prefill);
    }
  }, [location]);

  // If an exam link is present, try to auto-login and open the exam + monitoring modal
  useEffect(() => {
    if (!examId || autoProcessed) return;

    let mounted = true;

    const processLink = async () => {
      try {
        setAutoProcessed(true);
        setLoadingPaper(true);

        // Try direct lookup by link (handles encoded links)
        let byLinkResp;
        try {
          byLinkResp = await examsApi.getExamByLink(examId);
        } catch (err) {
          // Server returns 403 for terminated or not-yet-scheduled — handle gracefully
          const errData = err;
          if (errData?.error === 'terminated') {
            toast.error('Your session has been terminated by the administrator. You cannot re-enter this exam.', { autoClose: false });
            return;
          }
          if (errData?.error === 'not_yet_scheduled') {
            toast.info(errData.message || 'This exam has not started yet.', { autoClose: false });
            return;
          }
          throw err;
        }

        const foundData = byLinkResp?.data?.data || byLinkResp?.data || null;
        if (!foundData || !foundData.instance) {
          setShowLogin(true);
          toast.error("Exam link not recognized. Please enter Exam ID or login manually.");
          return;
        }
        const found = { paper: foundData.exam, instance: foundData.instance };

        // ── Guard: terminated session ────────────────────────────────────
        if (found.instance.status === 'terminated') {
          toast.error('Your session has been terminated by the administrator. You cannot re-enter this exam.', { autoClose: false });
          return;
        }

        // ── Guard: scheduled date/time ───────────────────────────────────
        const scheduledAt = found.instance.scheduledAt || found.paper?.scheduledAt || null;
        if (scheduledAt) {
          const scheduled = new Date(scheduledAt);
          if (!isNaN(scheduled.getTime()) && Date.now() < scheduled.getTime()) {
            const dateStr = scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const timeStr = scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            toast.info(`The exam will start on ${dateStr} at ${timeStr}.`, { autoClose: false });
            return;
          }
        }

        if (!mounted) return;

        // Fetch student details for auto-login
        try {
          const student = await fetchStudentById(found.instance.studentId);
          if (!mounted) return;
          setLoggedStudent(student);
        } catch (err) {
          toast.error("Could not fetch student information.");
        }

        setExamId(found.instance.examId || found.paper?.id || examId);
        setPaperInstance(found);
        try { localStorage.setItem('edu:lastPaperInstance', JSON.stringify(found)); } catch (_) {}

        // Mark instance active
        try {
          await examsApi.startInstance(found.instance.id);
        } catch (err) {
          const errData = err;
          if (errData?.error === 'terminated') {
            toast.error('Your session has been terminated by the administrator.', { autoClose: false });
            return;
          }
          console.warn('startInstance failed', err?.message);
        }
        setExamStarted(true);
        setMonitorOpen(true);
      } catch (err) {
        console.error(err);
        toast.error("Failed to process exam link.");
        setShowLogin(true);
      } finally {
        setLoadingPaper(false);
      }
    };

    processLink();

    return () => {
      mounted = false;
    };
  }, [examId, autoProcessed]);

  // called by ExamInterface with latest metrics
  const handleMetrics = async (metrics) => {
    setLiveMetrics(metrics);
    // persist to server if we have an instance id
    const instId = paperInstance?.instance?.id;
    if (instId) {
      try {
        await examsApi.postMetrics(instId, metrics);
      } catch (e) {
        // ignore network issues but keep local metrics
        console.warn('postMetrics failed', e?.message || e);
      }
    }
  };

  const handleCameraStream = (stream) => {
    setCameraStreamObj(stream);
  };

  const handleSnapshot = (url) => {
    setSnapshotUrl(url);
  };

  const handleStudentLogin = async (e) => {
    e.preventDefault();
    if (!studentLoginId) return toast.error("Please enter your student ID");

    try {
      setLoggingIn(true);
      // Try to fetch student by id (backend expected). If API requires different key adjust accordingly.
      const student = await fetchStudentById(studentLoginId);
      setLoggedStudent(student);

      // No exam link — look up student's scheduled exams and show when their next one starts
      if (!examId) {
        try {
          const studentId = student?.id || student?.studentId;
          if (studentId) {
            const assignments = await fetchStudentAssignments(studentId);
            const now = Date.now();
            const upcoming = (assignments || [])
              .filter(a => a.status !== 'completed' && a.scheduledAt && new Date(a.scheduledAt).getTime() > now)
              .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))[0];

            if (upcoming) {
              const scheduled = new Date(upcoming.scheduledAt);
              const dateStr = scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              const timeStr = scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
              toast.info(`${dateStr} at ${timeStr} — your exam "${upcoming.title}" will start.`, { autoClose: false });
            } else {
              toast.success(`Welcome, ${student?.name || 'Student'}! No upcoming exams scheduled.`);
            }
          }
        } catch (e) {
          console.warn('Could not fetch student assignments', e);
        }
        return;
      }

      // After manual login, if there is a link, try to find paper and show monitor modal
      if (examId) {
        setLoadingPaper(true);
        try {
          let byLinkResp;
          try {
            byLinkResp = await examsApi.getExamByLink(examId);
          } catch (err) {
            const errData = err;
            if (errData?.error === 'terminated') {
              toast.error('Your session has been terminated by the administrator. You cannot re-enter this exam.', { autoClose: false });
              return;
            }
            if (errData?.error === 'not_yet_scheduled') {
              toast.info(errData.message || 'This exam has not started yet.', { autoClose: false });
              return;
            }
            throw err;
          }

          const foundData = byLinkResp?.data?.data || byLinkResp?.data || null;
          if (foundData && foundData.instance) {
            const found = { paper: foundData.exam, instance: foundData.instance };

            if (found.instance.status === 'terminated') {
              toast.error('Your session has been terminated by the administrator. You cannot re-enter this exam.', { autoClose: false });
              return;
            }

            const scheduledAt = found.instance.scheduledAt || found.paper?.scheduledAt || null;
            if (scheduledAt) {
              const scheduled = new Date(scheduledAt);
              if (!isNaN(scheduled.getTime()) && Date.now() < scheduled.getTime()) {
                const dateStr = scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                const timeStr = scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                const title = found.paper?.title ? `"${found.paper.title}"` : 'Your exam';
                toast.info(`${dateStr} at ${timeStr} — ${title} will start.`, { autoClose: false });
                return;
              }
            }

            setPaperInstance(found);
            setExamId(found.instance.examId || found.paper.id || examId);
            try { localStorage.setItem('edu:lastPaperInstance', JSON.stringify(found)); } catch (_) {}
            try {
              await examsApi.startInstance(found.instance.id);
            } catch (err) {
              const errData = err;
              if (errData?.error === 'terminated') {
                toast.error('Your session has been terminated by the administrator.', { autoClose: false });
                return;
              }
              console.warn('startInstance failed', err?.message || err);
            }
            setExamStarted(true);
            setMonitorOpen(true);
          } else {
            toast.error("No exam found for this link. Please check the link or enter Exam ID manually.");
          }
        } finally {
          setLoadingPaper(false);
        }
      }
    } catch (err) {
      const message = err?.message || "Login failed. Please check your ID.";
      toast.error(message);
    } finally {
      setLoggingIn(false);
      setLoadingPaper(false);
    }
  };

  const handleStartFromModal = () => {
  setPaperModalOpen(false);
  setMonitorOpen(true);
  };

  const handleStartExam = async (e) => {
    e.preventDefault();
    const raw = examId.trim();
    if (!raw) return;

    // If the value looks like a full exam link, run the proper by-link lookup
    // so we get a real instanceId and examId before handing off to ExamInterface.
    const looksLikeLink = raw.includes('http') || raw.includes('edu-vision') || raw.includes('/');
    if (looksLikeLink) {
      setLoadingPaper(true);
      try {
        let byLinkResp;
        try {
          byLinkResp = await examsApi.getExamByLink(raw);
        } catch (err) {
          const errData = err;
          if (errData?.error === 'terminated') {
            toast.error('Your session has been terminated. You cannot re-enter this exam.', { autoClose: false });
            return;
          }
          if (errData?.error === 'not_yet_scheduled') {
            toast.info(errData.message || 'This exam has not started yet.', { autoClose: false });
            return;
          }
          throw err;
        }

        const foundData = byLinkResp?.data?.data || byLinkResp?.data || null;
        if (!foundData || !foundData.instance) {
          toast.error('Exam link not recognised. Please check and try again.');
          return;
        }
        const found = { paper: foundData.exam, instance: foundData.instance };

        if (found.instance.status === 'terminated') {
          toast.error('Your session has been terminated. You cannot re-enter this exam.', { autoClose: false });
          return;
        }

        const scheduledAt = found.instance.scheduledAt || found.paper?.scheduledAt || null;
        if (scheduledAt) {
          const scheduled = new Date(scheduledAt);
          if (!isNaN(scheduled.getTime()) && Date.now() < scheduled.getTime()) {
            const dateStr = scheduled.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            const timeStr = scheduled.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            toast.info(`The exam will start on ${dateStr} at ${timeStr}.`, { autoClose: false });
            return;
          }
        }

        setPaperInstance(found);
        setExamId(found.instance.examId || found.paper?.id || raw);
        try { localStorage.setItem('edu:lastPaperInstance', JSON.stringify(found)); } catch (_) {}
        try {
          await examsApi.startInstance(found.instance.id);
        } catch (err) {
          console.warn('startInstance failed', err?.message);
        }
        setExamStarted(true);
      } catch (err) {
        toast.error('Could not load exam. Please check the link.');
      } finally {
        setLoadingPaper(false);
      }
      return;
    }

    // Plain exam ID entered directly — just start (ExamInterface will load via examId)
    setExamStarted(true);
  };

  // Show exam interface if exam has started
  if (examStarted) {
    return <ExamInterface examId={examId} paperInstance={paperInstance} onExit={() => setExamStarted(false)} onMetrics={handleMetrics} onCameraStream={handleCameraStream} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-r r from-[#6231e9] to-[#C3A6FF]  flex items-center justify-center text-white">
      <div className="w-full max-w-md px-4">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg bg-[var(--color-primary)]">
            <PiGraduationCapFill className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">EduVision</h1>
          <p className="text-sm text-white">Enter your Exam ID to begin</p>
        </div>
      
      {/* Monitoring modal shown during exam (activated on auto-login or after login) */}
      <MonitoringModal
        student={loggedStudent || (paperInstance ? { name: paperInstance.instance.studentName || paperInstance.instance.studentId, studentId: paperInstance.instance.studentId, rollNumber: paperInstance.instance.rollNumber } : null)}
        isOpen={monitorOpen}
  onClose={() => setMonitorOpen(false)}
        onSessionOut={() => {
          // session out -> exit exam
          setMonitorOpen(false);
          setExamStarted(false);
        }}
  metrics={liveMetrics}
  videoStream={cameraStreamObj}
  snapshot={snapshotUrl}
      />

        {/* If exam link provided, show student login; otherwise show exam ID input */}
        {showLogin ? (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <h3 className="text-lg font-medium mb-3">Student Login to join exam</h3>
            <form onSubmit={handleStudentLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Student ID
                </label>
                <Input
                  placeholder="Enter your Student ID"
                  value={studentLoginId}
                  onChange={(e) => setStudentLoginId(e.target.value)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Password (if required)
                </label>
                <Input
                  type="password"
                  placeholder="Password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              <Button type="primary" htmlType="submit" className="w-full" disabled={loggingIn}>
                {loggingIn ? "Signing in..." : "Sign in and Open Exam"}
              </Button>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-4">
            <form onSubmit={handleStartExam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text)] mb-2">
                  Exam ID / Link
                </label>
                <Input
                  placeholder="Exam ID / Link"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]"
                disabled={loadingPaper}
              >
                {loadingPaper ? 'Loading exam…' : 'Start Exam'}
              </Button>
            </form>
          </div>
        )}

        {/* Important Instructions Card */}
        <div className="bg-amber-50 rounded-2xl shadow-sm p-6 border border-amber-200">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <FiAlertCircle className="text-white w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Important Instructions:
            </h2>
          </div>
          <ul className="space-y-2 ml-9">
            <li className="text-sm text-[var(--color-text)] flex items-start">
              <span className="mr-2">•</span>
              <span>Ensure your camera is working</span>
            </li>
            <li className="text-sm text-[var(--color-text)] flex items-start">
              <span className="mr-2">•</span>
              <span>Do not switch tabs during the exam</span>
            </li>
            <li className="text-sm text-[var(--color-text)] flex items-start">
              <span className="mr-2">•</span>
              <span>Keep your face visible at all times</span>
            </li>
            <li className="text-sm text-[var(--color-text)] flex items-start">
              <span className="mr-2">•</span>
              <span>No external devices allowed</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
