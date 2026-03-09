import React, { useMemo, useState } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { Input } from "../components/ui/Input";
import { Dropdown } from "../components/ui/Dropdown";
import { Checkbox } from "../components/ui/Checkbox";
import { Button } from "../components/ui/Button";
import { FiClock, FiCopy, FiUploadCloud } from "react-icons/fi";

const baseStudents = [
  {
    key: "stu-001",
    name: "John Doe",
    rollNumber: "R001",
    studentId: "STU001",
  },
  {
    key: "stu-002",
    name: "Jane Smith",
    rollNumber: "R002",
    studentId: "STU002",
  },
  {
    key: "stu-003",
    name: "Mike Johnson",
    rollNumber: "R003",
    studentId: "STU003",
  },
  {
    key: "stu-004",
    name: "Sarah Wilson",
    rollNumber: "R004",
    studentId: "STU004",
  },
  {
    key: "stu-005",
    name: "Tom Brown",
    rollNumber: "R005",
    studentId: "STU005",
  },
];

export function CreatePaper() {
  const [paper, setPaper] = useState({
    name: "",
    subject: "",
    date: "",
    time: "",
  });
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [generatedLinks, setGeneratedLinks] = useState([]);

  const allSelected = selectedKeys.length === baseStudents.length;

  const toggleStudent = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSelectAll = () => {
    setSelectedKeys(baseStudents.map((s) => s.key));
  };

  const handleDeselectAll = () => {
    setSelectedKeys([]);
  };

  const handleReset = () => {
    setPaper({ name: "", subject: "", date: "", time: "" });
    setSelectedKeys([]);
    setGeneratedLinks([]);
  };

  const handleCreatePaper = () => {
    if (!paper.name || !paper.subject || !paper.date || !paper.time) return;
    if (!selectedKeys.length) return;

    const scheduled = `${paper.date} ${paper.time}`;
    const chosen = baseStudents.filter((s) => selectedKeys.includes(s.key));

    const links = chosen.map((s, index) => ({
      key: s.key,
      name: s.name,
      rollNumber: s.rollNumber,
      studentId: s.studentId,
      link: `https://edu-vision.exam/${encodeURIComponent(
        paper.name.replace(/\s+/g, "-").toLowerCase()
      )}/${s.studentId.toLowerCase()}`,
      scheduled,
      index: index + 1,
    }));

    setGeneratedLinks(links);
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
          <button
            type="button"
            className="max-w-xs truncate text-left text-xs text-[var(--color-primary)] hover:underline"
            onClick={() => navigator.clipboard?.writeText(link)}
          >
            {link}
          </button>
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
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
            onClick={() => navigator.clipboard?.writeText(record.link)}
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
            Paper Details
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
                options={[
                  { label: "Select a subject", value: "" },
                  { label: "Mathematics", value: "Mathematics" },
                  { label: "Physics", value: "Physics" },
                  { label: "Chemistry", value: "Chemistry" },
                  { label: "Biology", value: "Biology" },
                  { label: "English", value: "English" },
                  { label: "History", value: "History" },
                  { label: "Geography", value: "Geography" },
                  { label: "Computer Science", value: "Computer Science" },
                ]}
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
            <Button
              type="primary"
              className="mt-4"
            >
              Browse Files
            </Button>
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
            {baseStudents.map((s) => {
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
            })}
          </div>
          <p className="text-[11px] text-[var(--color-text)]">
            {selectedKeys.length} student(s) selected
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
        >
          Create Paper
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


