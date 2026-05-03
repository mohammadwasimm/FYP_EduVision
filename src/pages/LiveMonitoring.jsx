import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { SummaryCards } from "../components/monitoring/SummaryCards";
import { SearchWithFilters } from "../components/monitoring/SearchWithFilters";
import { MonitoringCard } from "../components/monitoring/MonitoringCard";
import { MonitoringModal } from "../components/monitoring/MonitoringModal";
import { monitoringApi } from "../store/apiClients/monitoringClient";
import { useSocket } from "../utils/useSocket";
import { ENV_CONFIG } from "../config/env";
import { FiRefreshCw, FiMonitor } from "react-icons/fi";

const FILTER_KEYS = ["all", "critical", "warning", "normal"];

export function LiveMonitoring() {
  const [sessions, setSessions]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [lastRefresh, setLastRefresh]   = useState(null);

  // Live frames: { [instanceId]: base64DataUrl } updated every 2s from socket
  const [liveFrames, setLiveFrames] = useState({});

  const sessionsRef = useRef(sessions);
  sessionsRef.current = sessions;

  // ── Fetch active sessions ────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      const data = await monitoringApi.getAllActiveSessions();
      setSessions(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error("Monitoring load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Fallback poll every 10s in case socket is unavailable
  useEffect(() => {
    const id = setInterval(loadSessions, 10_000);
    return () => clearInterval(id);
  }, [loadSessions]);

  // ── Socket.io — real-time updates ────────────────────────────────────────
  const { emit } = useSocket({
    // Student's webcam frame arrives every 2s
    student_frame: (payload) => {
      const { instanceId, imageData } = payload;
      if (!instanceId || !imageData) return;

      // Store latest frame for this student
      setLiveFrames(prev => ({ ...prev, [instanceId]: imageData }));

      // If this student isn't in the grid yet → reload sessions
      const known = sessionsRef.current.find(s => s.instanceId === instanceId);
      if (!known) loadSessions();
    },

    // Server-emitted AI / motion metric update
    metrics_update: (payload) => {
      setSessions(prev => {
        const idx = prev.findIndex(s => s.instanceId === payload.instanceId);
        if (idx === -1) { loadSessions(); return prev; }

        const updated = [...prev];
        const m = payload.metrics || {};
        let status = 'normal';
        if (
          String(m.mobileDetected || '').toLowerCase().includes('yes') ||
          String(m.headMovement   || '').toLowerCase().includes('critical')
        ) status = 'critical';
        else if (
          (typeof m.motionScore === 'number' && m.motionScore > 0.04) ||
          String(m.headMovement || '').toLowerCase().includes('warning') ||
          (m.gazeDirection && m.gazeDirection !== 'Looking Center')
        ) status = 'warning';

        updated[idx] = { ...updated[idx], metrics: m, status, lastMetricsAt: payload.timestamp };
        return updated;
      });
    },

    snapshot_update: (payload) => {
      setSessions(prev => {
        const idx = prev.findIndex(s => s.instanceId === payload.instanceId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], snapshot: payload.snapshot };
        return updated;
      });
    },

    new_incident: () => {
      loadSessions();
    },

    // Remove session card immediately when admin terminates a student
    session_terminated: (payload) => {
      setSessions(prev => prev.filter(s => s.instanceId !== payload.instanceId));
      setLiveFrames(prev => {
        const next = { ...prev };
        delete next[payload.instanceId];
        return next;
      });
    },
  });

  useEffect(() => { emit('join_monitoring'); }, [emit]);

  // Update modal data live when socket updates arrive
  useEffect(() => {
    if (selectedStudent && isModalOpen) {
      const live = sessionsRef.current.find(s => s.instanceId === selectedStudent.instanceId);
      if (live) setSelectedStudent(live);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q) ||
        s.examTitle?.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "all") result = result.filter(s => s.status === activeFilter);
    return result;
  }, [sessions, search, activeFilter]);

  const stats = useMemo(() => ({
    totalLive: sessions.length,
    normal:   sessions.filter(s => s.status === "normal").length,
    warnings: sessions.filter(s => s.status === "warning").length,
    critical: sessions.filter(s => s.status === "critical").length,
  }), [sessions]);

  // Dynamic filter buttons with live counts
  const filters = useMemo(() => {
    const counts = {
      all:      sessions.length,
      critical: sessions.filter(s => s.status === "critical").length,
      warning:  sessions.filter(s => s.status === "warning").length,
      normal:   sessions.filter(s => s.status === "normal").length,
    };
    return FILTER_KEYS.map(key => ({
      key,
      label: `${key.charAt(0).toUpperCase() + key.slice(1)} (${counts[key]})`,
    }));
  }, [sessions]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCardClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };
  const handleModalClose = () => { setIsModalOpen(false); setSelectedStudent(null); };

  const resolveSnapshot = (snap) => {
    if (!snap) return null;
    if (snap.startsWith('http') || snap.startsWith('data:')) return snap;
    return `${ENV_CONFIG.API_BASE_URL}${snap}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {loading
            ? 'Loading sessions…'
            : sessions.length === 0
              ? 'No active exam sessions. Students appear here once they open their exam link.'
              : `${sessions.length} active session${sessions.length !== 1 ? 's' : ''} · ${lastRefresh ? `updated ${lastRefresh.toLocaleTimeString()}` : ''}`}
        </p>
        <button
          onClick={loadSessions}
          className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
        >
          <FiRefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Summary */}
      <SummaryCards stats={stats} />

      {/* Filters */}
      <SearchWithFilters
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
          <FiMonitor className="w-12 h-12 opacity-25" />
          <p className="text-sm font-medium">
            {sessions.length === 0
              ? "No active sessions yet"
              : "No sessions match your filters"}
          </p>
          <p className="text-xs text-center max-w-xs">
            {sessions.length === 0
              ? "When a student opens their exam link, their live webcam feed will appear here in real-time."
              : "Try changing the filter or search term."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSessions.map(student => (
            <MonitoringCard
              key={student.instanceId}
              student={student}
              liveFrame={liveFrames[student.instanceId] || null}
              onClick={() => handleCardClick(student)}
            />
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <MonitoringModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSessionOut={handleModalClose}
        liveFrame={selectedStudent ? liveFrames[selectedStudent.instanceId] || null : null}
        snapshot={resolveSnapshot(selectedStudent?.snapshot)}
      />
    </div>
  );
}
