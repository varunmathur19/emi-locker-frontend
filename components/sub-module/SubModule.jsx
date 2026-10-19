
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FiLayers, FiRefreshCw, FiSearch } from "react-icons/fi";
import {
  getModules,
  getSubModules,
  updateSubModule,
} from "@/services/api";

export default function SubModule() {
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null);

  const loadModules = useCallback(async () => {
    try {
      const response = await getModules();

      if (response?.success && Array.isArray(response?.data)) {
        setModules(response.data);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("GET MODULES ERROR:", error);
      setModules([]);
    }
  }, []);

  const loadSubModules = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);

      const response = await getSubModules();

      if (response?.success && Array.isArray(response?.data)) {
        setSubModules(response.data);
      } else {
        setSubModules([]);
        if (response?.message) toast.error(response.message);
      }
    } catch (error) {
      console.error("GET SUB MODULES ERROR:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load sub modules"
      );

      setSubModules([]);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadModules();
    loadSubModules();
  }, [loadModules, loadSubModules]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await Promise.all([
        loadModules(),
        loadSubModules(false),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleStatusToggle = async (subModule) => {
    if (statusLoading !== null || !subModule?.id) return;

    const currentStatus = Number(subModule.status ?? 0);
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      setStatusLoading(subModule.id);

      const response = await updateSubModule({
        id: subModule.id,
        status: newStatus,
      });

      if (!response?.success) {
        toast.error(
          response?.message || "Failed to update sub module status"
        );
        return;
      }

      setSubModules((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(subModule.id)
            ? { ...item, status: newStatus }
            : item
        )
      );

      if (newStatus === 1) {
        toast.success("Sub module activated successfully");
      } else {
        toast.error("Sub module deactivated successfully", {
          style: {
            background: "#EF4444",
            color: "#FFFFFF",
          },
          progressStyle: {
            background: "#FFFFFF",
          },
        });
      }
    } catch (error) {
      console.error("UPDATE SUB MODULE STATUS ERROR:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update sub module status"
      );
    } finally {
      setStatusLoading(null);
    }
  };

  const filteredSubModules = subModules.filter((item) => {
    const matchesSearch = String(item?.name ?? "")
      .toLowerCase()
      .includes(searchTerm.trim().toLowerCase());

    const isActive = Number(item?.status ?? 0) === 1;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && isActive) ||
      (filterStatus === "inactive" && !isActive);

    return matchesSearch && matchesStatus;
  });

  const activeCount = subModules.filter(
    (item) => Number(item?.status ?? 0) === 1
  ).length;

  const inactiveCount = subModules.length - activeCount;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <FiLayers size={23} />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 sm:text-2xl">
              Sub Module Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage and control all sub modules
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FiRefreshCw
            size={16}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Total Sub Modules
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-800">
              {subModules.length}
            </h2>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiLayers size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-green-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Active Sub Modules
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-green-600">
              {activeCount}
            </h2>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-xl text-green-600">
              ✓
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-red-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Inactive Sub Modules
          </p>
          <div className="mt-3 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-red-500">
              {inactiveCount}
            </h2>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-xl text-red-500">
              ×
            </span>
          </div>
        </div>
      </div>

      {/* Sub Module List */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Sub Module List
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View all records and update their status
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative w-full sm:min-w-64">
                <FiSearch
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search sub modules..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {loading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-slate-500">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              <p className="text-sm">Loading sub modules...</p>
            </div>
          ) : filteredSubModules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 px-4 py-14 text-center">
              <FiLayers
                size={34}
                className="mx-auto mb-3 text-slate-300"
              />
              <p className="font-semibold text-slate-700">
                No sub modules found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-800">
                    {filteredSubModules.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-800">
                    {subModules.length}
                  </span>{" "}
                  sub modules
                </p>
              </div>

              <div className="space-y-3">
                {filteredSubModules.map((subModule, index) => {
                  const isActive =
                    Number(subModule?.status ?? 0) === 1;

                  const isUpdating =
                    Number(statusLoading) === Number(subModule.id);

                  return (
                    <div
                      key={subModule.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            isActive
                              ? "bg-blue-50 text-blue-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="break-words font-semibold text-slate-800">
                            {subModule.name || "Unnamed Sub Module"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            ID: {subModule.id}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span
                          className={`inline-flex min-w-20 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                            isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={isActive}
                          aria-label={`${
                            isActive ? "Deactivate" : "Activate"
                          } ${subModule.name || "sub module"}`}
                          title={
                            isActive
                              ? "Deactivate Sub Module"
                              : "Activate Sub Module"
                          }
                          onClick={() => handleStatusToggle(subModule)}
                          disabled={statusLoading !== null}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive ? "bg-green-500" : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                              isActive
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />

                          {isUpdating && (
                            <span className="absolute inset-0 rounded-full ring-2 ring-blue-400 ring-offset-1" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
