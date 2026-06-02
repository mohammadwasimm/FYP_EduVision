import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { Button } from "../components/ui/Button";
import { FiUsers, FiFileText, FiMonitor, FiRefreshCw } from "react-icons/fi";
import { GoAlert } from "react-icons/go";
import { ROUTE_ENDPOINTS } from "../config/router-service/utils/endpoints";
import { dashboardApi } from "../store/apiClients/dashboardClient";

// ─── Stat Card ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, delta, iconBgClass, iconColorClass, deltaColorClass, loading }) {
  return (
    <Card className="border-slate-200">
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div className={`h-11 w-11 rounded-[8px] flex items-center justify-center ${iconBgClass} ${iconColorClass}`}>
            <Icon className="w-7 h-7" />
          </div>
          {delta ? (
            <span className={`text-xs font-semibold ${deltaColorClass || "text-emerald-500"}`}>{delta}</span>
          ) : null}
        </div>
        <div>
          <p className="text-2xl font-semibold text-[var(--color-text)]">
            {loading ? <span className="inline-block w-12 h-6 bg-slate-100 rounded animate-pulse" /> : value}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text)]">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats]           = useState(null);
  const [recentExams, setRecentExams] = useState([]);
  const [liveAlerts, setLiveAlerts]  = useState([]);
  const [loading, setLoading]        = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, exams, alerts] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getRecentExams(),
        dashboardApi.getLiveAlerts(),
      ]);
      setStats(s);
      setRecentExams(exams);
      setLiveAlerts(alerts);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Dashboard load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadAll(); }, [loadAll]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const id = setInterval(loadAll, 30_000);
    return () => clearInterval(id);
  }, [loadAll]);

  const statCards = [
    { icon: FiUsers,   label: "Total Students", value: stats?.totalStudents ?? '—', iconBgClass: "bg-blue-50",    iconColorClass: "text-blue-500",    deltaColorClass: "text-emerald-500" },
    { icon: FiFileText, label: "Total Exams",   value: stats?.activeExams   ?? '—', iconBgClass: "bg-emerald-50", iconColorClass: "text-emerald-500", deltaColorClass: "text-emerald-500" },
    { icon: FiMonitor,  label: "Live Sessions", value: stats?.liveSessions  ?? '—', iconBgClass: "bg-amber-50",   iconColorClass: "text-amber-500",   deltaColorClass: "text-emerald-500" },
    { icon: GoAlert,    label: "Alerts Today",  value: stats?.alertsToday   ?? '—', iconBgClass: "bg-rose-50",    iconColorClass: "text-rose-500",    deltaColorClass: "text-rose-500" },
  ];

  const examColumns = [
    { title: "EXAM NAME", dataIndex: "name",    key: "name",    render: t => <span className="font-medium text-[var(--color-text)]">{t}</span> },
    { title: "SUBJECT",   dataIndex: "subject", key: "subject", render: t => <span className="text-[var(--color-text)]">{t}</span> },
    { title: "STUDENTS",  dataIndex: "students",key: "students",align: "center", render: v => <span className="text-[var(--color-text)]">{v}</span> },
    { title: "DATE",      dataIndex: "date",    key: "date",    render: t => <span className="text-[var(--color-text)]">{t}</span> },
    {
      title: "STATUS", dataIndex: "status", key: "status",
      render: s => {
        const map = { Scheduled: "status-pill--scheduled", Ongoing: "status-pill--ongoing", Completed: "status-pill--completed" };
        return <span className={`status-pill ${map[s?.label] || ''}`}>{s?.label}</span>;
      },
    },
  ];

  const QUICK_ACTIONS = [
    { title: "Manage Students",  desc: "Add, edit, or remove students from the system",            icon: FiUsers,   to: ROUTE_ENDPOINTS.students,           iconBgClass: "bg-blue-50",    iconColorClass: "text-blue-500"    },
    { title: "Create New Paper", desc: "Set up a new exam with MCQs and schedule it",               icon: FiFileText,to: ROUTE_ENDPOINTS["create-paper"],    iconBgClass: "bg-emerald-50", iconColorClass: "text-emerald-500" },
    { title: "Live Monitoring",  desc: "Watch live sessions and detect suspicious activity",         icon: FiMonitor, to: ROUTE_ENDPOINTS["live-monitoring"], iconBgClass: "bg-amber-50",   iconColorClass: "text-amber-500"   },
  ];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {lastRefresh ? `Last updated ${lastRefresh.toLocaleTimeString()}` : 'Loading…'}
        </p>
        <button onClick={loadAll} className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
          <FiRefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map(c => (
          <StatCard key={c.label} {...c} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent Exams table */}
        <Card className="xl:col-span-2 border-slate-200">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Recent Exams</h2>
              <Button type="link" className="text-[var(--color-primary)] font-medium" onClick={() => navigate(ROUTE_ENDPOINTS["live-monitoring"])}>
                View all
              </Button>
            </div>
            {loading && recentExams.length === 0 ? (
              <div className="space-y-3">{[...Array(4)].map((_,i) => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)}</div>
            ) : (
              <DataTable columns={examColumns} dataSource={recentExams} />
            )}
          </CardBody>
        </Card>

        {/* Live Alerts */}
        <Card className="border-slate-200">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">Live Alerts</h2>
              <Button type="link" className="text-[var(--color-primary)] font-medium" onClick={() => navigate(ROUTE_ENDPOINTS["live-monitoring"])}>
                Monitor
              </Button>
            </div>

            {loading && liveAlerts.length === 0 ? (
              <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-16 bg-slate-50 rounded animate-pulse" />)}</div>
            ) : liveAlerts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No alerts today</p>
            ) : (
              <div className="space-y-3">
                {liveAlerts.map((a, i) => (
                  <div key={i} className={`rounded-[8px] border px-4 py-3 ${a.tone === 'danger' ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">{a.name}</p>
                        <p className="text-[11px] text-[var(--color-text)]">{a.room}</p>
                      </div>
                      <span className={`inline-flex items-center justify-center px-3 h-[27px] rounded-[3px] text-[11px] font-medium ${a.tone === 'danger' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {a.tag}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--color-text)]">{a.ago}</p>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {QUICK_ACTIONS.map(c => (
          <Card key={c.title} className="border-slate-200 rounded-3xl shadow-[0_8px_24px_rgba(15,23,42,0.04)] cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]" onClick={() => navigate(c.to)}>
            <CardBody className="flex flex-col items-start gap-3 py-6">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${c.iconBgClass} ${c.iconColorClass}`}>
                <c.icon className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-text)]">{c.title}</p>
              <p className="text-xs text-[var(--color-text)]">{c.desc}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
