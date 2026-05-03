import { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useSelector } from 'react-redux';
import { useSocket } from '../../utils/useSocket';

export function Topbar({ title = "Dashboard" }) {
  const reduxUser = useSelector((state) => state?.auth?.user);

  // Fall back to localStorage so name survives page refresh
  const authUser = reduxUser || (() => {
    try { return JSON.parse(localStorage.getItem('edu:admin') || 'null'); } catch { return null; }
  })();

  const displayName = (authUser?.fullName || authUser?.name || authUser?.email || 'Admin')
    .split(' ').filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const initials = displayName
    .split(' ').filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase()).join('') || 'AD';

  // Live notification badge — increments on every new incident via Socket.io
  const [unread, setUnread] = useState(0);

  useSocket({
    new_incident: () => setUnread((n) => n + 1),
  });

  const handleBellClick = () => setUnread(0);

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--color-text)] truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          type="button"
          onClick={handleBellClick}
          className="relative h-10 w-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
          aria-label="Notifications"
        >
          <FiBell className="text-[var(--color-primary)] w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-500 text-white text-[11px] flex items-center justify-center">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>

        {/* Admin avatar + name */}
        <div className="flex items-center gap-3 pl-1">
          <div className="h-10 w-10 rounded-full bg-[var(--color-primary)] text-[var(--color-white)] flex items-center justify-center font-semibold text-sm select-none">
            {initials}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-[var(--color-text)]">{displayName}</p>
            <p className="text-[11px] text-slate-400">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}
