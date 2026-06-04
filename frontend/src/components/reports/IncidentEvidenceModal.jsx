import { useState, useEffect } from 'react';
import { Modal } from "../../components/ui/Modal";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { FiDownload, FiChevronLeft, FiChevronRight, FiCamera, FiWifi, FiEyeOff, FiMonitor } from "react-icons/fi";
import { MdPhoneIphone } from "react-icons/md";
import { getSeverityTone } from "../../pages/Reports";
import { ReportsQueries } from '../../store/serviceQueries/reportsQueries';
import { ENV_CONFIG } from '../../config/env';
import { toast } from '../../utils/react-toastify-shim';

function buildSnapshotList(incident) {
  if (!incident) return [];

  const list = [];

  // Mobile detection annotated snapshot goes FIRST (has bounding box — best evidence)
  if (incident.mobileDetectionSnapshot && !list.includes(incident.mobileDetectionSnapshot)) {
    list.push(incident.mobileDetectionSnapshot);
  }

  // evidenceFile next
  if (incident.evidenceFile && !list.includes(incident.evidenceFile)) {
    list.push(incident.evidenceFile);
  }

  // Rest of the snapshots gallery
  try {
    const parsed = typeof incident.snapshots === 'string'
      ? JSON.parse(incident.snapshots || '[]')
      : (Array.isArray(incident.snapshots) ? incident.snapshots : []);
    parsed.forEach(url => { if (url && !list.includes(url)) list.push(url); });
  } catch (_) {}

  return list;
}

function resolveUrl(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  // Snapshot URL stored as /api/exams/instances/… → prepend backend base
  if (path.startsWith('/api/')) return `${ENV_CONFIG.API_BASE_URL}${path}`;
  return path;
}

// Parse cheatingType to extract detection metrics
function parseDetectionMetrics(cheatingType) {
  if (!cheatingType) return {};

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

export function IncidentEvidenceModal({ incident, open, onClose }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [fallbackObjectUrl, setFallbackObjectUrl] = useState(null);

  // Reset to first snapshot whenever a different incident is opened
  useEffect(() => {
    setCurrentIdx(0);
    setImgError(false);
  }, [incident?.id]);

  const snapshots = buildSnapshotList(incident);
  const total     = snapshots.length;
  const current   = snapshots[currentIdx] || null;
  const imgSrc    = resolveUrl(current);

  // Parse detection metrics from cheatingType if available
  const parsedMetrics = parseDetectionMetrics(incident?.cheatingType);
  const displayMetrics = {
    mobileDetected: parsedMetrics.mobileDetected || incident?.mobileDetected || 'No',
    headMovement: parsedMetrics.headMovement || incident?.headMovement || 'Normal',
    eyeMovement: parsedMetrics.eyeMovement || incident?.eyeMovement || 'Unknown',
    headPose: parsedMetrics.headPose || incident?.headPose || 'Unknown',
    mobileConfidence: incident?.mobileConfidence || 0,
  };

  // If direct snapshot URL is missing/broken, fetch evidence with auth and render as blob URL.
  useEffect(() => {
    let disposed = false;
    let objectUrl = null;

    async function loadFallbackEvidence() {
      setFallbackObjectUrl(null);
      if (!incident?.id) return;
      if (imgSrc && !imgError) return;

      try {
        const resp = await ReportsQueries.getEvidence(incident.id || incident.key);
        const blob = resp?.data ?? resp;
        if (!(blob instanceof Blob)) return;
        if (!String(blob.type || '').startsWith('image/')) return;

        objectUrl = window.URL.createObjectURL(blob);
        if (!disposed) setFallbackObjectUrl(objectUrl);
      } catch (_) {
        // no evidence available
      }
    }

    loadFallbackEvidence();

    return () => {
      disposed = true;
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [incident?.id, incident?.key, imgSrc, imgError]);

  const displaySrc = (!imgError && imgSrc) ? imgSrc : fallbackObjectUrl;

  if (!incident) return null;

  const prev = () => { setImgError(false); setCurrentIdx(i => Math.max(0, i - 1)); };
  const next = () => { setImgError(false); setCurrentIdx(i => Math.min(total - 1, i + 1)); };

  const handleDownload = async () => {
    try {
      toast.info('Downloading evidence…');
      const resp = await ReportsQueries.getEvidence(incident.id || incident.key);
      const blob = resp?.data ?? resp;
      let filename = current
        ? (current.split('/').pop() || 'evidence.jpg')
        : (incident.evidenceFile || 'evidence.bin');
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download started');
    } catch (err) {
      toast.error('Failed to download evidence');
    }
  };

  const sev = getSeverityTone(incident.severity);

  return (
    <Modal open={open} onCancel={onClose} width={1000} title={null}>
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">Incident Evidence</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {incident.studentName} · {incident.timestamp}
            </p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${sev.className}`}>
            {sev.label}
          </span>
        </div>

        {/* ── Snapshot gallery with right sidebar ─────────────────────────────────────── */}
        <div className="flex gap-4 items-start">
          {/* Main image area */}
          <div className="flex-1 relative bg-slate-900 rounded-xl overflow-hidden" style={{ minHeight: 320 }}>
            {displaySrc ? (
              <img
                key={displaySrc}
                src={displaySrc}
                alt={`Evidence ${currentIdx + 1} of ${total || 1}`}
                className="w-full h-full object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 h-full text-slate-500">
                <FiCamera className="w-10 h-10 opacity-30" />
                <p className="text-sm">No snapshot available</p>
              </div>
            )}

            {/* Detection badge on the annotated snapshot */}
            {current === incident?.mobileDetectionSnapshot && (
              <div className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <MdPhoneIphone className="w-3 h-3" />
                PHONE DETECTED
              </div>
            )}

            {/* Navigation arrows — only when multiple snapshots */}
            {total > 1 && (
              <>
                <button
                  onClick={prev}
                  disabled={currentIdx === 0}
                  className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition z-10"
                >
                  <FiChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={next}
                  disabled={currentIdx === total - 1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition z-10"
                >
                  <FiChevronRight className="w-5 h-5" />
                </button>

                {/* Counter badge */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full z-10">
                  {currentIdx + 1} / {total}
                </div>
              </>
            )}
          </div>

          {/* Right sidebar — thumbnail list */}
          {total > 0 && (
            <div className="w-20 flex flex-col gap-2 overflow-y-auto bg-slate-800/50 rounded-lg p-2 border border-slate-700" style={{ maxHeight: 320 }}>
              {snapshots.map((snap, i) => {
                const isDetectionSnap = snap === incident?.mobileDetectionSnapshot;
                return (
                  <button
                    key={i}
                    onClick={() => { setImgError(false); setCurrentIdx(i); }}
                    className={`relative shrink-0 w-full aspect-square rounded overflow-hidden border-2 transition hover:border-white ${
                      i === currentIdx
                        ? 'border-white ring-2 ring-blue-500'
                        : isDetectionSnap
                          ? 'border-rose-500 opacity-80 hover:opacity-100'
                          : 'border-slate-600 opacity-60 hover:opacity-100'
                    }`}
                    title={isDetectionSnap ? 'Phone Detection (annotated)' : `Shot ${i + 1}`}
                  >
                    <img
                      src={resolveUrl(snap)}
                      alt={`thumb-${i}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className={`absolute bottom-0.5 right-0.5 text-white text-[9px] font-bold px-1 py-0.5 rounded ${
                      isDetectionSnap ? 'bg-rose-600' : 'bg-black/70'
                    }`}>
                      {isDetectionSnap ? '📱' : i + 1}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── AI Detection Results ─────── */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">AI Detection Results</h3>

          {/* Detection metrics grid - always visible */}
          <div className="grid grid-cols-2 gap-3">
                {/* Mobile Detected */}
                <div className={`rounded-lg border p-3 flex items-start gap-2 ${
                  displayMetrics.mobileDetected === 'Yes'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    displayMetrics.mobileDetected === 'Yes'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <MdPhoneIphone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium">Mobile</p>
                    <p className={`text-xs font-bold ${
                      displayMetrics.mobileDetected === 'Yes'
                        ? 'text-red-600'
                        : 'text-emerald-600'
                    }`}>
                      {displayMetrics.mobileDetected === 'Yes' ? '🚨 YES' : '✓ No'}
                    </p>
                    {displayMetrics.mobileConfidence > 0 && (
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {(displayMetrics.mobileConfidence * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                </div>

                {/* Head Movement */}
                <div className={`rounded-lg border p-3 flex items-start gap-2 ${
                  displayMetrics.headMovement === 'Critical'
                    ? 'bg-red-50 border-red-200'
                    : displayMetrics.headMovement === 'Warning'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    displayMetrics.headMovement === 'Critical'
                      ? 'bg-red-100 text-red-600'
                      : displayMetrics.headMovement === 'Warning'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <FiWifi className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Head</p>
                    <p className={`text-xs font-bold ${
                      displayMetrics.headMovement === 'Critical'
                        ? 'text-red-600'
                        : displayMetrics.headMovement === 'Warning'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {displayMetrics.headMovement || '—'}
                    </p>
                  </div>
                </div>

                {/* Eye Movement */}
                <div className={`rounded-lg border p-3 flex items-start gap-2 ${
                  displayMetrics.eyeMovement && displayMetrics.eyeMovement !== 'Looking Center'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    displayMetrics.eyeMovement && displayMetrics.eyeMovement !== 'Looking Center'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <FiEyeOff className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Eye</p>
                    <p className={`text-xs font-bold ${
                      displayMetrics.eyeMovement && displayMetrics.eyeMovement !== 'Looking Center'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {displayMetrics.eyeMovement || '—'}
                    </p>
                  </div>
                </div>

                {/* Head Pose */}
                <div className={`rounded-lg border p-3 flex items-start gap-2 ${
                  displayMetrics.headPose && displayMetrics.headPose !== 'Looking at Screen'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${
                    displayMetrics.headPose && displayMetrics.headPose !== 'Looking at Screen'
                      ? 'bg-amber-100 text-amber-600'
                      : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    <FiMonitor className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">Pose</p>
                    <p className={`text-xs font-bold ${
                      displayMetrics.headPose && displayMetrics.headPose !== 'Looking at Screen'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {displayMetrics.headPose || '—'}
                    </p>
                  </div>
                </div>
              </div>
          </div>

        {/* ── Actions ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-4 pt-1">
          <Button
            type="primary"
            className="flex items-center gap-2 px-5 w-44"
            onClick={handleDownload}
            disabled={!displaySrc && !incident?.id}
          >
            <FiDownload className="w-4 h-4" />
            Download Evidence
          </Button>
          <Button mode="outline-primary" className="px-5 w-44" onClick={onClose}>
            Close
          </Button>
        </div>

      </div>
    </Modal>
  );
}
