import { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { FiCamera, FiAlertTriangle, FiWifi, FiEye, FiMonitor, FiLogOut } from "react-icons/fi";
import { MdPhoneIphone } from "react-icons/md";
import { examsApi } from "../../store/apiClients/examsClient";
import { toast } from "../../utils/react-toastify-shim";

function severity(val, dangerVal, warnVal) {
  if (dangerVal && String(val || '').toLowerCase().includes(dangerVal)) return 'critical';
  if (warnVal  && String(val || '').toLowerCase().includes(warnVal))   return 'warning';
  return 'normal'; 
}

const SEV_COLOR = {
  critical: { text: 'text-rose-600',   bg: 'bg-rose-50',   border: 'border-rose-200'   },
  warning:  { text: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200'  },
  normal:   { text: 'text-emerald-600',bg: 'bg-emerald-50',border: 'border-emerald-200' },
};

function MetricBlock({ icon: Icon, label, value, sev = 'normal' }) {
  const c = SEV_COLOR[sev] || SEV_COLOR.normal;
  return (
    <div className={`rounded-xl border ${c.border} ${c.bg} p-3 flex items-center gap-3`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.bg} border ${c.border}`}>
        <Icon className={`w-4 h-4 ${c.text}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-medium">{label}</p>
        <p className={`text-sm font-semibold ${c.text} truncate`}>{value || '—'}</p>
      </div>
    </div>
  );
}

export function MonitoringModal({ student, isOpen, onClose, onSessionOut, liveFrame, snapshot }) {
  const [terminating, setTerminating] = useState(false);

  if (!student && !isOpen) return null;

  const handleTerminate = async () => {
    const instId = student?.instanceId;
    if (!instId) return;
    try {
      setTerminating(true);
      await examsApi.terminateInstance(instId);
      toast.success(`Session terminated for ${student?.name || 'student'}`);
      onSessionOut?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to terminate session');
    } finally {
      setTerminating(false);
    }
  };

  const {
    name       = 'Unknown Student',
    rollNumber = '—',
    studentId  = '—',
    examTitle  = '—',
    status     = 'normal',
    metrics    = {},
  } = student || {};

  const statusCfg = {
    normal:   { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', label: 'Normal'   },
    warning:  { badge: 'bg-amber-100  text-amber-700',    dot: 'bg-amber-500',   label: 'Warning'  },
    critical: { badge: 'bg-rose-100   text-rose-700',     dot: 'bg-rose-500',    label: 'Critical' },
  }[status] || { badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400', label: status };

  // Active warning message
  const warnings = [];
  if (String(metrics.mobileDetected || '').toLowerCase().includes('yes'))
    warnings.push({ text: 'Mobile phone detected!', level: 'critical' });
  if (String(metrics.headMovement || '').toLowerCase().includes('critical'))
    warnings.push({ text: `Head movement: ${metrics.headMovement}`, level: 'critical' });
  if (!metrics.tabActive && metrics.tabActive !== undefined)
    warnings.push({ text: 'Student switched tabs', level: 'warning' });
  if (metrics.gazeDirection && metrics.gazeDirection !== 'Looking Center' && metrics.gazeDirection !== 'Unknown')
    warnings.push({ text: `Gaze: ${metrics.gazeDirection}`, level: 'warning' });
  if (String(metrics.headMovement || '').toLowerCase().includes('warning'))
    warnings.push({ text: `Head movement: ${metrics.headMovement}`, level: 'warning' });

  const frameSource = liveFrame || snapshot || null;

  return (
    <Modal open={isOpen} onCancel={onClose} width={600}>
      <div className="space-y-4">

        {/* ── Header ───────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {rollNumber} · {studentId}
              {examTitle !== '—' && <span> · {examTitle}</span>}
            </p>
          </div>
          <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusCfg.badge}`}>
            {statusCfg.label}
          </span>
        </div>

        {/* ── Live camera feed ─────────────────────────────── */}
        <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
          {frameSource ? (
            <img
              src={frameSource}
              alt="live feed"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-600">
              <FiCamera className="w-12 h-12 opacity-40" />
              <p className="text-sm text-slate-400">
                Waiting for student's webcam feed…
              </p>
              <p className="text-xs text-slate-500">
                Frame appears once the student starts their exam
              </p>
            </div>
          )}

          {/* Live badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1">
            <span className={`w-2 h-2 rounded-full ${statusCfg.dot} animate-pulse`} />
            <span className="text-xs text-white font-medium">LIVE</span>
          </div>

          {/* Frame-by-frame update indicator */}
          {liveFrame && (
            <div className="absolute top-3 right-3 bg-black/60 rounded-full px-2 py-0.5">
              <span className="text-[10px] text-white/70">~2s delay</span>
            </div>
          )}
        </div>

        {/* ── Active warnings ──────────────────────────────── */}
        {warnings.length > 0 && (
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                  ${w.level === 'critical'
                    ? 'bg-rose-50 border border-rose-200 text-rose-700'
                    : 'bg-amber-50 border border-amber-200 text-amber-700'}`}
              >
                <FiAlertTriangle className="w-4 h-4 shrink-0" />
                {w.text}
              </div>
            ))}
          </div>
        )}

        {/* ── Metrics grid ─────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-2">
          <MetricBlock
            icon={FiWifi}
            label="Head Movement"
            value={metrics.headMovement || 'Normal'}
            sev={severity(metrics.headMovement, 'critical', 'warning')}
          />
          <MetricBlock
            icon={FiEye}
            label="Gaze Direction"
            value={metrics.gazeDirection || metrics.eyeStatus || 'Center'}
            sev={metrics.gazeDirection && metrics.gazeDirection !== 'Looking Center' ? 'warning' : 'normal'}
          />
          <MetricBlock
            icon={MdPhoneIphone}
            label="Mobile Detected"
            value={String(metrics.mobileDetected || 'No').includes('Yes') ? 'YES — Detected' : 'No'}
            sev={String(metrics.mobileDetected || '').toLowerCase().includes('yes') ? 'critical' : 'normal'}
          />
          <MetricBlock
            icon={FiMonitor}
            label="Tab Active"
            value={metrics.tabActive === false ? 'SWITCHED AWAY' : 'Active'}
            sev={metrics.tabActive === false ? 'critical' : 'normal'}
          />
        </div>

        {/* Motion score bar */}
        {typeof metrics.motionScore === 'number' && (
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Motion score</span>
              <span className={metrics.motionScore > 0.06 ? 'text-rose-600 font-semibold' : metrics.motionScore > 0.02 ? 'text-amber-600' : 'text-emerald-600'}>
                {Math.round(metrics.motionScore * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  metrics.motionScore > 0.06 ? 'bg-rose-500' :
                  metrics.motionScore > 0.02 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${Math.min(100, Math.round(metrics.motionScore * 100 * 5))}%` }}
              />
            </div>
          </div>
        )}

        {/* ── Actions ──────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button
            className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 border-rose-600 text-white"
            onClick={handleTerminate}
            disabled={terminating}
          >
            <FiLogOut className="w-4 h-4" />
            {terminating ? 'Terminating…' : 'Log Out Student'}
          </Button>
          <Button mode="outline-primary" className="flex-1" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
