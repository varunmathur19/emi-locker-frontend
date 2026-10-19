"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  getAllStaffData,
  getRoles,
  getModules,
  getKeySettings,
} from "@/services/api";

import { getRoleId } from "@/utils/token";
import UsersTable from "../../components/dashboard/UsersTable";

const PIE_COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
];

const SUBMODULE_IDS = {
  manage: 3,
  edit: 4,
  view: 5,
  add: 6,
  delete: 7,
};

const ALLOWED_ROLES = {
  0: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  1: [2, 3, 4, 5, 6, 7, 8, 9],
  2: [3, 4, 5, 6, 7, 9],
  3: [4, 5, 6, 7, 9],
  4: [5, 6, 7, 9],
  5: [6, 7, 9],
  6: [7, 8],
  7: [8],
  8: [9],
  9: [],
};

function normalizePermissions(value) {
  if (!value) return {};

  if (typeof value === "string") {
    try {
      return normalizePermissions(JSON.parse(value));
    } catch {
      return {};
    }
  }

  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  if (
    value.permission &&
    typeof value.permission === "object"
  ) {
    return normalizePermissions(value.permission);
  }

  return value;
}

function isPermissionEnabled(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    return ["1", "true", "yes"].includes(
      value.trim().toLowerCase()
    );
  }

  if (value && typeof value === "object") {
    for (const key of [
      "status",
      "access",
      "view",
      "enabled",
    ]) {
      if (value[key] !== undefined) {
        return isPermissionEnabled(value[key]);
      }
    }
  }

  return false;
}

function hasModulePermission(
  permissions,
  moduleId,
  action = null
) {
  const id = Number(moduleId);

  if (!Number.isInteger(id) || id <= 0) {
    return false;
  }

  const normalized = normalizePermissions(permissions);

  if (!action) {
    return Object.entries(normalized).some(
      ([key, value]) => {
        const [permissionModuleId] = key.split(".");

        return (
          Number(permissionModuleId) === id &&
          isPermissionEnabled(value)
        );
      }
    );
  }

  const subModuleId =
    action === "login"
      ? SUBMODULE_IDS.manage
      : SUBMODULE_IDS[action];

  if (!subModuleId) return false;

  const exactKey = `${id}.${subModuleId}`;

  if (isPermissionEnabled(normalized[exactKey])) {
    return true;
  }

  if (subModuleId !== SUBMODULE_IDS.manage) {
    return isPermissionEnabled(
      normalized[`${id}.${SUBMODULE_IDS.manage}`]
    );
  }

  return false;
}

function normalizeRoleValue(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ");
}

function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-xl bg-white p-5 shadow"
      aria-hidden="true"
    >
      <div className="mb-4 h-4 w-28 rounded bg-gray-200" />
      <div className="h-9 w-20 rounded bg-gray-200" />
    </div>
  );
}

function DashboardCardsLoader() {
  return (
    <div
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4"
      aria-busy="true"
      aria-label="Loading role counts"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roleId, setRoleId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);

  const [rolesLoading, setRolesLoading] = useState(true);
  const [modulesLoading, setModulesLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [keySettingsLoading, setKeySettingsLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({});
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  const [keySettings, setKeySettings] = useState([]);
  const [staffPermissions, setStaffPermissions] = useState({});
  const [staffPermissionsLoaded, setStaffPermissionsLoaded] =
    useState(false);

  const [dashboardError, setDashboardError] = useState("");
  const [usersError, setUsersError] = useState("");

  const requestSequenceRef = useRef(0);

  const urlRoleParam = searchParams.get("role");
  const moduleParam = searchParams.get("module");

  const hasRoleParam = urlRoleParam !== null;
  const hasModuleParam = moduleParam !== null;
  const isDashboardHome = !hasRoleParam && !hasModuleParam;

  useEffect(() => {
    const currentRoleId = getRoleId();

    if (currentRoleId !== null && currentRoleId !== undefined) {
      setRoleId(Number(currentRoleId));
    }
  }, []);

  // Load active roles.
  useEffect(() => {
    let cancelled = false;

    async function loadRoles() {
      setRolesLoading(true);

      try {
        const response = await getRoles();
        const data = Array.isArray(response?.data)
          ? response.data
          : [];

        const activeRoles = data
          .filter((role) => Number(role?.status ?? 1) === 1)
          .sort(
            (a, b) =>
              Number(a?.sequence ?? 0) -
              Number(b?.sequence ?? 0)
          );

        if (!cancelled) {
          setRoles(activeRoles);
        }
      } catch (error) {
        console.error(
          "GET ROLES ERROR:",
          error?.response?.data || error.message
        );

        if (!cancelled) {
          setRoles([]);
          toast.error("Failed to load roles");
        }
      } finally {
        if (!cancelled) {
          setRolesLoading(false);
        }
      }
    }

    loadRoles();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModules() {
      setModulesLoading(true);

      try {
        const response = await getModules();

        const data = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
          ? response
          : [];

        if (!cancelled) {
          setModules(data);
        }
      } catch (error) {
        console.error(
          "GET MODULES ERROR:",
          error?.response?.data || error.message
        );

        if (!cancelled) {
          setModules([]);
          toast.error("Failed to load modules");
        }
      } finally {
        if (!cancelled) {
          setModulesLoading(false);
        }
      }
    }

    loadModules();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load active key settings.
  useEffect(() => {
    let cancelled = false;

    async function loadKeySettings() {
      setKeySettingsLoading(true);

      try {
        const response = await getKeySettings();

        const data =
          response?.success && Array.isArray(response?.data)
            ? response.data.filter(
                (item) => Number(item?.status) === 1
              )
            : [];

        if (!cancelled) {
          setKeySettings(data);
        }
      } catch (error) {
        console.error(
          "GET KEY SETTINGS ERROR:",
          error?.response?.data || error.message
        );

        if (!cancelled) {
          setKeySettings([]);
        }
      } finally {
        if (!cancelled) {
          setKeySettingsLoading(false);
        }
      }
    }

    loadKeySettings();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (roleId === null) return;

    if (roleId !== 9) {
      setStaffPermissions({});
      setStaffPermissionsLoaded(true);
      return;
    }

    setStaffPermissionsLoaded(false);

    try {
      const saved = localStorage.getItem("staff_permission");
      setStaffPermissions(normalizePermissions(saved));
    } catch (error) {
      console.error("STAFF PERMISSION ERROR:", error);
      setStaffPermissions({});
    } finally {
      setStaffPermissionsLoaded(true);
    }
  }, [roleId]);

  const myTransactionModule = useMemo(() => {
    return (
      modules.find((item) => {
        const slug = normalizeRoleValue(item?.slug);
        const name = normalizeRoleValue(item?.name);

        return (
          slug === "transaction" ||
          slug === "my transaction" ||
          name === "my transaction"
        );
      }) || null
    );
  }, [modules]);

  const canViewKeySettings = useMemo(() => {
    if (roleId === null) return false;
    if (roleId !== 9) return true;

    if (!staffPermissionsLoaded || modulesLoading) {
      return false;
    }

    if (!myTransactionModule?.id) {
      return false;
    }

    return hasModulePermission(
      staffPermissions,
      myTransactionModule.id,
      "view"
    );
  }, [
    roleId,
    staffPermissions,
    staffPermissionsLoaded,
    modulesLoading,
    myTransactionModule,
  ]);

  const getRoleIdFromValue = useCallback(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const text = String(value).trim();

      if (/^\d+$/.test(text)) {
        return Number(text);
      }

      const normalized = normalizeRoleValue(text);

      const role = roles.find(
        (item) =>
          normalizeRoleValue(item?.name) === normalized ||
          normalizeRoleValue(item?.slug) === normalized
      );

      if (role) return Number(role.role_id);

      const moduleItem = modules.find(
        (item) =>
          normalizeRoleValue(item?.name) === normalized ||
          normalizeRoleValue(item?.slug) === normalized
      );

      return moduleItem?.role_id != null
        ? Number(moduleItem.role_id)
        : null;
    },
    [roles, modules]
  );

  const urlRole = useMemo(
    () => getRoleIdFromValue(urlRoleParam),
    [urlRoleParam, getRoleIdFromValue]
  );

  const moduleRole = useMemo(
    () => getRoleIdFromValue(moduleParam),
    [moduleParam, getRoleIdFromValue]
  );

  const requestedRole =
    urlRole !== null ? urlRole : moduleRole;

  const getModuleForRole = useCallback(
    (role) => {
      if (!role) return null;

      const roleSlug = normalizeRoleValue(role.slug);
      const roleName = normalizeRoleValue(role.name);

      return (
        modules.find((item) => {
          const slug = normalizeRoleValue(item.slug);
          const name = normalizeRoleValue(item.name);

          return (
            (roleSlug && slug === roleSlug) ||
            (roleName && name === roleName)
          );
        }) ||
        modules.find(
          (item) => Number(item.role_id) === Number(role.role_id)
        ) ||
        null
      );
    },
    [modules]
  );

  const getModuleForParam = useCallback(
    (value) => {
      if (value === null || value === undefined || value === "") {
        return null;
      }

      const normalized = normalizeRoleValue(value);
      const numericValue = Number(value);

      const matchedModule = modules.find(
        (item) =>
          normalizeRoleValue(item.slug) === normalized ||
          normalizeRoleValue(item.name) === normalized ||
          (
            Number.isFinite(numericValue) &&
            String(value).trim() !== "" &&
            Number(item.id) === numericValue
          )
      );

      if (matchedModule) return matchedModule;

      const matchedRole = roles.find(
        (item) =>
          normalizeRoleValue(item.slug) === normalized ||
          normalizeRoleValue(item.name) === normalized
      );

      return getModuleForRole(matchedRole);
    },
    [modules, roles, getModuleForRole]
  );

  const requestedModule = useMemo(
    () => (hasModuleParam ? getModuleForParam(moduleParam) : null),
    [hasModuleParam, moduleParam, getModuleForParam]
  );

  const isRoleAllowed = useMemo(() => {
    if (roleId === null) return false;
    if (requestedRole === null) return true;
    if (roleId === 0 || requestedRole === roleId) return true;

    if (roleId !== 9) {
      return ALLOWED_ROLES[roleId]?.includes(requestedRole) ?? false;
    }

    if (!staffPermissionsLoaded) return false;

    const role = roles.find(
      (item) => Number(item.role_id) === Number(requestedRole)
    );

    const moduleItem = getModuleForRole(role);

    return moduleItem
      ? hasModulePermission(staffPermissions, moduleItem.id)
      : false;
  }, [
    roleId,
    requestedRole,
    roles,
    staffPermissions,
    staffPermissionsLoaded,
    getModuleForRole,
  ]);

  const isModuleAllowed = useMemo(() => {
    if (roleId === null) return false;
    if (!hasModuleParam) return true;
    if (!requestedModule) return false;

    if (roleId !== 9) return isRoleAllowed;
    if (!staffPermissionsLoaded) return false;

    return hasModulePermission(
      staffPermissions,
      requestedModule.id
    );
  }, [
    roleId,
    hasModuleParam,
    requestedModule,
    staffPermissions,
    staffPermissionsLoaded,
    isRoleAllowed,
  ]);

  const selectedRole =
    requestedRole !== null && isRoleAllowed
      ? requestedRole
      : null;

  const handleRoleList = useCallback(
    (role) => {
      router.push(`/dashboard?role=${encodeURIComponent(role)}`);
    },
    [router]
  );

  const getRoleName = useCallback(
    (id) => {
      const numericId = Number(id);

      if (numericId === 0) return "Master Admin";

      return (
        roles.find(
          (item) => Number(item.role_id) === numericId
        )?.name || "Unknown"
      );
    },
    [roles]
  );

  useEffect(() => {
    if (roleId === null || !hasModuleParam) return;
    if (rolesLoading || modulesLoading) return;
    if (roleId === 9 && !staffPermissionsLoaded) return;

    if (!requestedModule) {
      toast.error("Module not found");
      router.replace("/dashboard");
      return;
    }

    if (!isModuleAllowed) {
      toast.error("You are not allowed to access this module");
      router.replace("/dashboard");
    }
  }, [
    roleId,
    hasModuleParam,
    rolesLoading,
    modulesLoading,
    staffPermissionsLoaded,
    requestedModule,
    isModuleAllowed,
    router,
  ]);

  useEffect(() => {
    setPage(1);
  }, [urlRoleParam, moduleParam]);

  const cards = useMemo(
    () =>
      roles.map((role) => ({
        id: role.id,
        roleId: Number(role.role_id),
        title: role.name || role.slug || "Unknown Role",
        count: counts[Number(role.role_id)] ?? 0,
      })),
    [roles, counts]
  );

  const visibleCards = useMemo(() => {
    if (roleId === 0) return cards;

    if (roleId === 9) {
      if (!staffPermissionsLoaded) return [];

      return cards.filter((card) => {
        const role = roles.find(
          (item) => Number(item.role_id) === card.roleId
        );

        const moduleItem = getModuleForRole(role);

        return (
          moduleItem &&
          hasModulePermission(staffPermissions, moduleItem.id)
        );
      });
    }

    const allowed = ALLOWED_ROLES[Number(roleId)] || [];

    return cards.filter((card) => allowed.includes(card.roleId));
  }, [
    cards,
    roleId,
    roles,
    staffPermissions,
    staffPermissionsLoaded,
    getModuleForRole,
  ]);

  const hasStaffGraphData = useMemo(
    () =>
      visibleCards.some(
        (card) => Number(card.count) > 0
      ),
    [visibleCards]
  );


  const fetchUsers = useCallback(async () => {
    if (
      roleId === null ||
      rolesLoading ||
      modulesLoading ||
      roles.length === 0 ||
      (roleId === 9 && !staffPermissionsLoaded)
    ) {
      return;
    }

    const requestId = ++requestSequenceRef.current;

    setDashboardLoading(true);
    setDashboardError("");
    setUsersError("");
    setUsersLoading(!isDashboardHome && selectedRole !== null);

    try {
      const roleCounts = {};

      roles.forEach((role) => {
        const id = Number(role.role_id);

        if (Number.isFinite(id)) {
          roleCounts[id] = 0;
        }
      });

      const countableRoles =
        roleId === 9
          ? roles.filter((role) => {
              const moduleItem = getModuleForRole(role);

              return (
                moduleItem &&
                hasModulePermission(
                  staffPermissions,
                  moduleItem.id
                )
              );
            })
          : roles;

      const countResponses = await Promise.all(
        countableRoles.map((role) =>
          getAllStaffData(1, 1, Number(role.role_id))
        )
      );

      countResponses.forEach((response, index) => {
        const id = Number(countableRoles[index]?.role_id);

        if (!Object.prototype.hasOwnProperty.call(roleCounts, id)) {
          return;
        }

        roleCounts[id] = Number(
          response?.pagination?.totalUsers ??
          response?.pagination?.total ??
          0
        );
      });

      if (requestId !== requestSequenceRef.current) return;

      setCounts(roleCounts);
      setDashboardLoading(false);

      if (isDashboardHome || selectedRole === null) {
        setUsers([]);
        setPagination({});
        return;
      }

      const response = await getAllStaffData(
        page,
        10,
        selectedRole
      );

      if (requestId !== requestSequenceRef.current) return;

      setUsers(
        Array.isArray(response?.data) ? response.data : []
      );
      setPagination(response?.pagination || {});
    } catch (error) {
      if (requestId !== requestSequenceRef.current) return;

      console.error(
        "FETCH USERS ERROR:",
        error?.response?.data || error.message
      );

      setDashboardError(
        "Unable to load dashboard counts. Please try again."
      );

      if (!isDashboardHome) {
        setUsersError("Unable to load users. Please try again.");
      }

      setUsers([]);
      setPagination({});
    } finally {
      if (requestId === requestSequenceRef.current) {
        setDashboardLoading(false);
        setUsersLoading(false);
      }
    }
  }, [
    roleId,
    rolesLoading,
    modulesLoading,
    roles,
    staffPermissions,
    staffPermissionsLoaded,
    page,
    selectedRole,
    isDashboardHome,
    getModuleForRole,
  ]);

  useEffect(() => {
    fetchUsers();

    return () => {
      requestSequenceRef.current += 1;
    };
  }, [fetchUsers]);

  const retryFetch = useCallback(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalKeyBalance = useMemo(
    () =>
      keySettings.reduce(
        (total, item) => total + Number(item?.balance || 0),
        0
      ),
    [keySettings]
  );

  const initialLoading =
    roleId === null ||
    rolesLoading ||
    modulesLoading ||
    (roleId === 9 && !staffPermissionsLoaded);

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="p-0 pt-0">
        <h1 className="mb-5 text-[20px] font-bold md:text-3xl">
          Welcome Dashboard
        </h1>

        {dashboardError && (
          <div
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
            role="alert"
          >
            <p className="text-sm text-red-700">
              {dashboardError}
            </p>

            <button
              type="button"
              onClick={retryFetch}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}

        {isDashboardHome && (
          <>
    
            {dashboardLoading ? (
              <DashboardCardsLoader />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4">
                {visibleCards.map((card) => (
                  <div
                    key={card.id || card.roleId}
                    className="rounded-xl bg-white p-5 shadow"
                  >
                    <h3 className="text-sm font-medium text-gray-500">
                      {card.title}
                    </h3>

                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {Number(card.count || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}

 
            <section className="mt-6 rounded-xl bg-white p-5 shadow">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Key Settings
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Current wallet balance
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 px-4 py-2">
                  <p className="text-xs text-blue-500">
                    Total Balance
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    {keySettingsLoading
                      ? "Loading..."
                      : totalKeyBalance.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {keySettingsLoading ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 4 }, (_, index) => (
                    <SkeletonCard key={index} />
                  ))}
                </div>
              ) : keySettings.length === 0 ? (
                <p className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
                  No active key settings found.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {keySettings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                    >
                      <h3 className="text-sm font-semibold text-gray-700">
                        {item.name || "Unnamed Key"}
                      </h3>
                      <p className="mt-1 text-xs text-gray-400">
                        Wallet Balance
                      </p>
                      <p className="mt-2 text-xl font-bold text-blue-600">
                        {Number(item?.balance || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {(
              roleId !== 9 ||
              dashboardLoading ||
              hasStaffGraphData
            ) && (
              dashboardLoading ? (
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="animate-pulse rounded-xl bg-white p-5 shadow">
                    <div className="mb-5 h-5 w-48 rounded bg-gray-200" />
                    <div className="h-[300px] rounded-lg bg-gray-100" />
                  </div>

                  <div className="animate-pulse rounded-xl bg-white p-5 shadow">
                    <div className="mb-5 h-5 w-48 rounded bg-gray-200" />
                    <div className="h-[300px] rounded-lg bg-gray-100" />
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <section className="rounded-xl bg-white p-5 shadow">
                    <h2 className="mb-4 font-semibold text-gray-700">
                      Role-wise Users (Bar Chart)
                    </h2>

                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={visibleCards}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="title"
                          tick={{ fontSize: 12 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          fill="#6366f1"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </section>

                  <section className="rounded-xl bg-white p-5 shadow">
                    <h2 className="mb-4 font-semibold text-gray-700">
                      Role Distribution (Pie Chart)
                    </h2>

                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={visibleCards}
                          dataKey="count"
                          nameKey="title"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {visibleCards.map((entry, index) => (
                            <Cell
                              key={`cell-${entry.roleId}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </section>
                </div>
              )
            )}
          </>
        )}

        {!isDashboardHome &&
          selectedRole !== null &&
          isModuleAllowed && (
            <div className="mt-4">
              {usersLoading ? (
                <div className="animate-pulse space-y-3 rounded-xl bg-white p-5 shadow">
                  <div className="h-6 w-40 rounded bg-gray-200" />
                  {Array.from({ length: 6 }, (_, index) => (
                    <div
                      key={index}
                      className="h-12 rounded bg-gray-100"
                    />
                  ))}
                </div>
              ) : usersError ? (
                <div
                  className="rounded-xl bg-white p-6 text-center shadow"
                  role="alert"
                >
                  <p className="mb-4 text-sm text-red-600">
                    {usersError}
                  </p>
                  <button
                    type="button"
                    onClick={retryFetch}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <UsersTable
                  users={users}
                  page={page}
                  pagination={pagination}
                  setPage={setPage}
                  getRoleName={getRoleName}
                  selectedRole={Number(selectedRole)}
                  handleRoleList={handleRoleList}
                />
              )}
            </div>
          )}
      </main>
    </div>
  );
}