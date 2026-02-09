import React, { useMemo, useState } from "react";
import { Card, CardBody } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
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
          <span className="text-sm font-medium text-slate-900">{text}</span>
        ),
      },
      {
        title: "ROLL NUMBER",
        dataIndex: "rollNumber",
        key: "rollNumber",
        render: (text) => <span className="text-slate-600">{text}</span>,
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
            className="max-w-xs truncate text-left text-xs text-blue-600 hover:underline"
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
          <span className="inline-flex items-center gap-1 text-xs text-slate-600">
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
          <h2 className="text-sm font-semibold text-slate-900">
            Paper Details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Paper Name *
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                placeholder="e.g., Mathematics Final Exam"
                value={paper.name}
                onChange={(e) =>
                  setPaper((p) => ({ ...p, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Subject *
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={paper.subject}
                onChange={(e) =>
                  setPaper((p) => ({ ...p, subject: e.target.value }))
                }
              >
                <option value="">Select a subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="English">English</option>
                <option value="History">History</option>
                <option value="Geography">Geography</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Scheduled Date *
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={paper.date}
                onChange={(e) =>
                  setPaper((p) => ({ ...p, date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Scheduled Time *
              </label>
              <input
                type="time"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                value={paper.time}
                onChange={(e) =>
                  setPaper((p) => ({ ...p, time: e.target.value }))
                }
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Upload section */}
      <Card className="border-slate-200">
        <CardBody className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Upload Paper (MCQs)
          </h2>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
              <FiUploadCloud className="w-6 h-6" />
            </div>
            <p className="mt-3 text-sm font-medium text-slate-900">
              Upload your MCQs CSV file
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Format: Question, Option A, Option B, Option C, Option D, Correct
              Answer
            </p>
            <button
              type="button"
              className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
            >
              Browse Files
            </button>
          </div>
        </CardBody>
      </Card>

      {/* Select students */}
      <Card className="border-slate-200">
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">
              Select Students *
            </h2>
            <button
              type="button"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
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
                    "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                    checked
                      ? "border-blue-500 bg-blue-50/60"
                      : "border-slate-200 bg-white hover:bg-slate-50",
                  ].join(" ")}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-slate-500">{s.rollNumber}</p>
                  </div>
                  <div
                    className={[
                      "flex h-4 w-4 items-center justify-center rounded border",
                      checked
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-300 bg-white",
                    ].join(" ")}
                  >
                    {checked && (
                      <span className="h-2 w-2 rounded-sm bg-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-slate-500">
            {selectedKeys.length} student(s) selected
          </p>
        </CardBody>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <button
          type="button"
          className="w-full rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 md:w-40"
          onClick={handleReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 md:w-40"
          onClick={handleCreatePaper}
        >
          Create Paper
        </button>
      </div>

      {/* Generated exam links */}
      {generatedLinks.length > 0 && (
        <Card className="border-slate-200">
          <CardBody className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-900">
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


