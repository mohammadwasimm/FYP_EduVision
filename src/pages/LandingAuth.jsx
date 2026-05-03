import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PiGraduationCapFill } from 'react-icons/pi';
import { FiShield, FiMonitor, FiBarChart2 } from 'react-icons/fi';

export function LandingAuth() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#5318EB] to-[#AB6EF9] text-white">
      <div className="w-full max-w-6xl mx-auto px-6">
        <header className="flex items-center justify-between py-8 text-white">
          <div className="flex items-center gap-3">
            <PiGraduationCapFill className="w-10 h-10 text-white" />
            <span className="text-2xl font-bold">EduVision</span>
          </div>
          {/* header action buttons removed - primary actions are in the hero section */}
        </header>

        <main className="text-center pt-6 pb-14 text-white">
          <div className="flex flex-col items-center gap-5">
            <PiGraduationCapFill className="w-20 h-20 text-white" />
            <p className="inline-block bg-white/10 text-white px-4 py-1 rounded-full">Secure Online Exam Proctoring</p>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mt-1 max-w-4xl">
              Ensure Academic Integrity with <span className="text-white">AI-Powered</span> Proctoring
            </h1>
            <p className="mt-4 text-white/90 max-w-2xl mx-auto">
              Monitor exams in real-time with advanced detection for head movement, eye gaze, mobile phones, and more. Keep your examinations fair and secure.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button type="primary" className="px-6" onClick={() => nav('/student-enroll')}>
                Student Portal
              </Button>
              <Button mode="outline-primary" className="px-6" onClick={() => nav('/admin-signup')}>
                Admin Dashboard
              </Button>
            </div>
          </div>
        </main>

        <section className="pb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center">Powerful Features</h2>
            <p className="text-center text-white/90 mt-2 mb-10">Everything you need to conduct secure online examinations</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-7">
              <div className="bg-white rounded-2xl shadow-sm p-8 text-center min-h-[205px]">
                <div className="mx-auto w-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                  <FiShield className="text-[var(--color-primary)] w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-[var(--color-primary)]">Secure Authentication</h3>
                <p className="text-sm text-slate-500 mt-3">Multi-factor authentication for both admins and students ensures exam integrity.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-8 text-center min-h-[205px]">
                <div className="mx-auto w-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                  <FiMonitor className="text-[var(--color-primary)] w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-[var(--color-primary)]">Live Proctoring</h3>
                <p className="text-sm text-slate-500 mt-3">Real-time video monitoring with AI-powered cheating detection.</p>
              </div>

              <div className="bg-white rounded-2xl shadow-sm p-8 text-center min-h-[205px]">
                <div className="mx-auto w-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                  <FiBarChart2 className="text-[var(--color-primary)] w-6 h-6" />
                </div>
                <h3 className="font-semibold text-lg text-[var(--color-primary)]">Detailed Reports</h3>
                <p className="text-sm text-slate-500 mt-3">Comprehensive analytics and incident reports for every exam session.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
