import React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function StudentsModals({
  isModalOpen,
  setIsModalOpen,
  editingKey,
  setEditingKey,
  formValues,
  setFormValues,
  handleAddStudent,
  isSubmittedModalOpen,
  setIsSubmittedModalOpen,
  submittedStudent,
  submittedPapers,
}) {
  return (
    <>
      <Modal
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingKey(null);
          setFormValues({ name: "", rollNumber: "", className: "", email: "" });
        }}
        title={
          <span className="text-[18px] font-semibold text-[#2b3674]">
            {editingKey ? "Edit Student" : "Add Student"}
          </span>
        }
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
              mode="outline-primary"
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
            <span className="text-sm font-semibold text-[#2b3674]">
              Submitted Papers
            </span>
            {submittedStudent ? (
              <span className="text-xs text-[#2b3674] mt-1">
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
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#4318ff] text-white">
                  {/* simple initials from subject */}
                  <span className="text-[12px] font-semibold">
                    {paper.subject
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2b3674]">
                    {paper.title}
                  </p>
                  <p className="text-[12px] text-[#2b3674]">
                    {paper.subject} • {paper.dateTime}
                  </p>
                </div>
              </div>
              <div className="text-right text-[#2b3674]">
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
              mode="outline-primary"
              className="w-full"
              onClick={() => setIsSubmittedModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

