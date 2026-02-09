import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { DataTable } from "../components/ui/DataTable";
import { Button } from "../components/ui/Button";
import { FiUsers, FiFileText, FiMonitor } from "react-icons/fi";
import { GoAlert } from "react-icons/go";
import { ROUTE_ENDPOINTS } from "../config/router-service/utils/endpoints";

function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  iconBgClass,
  iconColorClass,
  deltaColorClass,
}) {
  return (
    <Card className="border-slate-200">
      <CardBody className="space-y-4">
        <div className="flex items-start justify-between">
          <div
            className={`h-11 w-11 rounded-2xl flex items-center justify-center ${iconBgClass} ${iconColorClass}`}
          >
            <Icon className="w-5 h-5" />
          </div>
          {delta ? (
            <span
              className={`text-xs font-semibold ${deltaColorClass || "text-emerald-500"}`}
            >
              {delta}
            </span>
          ) : null}
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
          <p className="mt-1 text-xs text-slate-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={FiUsers}
          label="Total Students"
          value="1,247"
          delta="+12%"
          iconBgClass="bg-blue-50"
          iconColorClass="text-blue-500"
          deltaColorClass="text-emerald-500"
        />
        <StatCard
          icon={FiFileText}
          label="Active Exams"
          value="8"
          delta="+3"
          iconBgClass="bg-emerald-50"
          iconColorClass="text-emerald-500"
          deltaColorClass="text-emerald-500"
        />
        <StatCard
          icon={FiMonitor}
          label="Live Sessions"
          value="45"
          delta="Now"
          iconBgClass="bg-amber-50"
          iconColorClass="text-amber-500"
          deltaColorClass="text-emerald-500"
        />
        <StatCard
          icon={GoAlert}
          label="Alerts Today"
          value="23"
          delta="-5%"
          iconBgClass="bg-rose-50"
          iconColorClass="text-rose-500"
          deltaColorClass="text-rose-500"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border-slate-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Recent Exams
              </h2>
              <Button
                type="link"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-0"
                onClick={() => navigate(ROUTE_ENDPOINTS["live-monitoring"])}
              >
                View all
              </Button>
            </div>

            <div className="mt-4">
              <DataTable
                columns={[
                  {
                    title: "EXAM NAME",
                    dataIndex: "name",
                    key: "name",
                    render: (text) => (
                      <span className="font-medium text-slate-900">{text}</span>
                    ),
                  },
                  {
                    title: "SUBJECT",
                    dataIndex: "subject",
                    key: "subject",
                    render: (text) => (
                      <span className="text-slate-600">{text}</span>
                    ),
                  },
                  {
                    title: "STUDENTS",
                    dataIndex: "students",
                    key: "students",
                    align: "center",
                    render: (value) => (
                      <span className="text-slate-600">{value}</span>
                    ),
                  },
                  {
                    title: "DATE",
                    dataIndex: "date",
                    key: "date",
                    render: (text) => (
                      <span className="text-slate-600">{text}</span>
                    ),
                  },
                  {
                    title: "STATUS",
                    dataIndex: "status",
                    key: "status",
                    render: (status) => (
                      <Badge
                        tone={status.tone}
                        className="bg-slate-50 text-slate-600 ring-slate-200"
                      >
                        {status.label}
                      </Badge>
                    ),
                  },
                ]}
                dataSource={[
                  {
                    key: "math-final",
                    name: "Mathematics Final",
                    subject: "Mathematics",
                    students: 156,
                    date: "Jan 3, 2026",
                    status: { label: "Ongoing", tone: "success" },
                  },
                  {
                    key: "physics-midterm",
                    name: "Physics Midterm",
                    subject: "Physics",
                    students: 89,
                    date: "Jan 3, 2026",
                    status: { label: "Scheduled", tone: "warning" },
                  },
                  {
                    key: "chem-quiz",
                    name: "Chemistry Quiz",
                    subject: "Chemistry",
                    students: 234,
                    date: "Jan 2, 2026",
                    status: { label: "Completed", tone: "default" },
                  },
                  {
                    key: "bio-test",
                    name: "Biology Test",
                    subject: "Biology",
                    students: 178,
                    date: "Jan 2, 2026",
                    status: { label: "Completed", tone: "default" },
                  },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        <Card className="border-slate-200">
          <CardBody>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                Live Alerts
              </h2>
              <Button
                type="link"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 px-0"
                onClick={() => navigate(ROUTE_ENDPOINTS["live-monitoring"])}
              >
                Monitor
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  name: "John Doe",
                  room: "R001",
                  ago: "2 min ago",
                  tag: "Mobile Detected",
                  tone: "danger",
                },
                {
                  name: "Jane Smith",
                  room: "R002",
                  ago: "5 min ago",
                  tag: "Head Movement",
                  tone: "warning",
                },
                {
                  name: "Mike Johnson",
                  room: "R003",
                  ago: "8 min ago",
                  tag: "Eye Gaze",
                  tone: "warning",
                },
                {
                  name: "Sarah Wilson",
                  room: "R004",
                  ago: "12 min ago",
                  tag: "Tab Switch",
                  tone: "warning",
                },
              ].map((a) => (
                <div
                  key={`${a.name}-${a.room}`}
                  className={[
                    "rounded-2xl border px-4 py-3",
                    a.tone === "danger"
                      ? "border-rose-200 bg-rose-50"
                      : "border-amber-200 bg-amber-50",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {a.name}
                      </p>
                      <p className="text-[11px] text-slate-500">{a.room}</p>
                    </div>
                    <Badge
                      tone={a.tone === "danger" ? "danger" : "warning"}
                      className={
                        a.tone === "danger"
                          ? "bg-rose-100 text-rose-700 ring-rose-200"
                          : "bg-amber-100 text-amber-700 ring-amber-200"
                      }
                    >
                      {a.tag}
                    </Badge>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">{a.ago}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            title: "Manage Students",
            desc: "Add, edit, or remove students from the system",
            icon: FiUsers,
            to: ROUTE_ENDPOINTS.students,
          },
          {
            title: "Create New Paper",
            desc: "Set up a new exam with MCQs and schedule it",
            icon: FiFileText,
            to: ROUTE_ENDPOINTS["create-paper"],
          },
          {
            title: "Live Monitoring",
            desc: "Watch live sessions and detect suspicious activity",
            icon: FiMonitor,
            to: ROUTE_ENDPOINTS["live-monitoring"],
          },
        ].map((c) => (
          <Card
            key={c.title}
            className="border-slate-200 rounded-3xl shadow-[0_8px_24px_rgba(15,23,42,0.04)] cursor-pointer transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)]"
            onClick={() => navigate(c.to)}
          >
            <CardBody className="flex flex-col items-start gap-3 py-6">
              {/* Row 1: icon */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                <c.icon className="w-5 h-5" />
              </div>

              {/* Row 2: title */}
              <p className="text-sm font-semibold text-slate-900">
                {c.title}
              </p>

              {/* Row 3: description */}
              <p className="text-xs text-slate-500">{c.desc}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

