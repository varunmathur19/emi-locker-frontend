
"use client";

import { useCallback, useEffect, useMemo,useRef, useState } from "react";
import { toast } from "react-toastify";

import {
  getModules,
  updateModule,
  getRoles,
  updateRoleStatus,
} from "@/services/api";

const formatModules = (modules = []) =>
  modules
    .map((item, index) => ({
      id: item?.id ?? index + 1,
      name: item?.name || "",
      slug: item?.slug || "",
      sequence: Number(item?.sequence ?? index + 1),
      status: Number(item?.status ?? 1),
    }))
    .sort((a, b) => a.sequence - b.sequence);

const formatRoles = (roles = []) =>
  roles
    .map((item, index) => ({
      id: item?.id ?? index + 1,
      roleId: Number(item?.role_id ?? item?.id ?? 0),
      name: item?.name || "User",
      slug: item?.slug || "",
      sequence: Number(item?.sequence ?? index + 1),
      status: Number(item?.status ?? 1),
    }))
    .sort((a, b) => a.sequence - b.sequence);

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const showDeactivateToast = (message) => {
  toast.error(message, {
    style: {
      background: "#EF4444",
      color: "#FFFFFF",
      borderRadius: "12px",
    },
    progressStyle: {
      background: "#FFFFFF",
    },
  });
};

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m16 16 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefreshIcon({ spinning = false }) {
  return (
    <svg
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 7v5h-5M4 17v-5h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.6 9a7 7 0 0 1 12-2L20 12M4 12l2.4 5a7 7 0 0 0 12-2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ModuleIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function RoleIcon() {
  return (
    <svg
      className="h-6 w-6"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="9"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M2.8 20a6.2 6.2 0 0 1 12.4 0M16 5.5a3.5 3.5 0 0 1 0 6.8M18 14a5.5 5.5 0 0 1 3.2 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({ title, value, description, icon, color }) {
  const colors = {
    blue: {
      icon: "bg-blue-50 text-blue-600 ring-blue-100",
      value: "text-slate-900",
      border: "hover:border-blue-200",
    },
    green: {
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-100",
      value: "text-emerald-600",
      border: "hover:border-emerald-200",
    },
    red: {
      icon: "bg-red-50 text-red-600 ring-red-100",
      value: "text-red-600",
      border: "hover:border-red-200",
    },
  };

  const theme = colors[color] || colors.blue;

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p
            className={`mt-3 text-3xl font-bold tracking-tight ${theme.value}`}
          >
            {value}
          </p>

          <p className="mt-1.5 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${theme.icon}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative w-full sm:w-64">
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        <SearchIcon />
      </span>

      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
      />
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"
          : "bg-red-50 text-red-600 ring-1 ring-inset ring-red-100"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-red-500"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ToggleSwitch({
  active,
  loading,
  disabled,
  onClick,
  title,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={title}
      title={title}
      onClick={onClick}
      disabled={disabled || loading}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50 ${
        active ? "bg-emerald-500" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
          active ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {loading && (
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
        )}
      </span>
    </button>
  );
}

function LoadingRows() {
  return (
    <div className="space-y-3 p-4 sm:p-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex animate-pulse items-center justify-between gap-3 rounded-xl border border-slate-100 p-3.5"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100" />
            <div className="space-y-2">
              <div className="h-3.5 w-32 rounded bg-slate-100" />
              <div className="h-3 w-20 rounded bg-slate-100" />
            </div>
          </div>
          <div className="h-6 w-11 shrink-0 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ search, label }) {
  return (
    <div className="px-5 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <SearchIcon />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-700">
        {search ? "No matching results" : `No ${label} found`}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {search
          ? "Try another name or search term."
          : `There are no ${label} to display right now.`}
      </p>
    </div>
  );
}

function ManagementPanel({
  title,
  subtitle,
  icon,
  count,
  search,
  onSearchChange,
  searchPlaceholder,
  onRefresh,
  loading,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                {icon}
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900">
                  {title}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {subtitle}
                </p>
              </div>
            </div>

            <span className="inline-flex shrink-0 items-center rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-600">
              {count} total
            </span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={onSearchChange}
                placeholder={searchPlaceholder}
              />
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshIcon spinning={loading} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {children}
    </section>
  );
}

export default function ModulePage() {
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
const hasFetched = useRef(false);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [updatingRoleStatus, setUpdatingRoleStatus] = useState(null);

  const [moduleSearch, setModuleSearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const loadModules = useCallback(async () => {
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
        getErrorMessage(error, "Failed to load modules")
      );

      setModules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    try {
      setLoadingRoles(true);

      const response = await getRoles();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        setRoles(formatRoles(response.data));
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("GET ROLES ERROR:", error);

      toast.error(
        getErrorMessage(error, "Failed to load roles")
      );

      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  }, []);

useEffect(() => {
  if (hasFetched.current) return;

  hasFetched.current = true;

  loadModules();
  loadRoles();
}, [loadModules, loadRoles]);

  const activeModules = modules.filter(
    (item) => Number(item.status) === 1
  ).length;

  const inactiveModules = modules.length - activeModules;

  const activeRoles = roles.filter(
    (item) => Number(item.status) === 1
  ).length;

  const inactiveRoles = roles.length - activeRoles;

  const filteredModules = useMemo(() => {
    const query = moduleSearch.trim().toLowerCase();

    if (!query) return modules;

    return modules.filter((item) =>
      [item.name, item.slug, item.id, item.sequence]
        .some((value) =>
          String(value ?? "").toLowerCase().includes(query)
        )
    );
  }, [modules, moduleSearch]);

  const filteredRoles = useMemo(() => {
    const query = roleSearch.trim().toLowerCase();

    if (!query) return roles;

    return roles.filter((item) =>
      [
        item.name,
        item.slug,
        item.id,
        item.roleId,
        item.sequence,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [roles, roleSearch]);

  const handleToggleModuleStatus = async (moduleItem) => {
    if (
      !moduleItem?.id ||
      updatingStatus !== null ||
      updatingRoleStatus !== null
    ) {
      return;
    }

    const currentStatus = Number(moduleItem.status ?? 1);
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      setUpdatingStatus(moduleItem.id);

      const response = await updateModule({
        id: moduleItem.id,
        status: newStatus,
      });

      if (!response?.success) {
        toast.error(
          response?.message || "Failed to update module status"
        );
        return;
      }

      setModules((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(moduleItem.id)
            ? { ...item, status: newStatus }
            : item
        )
      );

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("modules_updated"));
      }

      if (newStatus === 1) {
        toast.success("Module activated successfully");
      } else {
        showDeactivateToast("Module deactivated successfully");
      }
    } catch (error) {
      console.error("UPDATE MODULE STATUS ERROR:", error);

      toast.error(
        getErrorMessage(error, "Failed to update module status")
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleToggleRoleStatus = async (roleItem) => {
    if (
      !roleItem?.id ||
      updatingStatus !== null ||
      updatingRoleStatus !== null
    ) {
      return;
    }

    const currentStatus = Number(roleItem.status ?? 1);
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      setUpdatingRoleStatus(roleItem.id);

      const response = await updateRoleStatus(
        roleItem.id,
        newStatus
      );

      if (!response?.success) {
        toast.error(
          response?.message || "Failed to update role status"
        );
        return;
      }

      setRoles((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(roleItem.id)
            ? { ...item, status: newStatus }
            : item
        )
      );

      if (newStatus === 1) {
        toast.success("Role activated successfully");
      } else {
        showDeactivateToast("Role deactivated successfully");
      }
    } catch (error) {
      console.error("UPDATE ROLE STATUS ERROR:", error);

      toast.error(
        getErrorMessage(error, "Failed to update role status")
      );
    } finally {
      setUpdatingRoleStatus(null);
    }
  };

  const anyUpdateInProgress =
    updatingStatus !== null || updatingRoleStatus !== null;

  return (
    // <main className="min-h-screen bg-slate-50/80 px-3 py-5 sm:px-5 sm:py-7 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative p-5 sm:p-7">
            <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-blue-50/80" />
            <div className="pointer-events-none absolute -right-3 top-14 h-28 w-28 rounded-full border-[20px] border-indigo-50/70" />

            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  System Configuration
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Module & Role Management
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Manage system modules and user roles. Control
                  availability using the status switches below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  loadModules();
                  loadRoles();
                }}
                disabled={loading || loadingRoles}
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-4 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshIcon
                  spinning={loading || loadingRoles}
                />
                Refresh All
              </button>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Modules"
            value={loading ? "—" : modules.length}
            description="Configured system modules"
            icon={<ModuleIcon />}
            color="blue"
          />

          <StatCard
            title="Active Modules"
            value={loading ? "—" : activeModules}
            description="Currently marked active"
            icon={
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m5 12 4 4L19 6"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            }
            color="green"
          />

          <StatCard
            title="Total Roles"
            value={loadingRoles ? "—" : roles.length}
            description="Configured user roles"
            icon={<RoleIcon />}
            color="blue"
          />

          <StatCard
            title="Inactive Items"
            value={
              loading || loadingRoles
                ? "—"
                : inactiveModules + inactiveRoles
            }
            description={`${inactiveModules} modules · ${inactiveRoles} roles inactive`}
            icon={
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path
                  d="M12 7v5m0 4h.01"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            }
            color="red"
          />
        </div>

        {/* Module and Role Panels */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          {/* Modules */}
          <ManagementPanel
            title="Module List"
            subtitle="Manage application modules"
            icon={<ModuleIcon />}
            count={modules.length}
            search={moduleSearch}
            onSearchChange={setModuleSearch}
            searchPlaceholder="Search modules..."
            onRefresh={loadModules}
            loading={loading}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Module details
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </span>
            </div>

            {loading ? (
              <LoadingRows />
            ) : filteredModules.length === 0 ? (
              <EmptyState
                search={moduleSearch}
                label="modules"
              />
            ) : (
              <div className="space-y-2 p-3 sm:p-4">
                {filteredModules.map((module, index) => {
                  const isActive = Number(module.status) === 1;
                  const isUpdating =
                    updatingStatus === module.id;

                  return (
                    <div
                      key={module.id}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-white p-3 transition duration-200 hover:border-blue-100 hover:bg-blue-50/30 hover:shadow-sm sm:p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                            isActive
                              ? "bg-blue-50 text-blue-700 group-hover:bg-blue-100"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {module.sequence || index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {module.name || "Unnamed module"}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {module.slug
                              ? module.slug
                              : `Module ID: ${module.id}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2.5">
                        <div className="hidden sm:block">
                          <StatusBadge active={isActive} />
                        </div>

                        <ToggleSwitch
                          active={isActive}
                          loading={isUpdating}
                          disabled={anyUpdateInProgress}
                          onClick={() =>
                            handleToggleModuleStatus(module)
                          }
                          title={
                            isActive
                              ? "Deactivate Module"
                              : "Activate Module"
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && filteredModules.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredModules.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {modules.length}
                  </span>{" "}
                  modules
                </p>
              </div>
            )}
          </ManagementPanel>

          {/* Roles */}
          <ManagementPanel
            title="Role List"
            subtitle="Manage user role availability"
            icon={<RoleIcon />}
            count={roles.length}
            search={roleSearch}
            onSearchChange={setRoleSearch}
            searchPlaceholder="Search roles..."
            onRefresh={loadRoles}
            loading={loadingRoles}
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-5 py-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Role details
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Status
              </span>
            </div>

            {loadingRoles ? (
              <LoadingRows />
            ) : filteredRoles.length === 0 ? (
              <EmptyState
                search={roleSearch}
                label="roles"
              />
            ) : (
              <div className="space-y-2 p-3 sm:p-4">
                {filteredRoles.map((role, index) => {
                  const isActive = Number(role.status) === 1;
                  const isUpdating =
                    updatingRoleStatus === role.id;

                  return (
                    <div
                      key={role.id}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-white p-3 transition duration-200 hover:border-indigo-100 hover:bg-indigo-50/30 hover:shadow-sm sm:p-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                            isActive
                              ? "bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {role.sequence || index + 1}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {role.name}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-400">
                            {role.slug
                              ? role.slug
                              : `Role ID: ${role.roleId}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2.5">
                        <div className="hidden sm:block">
                          <StatusBadge active={isActive} />
                        </div>

                        <ToggleSwitch
                          active={isActive}
                          loading={isUpdating}
                          disabled={anyUpdateInProgress}
                          onClick={() =>
                            handleToggleRoleStatus(role)
                          }
                          title={
                            isActive
                              ? "Deactivate Role"
                              : "Activate Role"
                          }
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loadingRoles && filteredRoles.length > 0 && (
              <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
                <p className="text-xs text-slate-500">
                  Showing{" "}
                  <span className="font-semibold text-slate-700">
                    {filteredRoles.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-700">
                    {roles.length}
                  </span>{" "}
                  roles
                </p>
              </div>
            )}
          </ManagementPanel>
        </div>

        {/* Footer note */}
       
      </div>
    // </main>
  );
}
