import React, { useState } from "react";
import { PiGraduationCapFill } from "react-icons/pi";
import { FiAlertCircle } from "react-icons/fi";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { ExamInterface } from "../components/exam/ExamInterface";

export function StudentEnroll() {
  const [examId, setExamId] = useState("");
  const [examStarted, setExamStarted] = useState(false);

  const handleStartExam = (e) => {
    e.preventDefault();
    if (examId.trim()) {
      setExamStarted(true);
    }
  };

  // Show exam interface if exam has started
  if (examStarted) {
    return <ExamInterface examId={examId} onExit={() => setExamStarted(false)} />;
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] bg-slate-100">
      <div className="w-full max-w-md px-4">
        {/* Logo and Title Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-4 shadow-lg bg-[var(--color-primary)]">
            <PiGraduationCapFill className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-text)] mb-2">EduVision</h1>
          <p className="text-sm text-slate-600">Enter your Exam ID to begin</p>
        </div>

        {/* Exam ID Card */}
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
            >
              Start Exam
            </Button>
          </form>
        </div>

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
