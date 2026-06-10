import React from "react";
import { toast } from "react-toastify";

export function confirmWithToast({
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
}) {
  const toastId = toast.info(
    <div>
      <div className="mb-2 fw-semibold">{message}</div>
      <div className="d-flex gap-2">
        <button
          type="button"
          className="btn btn-sm btn-danger"
          onClick={async () => {
            toast.dismiss(toastId);
            await onConfirm();
          }}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => toast.dismiss(toastId)}
        >
          {cancelLabel}
        </button>
      </div>
    </div>,
    {
      autoClose: false,
      closeOnClick: false,
      draggable: false,
    }
  );
}
