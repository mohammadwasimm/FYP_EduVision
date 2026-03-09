import React, { useState } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Checkbox } from "../components/ui/Checkbox";
import { Slider } from "antd";
import { FiLock, FiSliders, FiBell, FiDownload } from "react-icons/fi";

const TABS = [
  { key: "password", label: "Password", icon: FiLock },
  { key: "thresholds", label: "Thresholds", icon: FiSliders },
  { key: "notifications", label: "Notifications", icon: FiBell },
];

export function Settings() {
  const [activeTab, setActiveTab] = useState("thresholds");

  // Notification preferences state
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);

  // Thresholds state
  const [headMovement, setHeadMovement] = useState(38);
  const [eyeGaze, setEyeGaze] = useState(25);
  const [mobileConfidence, setMobileConfidence] = useState(80);

  const renderContent = () => {
    if (activeTab === "password") {
      return (
        <Card className="border-slate-200 rounded-[12px] w-full">
          <CardBody className="space-y-2">
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Password Settings
            </h2>
            <p className="text-sm text-[var(--color-text)]">
              Configure your account security and password preferences.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text)]">
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full h-[45px] rounded-[9px] border border-slate-200 bg-[var(--color-input-bg)] px-3 text-sm outline-none"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-[var(--color-text)]">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full h-[45px] rounded-[9px] border border-slate-200 bg-[var(--color-input-bg)] px-3 text-sm outline-none"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-1 md:col-span-2">
                <label className="text-xs font-medium text-[var(--color-text)]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full h-[45px] rounded-[9px] border border-slate-200 bg-[var(--color-input-bg)] px-3 text-sm outline-none"
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button type="primary" className="px-5 flex items-center gap-2">
                <FiDownload className="w-4 h-4" />
                <span>Save Password</span>
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    if (activeTab === "thresholds") {
      return (
        <Card className="border-slate-200 rounded-[12px] w-full">
          <CardBody className="space-y-6">
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Detection Thresholds
            </h2>

            {/* Head Movement */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Head Movement Sensitivity
                </p>
                <span className="text-xs font-medium text-[var(--color-text)]">
                  {headMovement}%
                </span>
              </div>
              <Slider
                value={headMovement}
                onChange={setHeadMovement}
                className="text-blue-500"
              />
              <p className="text-xs text-[var(--color-text)]">
                Alerts trigger when head movement exceeds this threshold
              </p>
            </div>

            {/* Eye Gaze */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Eye Gaze Sensitivity
                </p>
                <span className="text-xs font-medium text-[var(--color-text)]">
                  {eyeGaze}%
                </span>
              </div>
              <Slider value={eyeGaze} onChange={setEyeGaze} />
              <p className="text-xs text-[var(--color-text)]">
                Alerts trigger when eyes look away for extended periods.
              </p>
            </div>

            {/* Mobile Detection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Mobile Detection Confidence
                </p>
                <span className="text-xs font-medium text-[var(--color-text)]">
                  {mobileConfidence}%
                </span>
              </div>
              <Slider value={mobileConfidence} onChange={setMobileConfidence} />
              <p className="text-xs text-[var(--color-text)]">
                Minimum confidence level to flag mobile phone detection.
              </p>
            </div>
 
            <div className="pt-2">
              <Button type="primary" className="px-5 flex items-center gap-2">
                <FiDownload className="w-4 h-4" />
                <span>Save Thresholds</span>
              </Button>
            </div>
          </CardBody>
        </Card>
      );
    }

    // Notifications tab
    return (
      <Card className="border-slate-200 rounded-[12px] w-full">
        <CardBody className="space-y-6">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Notification Preferences
          </h2>

          <div className="space-y-3">
            {/* Each row */}
            <div className="flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Email Alerts
                </p>
                <p className="text-xs text-[var(--color-text)]">
                  Receive alerts via email.
                </p>
              </div>
              <Checkbox
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Critical Alerts Only
                </p>
                <p className="text-xs text-[var(--color-text)]">
                  Only notify for high-severity incidents.
                </p>
              </div>
              <Checkbox
                checked={criticalOnly}
                onChange={(e) => setCriticalOnly(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Daily Digest
                </p>
                <p className="text-xs text-[var(--color-text)]">
                  Receive a summary of all incidents daily.
                </p>
              </div>
              <Checkbox
                checked={dailyDigest}
                onChange={(e) => setDailyDigest(e.target.checked)}
              />
            </div>

            <div className="flex items-center justify-between rounded-[12px] bg-slate-50 px-4 py-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Sound Alerts
                </p>
                <p className="text-xs text-[var(--color-text)]">
                  Play sound for real-time alerts.
                </p>
              </div>
              <Checkbox
                checked={soundAlerts}
                onChange={(e) => setSoundAlerts(e.target.checked)}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="primary" className="px-5 flex items-center gap-2">
              <FiDownload className="w-4 h-4" />
              <span>Save Preferences</span>
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Container with consistent width for tabs and cards */}
      <div className="flex flex-col items-center">
        {/* Tabs centered on the page */}
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

        {/* Tab content - fixed width */}
        <div style={{ width: '500px' }}>
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

