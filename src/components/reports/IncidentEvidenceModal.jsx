import React from "react";
import { Modal } from "../../components/ui/Modal";
import { Card, CardBody } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { FiDownload } from "react-icons/fi";
import { IoWarningOutline } from "react-icons/io5";
import { getSeverityTone } from "../../pages/Reports";


export function IncidentEvidenceModal({ incident, open, onClose }) {
  if (!incident) return null;

  return (
    <Modal open={open} onCancel={onClose} width={720} title={null}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Incident Evidence
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {incident.studentName} • {incident.timestamp}
          </p>
        </div>

        {/* Evidence Preview */}
        <Card className="border border-slate-100 bg-slate-50 rounded-[12px]">
          <CardBody className="py-14 flex flex-col items-center justify-center gap-2">
            <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center">
              <IoWarningOutline className="w-7 h-7 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Evidence Preview
            </p>
            <p className="text-xs text-slate-400">{incident.evidenceFile}</p>
          </CardBody>
        </Card>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 bg-slate-50 rounded-[12px]">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Cheating Type</p>
              <p className="text-sm font-semibold text-slate-900">
                {incident.cheatingType}
              </p>
            </CardBody>
          </Card>
          <Card className="border-0 bg-slate-50 rounded-[12px]">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Severity</p>
              <p
                className={`text-sm font-semibold ${
                  getSeverityTone(incident.severity).className
                } bg-transparent px-0 py-0`}
              >
                {getSeverityTone(incident.severity).label}
              </p>
            </CardBody>
          </Card>
          <Card className="border-0 bg-slate-50 rounded-[12px]">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Exam</p>
              <p className="text-sm font-semibold text-slate-900">
                {incident.exam}
              </p>
            </CardBody>
          </Card>
          <Card className="border-0 bg-slate-50 rounded-[12px]">
            <CardBody className="py-4">
              <p className="text-xs text-slate-500 mb-1">Subject</p>
              <p className="text-sm font-semibold text-slate-900">
                {incident.subject}
              </p>
            </CardBody>
          </Card>
        </div>

        {/* Footer Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            className="bg-slate-900 text-white flex items-center justify-center gap-2 px-4 [&:hover]:!bg-slate-900 [&:hover]:!border-slate-900 [&:hover]:!text-white [&:focus]:!bg-slate-900 [&:focus]:!border-slate-900 [&:focus]:!text-white [&:active]:!bg-slate-900 [&:active]:!border-slate-900 [&:active]:!text-white"
          >
            <FiDownload className="w-4 h-4" />
            <span className="text-sm">Download Evidence</span>
          </Button>
          <Button
            className="bg-slate-100 text-slate-700 border border-slate-200 px-4 [&:hover]:!bg-slate-100 [&:hover]:!border-slate-200 [&:hover]:!text-slate-700 [&:focus]:!bg-slate-100 [&:focus]:!border-slate-200 [&:focus]:!text-slate-700 [&:active]:!bg-slate-100 [&:active]:!border-slate-200 [&:active]:!text-slate-700"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

