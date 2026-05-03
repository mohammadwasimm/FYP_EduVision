import React, { useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from '../../utils/react-toastify-shim';
import { DataTable } from "../../components/ui/DataTable";
import { Button } from "../../components/ui/Button";
import { Search } from "../../components/ui/Search";
import { FiPlus } from "react-icons/fi";
import { StudentsModals } from "../../components/students/StudentsModals";
import { ConfirmationModal } from "../../components/ui/ConfirmationModal";
import { fetchStudents, fetchStudentById, createStudent, updateStudent, deleteStudent, fetchStudentAssignments, setSearchQuery, importStudents } from "./stores/actions";
import columnsFactory from './columns';

export function Students() {
  const studentsState = useSelector((state) => state.students);
  const studentsList = useMemo(() => studentsState.students.data || [], [studentsState.students.data]);
  const studentsPagination = studentsState.students.pagination || undefined;
  const studentsMeta = studentsState.students.meta || { total: 0, page: 1, limit: 10 };
  const loading = studentsState.students.loading;
  const createLoading = studentsState.createStudent.loading;
  const createStudentError = studentsState.createStudent.error;
  const updateLoading = studentsState.updateStudent.loading;
  const deleteLoading = studentsState.deleteStudent.loading;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittedModalOpen, setIsSubmittedModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [submittedPapers, setSubmittedPapers] = useState([]);
  const [submittedStudent, setSubmittedStudent] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const defaultFormValues = { name: "", rollNumber: "", className: "", email: "" };
  const [formValues, setFormValues] = useState(defaultFormValues);
 


  // Fetch students on mount and when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const q = search.trim();
  // when search changes, reset to first page
  setPage(1);
  if (q) fetchStudents({ search: q, page: 1, limit });
  else fetchStudents({ page: 1, limit });
  setSearchQuery(q);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Initial fetch on mount
  useEffect(() => {
  fetchStudents({ page, limit });
  }, []);

  const handleAddStudent = async (e) => {
    e.preventDefault();

    try {
      if (editingKey) {
        await updateStudent(editingKey, {
          name: formValues.name,
          'roll-number': formValues.rollNumber,
          'class-name': formValues.className,
          email: formValues.email || "",
        });
  toast.success("Student updated successfully!");
  await fetchStudents({ page, limit });
      } else {
        await createStudent({
          name: formValues.name,
          'roll-number': formValues.rollNumber,
          'class-name': formValues.className,
          email: formValues.email || "",
        });
  toast.success("Student added successfully!");
  await fetchStudents({ page, limit });
      }

      setEditingKey(null);
      setFormValues(defaultFormValues);
      setIsModalOpen(false);
    } catch (error) {
      if (editingKey) {
  toast.error(error?.message || "Failed to update student. Please try again.");
      }
    }
  };

  const handleEdit = async (record) => {
    try {
      const studentId = record.id || record.key;
      setEditingKey(studentId);
  toast.info("Loading student details...");
  const studentData = await fetchStudentById(studentId);
      setFormValues({
        name: studentData.name,
        rollNumber: studentData.rollNumber || studentData['roll-number'],
        className: studentData.className || studentData['class-name'],
        email: studentData.email === "-" ? "" : studentData.email,
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error fetching student details:", error);
      const errorMessage = error?.message || "Failed to load student details. Please try again.";
  toast.error(errorMessage);
    }
  };

  const handleViewSubmitted = async (record) => {
    setSubmittedStudent(record);
    try {
      const studentId = record.id || record.key;
      const assignments = await fetchStudentAssignments(studentId);
      setSubmittedPapers(assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setSubmittedPapers([]);
    } finally {
      setIsSubmittedModalOpen(true);
    }
  };

  const handleDeleteClick = (record) => {
    setStudentToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    try {
      const studentId = studentToDelete.id || studentToDelete.key;
      await deleteStudent(studentId);
  toast.success("Student deleted successfully!");
  // Refresh list
  await fetchStudents({ page, limit });
      // Close modal and reset
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error("Error deleting student:", error);
      const errorMessage = error?.message || "Failed to delete student. Please try again.";
  toast.error(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const columns = columnsFactory({ onEdit: handleEdit, onDelete: handleDeleteClick, onView: handleViewSubmitted });

  const fileInputRef = React.useRef(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.csv,text/csv';
    fileInput.onchange = (ev) => {
      const f = ev.target.files && ev.target.files[0];
      if (f) handleImport(f);
    };
    fileInput.click();
  };

  const handleImport = async (file) => {
    try {
      setIsImporting(true);
  toast.info('Importing students...');
      const text = await file.text();
  const resp = await importStudents(text);
  const payload = resp && (resp.data !== undefined ? resp.data : resp);
  const importedCount = Array.isArray(payload) ? payload.length : 0;
  toast.success(`Imported ${importedCount} students`);
  const errors = resp?.errors || [];
      if (errors.length) {
        console.warn('Import errors:', errors);
  toast.info(`${errors.length} rows failed to import. Check console for details.`);
      }
  await fetchStudents({ page, limit });
    } catch (err) {
      console.error('Import failed:', err);
      const msg = err?.message || (err?.detail && (Array.isArray(err.detail) ? err.detail[0]?.msg || err.detail[0]?.message : err.detail)) || 'Import failed. See console for details.';
  toast.error(msg);
      throw err;
    } finally {
      setIsImporting(false);
    }
  };

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
            onClick={handleImportClick}
          >
            Import
          </Button>
          {/* import uses dynamic input element created in handleImportClick */}
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

      {loading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : (
        <DataTable
          columns={columns}
          dataSource={studentsList.map((s) => ({ ...s, key: s.id || s.key }))}
          pagination={{
            // use local state for immediate UI responsiveness, server meta will update shortly
            current: page,
            pageSize: limit,
            total: (studentsPagination && (studentsPagination.totalRecords ?? studentsPagination.total)) || studentsMeta.total || 0,
            current: studentsPagination?.page || page,
            pageSize: studentsPagination?.perPage || limit,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            onChange: async (p, ps) => {
              setPage(p);
              setLimit(ps);
              await fetchStudents({ search: search.trim(), page: p, limit: ps });
            },
          }}
        />
      )}

      <StudentsModals
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingKey={editingKey}
        setEditingKey={setEditingKey}
        formValues={formValues}
        setFormValues={setFormValues}
        formErrors={createStudentError}
        handleAddStudent={handleAddStudent}
        isSubmittedModalOpen={isSubmittedModalOpen}
        setIsSubmittedModalOpen={setIsSubmittedModalOpen}
        submittedStudent={submittedStudent}
        submittedPapers={submittedPapers}
        loading={createLoading || updateLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        open={isDeleteModalOpen}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        message={
          studentToDelete
            ? `Are you sure you want to delete "${studentToDelete.name}"? This action cannot be undone.`
            : "Are you sure you want to delete this student?"
        }
        loading={deleteLoading}
      />
    </div>
  );
}

