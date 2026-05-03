import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardBody } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { Input } from "../components/ui/Input";
import { Dropdown } from "../components/ui/Dropdown";
import { Checkbox } from "../components/ui/Checkbox";
import { Button } from "../components/ui/Button";
import { FiClock, FiCopy, FiUploadCloud, FiExternalLink } from "react-icons/fi";
import { Pagination } from 'antd';
import { toast } from '../utils/react-toastify-shim';
import { ROUTE_ENDPOINTS } from "../config/router-service/utils/endpoints";
import { dashboardApi } from '../store/apiClients/dashboardClient';

import { fetchStudents } from "./students/stores/actions";
import { examsApi } from '../store/apiClients/examsClient';

/** Converts a raw DB exam link into the real URL a student can open in their browser */
function toStudentUrl(rawLink) {
  const base = window.location.origin; // e.g. http://localhost:3000
  return `${base}/student-enroll?examLink=${encodeURIComponent(rawLink)}`;
}

export function CreatePaper() {
  const navigate = useNavigate();
  const [paper, setPaper] = useState({
    name: "",
    subject: "",
    date: "",
    time: "",
  });
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [selectedStudentsMap, setSelectedStudentsMap] = useState({});
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [selectedCsvFile, setSelectedCsvFile] = useState(null);
  const [csvText, setCsvText] = useState("");
  const [creatingPaper, setCreatingPaper] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const fileInputRef = useRef(null);

  // Default subjects shown when the API has no data yet
  const DEFAULT_SUBJECTS = ['Mathematics','Physics','Chemistry','Biology','English','History','Geography','Computer Science'];

  // Load subjects from DB on mount
  useEffect(() => {
    dashboardApi.getSubjects()
      .then(apiSubjects => {
        // Merge API subjects with defaults, deduplicate, sort
        const merged = Array.from(new Set([...apiSubjects, ...DEFAULT_SUBJECTS])).sort();
        setSubjectOptions([{ label: 'Select a subject', value: '' }, ...merged.map(s => ({ label: s, value: s }))]);
      })
      .catch(() => {
        setSubjectOptions([{ label: 'Select a subject', value: '' }, ...DEFAULT_SUBJECTS.map(s => ({ label: s, value: s }))]);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingStudents(true);
        const resp = await fetchStudents({ page, limit });
        const list = resp && resp.data ? resp.data : (Array.isArray(resp) ? resp : []);
        if (!mounted) return;
        setStudents(
          list.map((s) => ({
            key: s.id || s.key,
            name: s.name,
            rollNumber: s.rollNumber || s['roll-number'] || '',
            studentId: s.studentId || s['student-id'] || s.id || '',
          }))
        );
  setTotal(resp?.pagination?.totalRecords ?? resp?.pagination?.total ?? resp?.meta?.totalRecords ?? resp?.meta?.total ?? 0);
      } catch (e) {
        if (mounted) setStudents([]);
      } finally {
        if (mounted) setLoadingStudents(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [page, limit]);

  const allSelected = students.length > 0 && students.every((s) => selectedKeys.includes(s.key));

  const toggleStudent = (key) => {
    setSelectedKeys((prev) => {
      const exists = prev.includes(key);
      if (exists) {
        setSelectedStudentsMap((old) => {
          const next = { ...old };
          delete next[key];
          return next;
        });
        return prev.filter((k) => k !== key);
      }

      const student = students.find((s) => s.key === key);
      if (student) {
        setSelectedStudentsMap((old) => ({ ...old, [key]: student }));
      }
      return [...prev, key];
    });
  };

  const handleSelectAll = () => {
    setSelectedKeys((prev) => {
      const currentPageKeys = students.map((s) => s.key);
      const merged = Array.from(new Set([...prev, ...currentPageKeys]));
      return merged;
    });
    setSelectedStudentsMap((old) => {
      const next = { ...old };
      students.forEach((s) => {
        next[s.key] = s;
      });
      return next;
    });
  };

  const handleDeselectAll = () => {
    const currentPageKeys = new Set(students.map((s) => s.key));
    setSelectedKeys((prev) => prev.filter((k) => !currentPageKeys.has(k)));
    setSelectedStudentsMap((old) => {
      const next = { ...old };
      currentPageKeys.forEach((k) => {
        delete next[k];
      });
      return next;
    });
  };

  const handleReset = () => {
    setPaper({ name: "", subject: "", date: "", time: "" });
    setSelectedKeys([]);
    setSelectedStudentsMap({});
    setGeneratedLinks([]);
    setSelectedCsvFile(null);
    setCsvText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleBrowseCsv = () => {
    fileInputRef.current?.click();
  };

  const handleCsvFileChange = async (event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file only.');
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      if (!text.trim()) {
        toast.error('Selected CSV file is empty.');
        event.target.value = '';
        return;
      }
      setSelectedCsvFile(file);
      setCsvText(text);
      toast.success('CSV file selected successfully.');
    } catch (error) {
      toast.error('Failed to read CSV file.');
      event.target.value = '';
    }
  };

  const handleCreatePaper = async () => {
    if (!paper.name || !paper.subject || !paper.date || !paper.time) {
      toast.error('Please fill all required paper details.');
      return;
    }
    if (!selectedKeys.length) {
      toast.error('Please select at least one student.');
      return;
    }
    if (!csvText.trim()) {
      toast.error('Please upload MCQs CSV file first.');
      return;
    }

    const scheduled = `${paper.date} ${paper.time}`;
    const scheduledAt = new Date(`${paper.date}T${paper.time}:00`).toISOString();

    try {
      setCreatingPaper(true);
      const createResponse = await examsApi.createPaper({
        title: paper.name,
        subject: paper.subject,
        scheduledAt,
        studentIds: selectedKeys,
      });

      const createPayload = createResponse?.data || {};
      const exam = createPayload?.exam;
      const instances = Array.isArray(createPayload?.instances) ? createPayload.instances : [];

      if (!exam?.id) {
        throw new Error('Paper creation failed. Invalid response from server.');
      }

      const importResponse = await examsApi.importExamQuestions(exam.id, csvText);
      const importedQuestions = importResponse?.data?.data || [];
      const importErrors = importResponse?.data?.errors || [];

      const links = instances.map((inst, index) => {
        const selectedStudent = selectedStudentsMap[inst.studentId];
        return {
          key: inst.id || inst.studentId,
          name: selectedStudent?.name || inst.studentId,
          rollNumber: selectedStudent?.rollNumber || '-',
          studentId: selectedStudent?.studentId || inst.studentId,
          rawLink: inst.link,                // internal identifier stored in DB
          link: toStudentUrl(inst.link),     // real clickable URL for students
          scheduled,
          index: index + 1,
        };
      });

      setGeneratedLinks(links);
      
      toast.success(`Paper created. ${importedQuestions.length} questions imported.`);
      if (importErrors.length) {
        toast.info(`${importErrors.length} question rows failed to import. Check server logs for details.`);
      }
      
      handleReset();
      navigate(ROUTE_ENDPOINTS["generated-paper"]);
    } catch (error) {
      const message = error?.message || 'Failed to create paper. Please try again.';
      toast.error(message);
    } finally {
      setCreatingPaper(false);
    }
  };

  const generatedColumns = useMemo(
    () => [
      {
        title: "STUDENT NAME",
        dataIndex: "name",
        key: "name",
        render: (text) => (
          <span className="text-sm font-medium text-[var(--color-text)]">{text}</span>
        ),
      },
      {
        title: "ROLL NUMBER",
        dataIndex: "rollNumber",
        key: "rollNumber",
  render: (text) => <span className="text-[var(--color-text)]">{text}</span>,
      },
      {
        title: "STUDENT ID",
        dataIndex: "studentId",
        key: "studentId",
        render: (value) => (
          <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
            {value}
          </span>
        ),
      },
      {
        title: "EXAM LINK",
        dataIndex: "link",
        key: "link",
        render: (link) => (
          <div className="flex items-center gap-2 max-w-xs">
            <span className="truncate text-xs text-slate-500 flex-1">{link}</span>
            <button
              type="button"
              title="Open student exam page in new tab"
              className="shrink-0 text-[var(--color-primary)] hover:underline"
              onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
            >
              <FiExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
      {
        title: "SCHEDULED",
        dataIndex: "scheduled",
        key: "scheduled",
        render: (text) => (
          <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text)]">
            <FiClock className="w-3 h-3" />
            {text}
          </span>
        ),
      },
      {
        title: "COPY",
        key: "copy",
        align: "center",
        render: (_, record) => (
          <button
            type="button"
            title="Copy student exam link"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            onClick={() => {
              navigator.clipboard?.writeText(record.link);
              toast.success('Link copied!');
            }}
          >
            <FiCopy className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      {/* Paper details */}
      <Card className="border-slate-200">
        <CardBody className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Create New Paper
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Paper Name *"
              placeholder="e.g., Mathematics Final Exam"
              value={paper.name}
              onChange={(e) =>
                setPaper((p) => ({ ...p, name: e.target.value }))
              }
            />
            <div className="space-y-1">
              <Dropdown
                label="Subject *"
                className="mb-0"
                options={subjectOptions.length > 1 ? subjectOptions : [{ label: 'Loading subjects…', value: '' }]}
                value={paper.subject}
                onChange={(value) =>
                  setPaper((p) => ({ ...p, subject: value }))
                }
              />
            </div>
            <Input
              label="Scheduled Date *"
              type="date"
              value={paper.date}
              onChange={(e) =>
                setPaper((p) => ({ ...p, date: e.target.value }))
              }
            />
            <Input
              label="Scheduled Time *"
              type="time"
              value={paper.time}
              onChange={(e) =>
                setPaper((p) => ({ ...p, time: e.target.value }))
              }
            />
          </div>
        </CardBody>
      </Card>

      {/* Upload section */}
      <Card className="border-slate-200">
        <CardBody className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Upload Paper (MCQs)
          </h2>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <FiUploadCloud className="w-6 h-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--color-text)]">
              Upload your MCQs CSV file
            </p>
            <p className="mt-1 text-xs text-[var(--color-text)]">
              Format: Question, Option A, Option B, Option C, Option D, Correct
              Answer
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleCsvFileChange}
            />
            <Button
              type="primary"
              className="mt-4"
              onClick={handleBrowseCsv}
            >
              Browse Files
            </Button>
            {selectedCsvFile ? (
              <p className="mt-2 text-xs text-[var(--color-text)]">Selected: {selectedCsvFile.name}</p>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {/* Select students */}
      <Card className="border-slate-200">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Select Students *
            </h2>
            <button
              type="button"
              className="text-xs font-medium text-[var(--color-primary)] hover:text-[var(--color-primary)]"
              onClick={allSelected ? handleDeselectAll : handleSelectAll}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {loadingStudents ? (
              <div className="col-span-3 text-center py-8">Loading students...</div>
            ) : (
              students.map((s) => {
              const checked = selectedKeys.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleStudent(s.key)}
                  className={[
                    "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition cursor-pointer",
                    checked
                      ? "border-[var(--color-primary)] bg-[var(--color-primary-50)]"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <Checkbox
                    checked={checked}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleStudent(s.key);
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-[var(--color-text)]">{s.rollNumber}</p>
                  </div>
                </button>
              );
              })
            )}
          </div>
          <div className="flex items-center justify-end mt-3">
            <Pagination
              current={page}
              pageSize={limit}
              total={total}
              showSizeChanger
              pageSizeOptions={[10,20,50]}
              onChange={(p, ps) => { setPage(p); setLimit(ps); }}
            />
          </div>
          <p className="text-[11px] text-[var(--color-text)]">
            {Object.keys(selectedStudentsMap).length} student(s) selected
          </p>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <Button
          mode="outline-primary"
          className="w-full md:w-40"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          type="primary"
          className="w-full md:w-40"
          onClick={handleCreatePaper}
          disabled={creatingPaper}
        >
          {creatingPaper ? 'Creating...' : 'Create Paper'}
        </Button>
      </div>

      {/* Generated exam links */}
      {generatedLinks.length > 0 && (
        <Card className="border-slate-200">
          <CardBody className="space-y-4">
              <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Generated Exam Links
            </h2>
            <DataTable
              columns={generatedColumns}
              dataSource={generatedLinks}
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}


