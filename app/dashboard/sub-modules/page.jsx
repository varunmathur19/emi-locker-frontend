
"use client";

import { useEffect, useState } from "react";
import { RiArrowDownSLine } from "react-icons/ri";
import { toast } from "react-toastify";
import {
  getModules,
  getSubModules,
  updateSubModule,
} from "@/services/api";

export default function SubModulePage() {
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);
  const [filterModule, setFilterModule] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null);

  useEffect(() => {
    loadModules();
    loadSubModules();
  }, []);

  const loadModules = async () => {
    try {
      const response = await getModules();

      if (response?.success) {
        setModules(response.data || []);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("GET MODULES ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load modules"
      );
      setModules([]);
    }
  };

  const loadSubModules = async () => {
    try {
      setLoading(true);

      const response = await getSubModules();

      if (response?.success) {
        setSubModules(response.data || []);
      } else {
        setSubModules([]);
      }
    } catch (error) {
      console.error("GET SUB MODULES ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Failed to load sub modules"
      );
      setSubModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (subModule) => {
    if (statusLoading !== null) {
      return;
    }

    const currentStatus = Number(subModule.status ?? 1);
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
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      toast.success(
        newStatus === 1
          ? "Sub module activated successfully"
          : "Sub module deactivated successfully"
      );
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

  const selectedModuleName =
    modules.find(
      (module) => Number(module.id) === Number(filterModule)
    )?.name || "";

  const filteredSubModules = filterModule
    ? subModules.filter(
        (item) => Number(item.module_id) === Number(filterModule)
      )
    : subModules;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div>
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">
                {selectedModuleName
                  ? `${selectedModuleName} Sub Modules`
                  : "Sub Module List"}
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                {filterModule
                  ? `Showing sub modules of ${selectedModuleName}`
                  : "Showing all sub modules"}
              </p>
            </div>

            <div className="relative w-full md:w-56">
              <select
                value={filterModule}
                onChange={(e) => setFilterModule(e.target.value)}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modules</option>

                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>

              <RiArrowDownSLine
                size={20}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          {loading && subModules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              Loading sub modules...
            </div>
          ) : filteredSubModules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              {filterModule
                ? `No sub modules found for ${selectedModuleName}`
                : "No sub modules found"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubModules.map((subModule, index) => {
                const moduleName =
                  modules.find(
                    (module) =>
                      Number(module.id) === Number(subModule.module_id)
                  )?.name || "Unknown Module";

                const isActive =
                  Number(subModule.status ?? 1) === 1;

                return (
                  <div
                    key={subModule.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-4 transition hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                        {index + 1}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {subModule.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Module: {moduleName}
                        </p>

                        {subModule.icon && (
                          <p className="mt-0.5 text-xs text-slate-400">
                            Icon: {subModule.icon}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusToggle(subModule)}
                        disabled={statusLoading !== null}
                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                          isActive
                            ? "bg-green-500"
                            : "bg-slate-300"
                        } ${
                          statusLoading !== null
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                        aria-label={
                          isActive
                            ? "Deactivate sub module"
                            : "Activate sub module"
                        }
                        title={
                          isActive
                            ? "Deactivate Sub Module"
                            : "Activate Sub Module"
                        }
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                            isActive
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>

                      <span
                        className={`min-w-[58px] rounded-full px-2.5 py-1 text-center text-xs font-semibold ${
                          isActive
                            ? "bg-green-50 text-green-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}