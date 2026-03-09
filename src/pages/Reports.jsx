import React, { useMemo, useState } from "react";
import { DatePicker } from "antd";
import { Search } from "../components/ui/Search";
import { Dropdown } from "../components/ui/Dropdown";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { FiDownload, FiEye, FiAlertTriangle, FiBarChart2, FiActivity } from "react-icons/fi";
import { IncidentEvidenceModal } from "../components/reports/IncidentEvidenceModal";

const INCIDENTS = [
  {
    id: "inc-1",
    studentName: "John Doe",
    rollNumber: "R001",
    exam: "Mathematics Final",
    subject: "Mathematics",
    cheatingType: "Mobile Phone Detected",
    timestamp: "Jan 3, 2026 10:23 AM",
    date: "2026-01-03",
    severity: "high",
    evidenceFile: "screenshot_001.jpg",
  },
  {
    id: "inc-2",
    studentName: "Jane Smith",
    rollNumber: "R002",
    exam: "Mathematics Final",
    subject: "Mathematics",
    cheatingType: "Excessive Head Movement",
    timestamp: "Jan 3, 2026 10:45 AM",
    date: "2026-01-03",
    severity: "medium",
    evidenceFile: "screenshot_002.jpg",
  },
  {
    id: "inc-3",
    studentName: "Mike Johnson",
    rollNumber: "R003",
    exam: "Physics Midterm",
    subject: "Physics",
    cheatingType: "Looking Away",
    timestamp: "Jan 2, 2026 2:12 PM",
    date: "2026-01-02",
    severity: "low",
    evidenceFile: "screenshot_003.jpg",
  },
  {
    id: "inc-4",
    studentName: "Chris Lee",
    rollNumber: "R007",
    exam: "Mathematics Final",
    subject: "Mathematics",
    cheatingType: "Multiple Persons Detected",
    timestamp: "Jan 3, 2026 11:05 AM",
    date: "2026-01-03",
    severity: "high",
    evidenceFile: "screenshot_004.jpg",
  },
  {
    id: "inc-5",
    studentName: "Sarah Wilson",
    rollNumber: "R004",
    exam: "Physics Midterm",
    subject: "Physics",
    cheatingType: "Tab Switching",
    timestamp: "Jan 2, 2026 2:30 PM",
    date: "2026-01-02",
    severity: "medium",
    evidenceFile: "screenshot_005.jpg",
  },
];

export const EXAM_OPTIONS = [
  { label: "All Exams", value: "all" },
  { label: "Mathematics Final", value: "Mathematics Final" },
  { label: "Physics Midterm", value: "Physics Midterm" },
  { label: "Chemistry Quiz", value: "Chemistry Quiz" },
];

export const SUBJECT_OPTIONS = [
  { label: "All Subjects", value: "all" },
  { label: "Mathematics", value: "Mathematics" },
  { label: "Physics", value: "Physics" },
  { label: "Chemistry", value: "Chemistry" },
  { label: "Biology", value: "Biology" },
];

export function getSeverityTone(severity) {
  switch (severity) {
    case "high":
      return {
        label: "High",
        className:
          "bg-rose-50 text-rose-500 text-[11px] px-3 py-1 font-medium",
      };
    case "medium":
      return {
        label: "Medium",
        className:
          "bg-amber-50 text-amber-500 text-[11px] px-3 py-1 font-medium",
      };
    default:
      return {
        label: "Low",
        className:
          "bg-slate-100 text-slate-500 text-[11px] px-3 py-1 font-medium",
      };
  }
}

export function Reports() {
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const filteredIncidents = useMemo(() => {
    return INCIDENTS.filter((inc) => {
      const matchesSearch =
        !search.trim() ||
        inc.studentName.toLowerCase().includes(search.trim().toLowerCase()) ||
        inc.rollNumber.toLowerCase().includes(search.trim().toLowerCase());

      const matchesExam =
        examFilter === "all" || inc.exam === examFilter;

      const matchesSubject =
        subjectFilter === "all" || inc.subject === subjectFilter;

      const matchesDate = !dateFilter
        ? true
        : inc.date === dateFilter.format("YYYY-MM-DD");

      return matchesSearch && matchesExam && matchesSubject && matchesDate;
    });
  }, [search, examFilter, subjectFilter, dateFilter]);

  const stats = useMemo(() => {
    const total = INCIDENTS.length;
    const high = INCIDENTS.filter((i) => i.severity === "high").length;
    const medium = INCIDENTS.filter((i) => i.severity === "medium").length;
    return { total, high, medium };
  }, []);

  const columns = [
    {
      title: "STUDENT",
      dataIndex: "studentName",
      key: "student",
      render: (_text, record) => (
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">
            {record.studentName}
          </p>
          <p className="text-xs text-[var(--color-text)]">{record.rollNumber}</p>
        </div>
      ),
    },
    {
      title: "EXAM / SUBJECT",
      dataIndex: "exam",
      key: "exam",
      render: (_text, record) => (
        <div>
          <p className="text-sm font-medium text-[var(--color-text)]">{record.exam}</p>
          <p className="text-xs text-[var(--color-text)]">{record.subject}</p>
        </div>
      ),
    },
    {
      title: "CHEATING TYPE",
      dataIndex: "cheatingType",
      key: "cheatingType",
      render: (text) => (
  <span className="text-sm text-[var(--color-text)]">{text}</span>
      ),
    },
    {
      title: "TIMESTAMP",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (text) => (
  <span className="text-sm text-[var(--color-text)]">{text}</span>
      ),
    },
    {
      title: "SEVERITY",
      dataIndex: "severity",
      key: "severity",
      render: (severity) => {
        const tone = getSeverityTone(severity);
        return <span className={tone.className}>{tone.label}</span>;
      },
    },
    {
      title: "EVIDENCE",
      key: "evidence",
      render: (_text, record) => (
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]"
          onClick={() => {
            setSelectedIncident(record);
            setIsEvidenceOpen(true);
          }}
        >
          <FiEye className="w-3 h-3 text-[var(--color-primary)]" />
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Filters Row */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-wrap gap-3 items-center">
          <Search
            placeholder="Search student..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="w-[220px]">
            <Dropdown
              options={EXAM_OPTIONS}
              value={examFilter}
              onChange={setExamFilter}
            />
          </div>
          <div className="w-[220px]">
            <Dropdown
              options={SUBJECT_OPTIONS}
              value={subjectFilter}
              onChange={setSubjectFilter}
            />
          </div>
          <div className="w-[200px]">
            <DatePicker
              className="w-full custom-date-picker"
              placeholder="mm/dd/yyyy"
              value={dateFilter}
              onChange={setDateFilter}
              allowClear
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="primary"
            className="flex items-center gap-2 px-4"
          >
            <FiDownload className="w-4 h-4" />
            <span className="text-sm">Export CSV</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards – compact stats style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Incidents */}
        <Card className="border-slate-200 rounded-[9px]">
          <CardBody className="py-4">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-[8px] border border-emerald-200 bg-emerald-50 flex items-center justify-center text-emerald-500">
                <FiActivity className="w-5 h-5" />
              </div>
              {/* Optional delta, kept subtle */}
              <span className="text-[11px] font-medium text-rose-500">
                -12.5%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-[var(--color-text)]">
                {stats.total}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text)]">Total Incidents</p>
            </div>
          </CardBody>
        </Card>

        {/* High Severity */}
        <Card className="border-slate-200 rounded-[9px]">
          <CardBody className="py-4">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-[8px] border border-rose-200 bg-rose-50 flex items-center justify-center text-rose-500">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-rose-500">
                -8.3%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-rose-500">
                {stats.high}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text)]">High Severity</p>
            </div>
          </CardBody>
        </Card>

        {/* Medium Severity */}
        <Card className="border-slate-200 rounded-[9px]">
          <CardBody className="py-4">
            <div className="flex items-start justify-between">
              <div className="h-9 w-9 rounded-[8px] border border-amber-200 bg-amber-50 flex items-center justify-center text-amber-500">
                <FiBarChart2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium text-amber-500">
                +3.0%
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-semibold text-amber-500">
                {stats.medium}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text)]">Medium Severity</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Incident Reports Table */}
      <div>
       
        <DataTable columns={columns} dataSource={filteredIncidents} />
      </div>

      {/* Evidence Modal */}
      <IncidentEvidenceModal
        incident={selectedIncident}
        open={isEvidenceOpen}
        onClose={() => setIsEvidenceOpen(false)}
      />
    </div>
  );
}

