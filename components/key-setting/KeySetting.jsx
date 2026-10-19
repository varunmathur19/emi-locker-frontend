
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  getKeySettings,
  updateKeySetting,
} from "@/services/api";

const getSettingsArray = (response) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
    response?.settings,
    response?.data?.settings,
    response?.result,
    response?.data?.result,
    response?.data?.data?.settings,
    response?.data?.data?.result,
  ];

  return candidates.find(Array.isArray) || [];
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong. Please try again.";

export default function KeySetting() {
  const [keySettings, setKeySettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingIds, setUpdatingIds] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch all records, including inactive records.
  const fetchKeySettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await getKeySettings();

      console.log("KEY SETTINGS API RESPONSE:", response);

      if (
        response?.success === false &&
        !Array.isArray(response?.data)
      ) {
        throw new Error(
          response?.message || "Unable to load key settings."
        );
      }

      const settings = getSettingsArray(response);

      setKeySettings(settings);

      if (settings.length === 0) {
        console.warn(
          "No key settings array found. Check the API response structure."
        );
      }
    } catch (error) {
      console.error("GET KEY SETTINGS ERROR:", error);
      setErrorMessage(getErrorMessage(error));
      setKeySettings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeySettings();
  }, [fetchKeySettings]);

  // Search all settings without filtering by status.
  const filteredSettings = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return keySettings;

    return keySettings.filter((item) => {
      const values = [
        item.id,
        item.root,
        item.root_id,
        item.name,
        item.key,
        item.value,
        item.status,
        Number(item.status) === 1 ? "active" : "inactive",
      ];

      return values.some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );
    });
  }, [keySettings, search]);

  const activeCount = keySettings.filter(
    (item) => Number(item.status) === 1
  ).length;

  const inactiveCount = keySettings.length - activeCount;

  const handleStatusChange = async (item) => {
    if (
      item.id == null ||
      updatingIds.includes(item.id)
    ) {
      return;
    }

    const oldStatus = Number(item.status) === 1 ? 1 : 0;
    const newStatus = oldStatus === 1 ? 0 : 1;

    setUpdatingIds((prev) => [...prev, item.id]);

    // Optimistically update the UI.
    setKeySettings((prev) =>
      prev.map((setting) =>
        setting.id === item.id
          ? { ...setting, status: newStatus }
          : setting
      )
    );

    try {
      const response = await updateKeySetting(item.id, {
        status: newStatus,
      });

      console.log("UPDATE KEY SETTING RESPONSE:", response);

      const payload = response?.data ?? response;

      if (
        response?.success === false ||
        payload?.success === false
      ) {
        throw new Error(
          payload?.message ||
            response?.message ||
            "Unable to update setting status."
        );
      }

      const updatedRecord =
        payload?.data &&
        !Array.isArray(payload.data) &&
        typeof payload.data === "object"
          ? payload.data
          : payload?.setting &&
              typeof payload.setting === "object"
            ? payload.setting
            : {};

      setKeySettings((prev) =>
        prev.map((setting) =>
          setting.id === item.id
            ? {
                ...setting,
                ...updatedRecord,
                status: newStatus,
              }
            : setting
        )
      );

      // Green toast for activation, red toast for deactivation.
      if (newStatus === 1) {
        toast.success(
          `${item.name || "Key setting"} activated successfully.`
        );
      } else {
        toast.error(
          `${item.name || "Key setting"} deactivated successfully.`,
          {
            style: {
              background: "#EF4444",
              color: "#FFFFFF",
            },
            progressStyle: {
              background: "#FFFFFF",
            },
          }
        );
      }
    } catch (error) {
      console.error("UPDATE KEY SETTING STATUS ERROR:", error);

      // Roll back the UI if the API update fails.
      setKeySettings((prev) =>
        prev.map((setting) =>
          setting.id === item.id
            ? { ...setting, status: oldStatus }
            : setting
        )
      );

      toast.error(getErrorMessage(error));
    } finally {
      setUpdatingIds((prev) =>
        prev.filter((id) => id !== item.id)
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Key Settings
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View and manage all active and inactive key settings.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchKeySettings}
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
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total Settings
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {loading ? "—" : keySettings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Active
            </p>
            <p className="mt-2 text-3xl font-bold text-green-600">
              {loading ? "—" : activeCount}
            </p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Inactive
            </p>
            <p className="mt-2 text-3xl font-bold text-red-500">
              {loading ? "—" : inactiveCount}
            </p>
          </div>
        </div>

        {/* Settings Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                All Key Settings
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                {loading
                  ? "Loading settings..."
                  : `Showing ${filteredSettings.length} of ${keySettings.length} settings`}
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, ID, status..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p className="font-semibold">
                Failed to load key settings
              </p>
              <p className="mt-1">{errorMessage}</p>
              <button
                type="button"
                onClick={fetchKeySettings}
                className="mt-3 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Root / ID
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`loading-${index}`}>
                      {[1, 2, 3, 4].map((cell) => (
                        <td key={cell} className="px-6 py-5">
                          <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredSettings.length > 0 ? (
                  filteredSettings.map((item, index) => {
                    const isActive = Number(item.status) === 1;
                    const isUpdating = updatingIds.includes(item.id);

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
                            {item.root ??
                              item.root_id ??
                              `Root ${item.id ?? "—"}`}
                          </span>
                        </td>

                        <td className="px-6 py-5">
                          <div className="font-semibold text-slate-800">
                            {item.name || "Unnamed"}
                          </div>

                          {item.key != null && (
                            <div className="mt-1 break-all text-xs text-slate-500">
                              Key: {String(item.key)}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={isActive}
                              aria-label={`${
                                isActive ? "Deactivate" : "Activate"
                              } ${item.name || "key setting"}`}
                              disabled={isUpdating || item.id == null}
                              onClick={() => handleStatusChange(item)}
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                                isActive
                                  ? "bg-green-500"
                                  : "bg-slate-300"
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
                    <td colSpan={4} className="px-6 py-14 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <svg
                          className="h-6 w-6 text-slate-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <circle
                            cx="11"
                            cy="11"
                            r="7"
                            stroke="currentColor"
                            strokeWidth="1.7"
                          />
                          <path
                            d="m16 16 4 4"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      <p className="mt-3 font-semibold text-slate-700">
                        {search
                          ? "No matching settings found"
                          : "No key settings found"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {search
                          ? "Try a different search term."
                          : "The API did not return any key settings."}
                      </p>

                      {search && (
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
