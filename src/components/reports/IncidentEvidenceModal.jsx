import { useState, useEffect } from 'react';
import { Modal } from "../../components/ui/Modal";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { FiDownload, FiChevronLeft, FiChevronRight, FiCamera } from "react-icons/fi";
import { getSeverityTone } from "../../pages/Reports";
import { ReportsQueries } from '../../store/serviceQueries/reportsQueries';
import { ENV_CONFIG } from '../../config/env';
import { toast } from '../../utils/react-toastify-shim';

function buildSnapshotList(incident) {
  if (!incident) return [];

  const list = [];

  // Parse the snapshots array (multi-snapshot gallery)
  try {
    const parsed = typeof incident.snapshots === 'string'
      ? JSON.parse(incident.snapshots || '[]')
      : (Array.isArray(incident.snapshots) ? incident.snapshots : []);
    parsed.forEach(url => { if (url && !list.includes(url)) list.push(url); });
  } catch (_) {}

  // Add evidenceFile as fallback if not already in list
  if (incident.evidenceFile && !list.includes(incident.evidenceFile)) {
    list.unshift(incident.evidenceFile);
  }

  return list;
}

function resolveUrl(path) {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  // Snapshot URL stored as /api/exams/instances/… → prepend backend base
  if (path.startsWith('/api/')) return `${ENV_CONFIG.API_BASE_URL}${path}`;
  return path;
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
    <Modal open={open} onCancel={onClose} width={740} title={null}>
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

        {/* ── Snapshot gallery ─────────────────────────────────────── */}
        <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ minHeight: 260 }}>
          {displaySrc ? (
            <img
              key={displaySrc}
              src={displaySrc}
              alt={`Evidence ${currentIdx + 1} of ${total || 1}`}
              className="w-full object-contain max-h-72"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-500">
              <FiCamera className="w-10 h-10 opacity-30" />
              <p className="text-sm">No snapshot available for this incident</p>
            </div>
          )}

          {/* Navigation arrows — only when multiple snapshots */}
          {total > 1 && (
            <>
              <button
                onClick={prev}
                disabled={currentIdx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition"
              >
                <FiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={next}
                disabled={currentIdx === total - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-30 hover:bg-black/80 transition"
              >
                <FiChevronRight className="w-5 h-5" />
              </button>

              {/* Counter badge */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                {currentIdx + 1} / {total}
              </div>
            </>
          )}

          {/* Thumbnail strip — up to 6 thumbs */}
          {total > 1 && (
            <div className="flex gap-1.5 px-3 pb-3 pt-1 bg-black/40 overflow-x-auto">
              {snapshots.slice(0, 8).map((snap, i) => (
                <button
                  key={i}
                  onClick={() => { setImgError(false); setCurrentIdx(i); }}
                  className={`shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition ${
                    i === currentIdx ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={resolveUrl(snap)}
                    alt={`thumb-${i}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </button>
              ))}
              {total > 8 && (
                <div className="shrink-0 w-14 h-10 rounded bg-black/40 flex items-center justify-center text-white text-xs">
                  +{total - 8}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Incident details grid ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 bg-slate-50 rounded-xl">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Cheating Type</p>
              <p className="text-sm font-semibold text-[var(--color-text)] break-words">{incident.cheatingType || '—'}</p>
            </CardBody>
          </Card>
          <Card className="border-0 bg-slate-50 rounded-xl">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Snapshots Captured</p>
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {total > 0 ? `${total} snapshot${total !== 1 ? 's' : ''}` : 'None'}
              </p>
            </CardBody>
          </Card>
          <Card className="border-0 bg-slate-50 rounded-xl">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Exam</p>
              <p className="text-sm font-semibold text-[var(--color-text)]">{incident.exam || '—'}</p>
            </CardBody>
          </Card>
          <Card className="border-0 bg-slate-50 rounded-xl">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Subject</p>
              <p className="text-sm font-semibold text-[var(--color-text)]">{incident.subject || '—'}</p>
            </CardBody>
          </Card>
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
