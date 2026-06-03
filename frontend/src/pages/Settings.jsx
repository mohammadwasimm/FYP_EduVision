import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import {
  FiLock, FiBell, FiSave, FiEye, FiEyeOff,
  FiUser, FiUploadCloud,
} from "react-icons/fi";
import { SettingsQueries } from '../store/serviceQueries/settingsQueries';
import { settingsApi } from '../store/apiClients/settingsClient';
import { authApi } from '../store/apiClients/authClient';
import { updateUserProfile } from '../pages/auth/stores/actions';
import { toast } from '../utils/react-toastify-shim';

const TABS = [
  { key: "profile",      label: "Profile",       icon: FiUser     },
  { key: "notifications",label: "Notifications", icon: FiBell     },
  { key: "password",     label: "Password",      icon: FiLock     },
];

export function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || "profile");
  const reduxAdmin = useSelector((state) => state?.auth?.user || null);
  const [admin, setAdmin] = useState(reduxAdmin || {});
  const [profilePicture, setProfilePicture] = useState(admin?.profilePicture || null);
  const [uploadingPic, setUploadingPic] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch fresh profile from server if Redux is empty (e.g. after page refresh)
  useEffect(() => {
    if (reduxAdmin?.fullName) {
      setAdmin(reduxAdmin);
      setProfilePicture(reduxAdmin?.profilePicture || null);
      return;
    }
    authApi.getProfile()
      .then((res) => {
        const profile = res?.data?.data || res?.data || null;
        if (profile) {
          setAdmin(profile);
          setProfilePicture(profile?.profilePicture || null);
        }
      })
      .catch(() => {});
  }, [reduxAdmin]);

  // Sync profile picture when admin object changes
  useEffect(() => {
    setProfilePicture(admin?.profilePicture || null);
  }, [admin?.profilePicture]);

  // ── Notification prefs ──────────────────────────────────────────────────
  const [emailAlerts,          setEmailAlerts]          = useState(true);
  const [criticalOnly,         setCriticalOnly]         = useState(false);
  const [dailyDigest,          setDailyDigest]          = useState(true);
  const [soundAlerts,          setSoundAlerts]          = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  // ── Password ────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords,   setShowPasswords]   = useState(false);

  // Load settings on mount
  useEffect(() => {
    (async () => {
      try {
        const s = await SettingsQueries.getSettings();
        if (!s) return;
        if (s.notifications) {
          setEmailAlerts(!!s.notifications.emailAlerts);
          setCriticalOnly(!!s.notifications.criticalOnly);
          setDailyDigest(!!s.notifications.dailyDigest);
          setSoundAlerts(!!s.notifications.soundAlerts);
          const bn = !!s.notifications.browserNotifications;
          setBrowserNotifications(bn);
          localStorage.setItem('settings_browserNotifications', String(bn));
        }
      } catch (err) {
        console.warn('Failed to load settings', err);
      }
    })();
  }, []);

  // ── Request browser notification permission ─────────────────────────────
  const handleBrowserNotifToggle = async (checked) => {
    if (checked) {
      if (!('Notification' in window)) {
        toast.error('Your browser does not support notifications.');
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission denied. Please allow it in browser settings.');
        return;
      }
      toast.success('Browser notifications enabled!');
    }
    setBrowserNotifications(checked);
  };

  const inputCls = "w-full h-[45px] rounded-[9px] border border-slate-200 bg-[var(--color-input-bg)] px-3 text-sm outline-none text-[var(--color-text)]";
  const rowCls   = "flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-4";

  // ── Profile Picture Upload ──────────────────────────────────────────────
  const handleProfilePictureUpload = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    // Validate file type
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP).');
      event.target.value = '';
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be less than 5MB.');
      event.target.value = '';
      return;
    }

    try {
      setUploadingPic(true);
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await settingsApi.uploadProfilePicture(formData);
      const picUrl = response?.data?.profilePicture || response?.data?.data?.profilePicture;

      if (picUrl) {
        setProfilePicture(picUrl);
        setAdmin((prev) => ({ ...prev, profilePicture: picUrl }));
        // Update Redux and localStorage so the header shows the new picture
        updateUserProfile({ profilePicture: picUrl });
        toast.success('Profile picture updated successfully!');
      } else {
        toast.error('Failed to upload profile picture. Please try again.');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to upload profile picture.');
    } finally {
      setUploadingPic(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ── Tab: Profile ────────────────────────────────────────────────────────
  const renderProfile = () => (
    <Card className="border-slate-200 rounded-[12px] w-full">
      <CardBody className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Admin Profile</h2>
          <p className="text-sm text-slate-500">Your account information.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-2xl font-bold select-none">
                {(admin.fullName || admin.email || 'A')[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-[var(--color-primary)] text-white rounded-full p-1.5 hover:opacity-90"
              title="Change profile picture"
            >
              <FiUploadCloud className="w-3 h-3" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePictureUpload}
            disabled={uploadingPic}
            className="hidden"
          />
          <div>
            <p className="text-base font-semibold text-[var(--color-text)]">{admin.fullName || '—'}</p>
            <p className="text-sm text-slate-500">{admin.email || '—'}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Admin</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text)]">Full Name</label>
            <input readOnly value={admin.fullName || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed text-slate-500`} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text)]">Email</label>
            <input readOnly value={admin.email || ''} className={`${inputCls} bg-slate-50 cursor-not-allowed text-slate-500`} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text)]">Role</label>
            <input readOnly value="Administrator" className={`${inputCls} bg-slate-50 cursor-not-allowed text-slate-500`} />
          </div>
        </div>

        <p className="text-xs text-slate-400">To update your name or email, contact your system administrator.</p>
      </CardBody>
    </Card>
  );

  // ── Tab: Notifications ──────────────────────────────────────────────────
  const renderNotifications = () => (
    <Card className="border-slate-200 rounded-[12px] w-full">
      <CardBody className="space-y-6">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Notification Preferences</h2>
          <p className="text-sm text-slate-500">Choose how you want to be alerted about incidents.</p>
        </div>

        <div className="space-y-3">
          <div className={rowCls}>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">Email Alerts</p>
              <p className="text-xs text-slate-500">Receive incident alerts via email (SMTP required).</p>
            </div>
            <Checkbox checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
          </div>

          <div className={rowCls}>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">Critical Alerts Only</p>
              <p className="text-xs text-slate-500">Only notify for high-severity incidents.</p>
            </div>
            <Checkbox checked={criticalOnly} onChange={(e) => setCriticalOnly(e.target.checked)} />
          </div>

          <div className={rowCls}>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">Daily Digest</p>
              <p className="text-xs text-slate-500">Receive a daily summary of all incidents.</p>
            </div>
            <Checkbox checked={dailyDigest} onChange={(e) => setDailyDigest(e.target.checked)} />
          </div>

          <div className={rowCls}>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">Sound Alerts</p>
              <p className="text-xs text-slate-500">Play a sound for real-time in-app alerts.</p>
            </div>
            <Checkbox checked={soundAlerts} onChange={(e) => setSoundAlerts(e.target.checked)} />
          </div>

          <div className={rowCls}>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text)]">Browser Notifications</p>
              <p className="text-xs text-slate-500">
                Show OS-level popups even when this tab is not focused.
                {' '}
                {typeof Notification !== 'undefined' && Notification.permission === 'denied' && (
                  <span className="text-red-500">Permission blocked — allow in browser settings.</span>
                )}
              </p>
            </div>
            <Checkbox
              checked={browserNotifications}
              onChange={(e) => handleBrowserNotifToggle(e.target.checked)}
            />
          </div>
        </div>

        <div className="pt-2">
          <Button type="primary" className="px-5 flex items-center gap-2" onClick={async () => {
            try {
              await settingsApi.update({ notifications: { emailAlerts, criticalOnly, dailyDigest, soundAlerts, browserNotifications } });
              // cache for GlobalAlerts (reads localStorage to avoid Redux async lag)
              localStorage.setItem('settings_browserNotifications', String(browserNotifications));
              toast.success('Preferences saved');
            } catch (err) {
              toast.error(err?.message || 'Failed to save preferences');
            }
          }}>
            <FiSave className="w-4 h-4" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </CardBody>
    </Card>
  );

  // ── Tab: Password ───────────────────────────────────────────────────────
  const renderPassword = () => (
    <Card className="border-slate-200 rounded-[12px] w-full">
      <CardBody className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">Change Password</h2>
          <p className="text-sm text-slate-500">Update your account password.</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text)]">Current Password</label>
            <div className="relative">
              <input
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputCls}
                placeholder="Enter current password"
              />
              <button type="button" onClick={() => setShowPasswords(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                {showPasswords ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text)]">New Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} placeholder="Enter new password" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--color-text)]">Confirm New Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Re-enter new password" />
          </div>
        </div>

        <Button type="primary" className="px-5 flex items-center gap-2" onClick={async () => {
          if (!currentPassword || !newPassword) return toast.info('Please fill both current and new password');
          if (newPassword !== confirmPassword) return toast.error('New passwords do not match');
          if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
          try {
            await settingsApi.changePassword({ email: admin.email, currentPassword, newPassword });
            toast.success('Password updated successfully');
            setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
          } catch (err) {
            toast.error(err?.message || 'Failed to update password');
          }
        }}>
          <FiSave className="w-4 h-4" />
          <span>Save Password</span>
        </Button>
      </CardBody>
    </Card>
  );

  const renderContent = () => {
    if (activeTab === 'profile')       return renderProfile();
    if (activeTab === 'notifications') return renderNotifications();
    if (activeTab === 'password')      return renderPassword();
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center">
        <div className="inline-flex items-center rounded-[9px] bg-slate-100/80 p-1 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "flex items-center gap-2 px-4 h-[45px] rounded-[9px] text-sm font-medium transition-colors border",
                  isActive
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-white)]"
                    : "border-transparent text-[var(--color-text)]",
                ].join(" ")}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ width: '520px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
