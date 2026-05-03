import { FiCamera, FiAlertTriangle, FiWifi } from "react-icons/fi";
import { MdPhoneIphone } from "react-icons/md";
import { BsEyeSlash } from "react-icons/bs";

// Derive a human-readable warning from live metrics
function getWarningText(metrics = {}) {
  if (!metrics) return null;
  if (String(metrics.mobileDetected || '').toLowerCase().includes('yes'))
    return 'Mobile detected!';
  if (String(metrics.headMovement || '').toLowerCase().includes('critical'))
    return `Head: ${metrics.headMovement}`;
  if (metrics.gazeDirection && metrics.gazeDirection !== 'Looking Center' && metrics.gazeDirection !== 'Unknown')
    return `Gaze: ${metrics.gazeDirection}`;
  if (!metrics.tabActive && metrics.tabActive !== undefined)
    return 'Tab switched!';
  if (String(metrics.headMovement || '').toLowerCase().includes('warning'))
    return `Head: ${metrics.headMovement}`;
  return null;
}

const STATUS = {
  normal: {
    border:    'border-emerald-400',
    dot:       'bg-emerald-500',
    badge:     'bg-emerald-100 text-emerald-700',
    label:     'Normal',
  },
  warning: {
    border:    'border-amber-400',
    dot:       'bg-amber-500',
    badge:     'bg-amber-100 text-amber-700',
    label:     'Warning',
  },
  critical: {
    border:    'border-rose-500',
    dot:       'bg-rose-500',
    badge:     'bg-rose-100 text-rose-700',
    label:     'Critical',
  },
};

export function MonitoringCard({ student, liveFrame, onClick }) {
  const { name, rollNumber, examTitle, status = 'normal', metrics = {} } = student;
  const cfg = STATUS[status] || STATUS.normal;
  const warning = getWarningText(metrics);
  const isCritical = status === 'critical';
  const isWarning  = status === 'warning';

  return (
    <div
      className={`bg-white border-2 ${cfg.border} rounded-2xl overflow-hidden cursor-pointer
        hover:shadow-xl transition-all duration-200 flex flex-col`}
      onClick={onClick}
    >
      {/* ── Live camera area ─────────────────────────────── */}
      <div className="relative bg-slate-900 aspect-video overflow-hidden">
        {liveFrame ? (
          <img
            src={liveFrame}
            alt="live feed"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
            <FiCamera className="w-8 h-8" />
            <span className="text-xs">Waiting for camera…</span>
          </div>
        )}

        {/* Live indicator — top-left */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 rounded-full px-2 py-0.5">
          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} animate-pulse`} />
          <span className="text-[10px] text-white font-medium">LIVE</span>
        </div>

        {/* Warning overlay — bottom of video when not normal */}
        {warning && (
          <div className={`absolute bottom-0 left-0 right-0 px-3 py-1.5 flex items-center gap-1.5
            ${isCritical ? 'bg-rose-600/90' : 'bg-amber-500/90'}`}>
            <FiAlertTriangle className="w-3 h-3 text-white shrink-0" />
            <span className="text-[11px] text-white font-semibold truncate">{warning}</span>
          </div>
        )}
      </div>

      {/* ── Student info + quick metrics ─────────────────── */}
      <div className="p-3 flex flex-col gap-2">
        {/* Name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
            <p className="text-[11px] text-slate-500 truncate">{rollNumber}</p>
            {examTitle && (
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{examTitle}</p>
            )}
          </div>
          <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        {/* Metric pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Head movement */}
          <MetricPill
            icon={<FiWifi className="w-2.5 h-2.5" />}
            value={metrics.headMovement || 'Normal'}
            danger={String(metrics.headMovement || '').toLowerCase().includes('critical')}
            warn={String(metrics.headMovement || '').toLowerCase().includes('warning')}
          />
          {/* Mobile */}
          <MetricPill
            icon={<MdPhoneIphone className="w-2.5 h-2.5" />}
            value={String(metrics.mobileDetected || 'No').includes('Yes') ? 'Detected' : 'None'}
            danger={String(metrics.mobileDetected || '').toLowerCase().includes('yes')}
          />
          {/* Gaze */}
          <MetricPill
            icon={<BsEyeSlash className="w-2.5 h-2.5" />}
            value={metrics.gazeDirection || metrics.eyeStatus || 'Center'}
            warn={metrics.gazeDirection && metrics.gazeDirection !== 'Looking Center'}
          />
        </div>
      </div>
    </div>
  );
}

function MetricPill({ icon, value, danger, warn }) {
  const cls = danger
    ? 'bg-rose-50 text-rose-600 border-rose-200'
    : warn
      ? 'bg-amber-50 text-amber-600 border-amber-200'
      : 'bg-slate-50 text-slate-500 border-slate-200';
  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-medium ${cls}`}>
      {icon}
      <span className="truncate max-w-[60px]">{value}</span>
    </div>
  );
}
