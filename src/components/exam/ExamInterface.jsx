import { useState, useEffect, useRef, useMemo } from "react";
import { PiGraduationCapFill } from "react-icons/pi";
import { FiAlertCircle, FiCamera, FiVideo, FiGrid } from "react-icons/fi";
import { Radio } from "antd";
import { examsApi } from "../../store/apiClients/examsClient";
import { useSocket } from "../../utils/useSocket";


export function ExamInterface({ examId, instanceId: instanceIdProp, paperInstance, onExit, onMetrics, onCameraStream, onSnapshot }) {

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // default 60 min, overwritten once exam loads
  const [examData, setExamData] = useState(null);
  const [loadingExam, setLoadingExam] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraGranted, setCameraGranted]   = useState(false);
  const [cameraError, setCameraError]       = useState(null);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [monitoringMetrics, setMonitoringMetrics] = useState({ headMovement: "Normal", motionScore: 0, mobileDetected: 'No' });
  const [isTabActive, setIsTabActive] = useState(true);
  const videoRef = useRef(null);

  // COCO-SSD model ref — loaded lazily after camera starts, stays in memory
  const cocoModelRef = useRef(null);
  const cocoLoadingRef = useRef(false);

  // derive instanceId from prop or from paperInstance passed by StudentEnroll
  let instanceId = instanceIdProp || (paperInstance && paperInstance.instance && paperInstance.instance.id) || null;
  if (!instanceId) {
    try {
      const stored = localStorage.getItem('edu:lastPaperInstance');
      if (stored) {
        const parsed = JSON.parse(stored);
        instanceId = parsed?.instance?.id || instanceId;
      }
    } catch (e) {
      // ignore
    }
  }

  // ── Camera initialisation — mandatory for exam ───────────────────────────
  const requestCamera = async () => {
    setRequestingCamera(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      setCameraStream(stream);
      setCameraGranted(true);
      try { if (typeof onCameraStream === 'function') onCameraStream(stream); } catch (_) {}

      // Load COCO-SSD after camera granted
      if (!cocoModelRef.current && !cocoLoadingRef.current) {
        cocoLoadingRef.current = true;
        try {
          await import('@tensorflow/tfjs');
          const cocoSsd = await import('@tensorflow-models/coco-ssd');
          cocoModelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        } catch (e) {
          console.warn('[ExamInterface] COCO-SSD unavailable:', e.message);
        } finally {
          cocoLoadingRef.current = false;
        }
      }
    } catch (err) {
      setCameraGranted(false);
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera access was denied. Please allow camera access in your browser settings and try again.'
        : 'Could not access your camera. Please check it is connected and not in use by another app.');
    } finally {
      setRequestingCamera(false);
    }
  };

  useEffect(() => {
    const initializeCamera = async () => {
      await requestCamera();
    };

    initializeCamera();

    return () => {
      if (cameraStream) {
        // stop all tracks on unmount
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // attach the MediaStream to the video element so preview shows
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      try {
        // some browsers require direct assignment
        videoRef.current.srcObject = cameraStream;
      } catch (e) {
        try {
          videoRef.current.src = window.URL.createObjectURL(cameraStream);
        } catch (inner) {
          console.warn('Could not attach camera stream to video element', inner || e);
        }
      }
    }
  }, [cameraStream]);

  // Lightweight motion detection using frame-difference (no ML). Updates headMovement in monitoringMetrics.
  useEffect(() => {
    if (!videoRef.current) return;
    let running = true;
    let prevImageData = null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const sample = () => {
      try {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return; // not ready

        // size canvas to small resolution for performance
        const w = 160;
        const h = Math.floor((video.videoHeight / video.videoWidth) * w) || 120;
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(video, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);

        if (prevImageData) {
          // compute simple frame diff
          let diff = 0;
          const len = imageData.data.length;
          for (let i = 0; i < len; i += 4) {
            // use luminance difference (r,g,b combined)
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const pr = prevImageData.data[i];
            const pg = prevImageData.data[i + 1];
            const pb = prevImageData.data[i + 2];
            const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const pl = 0.2126 * pr + 0.7152 * pg + 0.0722 * pb;
            diff += Math.abs(l - pl);
          }
          // normalize diff by pixel count
          const pixelCount = (imageData.data.length / 4);
          const norm = diff / (pixelCount * 255); // approx 0..1
          const motionScore = Math.min(1, norm);

          let headMovement = 'Normal';
          if (motionScore > 0.06) headMovement = 'Critical';
          else if (motionScore > 0.02) headMovement = 'Warning';

          const m = { headMovement, motionScore };
          setMonitoringMetrics(m);
          try { if (typeof onMetrics === 'function') onMetrics(m); } catch (e) {}
        }

        prevImageData = imageData;
      } catch (err) {
        // ignore frame errors
      }
    };

    // sample at ~4 FPS
    const tick = () => {
      if (!running) return;
      sample();
      setTimeout(tick, 250);
    };

    tick();

    return () => {
      running = false;
      prevImageData = null;
      // allow GC of canvas
    };
  }, [videoRef, cameraStream]);

  // ── Live frame emission via Socket.io (every 2s) ─────────────────────────
  // This sends the webcam frame directly to the admin's Live Monitoring in
  // near-real-time, without waiting for an HTTP round-trip.
  useEffect(() => {
    if (!cameraStream) return;
    let mounted = true;
    let httpUploadCounter = 0;

    // Use 320×240 so the admin sees a clear image
    const canvas = document.createElement('canvas');
    canvas.width = 320; canvas.height = 240;
    const ctx = canvas.getContext('2d');

    const capture = async () => {
      try {
        const video = videoRef.current;
        if (!video || video.readyState < 2) return;
        ctx.drawImage(video, 0, 0, 320, 240);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.65);

        let instId = instanceIdRef.current
          || (paperInstance && paperInstance.instance && paperInstance.instance.id)
          || null;
        // Last-resort: localStorage (populated by StudentEnroll or handleNext fallback)
        if (!instId) {
          try {
            const stored = localStorage.getItem('edu:lastPaperInstance');
            if (stored) instId = JSON.parse(stored)?.instance?.id || null;
          } catch (_) {}
        }

        // ── Phone detection via COCO-SSD (runs in browser, no Python needed) ──
        let mobileDetected = 'No';
        if (cocoModelRef.current) {
          try {
            const predictions = await cocoModelRef.current.detect(video);
            // COCO dataset class 76 = 'cell phone'; also catch 'remote' as proxy
            const found = predictions.some(
              p => (p.class === 'cell phone' || p.class === 'remote') && p.score > 0.55
            );
            if (found) mobileDetected = 'Yes';
          } catch (_) { /* GPU context errors — non-fatal */ }
        }
        // Keep local state in sync so the live widget shows correct value
        setMonitoringMetrics(prev =>
          prev.mobileDetected === mobileDetected ? prev : { ...prev, mobileDetected }
        );

        // 1. Emit via Socket.io every 2s → admin sees it instantly
        if (instId) {
          socketEmit('student_frame', {
            instanceId: instId,
            imageData: dataUrl,
            timestamp: new Date().toISOString(),
          });
        }

        // 2. HTTP upload first frame immediately, then every ~10s (every 5th frame)
        // so incidents generated early in a session still have snapshot evidence.
        httpUploadCounter++;
        if (instId && (httpUploadCounter === 1 || httpUploadCounter % 5 === 0)) {
          try {
            const { examsApi } = await import('../../store/apiClients/examsClient');
            const resp = await examsApi.uploadSnapshot(instId, dataUrl);
            const snapshotUrl = resp?.data?.data?.snapshot
              || resp?.data?.snapshot
              || resp?.data?.instance?.snapshot
              || null;
            if (mounted && typeof onSnapshot === 'function' && snapshotUrl) {
              onSnapshot(snapshotUrl);
            }
          } catch (_) { /* non-fatal */ }
        }
      } catch (_) { /* ignore frame errors */ }
    };

    capture(); // immediate first frame
    const timer = setInterval(capture, 2000); // every 2s
    return () => { mounted = false; clearInterval(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraStream]);

  // Detect tab switching for proctoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
      if (document.hidden) {
        // Tab switched - could log this or show warning
        console.warn("Tab switched detected");
      }
    };

    const handleBlur = () => {
      setIsTabActive(false);
    };

    const handleFocus = () => {
      setIsTabActive(true);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  // ── Socket.io: join exam room + listen for forced termination ─────────────
  const { emit: socketEmit } = useSocket({
    session_terminated: (payload) => {
      // Only act if this event is for our specific instance
      const myId = instanceIdRef.current
        || (paperInstance?.instance?.id)
        || null;
      if (!myId || (payload.instanceId && payload.instanceId !== myId)) return;

      // Stop camera tracks immediately
      try {
        cameraStream?.getTracks().forEach(t => t.stop());
      } catch (_) {}

      // Clear saved session so student can't re-enter
      try { localStorage.removeItem('edu:lastPaperInstance'); } catch (_) {}

      // Show full-screen termination notice then redirect
      import('../../utils/react-toastify-shim').then(({ toast }) => {
        toast.error(payload.message || 'Your session has been terminated by the administrator.', {
          autoClose: false,
          closeOnClick: false,
        });
      }).catch(() => {});

      // Brief delay so toast is visible, then exit
      setTimeout(() => {
        if (typeof onExit === 'function') onExit();
      }, 2500);
    },
  });
  useEffect(() => {
    if (instanceId) socketEmit('join_exam', instanceId);
  }, [instanceId, socketEmit]);

  // ── Periodically push metrics to server (every 4 s) ───────────────────
  // Uses a ref so the interval always has the latest values without restarts.
  const metricsRef = useRef(monitoringMetrics);
  metricsRef.current = monitoringMetrics;
  const tabRef = useRef(isTabActive);
  tabRef.current = isTabActive;
  const instanceIdRef = useRef(instanceId);
  instanceIdRef.current = instanceId;

  useEffect(() => {
    const push = async () => {
      // Prefer prop/paperInstance id; fall back to localStorage
      let id = instanceIdRef.current;
      if (!id) {
        try {
          const stored = localStorage.getItem('edu:lastPaperInstance');
          if (stored) id = JSON.parse(stored)?.instance?.id || null;
        } catch (_) {}
      }
      if (!id) return;
      try {
        const payload = {
          ...metricsRef.current,
          tabActive: tabRef.current,
          headMovement: !tabRef.current
            ? 'Critical'
            : metricsRef.current.headMovement || 'Normal',
          // mobileDetected comes from COCO-SSD detection updated in capture loop
          mobileDetected: metricsRef.current.mobileDetected || 'No',
        };
        await examsApi.sendMetrics(id, payload);
      } catch (_e) { /* network errors are non-fatal for the student */ }
    };

    // push once immediately then every 4 s
    push();
    const interval = setInterval(push, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Snapshot: capture at 320×240 for AI analysis every 5 s ───────────
  // (replaces the 160×120 snapshot inside the existing snapshot useEffect)

  const questionsList = (examData && Array.isArray(examData.questions) ? examData.questions : []);
  const currentQuestion = questionsList[currentQuestionIndex] || {};
  const questionKey = currentQuestion.id || `q-index-${currentQuestionIndex}`;
  const selectedAnswer = answers[questionKey];

  // Load exam data when examId provided
  useEffect(() => {
    let mounted = true;
    const loadExam = async () => {
      if (!examId) return;
      try {
        setLoadingExam(true);

        // If examId is a full link URL, use the by-link endpoint to get the real exam
        const isLink = String(examId).includes('http') || String(examId).includes('edu-vision') || String(examId).includes('/');
        const resp = isLink
          ? await examsApi.getExamByLink(examId)
          : await examsApi.getExam(examId);

        const payload = resp?.data?.data || resp?.data || {};

        // support responses that wrap exam under `exam` (and include `instance`)
        const examPayload = payload.exam || payload;

        // Raw questions may have options as an array of strings; normalize to UI shape
        const rawQuestions = Array.isArray(examPayload.questions) ? examPayload.questions : [];
        const letterForIndex = (i) => String.fromCharCode(65 + i); // 0 -> A
        const normalizedQuestions = rawQuestions.map((q) => {
          const opts = Array.isArray(q.options)
            ? q.options.map((opt, i) => ({ label: letterForIndex(i), value: String(i), text: String(opt) }))
            : [];
          return {
            id: q.id || q.questionId || undefined,
            question: q.question || q.text || "",
            options: opts,
            marks: q.marks || q.mark || 1,
            correct: typeof q.correct !== 'undefined' ? q.correct : null,
            mediaURL: q.mediaURL || q.media || null,
            explanation: q.explanation || "",
          };
        });

        const normalized = {
          title: examPayload.title || '',
          subject: examPayload.subject || '',
          totalQuestions: (examPayload.totalQuestions && examPayload.totalQuestions > 0)
            ? examPayload.totalQuestions
            : normalizedQuestions.length,
          timeLimit: examPayload.timeLimitMinutes || examPayload.timeLimit || 60,
          questions: normalizedQuestions,
        };
        if (!mounted) return;
        setExamData(normalized);
        setTimeRemaining((normalized.timeLimit || 60) * 60);
      } catch (err) {
        console.warn('Failed to load exam data', err);
      } finally {
        if (mounted) setLoadingExam(false);
      }
    };

    loadExam();
    return () => { mounted = false; };
  }, [examId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      // Handle time up
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => answers[key] !== undefined && answers[key] !== null).length,
    [answers]
  );

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (value) => {
    const key = currentQuestion.id || `q-index-${currentQuestionIndex}`;
    setAnswers((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleNext = () => {
    const saveAndNext = async () => {
      const q = currentQuestion;
      const key = q.id || `q-index-${currentQuestionIndex}`;
      const selected = answers[key];
      // only proceed if answer selected
      if (typeof selected === 'undefined' || selected === null) return;
      // selected stored as option.value (string index). Prefer numeric index
      const selectedIndex = Number(selected);
      try {
        let usedInstanceId = instanceId;

        if (!usedInstanceId) {
          // Check localStorage for a previously resolved instance
          try {
            const stored = localStorage.getItem('edu:lastPaperInstance');
            if (stored) {
              const parsed = JSON.parse(stored);
              usedInstanceId = parsed?.instance?.id || null;
            }
          } catch (_) {}
        }

        if (!usedInstanceId) {
          const rawExamId = String(examId || '');
          const isLink = rawExamId.includes('http') || rawExamId.includes('edu-vision') || rawExamId.includes('/');

          if (isLink) {
            // examId is a full link URL → resolve the real instance via by-link lookup
            try {
              const byLinkResp = await examsApi.getExamByLink(rawExamId);
              const foundInst = byLinkResp?.data?.data?.instance;
              if (foundInst?.id) {
                usedInstanceId = foundInst.id;
                try { await examsApi.startInstance(usedInstanceId); } catch (_) {}
                try { localStorage.setItem('edu:lastPaperInstance', JSON.stringify({ instance: { id: usedInstanceId } })); } catch (_) {}
              }
            } catch (e) {
              console.warn('[ExamInterface] by-link fallback failed', e?.message);
            }
          } else {
            // examId is a real exam ID → create a fresh instance
            try {
              const createResp = await examsApi.createInstance({ examId: rawExamId });
              usedInstanceId = createResp?.data?.data?.id || createResp?.data?.id || null;
              try { localStorage.setItem('edu:lastPaperInstance', JSON.stringify({ instance: { id: usedInstanceId } })); } catch (_) {}
            } catch (e) {
              console.warn('[ExamInterface] createInstance failed', e?.message);
            }
          }
        }

        if (usedInstanceId) {
          await examsApi.submitAnswer(usedInstanceId, { questionId: q.id, selectedIndex });
        } else {
          console.warn('[ExamInterface] no instanceId resolved; answer not saved');
        }
      } catch (err) {
        console.warn('submitAnswer failed', err?.message || err, err?.response?.data || null);
      }

      if (currentQuestionIndex < questionsList.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      // if this was last question, we could optionally finish here but handled in Done button
    };
    saveAndNext();
  };

  // ── Mandatory camera permission overlay ───────────────────────────────────
  // This covers and blurs the entire exam until camera access is granted.
  const CameraGate = !cameraGranted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
         style={{ backdropFilter: 'blur(12px)', background: 'rgba(15,23,42,0.85)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center mx-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <FiCamera className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Camera Access Required</h2>
        <p className="text-sm text-slate-500 mb-4 leading-relaxed">
          This exam requires your camera to be active at all times for proctoring purposes.
          You cannot proceed without granting camera access.
        </p>
        {cameraError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg px-4 py-3 mb-4 text-left">
            <p className="text-xs text-rose-700 font-medium">{cameraError}</p>
          </div>
        )}
        <button
          onClick={requestCamera}
          disabled={requestingCamera}
          className="w-full py-3 px-6 rounded-xl bg-[var(--color-primary)] text-white font-semibold text-sm
                     hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {requestingCamera ? 'Requesting access…' : 'Grant Camera Access'}
        </button>
        <p className="text-[11px] text-slate-400 mt-3">
          Click the camera icon in your browser address bar and select "Allow"
        </p>
      </div>
    </div>
  ) : null;

  return (
  <div className="min-h-screen bg-slate-100 pb-20 relative">
      {/* Mandatory camera overlay — blocks exam until permission granted */}
      {CameraGate}

      {/* Loading / error state while exam data is fetched from server */}
      {loadingExam && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-sm">Loading exam…</p>
          </div>
        </div>
      )}

      {!loadingExam && examData && questionsList.length === 0 && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-2">
            <p className="text-slate-700 font-semibold">No questions found for this exam.</p>
            <p className="text-slate-400 text-sm">Please contact your administrator.</p>
          </div>
        </div>
      )}

      {/* Main exam UI — only rendered when data is ready */}
      {(!loadingExam && examData && questionsList.length > 0) && (<>

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className=" flex  justify-between">
          <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <PiGraduationCapFill className="text-[var(--color-white)] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text)]">
                {examData?.title || (loadingExam ? 'Loading exam…' : 'Exam')}
              </h1>
              <p className="text-sm text-slate-600">{examData?.subject || ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xl font-semibold text-[var(--color-text)]">
              {formatTime(timeRemaining)}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live</span>
              <FiVideo className="text-[var(--color-primary)] w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      {/* Warning Bar */}
  <div className="bg-slate-100 border-b border-slate-200 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <FiAlertCircle className="text-amber-600 w-5 h-5" />
          <span className="text-sm text-[var(--color-text)]">
            Keep your face visible • No tab switching • {answeredCount}/{examData?.totalQuestions ?? questionsList.length} answered
          </span>
        </div>
      </div>

      {/* Main Content Area with Question Navigation and Question Card */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Question Navigation */}
        <div className="mb-4 flex items-center gap-2">
          {questionsList.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
            const isCurrent = index === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => handleQuestionNavigation(index)}
                className={[
                  "w-10 h-10 rounded-lg font-medium text-sm transition",
                  isCurrent
                    ? "bg-[var(--color-primary)] text-[var(--color-white)] shadow-sm"
                    : isAnswered
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-slate-200 text-[var(--color-text)] hover:bg-slate-300",
                ].join(" ")}
              >
                {index + 1}
              </button>
            );
          })}
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
          {/* Question Tag */}
          <div className="mb-6">
            <span className="inline-block bg-blue-50 text-[var(--color-primary)] px-3 py-1 rounded-full text-sm font-medium">
              Question {currentQuestionIndex + 1} of {examData?.totalQuestions ?? questionsList.length}
            </span>
          </div>

          {/* Question */}
          <h2 className="text-xl font-bold text-[var(--color-text)] mb-6">
            {currentQuestion.question}
          </h2>

          {/* Options - With gaps between them */}
          <div className="mb-8">
            {currentQuestion.options && currentQuestion.options.length > 0 ? (
              <div className="flex flex-col gap-3">
                <Radio.Group
                  value={selectedAnswer}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  className="w-full flex flex-col gap-3"
                >
                  {currentQuestion.options.map((option) => (
                    <div
                      key={option.value}
                      className={[
                        "p-4 rounded-lg border-2 transition cursor-pointer bg-white",
                        selectedAnswer === option.value
                          ? "border-[var(--color-primary)] bg-blue-50"
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                      ].join(" ")}
                      onClick={() => handleAnswerChange(option.value)}
                    >
                      <Radio value={option.value} className="w-full">
                        <span className="text-[var(--color-text)] font-medium">
                          <span className="font-semibold mr-2">{option.label}.</span>
                          {option.text}
                        </span>
                      </Radio>
                    </div>
                  ))}
                </Radio.Group>
              </div>
            ) : (
              <div className="text-[var(--color-text)] p-4">No options available</div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className={[
                "min-w-[120px] h-[45px] px-6 text-sm font-medium rounded-lg flex items-center justify-center transition",
                currentQuestionIndex === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-white text-[var(--color-primary)] border border-slate-300 hover:bg-slate-50",
              ].join(" ")}
            >
              &lt; Previous
            </button>
            {currentQuestionIndex < questionsList.length - 1 ? (
            <button
              onClick={handleNext}
              disabled={typeof answers[currentQuestion.id] === 'undefined'}
              className={[
                "min-w-[120px] h-[45px] px-6 text-sm font-medium rounded-lg flex items-center justify-center transition",
                currentQuestionIndex === questionsList.length - 1
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-[var(--color-primary)] text-[var(--color-white)] hover:bg-[var(--color-primary)] border border-[var(--color-primary)]",
              ].join(" ")}
            >
              Next &gt;
            </button>
            ) : (
              <button
                onClick={async () => {
                  const q = currentQuestion;
                  const key = q.id || `q-index-${currentQuestionIndex}`;
                  const selected = answers[key];
                  if (typeof selected === 'undefined' || selected === null) return;
                  const selectedIndex = Number(selected);
                  try {
                    if (instanceId) {
                      await examsApi.submitAnswer(instanceId, { questionId: q.id, selectedIndex, complete: true });
                    } else {
                      console.warn('[ExamInterface] no instanceId provided; skipping finish submit');
                    }
                  } catch (err) {
                    console.warn('finish submit failed', err?.message || err, err?.response?.data || null);
                  }
                  // exit the exam UI
                  if (typeof onExit === 'function') onExit();
                }}
                className={[
                  "min-w-[120px] h-[45px] px-6 text-sm font-medium rounded-lg flex items-center justify-center transition bg-[var(--color-primary)] text-[var(--color-white)] border border-[var(--color-primary)] hover:bg-[var(--color-primary)]",
                ].join(" ")}
              >
                Done
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Floating Live Monitoring Widget - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-[#1a1f40] rounded-xl shadow-2xl overflow-hidden w-48">
          {/* Camera Feed */}
          <div className="aspect-video bg-black flex items-center justify-center relative overflow-hidden">
            {cameraStream ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <FiCamera className="text-white/30 w-8 h-8" />
            )}
          </div>
          {/* Live Status Text */}
          <div className="px-3 py-2 bg-[#1a1f40] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <div className="flex flex-col">
                <span className="text-white text-xs font-medium">Live</span>
                <span className="text-[10px] text-white/70">
                  {monitoringMetrics.headMovement}
                  {monitoringMetrics.mobileDetected === 'Yes' && ' • 📱 Phone!'}
                  {monitoringMetrics.mobileDetected !== 'Yes' && ` • ${Math.round((monitoringMetrics.motionScore || 0) * 100)}%`}
                </span>
              </div>
            </div>
            <FiGrid className="text-white/60 w-4 h-4" />
          </div>
        </div>
      </div>
    </>)}
  </div>
  );
}
