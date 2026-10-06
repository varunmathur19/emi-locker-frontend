
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  getModules,
  updateModule,
  getRoles,
  updateRoleStatus,
} from "@/services/api";

const formatModules = (modules = []) => {
  return modules
    .map((item, index) => ({
      id: item?.id ?? index + 1,
      name: item?.name || "",
      slug: item?.slug || "",
      sequence: Number(
        item?.sequence ?? index + 1
      ),
      status: Number(item?.status ?? 1),
    }))
    .sort((a, b) => a.sequence - b.sequence);
};

const formatRoles = (roles = []) => {
  return roles
    .map((item, index) => ({
      id: item?.id ?? index + 1,
      roleId: Number(
        item?.role_id ?? item?.id ?? 0
      ),
      name: item?.name || "User",
      slug: item?.slug || "",
      sequence: Number(
        item?.sequence ?? index + 1
      ),
      status: Number(item?.status ?? 1),
    }))
    .sort((a, b) => a.sequence - b.sequence);
};

export default function ModulePage() {
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] =
    useState(true);

  const [updatingStatus, setUpdatingStatus] =
    useState(null);

  const [updatingRoleStatus, setUpdatingRoleStatus] =
    useState(null);

  const loadModules = async () => {
    try {
      setLoading(true);

      const response = await getModules();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        setModules(
          formatModules(response.data)
        );
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error(
        "GET MODULES ERROR:",
        error
      );

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

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const response = await getRoles();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        setRoles(
          formatRoles(response.data)
        );
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error(
        "GET ROLES ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load roles"
      );

      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    loadModules();
    loadRoles();
  }, []);

  const handleToggleModuleStatus = async (
    moduleItem
  ) => {
    if (
      !moduleItem?.id ||
      updatingStatus !== null ||
      updatingRoleStatus !== null
    ) {
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

        if (
          typeof window !== "undefined"
        ) {
          window.dispatchEvent(
            new Event("modules_updated")
          );
        }

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

  const handleToggleRoleStatus = async (
    roleItem
  ) => {
    if (
      !roleItem?.id ||
      updatingStatus !== null ||
      updatingRoleStatus !== null
    ) {
      return;
    }

    const currentStatus = Number(
      roleItem?.status ?? 1
    );

    const newStatus =
      currentStatus === 1 ? 0 : 1;

    try {
      setUpdatingRoleStatus(roleItem.id);

      const response =
        await updateRoleStatus(
          roleItem.id,
          newStatus
        );

      if (response?.success === true) {
        setRoles((prev) =>
          prev.map((item) =>
            Number(item.id) ===
            Number(roleItem.id)
              ? {
                  ...item,
                  status: newStatus,
                }
              : item
          )
        );

        toast.success(
          newStatus === 1
            ? "Role activated successfully"
            : "Role deactivated successfully"
        );
      } else {
        toast.error(
          response?.message ||
            "Failed to update role status"
        );
      }
    } catch (error) {
      console.error(
        "UPDATE ROLE STATUS ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update role status"
      );
    } finally {
      setUpdatingRoleStatus(null);
    }
  };

  const renderToggle = (
    isActive,
    isUpdating,
    onClick,
    title
  ) => {
    const isDisabled =
      isUpdating ||
      updatingStatus !== null ||
      updatingRoleStatus !== null;

    return (
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
            isActive
              ? "bg-green-500"
              : "bg-slate-300"
          } ${
            isDisabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer"
          }`}
          title={title}
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
    );
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
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
              {modules.map(
                (module, index) => {
                  const isActive =
                    Number(
                      module?.status ?? 1
                    ) === 1;

                  const isUpdating =
                    updatingStatus ===
                    module.id;

                  return (
                    <div
                      key={module.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                          {module.sequence ||
                            index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">
                            {module.name}
                          </p>
                        </div>
                      </div>

                      {renderToggle(
                        isActive,
                        isUpdating,
                        () =>
                          handleToggleModuleStatus(
                            module
                          ),
                        isActive
                          ? "Deactivate Module"
                          : "Activate Module"
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">
             List
          </h2>

          {loadingRoles ? (
            <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              Loading roles...
            </div>
          ) : roles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No roles found
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map(
                (role, index) => {
                  const isActive =
                    Number(
                      role?.status ?? 1
                    ) === 1;

                  const isUpdating =
                    updatingRoleStatus ===
                    role.id;

                  return (
                    <div
                      key={role.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                          {role.sequence ||
                            index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">
                            {role.name}
                          </p>
                        </div>
                      </div>

                      {renderToggle(
                        isActive,
                        isUpdating,
                        () =>
                          handleToggleRoleStatus(
                            role
                          ),
                        isActive
                          ? "Deactivate Role"
                          : "Activate Role"
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

