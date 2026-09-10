
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getModules,
  updateModule,
} from "@/services/api";

const formatModules = (modules = []) => {
  return modules
    .map((item, index) => ({
      id: item?.id ?? index + 1,
      name: item?.name || "",
      slug: item?.slug || "",
      // icon: item?.icon || "",
      sequence: Number(item?.sequence ?? index + 1),
      status: Number(item?.status ?? 1),
    }))
    .sort((a, b) => a.sequence - b.sequence);
};

export default function ModulePage() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const loadModules = async () => {
    try {
      setLoading(true);

      const response = await getModules();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        setModules(formatModules(response.data));
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("GET MODULES ERROR:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load modules"
      );
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleToggleStatus = async (moduleItem) => {
    if (!moduleItem?.id || updatingStatus !== null) {
      return;
    }

    const currentStatus = Number(
      moduleItem?.status ?? 1
    );

    const newStatus =
      currentStatus === 1 ? 0 : 1;

    try {
      setUpdatingStatus(moduleItem.id);

      const response = await updateModule({
        id: moduleItem.id,
        status: newStatus,
      });

      if (response?.success === true) {
        setModules((prev) =>
          prev.map((item) =>
            Number(item.id) ===
            Number(moduleItem.id)
              ? {
                  ...item,
                  status: newStatus,
                }
              : item
          )
        );

        toast.success(
          newStatus === 1
            ? "Module activated successfully"
            : "Module deactivated successfully"
        );
      } else {
        toast.error(
          response?.message ||
            "Failed to update module status"
        );
      }
    } catch (error) {
      console.error(
        "UPDATE MODULE STATUS ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update module status"
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div>
          <h2 className="mb-4 text-lg font-semibold text-slate-700">
            Module List
          </h2>

          {loading ? (
            <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Loading modules...
            </div>
          ) : modules.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No modules found
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module, index) => {
                const isActive =
                  Number(module?.status ?? 1) ===
                  1;

                const isUpdating =
                  updatingStatus === module.id;

                return (
                  <div
                    key={module.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:shadow-sm"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                        <span className="">
                          {module.sequence ||
                            index + 1}
                        </span>
                      </div>

                      {/* <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-blue-50">
                        <span className="text-sm font-bold text-blue-600">
                          {module.icon || "M"}
                        </span>
                      </div> */}

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-800">
                          {module.name}
                        </p>

                        {/* <p className="mt-0.5 text-xs text-slate-500">
                          Slug: {module.slug}
                        </p>

                        <p className="text-xs text-slate-500">
                          Icon: {module.icon}
                        </p>

                        <p className="text-xs text-slate-500">
                          Sequence: {module.sequence}
                        </p> */}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleStatus(module)
                        }
                        disabled={
                          isUpdating ||
                          updatingStatus !== null
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                          isActive
                            ? "bg-green-500"
                            : "bg-slate-300"
                        } ${
                          isUpdating ||
                          updatingStatus !== null
                            ? "cursor-not-allowed opacity-50"
                            : "cursor-pointer"
                        }`}
                        title={
                          isActive
                            ? "Deactivate Module"
                            : "Activate Module"
                        }
                        aria-label={
                          isActive
                            ? "Deactivate module"
                            : "Activate module"
                        }
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                            isActive
                              ? "translate-x-5"
                              : "translate-x-0.5"
                          }`}
                        />
                      </button>

                      <span
                        className={`min-w-[58px] text-xs font-semibold ${
                          isActive
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {isActive
                          ? "Active"
                          : "Inactive"}
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
