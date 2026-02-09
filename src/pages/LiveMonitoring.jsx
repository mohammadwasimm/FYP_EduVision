import React, { useState, useMemo } from "react";
import { SummaryCards } from "../components/monitoring/SummaryCards";
import { SearchWithFilters } from "../components/monitoring/SearchWithFilters";
import { MonitoringCard } from "../components/monitoring/MonitoringCard";
import { MonitoringModal } from "../components/monitoring/MonitoringModal";

const initialStudents = [
  {
    id: "1",
    name: "John Doe",
    rollNumber: "R001",
    studentId: "STU001",
    status: "critical",
    metrics: {
      movement: "Left",
      suspicious: "Suspicious",
      phoneDetection: "Yes",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "Yes",
    },
  },
  {
    id: "2",
    name: "Jane Smith",
    rollNumber: "R002",
    studentId: "STU002",
    status: "warning",
    metrics: {
      movement: "Right",
      suspicious: "Normal",
      phoneDetection: "No",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "No",
    },
  },
  {
    id: "3",
    name: "Mike Johnson",
    rollNumber: "R003",
    studentId: "STU003",
    status: "normal",
    metrics: {
      movement: "Normal",
      suspicious: "Normal",
      phoneDetection: "No",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "No",
    },
  },
  {
    id: "4",
    name: "Sarah Wilson",
    rollNumber: "R004",
    studentId: "STU004",
    status: "warning",
    metrics: {
      movement: "Down",
      suspicious: "Suspicious",
      phoneDetection: "No",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "No",
    },
  },
  {
    id: "5",
    name: "David Brown",
    rollNumber: "R005",
    studentId: "STU005",
    status: "critical",
    metrics: {
      movement: "Left",
      suspicious: "Suspicious",
      phoneDetection: "Yes",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "Yes",
    },
  },
  {
    id: "6",
    name: "Emily Davis",
    rollNumber: "R006",
    studentId: "STU006",
    status: "normal",
    metrics: {
      movement: "Normal",
      suspicious: "Normal",
      phoneDetection: "No",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "No",
    },
  },
  {
    id: "7",
    name: "Chris Miller",
    rollNumber: "R007",
    studentId: "STU007",
    status: "warning",
    metrics: {
      movement: "Right",
      suspicious: "Normal",
      phoneDetection: "No",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "No",
    },
  },
  {
    id: "8",
    name: "Lisa Anderson",
    rollNumber: "R008",
    studentId: "STU008",
    status: "normal",
    metrics: {
      movement: "Normal",
      suspicious: "Normal",
      phoneDetection: "No",
      headMovement: "Normal",
      eyeStatus: "Normal",
      mobileDetected: "No",
    },
  },
];

const filters = [
  { key: "all", label: "All" },
  { key: "critical", label: "Critical" },
  { key: "warning", label: "Warning" },
  { key: "normal", label: "Normal" },
];

export function LiveMonitoring() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredStudents = useMemo(() => {
    let result = initialStudents;

    // Filter by search
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.rollNumber.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (activeFilter !== "all") {
      result = result.filter((s) => s.status === activeFilter);
    }

    return result;
  }, [search, activeFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalLive: initialStudents.length,
      normal: initialStudents.filter((s) => s.status === "normal").length,
      warnings: initialStudents.filter((s) => s.status === "warning").length,
      critical: initialStudents.filter((s) => s.status === "critical").length,
    };
  }, []);

  // Get first 4 cards for single row display
  const displayCards = filteredStudents.slice(0, 4);

  const handleCardClick = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  const handleSessionOut = () => {
    // Handle session out logic here
    console.log("Session out:", selectedStudent);
    handleModalClose();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <SummaryCards stats={stats} />

      {/* Search and Filters */}
      <SearchWithFilters
        searchValue={search}
        onSearchChange={setSearch}
        filters={filters}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Monitoring Cards - Single Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayCards.map((student) => (
          <MonitoringCard
            key={student.id}
            student={student}
            onClick={() => handleCardClick(student)}
          />
        ))}
      </div>

      {/* Monitoring Modal */}
      <MonitoringModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSessionOut={handleSessionOut}
      />
    </div>
  );
}
