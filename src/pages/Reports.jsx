import { useMemo, useState, useEffect } from "react";
import { DatePicker } from "antd";
import { toast } from '../utils/react-toastify-shim';
import { Search } from "../components/ui/Search";
import { Dropdown } from "../components/ui/Dropdown";
import { Button } from "../components/ui/Button";
import { Card, CardBody } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { FiDownload, FiEye, FiAlertTriangle, FiBarChart2, FiActivity } from "react-icons/fi";
import { IncidentEvidenceModal } from "../components/reports/IncidentEvidenceModal";
import { useSelector } from 'react-redux';
import { fetchReports, fetchReportsStats } from './reports/stores/actions';
import { ReportsQueries } from '../store/serviceQueries/reportsQueries';
import { examsApi } from '../store/apiClients/examsClient';


// Seed options shown before API data loads
const EXAM_OPTIONS_DEFAULT    = [{ label: "All Exams",    value: "all" }];
const SUBJECT_OPTIONS_DEFAULT = [{ label: "All Subjects", value: "all" }];

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
  const [examOptions, setExamOptions] = useState(EXAM_OPTIONS_DEFAULT);
  const [subjectOptions, setSubjectOptions] = useState(SUBJECT_OPTIONS_DEFAULT);
  const [examMap, setExamMap] = useState({});
  const [dateFilter, setDateFilter] = useState(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);

  const reportsState = useSelector((s) => s.reports);
  const incidents = reportsState?.list?.data || [];
  const stats = reportsState?.stats?.data || { total: incidents.length, high: 0, medium: 0, low: 0 };

  // fetch incidents and stats (debounced 400ms to avoid firing on every keystroke)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const q = search?.trim();
      const params = {};
      if (q) params.search = q;
      if (examFilter && examFilter !== 'all') params.exam = examFilter;
      if (subjectFilter && subjectFilter !== 'all') params.subject = subjectFilter;
      if (dateFilter) params.date = dateFilter.format && dateFilter.format('YYYY-MM-DD');
      fetchReports(params).catch(() => {});
      fetchReportsStats().catch(() => {});
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, examFilter, subjectFilter, dateFilter]);

  // fetch exams and subjects dynamically on mount
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const resp = await examsApi.getPapers();
        const papers = (resp && resp.data) ? resp.data : [];
        if (!mounted) return;
  // only include exams where at least one student has taken the paper
  const papersWithTaken = papers.filter(p => Array.isArray(p.instances) && p.instances.some(inst => inst.status === 'completed' || (Array.isArray(inst.answers) && inst.answers.length > 0)));

  const exams = [{ label: 'All Exams', value: 'all' }, ...papersWithTaken.map(p => ({ label: p.title || p.id, value: p.id }))];
  setExamOptions(exams);
  // build exam map id -> { title, subject } using all papers (for display resolution)
  const map = {};
  papers.forEach(p => { map[p.id] = { title: p.title, subject: p.subject }; });
  setExamMap(map);

  // derive subjects from the filtered papers (only subjects where students took the paper)
  const subjects = new Set();
  papersWithTaken.forEach(p => { if (p.subject) subjects.add(p.subject); });
  const subjOptions = [{ label: 'All Subjects', value: 'all' }, ...Array.from(subjects).map(s => ({ label: s, value: s }))];
  setSubjectOptions(subjOptions);
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  // Polling: re-fetch reports and stats every 15 seconds
  useEffect(() => {
    const id = setInterval(() => {
      const params = {};
      if (search?.trim()) params.search = search.trim();
      if (examFilter && examFilter !== 'all') params.exam = examFilter;
      if (subjectFilter && subjectFilter !== 'all') params.subject = subjectFilter;
      if (dateFilter) params.date = dateFilter.format && dateFilter.format('YYYY-MM-DD');
      fetchReports(params).catch(() => {});
      fetchReportsStats().catch(() => {});
    }, 15000);
    return () => clearInterval(id);
  }, [search, examFilter, subjectFilter, dateFilter]);

  const handleExportCsv = async () => {
    try {
  toast.info('Preparing CSV...');
      const q = search?.trim();
      const params = {};
      if (q) params.search = q;
      if (examFilter && examFilter !== 'all') params.exam = examFilter;
      if (subjectFilter && subjectFilter !== 'all') params.subject = subjectFilter;
      if (dateFilter) params.date = dateFilter.format && dateFilter.format('YYYY-MM-DD');

  const blob = await ReportsQueries.exportCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'incidents.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
  toast.success('CSV download started');
    } catch (_err) {
  toast.error('Failed to export CSV');
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch =
        !search.trim() ||
        (inc.studentName || '').toLowerCase().includes(search.trim().toLowerCase()) ||
        (inc.rollNumber || '').toLowerCase().includes(search.trim().toLowerCase());

  const matchesExam = examFilter === "all" || inc.exam === examFilter;
  // resolve subject: prefer incident.subject, otherwise look up from examMap
  const incidentSubject = inc.subject || (inc.exam && examMap[inc.exam] && examMap[inc.exam].subject) || null;
  const matchesSubject = subjectFilter === "all" || incidentSubject === subjectFilter;
      const matchesDate = !dateFilter ? true : inc.date === dateFilter.format("YYYY-MM-DD");

      return matchesSearch && matchesExam && matchesSubject && matchesDate;
    });
  }, [incidents, search, examFilter, subjectFilter, dateFilter]);

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
          <p className="text-sm font-medium text-[var(--color-text)]">
            { (examMap && examMap[record.exam] && examMap[record.exam].title) || record.exam }
          </p>
          <p className="text-xs text-[var(--color-text)]">
            { record.subject || (examMap && examMap[record.exam] && examMap[record.exam].subject) || '' }
          </p>
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
              options={examOptions}
              value={examFilter}
              onChange={setExamFilter}
            />
          </div>
          <div className="w-[220px]">
            <Dropdown
              options={subjectOptions}
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
          <div className="flex items-center gap-2">
            <Button
              type="primary"
              className="flex items-center gap-2 px-4"
              onClick={handleExportCsv}
            >
              <FiDownload className="w-4 h-4" />
              <span className="text-sm">Export CSV</span>
            </Button>
          </div>
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

