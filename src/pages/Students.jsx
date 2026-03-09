import React, { useMemo, useState } from "react";
import { DataTable } from "../components/ui/DataTable";
import { Button } from "../components/ui/Button";
import { Search } from "../components/ui/Search";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
} from "react-icons/fi";
import { StudentsModals } from "../components/students/StudentsModals";
import { MdEdit } from "react-icons/md";
import { RiDeleteBin6Fill } from "react-icons/ri";


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
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-white)] text-xs font-semibold">
            {record.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text)]">{record.name}</p>
          </div>
        </div>
      ),
    },
    {
      title: "ROLL NUMBER",
      dataIndex: "rollNumber",
      key: "rollNumber",
      width: 150,
  render: (value) => <span className="text-[var(--color-text)]">{value}</span>,
    },
    {
      title: "CLASS",
      dataIndex: "className",
      key: "className",
      width: 120,
  render: (value) => <span className="text-[var(--color-text)]">{value}</span>,
    },
    {
      title: "EMAIL",
      dataIndex: "email",
      key: "email",
      width: 150,
      render: (value) => (
  <span className="text-[var(--color-text)] text-xs sm:text-sm">{value}</span>
      ),
    },
    {
      title: "STUDENT ID",
      dataIndex: "studentId",
      key: "studentId",
      width: 60,
      render: (value) => (
  <span className="inline-flex items-center  bg-[var(--color-primary-50)] px-3 py-1 text-[11px] font-medium text-[var(--color-text)]">
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
        <div className="flex justify-center">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center "
            aria-label={`Edit ${record.name}`}
            onClick={() => handleEdit(record)}
          >
            <MdEdit className="w-5 h-5 text-[var(--color-gold)]" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center"
            aria-label={`Delete ${record.name}`}
            onClick={() =>
              setStudents((prev) => prev.filter((s) => s.key !== record.key))
            }
          >
            <RiDeleteBin6Fill className="w-5 h-5 text-red-500" />
          </button>
          <button
            type="button"
            className="text-[var(--color-primary)] ml-1"
            aria-label={`View submitted papers for ${record.name}`}
            onClick={() => handleViewSubmitted(record)}
          >
            <FiEye className="w-5 h-5 text-[var(--color-primary)]" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: search at table start */}
        <div className="w-full sm:w-auto">
          <Search
            placeholder="Search students by name, roll number, or class..."
            className="sm:w-72"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Right: actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button
            mode="outline-primary"
            onClick={() => console.log("Import clicked")}
          >
            Import
          </Button>
          <Button
            type="primary"
            className="bg-[var(--color-primary)] hover:bg-[var(--color-primary)]"
            onClick={() => setIsModalOpen(true)}
            icon={<FiPlus color="var(--color-white)" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      <DataTable columns={columns} dataSource={filteredStudents} />

      <StudentsModals
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingKey={editingKey}
        setEditingKey={setEditingKey}
        formValues={formValues}
        setFormValues={setFormValues}
        handleAddStudent={handleAddStudent}
        isSubmittedModalOpen={isSubmittedModalOpen}
        setIsSubmittedModalOpen={setIsSubmittedModalOpen}
        submittedStudent={submittedStudent}
        submittedPapers={submittedPapers}
      />
    </div>
  );
}

