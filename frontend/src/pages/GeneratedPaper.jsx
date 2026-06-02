import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiClock, FiCopy } from "react-icons/fi";
import { MdDelete } from "react-icons/md";
import { Select } from "antd";
import { Card, CardBody } from "../components/ui/Card";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { Button } from "../components/ui/Button";
import { ROUTE_ENDPOINTS } from "../config/router-service/utils/endpoints";
import { ENV_CONFIG } from "../config/env";
import { examsApi } from "../store/apiClients/examsClient";
import { fetchStudents } from "./students/stores/actions";
import { toast } from "../utils/react-toastify-shim";

export function GeneratedPaper() {
  const navigate = useNavigate();
  const [papers, setPapers] = useState([]);
  const [selectedPaperId, setSelectedPaperId] = useState("");
  const [studentsMap, setStudentsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [deletingPaperId, setDeletingPaperId] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleCopyLink = useCallback((link) => {
    if (!link) return;
    navigator.clipboard?.writeText(link);
    toast.success("Exam link copied.");
  }, []);

  const handleOpenEnroll = useCallback(
    (link) => {
      if (!link) return;
      navigate(`${ROUTE_ENDPOINTS["student-enroll"]}?examLink=${encodeURIComponent(link)}`, {
        state: { examLink: link },
      });
    },
    [navigate]
  );

  const handleViewPaperCsv = useCallback((examId) => {
    if (!examId) return;

    const csvUrl = `${ENV_CONFIG.API_BASE_URL}/api/exams/${encodeURIComponent(examId)}/questions/csv`;
    const opened = window.open(csvUrl, "_blank");
    if (!opened) {
      toast.error("Popup blocked. Please allow popups for this site.");
    }
  }, []);

  const handleDeletePaper = useCallback(
    async (examId) => {
      if (!examId) return;

      try {
        setDeletingPaperId(examId);
        await examsApi.deletePaper(examId);

        const nextPapers = papers.filter((paper) => paper.id !== examId);
        setPapers(nextPapers);

        if (selectedPaperId === examId) {
          setSelectedPaperId(nextPapers[0]?.id || "");
        }

        toast.success("Paper deleted successfully.");
        setDeleteModalOpen(false);
      } catch (error) {
        const message = error?.response?.data?.error || error?.message || "Failed to delete paper.";
        toast.error(message);
      } finally {
        setDeletingPaperId("");
      }
    },
    [papers, selectedPaperId]
  );

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const [papersResp, studentsResp] = await Promise.all([
          examsApi.getPapers(),
          fetchStudents({ page: 1, limit: 1000 }),
        ]);

        const papersData = papersResp?.data?.data || [];
        const studentsList = studentsResp?.data || [];

        const byStudentId = studentsList.reduce((acc, student) => {
          const keys = [student?.id, student?.studentId, student?.["student-id"]].filter(Boolean);
          if (!keys.length) return acc;

          const normalizedStudent = {
            name: student?.name || student?.studentId || student?.id || "Unknown Student",
            rollNumber: student?.rollNumber || student?.["roll-number"] || "-",
            studentId: student?.studentId || student?.["student-id"] || student?.id,
          };

          keys.forEach((key) => {
            acc[key] = normalizedStudent;
          });

          return acc;
        }, {});

        if (!mounted) return;

        setStudentsMap(byStudentId);
        setPapers(papersData);
        setSelectedPaperId((prev) => prev || papersData[0]?.id || "");
      } catch (error) {
        if (mounted) {
          toast.error("Failed to load generated papers.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedPaper = useMemo(
    () => papers.find((paper) => paper.id === selectedPaperId) || null,
    [papers, selectedPaperId]
  );

  const handleRequestDelete = useCallback(() => {
    if (!selectedPaperId) {
      toast.error("Please select a paper first.");
      return;
    }
    setDeleteModalOpen(true);
  }, [selectedPaperId]);

  const rows = useMemo(() => {
    if (!selectedPaper?.instances?.length) return [];

    return selectedPaper.instances.map((instance, index) => {
      const student = studentsMap[instance.studentId] || {};
      return {
        key: instance.id,
        name: instance.studentName || student.name || instance.studentId,
        rollNumber: instance.rollNumber || student.rollNumber || "-",
        studentId: instance.studentCode || student.studentId || instance.studentId,
        examId: instance.examId || selectedPaper.id,
        link: instance.link,
        scheduled: selectedPaper.scheduledAt
          ? new Date(selectedPaper.scheduledAt).toLocaleString()
          : "N/A",
        index: index + 1,
      };
    });
  }, [selectedPaper, studentsMap]);

  const columns = useMemo(
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
            onClick={() => handleOpenEnroll(link)}
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
            onClick={() => handleCopyLink(record.link)}
          >
            <FiCopy className="w-4 h-4" />
          </button>
        ),
      },
      {
        title: "VIEW PAPER",
        key: "view-paper",
        align: "center",
        render: (_, record) => (
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-[var(--color-primary)] hover:bg-slate-50"
            onClick={() => handleViewPaperCsv(record.examId)}
          >
            View CSV
          </button>
        ),
      },
    ],
    [handleCopyLink, handleOpenEnroll, handleViewPaperCsv]
  );

  return (
    <div className="space-y-6">
      <Card className="border-slate-200">
        <CardBody className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Generated Paper</h2>
          <div className="space-y-1">
            <label className="text-[14px] font-medium text-[var(--color-text)]">Select Generated Paper</label>
            <div className="flex items-center gap-3">
              <Select
                className="w-full custom-dropdown"
                placeholder="Select paper"
                value={selectedPaperId || undefined}
                onChange={(value) => setSelectedPaperId(value)}
                options={papers.map((paper) => ({
                  label: `${paper.title} (${paper.id})`,
                  value: paper.id,
                }))}
              />
            <button
              type="button"
              className="inline-flex h-[45px] w-11 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-50 mt-6"
              onClick={handleRequestDelete}
              title="Delete selected paper"
              disabled={!selectedPaperId || Boolean(deletingPaperId)}
              style={{
                color: "var(--color-danger)",
                // border: "1px solid var(--color-danger)",
                backgroundColor: "rgba(220, 38, 38, 0.10)",
              }}
            >
              <MdDelete className="h-6 w-6" />
            </button>
            </div>
          </div>

          {selectedPaper ? (
            <p className="text-xs text-[var(--color-text)]">
              Subject: {selectedPaper.subject} • Students: {selectedPaper.studentCount} • Questions: {selectedPaper.totalQuestions}
            </p>
          ) : (
            <p className="text-xs text-[var(--color-text)]">No generated paper found.</p>
          )}
        </CardBody>
      </Card>

      <Card className="border-slate-200">
        <CardBody className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Generated Exam Links</h2>
          <DataTable columns={columns} dataSource={rows} loading={loading} />
        </CardBody>
      </Card>

      <Modal
        open={deleteModalOpen}
        onCancel={() => setDeleteModalOpen(false)}
        width={430}
        title={null}
      >
        <div className="space-y-6 py-4">
          <p className="text-center text-[16px] text-[var(--color-text)]">
            Are you sure you want to "Delete" this paper?
          </p>

          <div className="flex items-center justify-center gap-3 pt-1">
            <Button
              onClick={() => setDeleteModalOpen(false)}
              disabled={Boolean(deletingPaperId)}
              className="!h-[44px] !min-w-[110px] !border !border-[var(--color-danger)] !bg-white !text-[var(--color-danger)] hover:!bg-[rgba(220,38,38,0.08)]"
            >
              Cancel
            </Button>
            <Button
              type="default"
              onClick={() => handleDeletePaper(selectedPaperId)}
              disabled={!selectedPaperId || Boolean(deletingPaperId)}
              className="!h-[44px] !min-w-[110px]"
              style={{
                backgroundColor: "var(--color-danger)",
                borderColor: "var(--color-danger)",
                color: "#fff",
              }}
            >
              {deletingPaperId ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
