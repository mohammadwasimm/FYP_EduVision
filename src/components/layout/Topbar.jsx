import { useState, useEffect } from "react";
import { FiBell } from "react-icons/fi";
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../utils/useSocket';

export function Topbar({ title = "Dashboard" }) {
  const navigate = useNavigate();
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

  const profileImage = authUser?.profilePicture || null;

  const handleProfileClick = () => {
    navigate('/settings?tab=profile');
  };

  // Live notification badge — increments on every new incident via Socket.io
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useSocket({
    new_incident: (incident) => {
      setUnread((n) => n + 1);
      setNotifications((prev) => [
        {
          id: Date.now(),
          type: 'incident',
          title: incident?.title || 'New Incident',
          message: incident?.message || 'A new incident has been detected',
          severity: incident?.severity || 'warning',
          timestamp: new Date(),
          read: false,
        },
        ...prev.slice(0, 9), // Keep last 10 notifications
      ]);
    },
  });

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    setUnread(0);
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
  };

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-semibold text-[var(--color-text)] truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3 relative">
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

        {/* Notification Panel */}
        {showNotifications && (
          <div className="absolute right-0 top-14 w-80 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-slate-500">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition ${
                      !notif.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          notif.severity === 'critical'
                            ? 'bg-rose-500'
                            : notif.severity === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-green-500'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {notif.message}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          {notif.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Admin avatar + name */}
        <button
          type="button"
          onClick={handleProfileClick}
          className="flex items-center gap-3 pl-1 hover:opacity-80 transition cursor-pointer"
        >
          <div className="relative h-10 w-10 rounded-full shrink-0 overflow-hidden bg-[var(--color-primary)] text-[var(--color-white)] flex items-center justify-center font-semibold text-sm select-none">
            {profileImage ? (
              <img
                src={profileImage}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="hidden sm:block leading-tight">
            <p className="text-sm font-medium text-[var(--color-text)]">{displayName}</p>
            <p className="text-[11px] text-slate-400">Administrator</p>
          </div>
        </button>
      </div>
    </header>
  );
}
