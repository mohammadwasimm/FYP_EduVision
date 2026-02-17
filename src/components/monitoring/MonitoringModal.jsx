import React from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Card, CardBody } from "../ui/Card";
import { FiCamera, FiX } from "react-icons/fi";

export function MonitoringModal({ student, isOpen, onClose, onSessionOut }) {
  if (!student) return null;

  const { name, rollNumber, studentId, status = "normal", metrics = {} } = student;

  const metricCards = [
    {
      label: "Head Movement",
      value: metrics.headMovement || "Normal",
      status: "normal",
    },
    {
      label: "Eye Status",
      value: metrics.eyeStatus || "Normal",
      status: "normal",
    },
    {
      label: "Mobile Detected",
      value: metrics.mobileDetected || "No",
      status: metrics.mobileDetected === "Yes" ? "critical" : "normal",
    },
    {
      label: "Overall Status",
      value: status === "normal" ? "Normal" : status,
      status: status,
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "critical":
        return "text-rose-500";
      case "warning":
        return "text-amber-500";
      default:
        return "text-emerald-500";
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={500}
      className="monitoring-modal"
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-[#2b3674]">{name}</h2>
            <p className="text-sm text-[#2b3674] mt-1">
              {rollNumber} • {studentId}
            </p>
          </div>
          {/* <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition"
          >
            <FiX className="w-5 h-5 text-slate-500" />
          </button> */}
        </div>

        {/* Live Feed Section */}
        <div className="bg-[#1a1f40] rounded-xl p-6 mb-6 relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-emerald-400">Live Feed</span>
          </div>
          <div className="flex items-center justify-center py-16">
            <FiCamera className="w-16 h-16 text-slate-400" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {metricCards.map((metric, index) => (
            <Card key={index} className="border-0">
              <CardBody>
                <p className="text-[14px] text-[#2b3674] mb-1">{metric.label}</p>
                <p className={`text-sm font-semibold ${getStatusColor(metric.status)}`}>
                  {metric.value}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Session Out Button (outline mode) */}
        <Button
          mode="outline-primary"
          className="w-full"
          onClick={onSessionOut}
        >
          Session Out Student
        </Button>
      </div>
    </Modal>
  );
}
