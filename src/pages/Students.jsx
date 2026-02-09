import React, { useMemo, useState } from "react";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Search } from "../components/ui/Search";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
} from "react-icons/fi";

const initialStudents = [
  {
    key: "stu-001",
    name: "John Doe",
    rollNumber: "R001",
    className: "Class 12A",
    email: "john@example.com",
    studentId: "STU001",
  },
  {
    key: "stu-002",
    name: "Jane Smith",
    rollNumber: "R002",
    className: "Class 12A",
    email: "jane@example.com",
    studentId: "STU002",
  },
  {
    key: "stu-003",
    name: "Mike Johnson",
    rollNumber: "R003",
    className: "Class 12B",
    email: "mike@example.com",
    studentId: "STU003",
  },
  {
    key: "stu-004",
    name: "Sarah Wilson",
    rollNumber: "R004",
    className: "Class 12B",
    email: "sarah@example.com",
    studentId: "STU004",
  },
  {
    key: "stu-005",
    name: "Tom Brown",
    rollNumber: "R005",
    className: "Class 12A",
    email: "tom@example.com",
    studentId: "STU005",
  },
];

export function Students() {
  const [students, setStudents] = useState(initialStudents);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [submittedPapers, setSubmittedPapers] = useState([]);
  const [submittedStudent, setSubmittedStudent] = useState(null);
  const [formValues, setFormValues] = useState({
    name: "",
    rollNumber: "",
    className: "",
    email: "",
  });

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.rollNumber.toLowerCase().includes(query) ||
        s.className.toLowerCase().includes(query)
    );
  }, [students, search]);

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!formValues.name || !formValues.rollNumber || !formValues.className) {
      return;
    }

    if (editingKey) {
      setStudents((prev) =>
        prev.map((s) =>
          s.key === editingKey
            ? {
              ...s,
              name: formValues.name,
              rollNumber: formValues.rollNumber,
              className: formValues.className,
              email: formValues.email || "-",
            }
            : s
        )
      );
    } else {
      const nextIndex = students.length + 1;
      const newStudent = {
        key: `stu-${String(nextIndex).padStart(3, "0")}`,
        name: formValues.name,
        rollNumber: formValues.rollNumber,
        className: formValues.className,
        email: formValues.email || "-",
        studentId: `STU${String(nextIndex).padStart(3, "0")}`,
      };
      setStudents((prev) => [...prev, newStudent]);
    }

    setEditingKey(null);
    setFormValues({ name: "", rollNumber: "", className: "", email: "" });
    setIsModalOpen(false);
  };

  const handleEdit = (record) => {
    setEditingKey(record.key);
    setFormValues({
      name: record.name,
      rollNumber: record.rollNumber,
      className: record.className,
      email: record.email === "-" ? "" : record.email,
    });
    setIsModalOpen(true);
  };

  const handleViewSubmitted = (record) => {
    setSubmittedStudent(record);
    // Demo data; in real app fetch from API
    setSubmittedPapers([
      {
        key: "paper-1",
        title: "Mathematics Final",
        subject: "Mathematics",
        dateTime: "Jan 2, 2026 10:45 AM",
        score: 85,
        total: 100,
        percent: "85%",
      },
      {
        key: "paper-2",
        title: "Physics Midterm",
        subject: "Physics",
        dateTime: "Dec 28, 2025 2:30 PM",
        score: 72,
        total: 100,
        percent: "72%",
      },
      {
        key: "paper-3",
        title: "Chemistry Quiz",
        subject: "Chemistry",
        dateTime: "Dec 20, 2025 11:00 AM",
        score: 45,
        total: 50,
        percent: "90%",
      },
    ]);
    setIsSubmittedModalOpen(true);
  };

  const columns = [
    {
      title: "STUDENT NAME",
      dataIndex: "name",
      key: "name",
      width: 250,
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
            {record.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">{record.name}</p>
          </div>
        </div>
      ),
    },
    {
      title: "ROLL NUMBER",
      dataIndex: "rollNumber",
      key: "rollNumber",
      width: 150,
      render: (value) => <span className="text-slate-600">{value}</span>,
    },
    {
      title: "CLASS",
      dataIndex: "className",
      key: "className",
      width: 120,
      render: (value) => <span className="text-slate-600">{value}</span>,
    },
    {
      title: "EMAIL",
      dataIndex: "email",
      key: "email",
      width: 150,
      render: (value) => (
        <span className="text-slate-600 text-xs sm:text-sm">{value}</span>
      ),
    },
    {
      title: "STUDENT ID",
      dataIndex: "studentId",
      key: "studentId",
      width: 60,
      render: (value) => (
        <span className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-700">
          {value}
        </span>
      ),
    },
    {
      title: "ACTIONS",
      key: "actions",
      align: "center",
      width: 50,
      render: (_, record) => (
        <div className="flex justify-end gap-3 text-slate-400">
          <button
            type="button"
            className="hover:text-blue-500"
            aria-label={`Edit ${record.name}`}
            onClick={() => handleEdit(record)}
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="hover:text-rose-500"
            aria-label={`Delete ${record.name}`}
            onClick={() =>
              setStudents((prev) => prev.filter((s) => s.key !== record.key))
            }
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            className="hover:text-slate-600"
            aria-label={`View submitted papers for ${record.name}`}
            onClick={() => handleViewSubmitted(record)}
          >
            <FiEye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Search
            placeholder="Search students by name, roll number, or class..."
            className="sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => console.log("Import clicked")}
          >
            Import
          </Button>
          <Button
            type="primary"
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsModalOpen(true)}
            icon={<FiPlus />}
          >
            Add Student
          </Button>
        </div>
      </div>

      <DataTable columns={columns} dataSource={filteredStudents} />

      <Modal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingKey(null);
          setFormValues({ name: "", rollNumber: "", className: "", email: "" });
        }}
        title={editingKey ? "Edit Student" : "Add Student"}
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <Input
            label="Name *"
            placeholder="Enter student name"
            value={formValues.name}
            onChange={(e) =>
              setFormValues((v) => ({ ...v, name: e.target.value }))
            }
          />
          <Input
            label="Roll Number *"
            placeholder="Enter roll number"
            value={formValues.rollNumber}
            onChange={(e) =>
              setFormValues((v) => ({ ...v, rollNumber: e.target.value }))
            }
          />
          <Input
            label="Class *"
            placeholder="e.g., Class 12A"
            value={formValues.className}
            onChange={(e) =>
              setFormValues((v) => ({ ...v, className: e.target.value }))
            }
          />
          <Input
            label="Email (optional)"
            type="email"
            placeholder="student@example.com"
            value={formValues.email}
            onChange={(e) =>
              setFormValues((v) => ({ ...v, email: e.target.value }))
            }
          />

          <div className="mt-2 flex justify-end gap-2 pt-2">
            <Button
              className="bg-slate-50 text-slate-700 hover:bg-slate-100"
              onClick={() => {
                setIsModalOpen(false);
                setEditingKey(null);
                setFormValues({
                  name: "",
                  rollNumber: "",
                  className: "",
                  email: "",
                });
              }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              {editingKey ? "Save Changes" : "Add Student"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={isSubmittedModalOpen}
        onCancel={() => setIsSubmittedModalOpen(false)}
        title={
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-900">
              Submitted Papers
            </span>
            {submittedStudent ? (
              <span className="text-xs text-slate-500">
                {submittedStudent.name} ({submittedStudent.rollNumber})
              </span>
            ) : null}
          </div>
        }
      >
        <div className="space-y-3">
          {submittedPapers.map((paper) => (
            <div
              key={paper.key}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                  <FiEye className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {paper.title}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {paper.subject} • {paper.dateTime}
                  </p>
                </div>
              </div>
              <div className="text-right text-slate-900">
                <p className="text-sm font-semibold">
                  {paper.score}
                  <span className="text-[11px] font-normal text-slate-500">
                    /{paper.total}
                  </span>
                </p>
                <p className="text-[11px] text-emerald-500">{paper.percent}</p>
              </div>
            </div>
          ))}
          <div className="pt-2">
            <Button
              className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200"
              onClick={() => setIsSubmittedModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

