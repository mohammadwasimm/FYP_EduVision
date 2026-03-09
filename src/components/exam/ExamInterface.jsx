import React, { useState, useEffect, useRef } from "react";
import { PiGraduationCapFill } from "react-icons/pi";
import { FiAlertCircle, FiCamera, FiVideo, FiGrid } from "react-icons/fi";
import { Radio } from "antd";
import { Button } from "../ui/Button";

// Mock exam data - replace with actual data from API
const mockExamData = {
  title: "Mathematics Final Exam",
  subject: "Mathematics",
  totalQuestions: 5,
  timeLimit: 60, // minutes
  questions: [
    {
      id: 1,
      question: "What is the derivative of x²?",
      options: [
        { label: "A", value: "x", text: "x" },
        { label: "B", value: "2x", text: "2x" },
        { label: "C", value: "x²", text: "x²" },
        { label: "D", value: "2x²", text: "2x²" },
      ],
    },
    {
      id: 2,
      question: "What is the integral of 2x?",
      options: [
        { label: "A", value: "x", text: "x" },
        { label: "B", value: "x²", text: "x²" },
        { label: "C", value: "2x", text: "2x" },
        { label: "D", value: "2x²", text: "2x²" },
      ],
    },
    {
      id: 3,
      question: "What is the limit of (x² - 1)/(x - 1) as x approaches 1?",
      options: [
        { label: "A", value: "0", text: "0" },
        { label: "B", value: "1", text: "1" },
        { label: "C", value: "2", text: "2" },
        { label: "D", value: "undefined", text: "undefined" },
      ],
    },
    {
      id: 4,
      question: "What is the derivative of sin(x)?",
      options: [
        { label: "A", value: "cos(x)", text: "cos(x)" },
        { label: "B", value: "-cos(x)", text: "-cos(x)" },
        { label: "C", value: "sin(x)", text: "sin(x)" },
        { label: "D", value: "-sin(x)", text: "-sin(x)" },
      ],
    },
    {
      id: 5,
      question: "What is the value of ∫₀¹ x dx?",
      options: [
        { label: "A", value: "0.5", text: "0.5" },
        { label: "B", value: "1", text: "1" },
        { label: "C", value: "1.5", text: "1.5" },
        { label: "D", value: "2", text: "2" },
      ],
    },
  ],
};

export function ExamInterface({ examId, onExit }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(mockExamData.timeLimit * 60); // in seconds
  const [answeredCount, setAnsweredCount] = useState(0);
  const [cameraStream, setCameraStream] = useState(null);
  const [isTabActive, setIsTabActive] = useState(true);
  const videoRef = useRef(null);

  // Initialize camera stream for live monitoring
  useEffect(() => {
    const initializeCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        setCameraStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        // Camera access denied or not available - show placeholder
      }
    };

    initializeCamera();

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

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

  const currentQuestion = mockExamData.questions[currentQuestionIndex];
  const selectedAnswer = answers[currentQuestion.id];

  // Debug: Log current question and options
  useEffect(() => {
    console.log("Current question:", currentQuestion);
    console.log("Options:", currentQuestion?.options);
  }, [currentQuestionIndex, currentQuestion]);

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

  // Update answered count
  useEffect(() => {
    const count = Object.keys(answers).filter(
      (key) => answers[key] !== undefined && answers[key] !== null
    ).length;
    setAnsweredCount(count);
  }, [answers]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerChange = (value) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: value,
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
    if (currentQuestionIndex < mockExamData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  return (
  <div className="min-h-screen bg-slate-100 pb-20 relative">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className=" flex  justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center">
              <PiGraduationCapFill className="text-[var(--color-white)] w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text)]">
                {mockExamData.title}
              </h1>
              <p className="text-sm text-slate-600">{mockExamData.subject}</p>
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
            Keep your face visible • No tab switching • {answeredCount}/{mockExamData.totalQuestions} answered
          </span>
        </div>
      </div>

      {/* Main Content Area with Question Navigation and Question Card */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Question Navigation */}
            <div className="mb-4 flex items-center gap-2">
          {mockExamData.questions.map((q, index) => {
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
              Question {currentQuestionIndex + 1} of {mockExamData.totalQuestions}
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
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === mockExamData.questions.length - 1}
              className={[
                "min-w-[120px] h-[45px] px-6 text-sm font-medium rounded-lg flex items-center justify-center transition",
                currentQuestionIndex === mockExamData.questions.length - 1
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-[var(--color-primary)] text-[var(--color-white)] hover:bg-[var(--color-primary)] border border-[var(--color-primary)]",
              ].join(" ")}
            >
              Next &gt;
            </button>
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
              <span className="text-white text-xs font-medium">Live</span>
            </div>
            <FiGrid className="text-white/60 w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
