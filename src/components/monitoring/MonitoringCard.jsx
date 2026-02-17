import React from "react";
import { Badge } from "../ui/Badge";
import { FiCamera, FiAlertTriangle, FiEye } from "react-icons/fi";
import { BsArrows } from "react-icons/bs";
import { MdPhoneIphone } from "react-icons/md";

const statusConfig = {
  normal: {
    borderColor: "border-emerald-500",
    textColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    tagColor: "bg-emerald-100 text-emerald-600",
    iconColor: "text-emerald-500",
    liveIconBg: "bg-emerald-500",
    liveTextColor: "text-emerald-400",
    warningIconBg: null,
  },
  warning: {
    borderColor: "border-amber-500",
    textColor: "text-amber-600",
    bgColor: "bg-yellow-50",
    tagColor: "bg-yellow-50 text-amber-600",
    iconColor: "text-amber-500",
    liveIconBg: "bg-amber-500",
    liveTextColor: "text-amber-400",
    warningIconBg: "bg-amber-500",
  },
  critical: {
    borderColor: "border-rose-500",
    textColor: "text-rose-600",
    bgColor: "bg-rose-50",
    tagColor: "bg-rose-100 text-rose-600",
    iconColor: "text-rose-500",
    liveIconBg: "bg-rose-500",
    liveTextColor: "text-rose-400",
    warningIconBg: "bg-rose-500",
  },
};

export function MonitoringCard({ student, onClick }) {
  const { name, rollNumber, status = "normal", metrics = {} } = student;
  const config = statusConfig[status] || statusConfig.normal;

  return (
    <div
      className={`bg-white border-2 ${config.borderColor} rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={onClick}
    >
      {/* Dark Top Section */}
      <div className={`${config.bgColor} p-4 relative`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${config.liveIconBg}`}></div>
            <span className={`text-xs font-medium ${config.liveTextColor}`}>Live</span>
          </div>
          {status !== "normal" && config.warningIconBg && (
            <div className={`h-6 w-6 rounded-full ${config.warningIconBg} flex items-center justify-center`}>
              <FiAlertTriangle className="w-3 h-3 text-white" />
            </div>
          )}
        </div>

        {/* Camera Icon */}
        <div className="flex items-center justify-center py-8">
          <FiCamera className="w-12 h-12 text-slate-400" />
        </div>
      </div>

      {/* White Bottom Section */}
      <div className="p-4 bg-white">
        {/* Student Info */}
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-[#2b3674] mb-1">{name}</h3>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#2b3674]">{rollNumber}</p>
            <Badge className={`${config.tagColor} text-[10px] px-2 py-0.5 font-medium`}>
              {status}
            </Badge>
          </div>
        </div>

        {/* Metrics - Single Row as Cards */}
        <div className="flex items-center gap-2">
          {/* Movement Card */}
          <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-[#F1F5F980] flex-1">
            <BsArrows className="w-4 h-4 text-[#2b3674] mb-1" />
            <span className="text-xs text-[#2b3674] capitalize">{metrics.movement || "Normal"}</span>
          </div>
          
          {/* Suspicious Card */}
          <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-[#F1F5F980] flex-1">
            <FiEye className="w-4 h-4 text-[#2b3674] mb-1" />
            <span className="text-xs text-[#2b3674] capitalize">{metrics.suspicious || "Normal"}</span>
          </div>
          
          {/* Phone Detection Card */}
          <div className="flex flex-col items-center justify-center px-3 py-2 rounded-lg bg-[#F1F5F980] flex-1">
            <MdPhoneIphone className="w-4 h-4 text-[#2b3674] mb-1" />
            <span className="text-xs text-[#2b3674] capitalize">
              {metrics.phoneDetection || "No"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
