import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { RiErrorWarningLine } from "react-icons/ri";

export function ConfirmationModal({
  open,
  onCancel,
  onConfirm,
  message = "Are you sure you want to proceed?",
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onCancel={onCancel}
      width={350}
      title={null}
    >
      <div className="space-y-6 py-2">
        {/* Warning Icon and Message */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF0000]/10">
            <RiErrorWarningLine className="w-6 h-6 text-[#FF0000]" />
          </div>
          <p className="text-sm text-[var(--color-text)] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons - Centered */}
        <div className="flex justify-center gap-3 pt-2">
          <Button
            onClick={onCancel}
            disabled={loading}
            type="default"
            className="!border-[#FF0000] !text-[#FF0000] hover:!bg-[#FF0000]/10 hover:!border-[#FF0000] hover:!text-[#FF0000] !bg-transparent active:!bg-[#FF0000]/20"
            style={{
              borderColor: '#FF0000',
              color: '#FF0000',
              backgroundColor: 'transparent',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            type="default"
            className="!bg-[#FF0000] !text-white !border-[#FF0000] hover:!bg-[#CC0000] hover:!border-[#CC0000] active:!bg-[#AA0000]"
            style={{
              backgroundColor: '#FF0000',
              borderColor: '#FF0000',
              color: 'white',
            }}
          >
            {loading ? "Processing..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
