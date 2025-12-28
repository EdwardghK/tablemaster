import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/utils";

const statusStyles = {
  approved: "text-green-700 bg-green-50 border-green-200",
  rejected: "text-red-700 bg-red-50 border-red-200",
  pending: "text-amber-700 bg-amber-50 border-amber-200",
  none: "text-stone-600 bg-stone-100 border-stone-200",
};

export default function EditAccessRequest({
  request,
  onSubmit,
  disabled = false,
  className,
  message,
  title = "View-only mode",
  ctaLabel = "Request edit access",
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const status = request?.status || "none";
  const statusText =
    status === "pending"
      ? "Pending review"
      : status === "approved"
      ? "Approved"
      : status === "rejected"
      ? "Rejected"
      : "No active request";

  const handleSubmit = async () => {
    if (!onSubmit || submitting || disabled || status === "pending") return;
    setSubmitting(true);
    try {
      await onSubmit(reason);
      setReason("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border bg-white shadow-sm p-3 space-y-3",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-stone-900">{title}</p>
          <p className="text-xs text-stone-600">
            {message || "You do not have edit permissions. Explain why you need them and an admin can approve."}
          </p>
          {request?.decision_notes ? (
            <p className="text-xs text-stone-500">
              Notes: {request.decision_notes}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "text-xs font-semibold px-2 py-1 rounded-lg border whitespace-nowrap",
            statusStyles[status] || statusStyles.none
          )}
        >
          {statusText}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why do you need edit access?"
          disabled={submitting || disabled || status === "pending"}
          className="flex-1 rounded-xl"
        />
        <Button
          onClick={handleSubmit}
          disabled={submitting || disabled || status === "pending"}
          className="rounded-xl bg-amber-700 hover:bg-amber-800"
          type="button"
        >
          {status === "pending" ? "Requested" : submitting ? "Sending..." : ctaLabel}
        </Button>
      </div>
    </div>
  );
}
