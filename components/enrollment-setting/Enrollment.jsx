"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import {
  getEnrollment,
  updateEnrollment,
} from "@/services/api";

const getEnrollmentArray = (response) => {
  const candidates = [
    response?.data?.data,
    response?.data?.enrollments,
    response?.data,
    response?.enrollments,
    response,
  ];

  return candidates.find(Array.isArray) || [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function Enrollment() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [savingNameIds, setSavingNameIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasFetched = useRef(false);

  const fetchEnrollment = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getEnrollment();
      const payload = response?.data ?? response;

      if (
        response?.success === false ||
        payload?.success === false
      ) {
        throw new Error(
          payload?.message || "Unable to load enrollment data."
        );
      }

      setEnrollments(getEnrollmentArray(response));
    } catch (error) {
      console.error("GET ENROLLMENT ERROR:", error);
      setErrorMessage(getErrorMessage(error));
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;

    hasFetched.current = true;
    fetchEnrollment();
  }, [fetchEnrollment]);

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return enrollments;

    return enrollments.filter((item) =>
      [
        item.id,
        item.name,
        item.status,
        Number(item.status) === 1 ? "active" : "inactive",
        item.created_at,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [enrollments, search]);

  const activeCount = enrollments.filter(
    (item) => Number(item.status) === 1
  ).length;

  const inactiveCount = enrollments.length - activeCount;

  const startEditing = (item) => {
    setEditingId(item.id);
    setEditingName(item.name ?? "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleNameSave = async (item) => {
    if (item.id == null || savingNameIds.includes(item.id)) return;

    const newName = editingName.trim();

    if (!newName) {
      toast.error("Name cannot be empty.");
      return;
    }

    if (newName.length > 150) {
      toast.error("Name cannot exceed 150 characters.");
      return;
    }

    if (newName === String(item.name ?? "").trim()) {
      cancelEditing();
      return;
    }

    setSavingNameIds((prev) => [...prev, item.id]);

    try {
      const response = await updateEnrollment(item.id, {
        name: newName,
      });

      const payload = response?.data ?? response;

      if (
        response?.success === false ||
        payload?.success === false
      ) {
        throw new Error(
          payload?.message || "Unable to update enrollment name."
        );
      }

      const updatedRecord =
        payload?.data &&
        !Array.isArray(payload.data) &&
        typeof payload.data === "object"
          ? payload.data
          : payload?.enrollment &&
              typeof payload.enrollment === "object"
            ? payload.enrollment
            : {};

      setEnrollments((prev) =>
        prev.map((enrollment) =>
          String(enrollment.id) === String(item.id)
            ? { ...enrollment, ...updatedRecord, name: newName }
            : enrollment
        )
      );

      toast.success("Enrollment name updated successfully.");
      cancelEditing();
    } catch (error) {
      console.error("UPDATE ENROLLMENT NAME ERROR:", error);
      toast.error(getErrorMessage(error));
    } finally {
      setSavingNameIds((prev) =>
        prev.filter((id) => String(id) !== String(item.id))
      );
    }
  };

  const handleStatusChange = async (item) => {
    if (
      item.id == null ||
      updatingIds.some((id) => String(id) === String(item.id)) ||
      savingNameIds.some((id) => String(id) === String(item.id))
    ) {
      return;
    }

    const oldStatus = Number(item.status) === 1 ? 1 : 0;
    const newStatus = oldStatus === 1 ? 0 : 1;

    setUpdatingIds((prev) => [...prev, item.id]);

    // Optimistic update.
    setEnrollments((prev) =>
      prev.map((enrollment) =>
        String(enrollment.id) === String(item.id)
          ? { ...enrollment, status: newStatus }
          : enrollment
      )
    );

    try {
      const response = await updateEnrollment(item.id, {
        status: newStatus,
      });

      const payload = response?.data ?? response;

      if (
        response?.success === false ||
        payload?.success === false
      ) {
        throw new Error(
          payload?.message || "Unable to update enrollment status."
        );
      }

      const updatedRecord =
        payload?.data &&
        !Array.isArray(payload.data) &&
        typeof payload.data === "object"
          ? payload.data
          : payload?.enrollment &&
              typeof payload.enrollment === "object"
            ? payload.enrollment
            : {};

      setEnrollments((prev) =>
        prev.map((enrollment) =>
          String(enrollment.id) === String(item.id)
            ? { ...enrollment, ...updatedRecord, status: newStatus }
            : enrollment
        )
      );

      // Active = green toast; Deactivated = red toast.
      if (newStatus === 1) {
        toast.success(
          `${item.name || "Enrollment"} activated successfully.`
        );
      } else {
        toast.error(
          `${item.name || "Enrollment"} deactivated successfully.`
        );
      }
    } catch (error) {
      console.error("UPDATE ENROLLMENT STATUS ERROR:", error);

      // Roll back UI if API request fails.
      setEnrollments((prev) =>
        prev.map((enrollment) =>
          String(enrollment.id) === String(item.id)
            ? { ...enrollment, status: oldStatus }
            : enrollment
        )
      );

      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingIds((prev) =>
        prev.filter((id) => String(id) !== String(item.id))
      );
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Enrollment Setting
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View, rename, and manage enrollment settings.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchEnrollment}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M20 11a8 8 0 0 0-14.9-3L3 11m0-6v6h6m-5 2a8 8 0 0 0 14.9 3L21 13m0 6v-6h-6"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total Enrollments"
            value={loading ? "—" : enrollments.length}
          />

          <SummaryCard
            label="Active"
            value={loading ? "—" : activeCount}
            valueClass="text-green-600"
          />

          <SummaryCard
            label="Inactive"
            value={loading ? "—" : inactiveCount}
            valueClass="text-red-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                All Enrollments
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Loading enrollments..."
                  : `Showing ${filteredEnrollments.length} of ${enrollments.length} enrollments`}
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, ID, status..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 sm:max-w-xs"
            />
          </div>

          {errorMessage && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">
                Failed to load enrollment data
              </p>
              <p className="mt-1">{errorMessage}</p>

              <button
                type="button"
                onClick={fetchEnrollment}
                disabled={loading}
                className="mt-3 font-semibold underline underline-offset-2 disabled:opacity-50"
              >
                Try again
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <TableHeader>#</TableHeader>
                  <TableHeader>Enrollment ID</TableHeader>
                  <TableHeader>Name</TableHeader>
                  <TableHeader>Created At</TableHeader>
                  <TableHeader align="right">Status</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`loading-${index}`}>
                      {[1, 2, 3, 4, 5].map((cell) => (
                        <td key={cell} className="px-6 py-5">
                          <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : !errorMessage && filteredEnrollments.length > 0 ? (
                  filteredEnrollments.map((item, index) => {
                    const isActive = Number(item.status) === 1;
                    const isUpdating = updatingIds.some(
                      (id) => String(id) === String(item.id)
                    );
                    const isSavingName = savingNameIds.some(
                      (id) => String(id) === String(item.id)
                    );
                    const isEditing =
                      String(editingId) === String(item.id);

                    return (
                      <tr
                        key={item.id ?? `${item.name}-${index}`}
                        className="transition hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-5 text-sm text-slate-500">
                          {index + 1}
                        </td>

                        <td className="px-6 py-5">
                          <span className="inline-flex rounded-lg border border-blue-100 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
                            {item.id ?? "—"}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          {isEditing ? (
                            <div className="flex min-w-[280px] flex-col gap-2 sm:flex-row sm:items-center">
                              <input
                                type="text"
                                value={editingName}
                                onChange={(event) =>
                                  setEditingName(event.target.value)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleNameSave(item);
                                  }

                                  if (event.key === "Escape") {
                                    cancelEditing();
                                  }
                                }}
                                autoFocus
                                maxLength={150}
                                disabled={isSavingName}
                                className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                                placeholder="Enter enrollment name"
                              />

                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleNameSave(item)}
                                  disabled={isSavingName}
                                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                  {isSavingName ? "Saving..." : "Save"}
                                </button>

                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={isSavingName}
                                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="min-w-0">
                                <div className="break-words font-semibold text-slate-800">
                                  {item.name || "Unnamed"}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => startEditing(item)}
                                disabled={
                                  item.id == null ||
                                  editingId !== null ||
                                  savingNameIds.length > 0
                                }
                                aria-label={`Edit ${item.name || "enrollment"} name`}
                                title="Edit name"
                                className="shrink-0 rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-50"
                              >
                                <svg
                                  className="h-4 w-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="m14 6 4 4M4 20l4.2-.8L19 8.4a2.1 2.1 0 0 0-3-3L5.2 16.2 4 20Z"
                                    stroke="currentColor"
                                    strokeWidth="1.8"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString(
                                "en-IN"
                              )
                            : "—"}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              aria-label={`${
                                isActive ? "Deactivate" : "Activate"
                              } ${item.name || "enrollment"}`}
                              disabled={
                                isUpdating ||
                                isSavingName ||
                                item.id == null
                              }
                              onClick={() => handleStatusChange(item)}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                                isActive ? "bg-green-500" : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                  isActive
                                    ? "translate-x-5"
                                    : "translate-x-0.5"
                                }`}
                              />
                            </button>

                            <span
                              className={`min-w-[68px] text-right text-xs font-semibold ${
                                isActive
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {isUpdating
                                ? "Saving..."
                                : isActive
                                  ? "Active"
                                  : "Inactive"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <p className="font-semibold text-slate-700">
                        {errorMessage
                          ? "Unable to display enrollments"
                          : search
                            ? "No matching enrollments found"
                            : "No enrollment data found"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {errorMessage
                          ? "Please try refreshing the data."
                          : search
                            ? "Try a different search term."
                            : "The API did not return any enrollment records."}
                      </p>

                      {search && !errorMessage && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function TableHeader({ children, align = "left" }) {
  return (
    <th
      className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}