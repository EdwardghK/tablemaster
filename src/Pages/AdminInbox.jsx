import React, { useEffect, useState, useContext } from "react";
import Header from "@/components/common/Header";
import { AccessRequests } from "@/api/accessRequests";
import { ChangeRequests } from "@/api/changeRequests";
import { AppContext } from "@/context/AppContext";
import { toast } from "sonner";

const formatAgo = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [label, size] of units) {
    if (seconds >= size || label === "second") {
      const val = Math.floor(seconds / size);
      return `${val} ${label}${val !== 1 ? "s" : ""} ago`;
    }
  }
  return "";
};

const summarizeChanges = (before, after, action) => {
  const isNullish = (v) => v === null || v === undefined;
  const isEmptyArray = (v) => Array.isArray(v) && v.length === 0;
  const arrayToSetString = (arr) =>
    Array.isArray(arr) ? JSON.stringify([...new Set(arr)].sort()) : null;
  const isSame = (a, b) => {
    if (isNullish(a) && isNullish(b)) return true;
    if (Array.isArray(a) && Array.isArray(b)) {
      const sa = arrayToSetString(a);
      const sb = arrayToSetString(b);
      return sa === sb;
    }
    if (isEmptyArray(a) && isEmptyArray(b)) return true;
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  const fmt = (val) => {
    if (val === null || val === undefined) return "—";
    if (Array.isArray(val)) {
      const uniq = [...new Set(val)];
      const preview = uniq.slice(0, 3).join(", ");
      return uniq.length > 3 ? `${preview}, …` : preview || "—";
    }
    if (typeof val === "object") {
      if (val.name) return val.name;
      try {
        const s = JSON.stringify(val);
        return s.length > 60 ? `${s.slice(0, 57)}...` : s;
      } catch {
        return "[object]";
      }
    }
    const s = String(val);
    return s.length > 40 ? `${s.slice(0, 37)}...` : s;
  };

  const describeArrayChange = (prev, next) => {
    const prevSet = new Set(Array.isArray(prev) ? prev : []);
    const nextSet = new Set(Array.isArray(next) ? next : []);
    const added = [...nextSet].filter((x) => !prevSet.has(x));
    const removed = [...prevSet].filter((x) => !nextSet.has(x));
    const parts = [];
    if (added.length) parts.push(`+${added.slice(0, 3).join(", ")}`);
    if (removed.length) parts.push(`-${removed.slice(0, 3).join(", ")}`);
    if (!parts.length) return null;
    return parts.join(" ");
  };

  // Created
  if (!before && after) {
    const excluded = new Set(["id", "created_at", "updated_at", "user_id", "email", "full_name", "entity_id"]);
    const keys = Object.keys(after).filter((k) => !excluded.has(k));
    const lines = keys.slice(0, 4).map((k) => `${k}: ${fmt(after[k])}`);
    return lines.length ? lines : ["Created"];
  }

  // Deleted
  if (before && !after) {
    return [`Deleted ${before.name || before.id || "item"}`];
  }

  const excluded = new Set([
    "id",
    "created_at",
    "updated_at",
    "user_id",
    "email",
    "full_name",
    "entity_id",
    "reviewer_id",
    "reviewer_email",
  ]);
  const keys = new Set([
    ...Object.keys(before || {}),
    ...Object.keys(after || {}),
  ]);
  const diffs = [];
  for (const key of keys) {
    if (excluded.has(key)) continue;
    const hasPrev = before && Object.prototype.hasOwnProperty.call(before, key);
    const hasNext = after && Object.prototype.hasOwnProperty.call(after, key);

    // If neither payload mentions the field, skip
    if (!hasPrev && !hasNext) continue;

    // For partial updates, if after doesn't include the field, treat as unchanged
    if (!hasNext && hasPrev) continue;

    const prev = hasPrev ? before[key] : undefined;
    const next = hasNext ? after[key] : undefined;
    if (!isSame(prev, next)) {
      if (Array.isArray(prev) || Array.isArray(next)) {
        const desc = describeArrayChange(prev, next);
        if (desc) {
          diffs.push(`${key}: ${desc}`);
        } else {
          diffs.push(`${key}: ${fmt(prev)} → ${fmt(next)}`);
        }
      } else {
        diffs.push(`${key}: ${fmt(prev)} → ${fmt(next)}`);
      }
    }
  }
  if (!diffs.length && action === "update") {
    return ["No field changes detected"];
  }
  return diffs;
};

export default function AdminInbox() {
  const { isAdmin, user } = useContext(AppContext);
  const [editRequests, setEditRequests] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actingId, setActingId] = useState(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [edits, changes] = await Promise.all([
          AccessRequests.listPending().catch((err) => {
            console.warn("Load edit requests failed:", err);
            return [];
          }),
          ChangeRequests.listPending().catch((err) => {
            console.warn("Load change requests failed:", err);
            return [];
          }),
        ]);
        if (!active) return;
        setEditRequests(edits || []);
        setChangeRequests(changes || []);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load requests:", err);
        setError(err?.message || "Could not load requests");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const handleEditAction = async (id, status) => {
    if (!id || !status || !user) return;
    setActingId(id);
    try {
      await AccessRequests.updateStatus(id, status, user);
      setEditRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Request ${status}`);
    } catch (err) {
      console.error("Update edit request failed:", err);
      toast.error(err?.message || "Could not update request");
    } finally {
      setActingId(null);
    }
  };

  const handleChangeAction = async (id, status) => {
    if (!id || !status || !user) return;
    setActingId(id);
    try {
      if (status === "approved") {
        await ChangeRequests.applyAndUpdate(id, user);
      } else {
        await ChangeRequests.updateStatus(id, status, user);
      }
      setChangeRequests((prev) => prev.filter((r) => r.id !== id));
      toast.success(`Change ${status}`);
    } catch (err) {
      console.error("Update change request failed:", err);
      toast.error(err?.message || "Could not update request");
    } finally {
      setActingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pb-24">
        <Header title="Admin Inbox" subtitle="Admins only" />
        <div className="p-4 text-sm text-stone-600">
          You need admin access to view edit requests.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pb-24">
      <Header title="Admin Inbox" subtitle="Access and change requests" />
      <div className="p-4 space-y-4">
        {loading && <p className="text-sm text-stone-500">Loading requests…</p>}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="space-y-6">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                Edit access requests
              </h2>
              {editRequests.length === 0 ? (
                <p className="text-sm text-stone-500">None pending.</p>
              ) : (
                <div className="space-y-3">
                  {editRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-stone-200 bg-white dark:bg-stone-800 dark:border-stone-700 p-3 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-stone-900 dark:text-stone-100">
                          {req.full_name || req.email || req.user_id || "Unknown user"}
                        </div>
                        <span className="text-xs text-stone-500">
                          {formatAgo(req.created_at)}
                        </span>
                      </div>
                      {req.email && (
                        <div className="text-xs text-stone-500">{req.email}</div>
                      )}
                      {req.reason && (
                        <div className="text-sm text-stone-700 dark:text-stone-200 mt-1">
                          {req.reason}
                        </div>
                      )}
                      <div className="text-xs text-amber-700 font-semibold">
                        Status: {req.status || "pending"}
                      </div>
                      <div className="flex items-center gap-2 pt-2 justify-end">
                        <button
                          type="button"
                          disabled={actingId === req.id}
                          onClick={() => handleEditAction(req.id, "approved")}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={actingId === req.id}
                          onClick={() => handleEditAction(req.id, "rejected")}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-200">
                Change requests
              </h2>
              {changeRequests.length === 0 ? (
                <p className="text-sm text-stone-500">None pending.</p>
              ) : (
                <div className="space-y-3">
                  {changeRequests.map((req) => {
                    const changes = summarizeChanges(req.before_data, req.after_data, req.action);
                    const targetName =
                      (req.after_data && req.after_data.name) ||
                      (req.before_data && req.before_data.name) ||
                      null;
                    return (
                      <div
                        key={req.id}
                        className="rounded-xl border border-stone-200 bg-white dark:bg-stone-800 dark:border-stone-700 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-stone-900 dark:text-stone-100">
                            {req.full_name || req.email || req.user_id || "Unknown user"}
                          </div>
                          <span className="text-xs text-stone-500">
                            {formatAgo(req.created_at)}
                          </span>
                        </div>
                        <div className="text-xs text-stone-500">
                          {req.entity_type || "change"} · {req.action || "update"}
                        </div>
                        {targetName && (
                          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">
                            {targetName}
                          </div>
                        )}
                        {changes.length ? (
                          <div className="mt-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 px-3 py-2 text-xs text-stone-600 dark:text-stone-300 space-y-1">
                            {changes.slice(0, 5).map((line, idx) => (
                              <div key={idx} className="truncate">{line}</div>
                            ))}
                            {changes.length > 5 && (
                              <div className="text-[11px] text-stone-400">+{changes.length - 5} more</div>
                            )}
                          </div>
                        ) : null}
                        {req.reason && (
                          <div className="text-sm text-stone-700 dark:text-stone-200 mt-1">
                            {req.reason}
                          </div>
                        )}
                        <div className="text-xs text-amber-700 font-semibold">
                          Status: {req.status || "pending"}
                        </div>
                        <div className="flex items-center gap-2 pt-2 justify-end">
                          <button
                            type="button"
                            disabled={actingId === req.id}
                            onClick={() => handleChangeAction(req.id, "approved")}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={actingId === req.id}
                            onClick={() => handleChangeAction(req.id, "rejected")}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
