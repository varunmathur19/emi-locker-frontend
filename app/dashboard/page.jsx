
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  LineChart,
  Line,
} from "recharts";

import { getAllStaffData, getRoles } from "@/services/api";
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

const allowedRoles = {
  0: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  1: [2, 3, 4, 5, 6, 7, 8, 9],
  2: [3, 4, 5, 6, 7, 8, 9],
  3: [4, 5, 6, 7, 8, 9],
  4: [5, 6, 7, 8, 9],
  5: [6, 7, 8, 9],
  6: [7, 8, 9],
  7: [8, 9],
  8: [9],
  9: [],
};

const isPermissionEnabled = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }
  if (value && typeof value === "object") {
    if (value.status !== undefined) return Number(value.status) === 1;
    if (value.view !== undefined) return Number(value.view) === 1;
    if (value.access !== undefined) return Number(value.access) === 1;
    return true;
  }
  return false;
};

const hasRolePermission = (permissions, role) => {
  if (!permissions || !role) return false;

  return [role.slug, role.name]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase())
    .some((key) =>
      Object.keys(permissions).some((permissionKey) => {
        const normalizedKey = String(permissionKey).trim().toLowerCase();
        return (normalizedKey === key || normalizedKey.startsWith(`${key}.`)) &&
          isPermissionEnabled(permissions[permissionKey]);
      })
    );
};

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  const [roleId, setRoleId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({});
  const [staffPermissions, setStaffPermissions] = useState(null);

  // --------------------------------------------------
  // URL PARAMS
  // --------------------------------------------------

  const urlRoleParam = searchParams.get("role");
  const moduleParam = searchParams.get("module");

  const hasRoleParam = urlRoleParam !== null;
  const hasModuleParam = moduleParam !== null;

  const isDashboardHome =
    !hasRoleParam && !hasModuleParam;

  // --------------------------------------------------
  // CURRENT LOGGED-IN ROLE
  // --------------------------------------------------

  useEffect(() => {
    const currentRoleId = getRoleId();

    if (
      currentRoleId === null ||
      currentRoleId === undefined
    ) {
      return;
    }

    setRoleId(Number(currentRoleId));
  }, []);

  // The sidebar already uses this stored profile permission. Load the same
  // value here so a visible staff role link is also usable on the dashboard.
  useEffect(() => {
    if (roleId !== 9) {
      setStaffPermissions(null);
      return;
    }

    try {
      const saved = localStorage.getItem("staff_permissions");
      const permissions = saved ? JSON.parse(saved) : null;
      setStaffPermissions(
        permissions && typeof permissions === "object" ? permissions : null
      );
    } catch {
      setStaffPermissions(null);
    }
  }, [roleId]);

  // --------------------------------------------------
  // GET ROLES
  // --------------------------------------------------

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const response = await getRoles();

        const roleData = Array.isArray(response?.data)
          ? response.data
          : [];

        const activeRoles = roleData
          .filter(
            (role) => Number(role?.status ?? 1) === 1
          )
          .sort(
            (a, b) =>
              Number(a?.sequence ?? 0) -
              Number(b?.sequence ?? 0)
          );

        setRoles(activeRoles);
      } catch (error) {
        console.error("GET ROLES ERROR:", error);
        setRoles([]);
      }
    };

    loadRoles();
  }, []);

  // --------------------------------------------------
  // ROLE HELPERS
  // --------------------------------------------------

  const normalizeRoleValue = useCallback((value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ");
  }, []);

  const getRoleIdFromValue = useCallback(
    (value) => {
      if (
        value === null ||
        value === undefined ||
        value === ""
      ) {
        return null;
      }

      const valueString = String(value).trim();

      // Numeric role ID
      if (/^\d+$/.test(valueString)) {
        return Number(valueString);
      }

      const normalizedValue =
        normalizeRoleValue(valueString);

      const foundRole = roles.find((role) => {
        const roleName = normalizeRoleValue(role?.name);
        const roleSlug = normalizeRoleValue(role?.slug);

        return (
          roleName === normalizedValue ||
          roleSlug === normalizedValue
        );
      });

      return foundRole
        ? Number(foundRole.role_id)
        : null;
    },
    [roles, normalizeRoleValue]
  );

  // --------------------------------------------------
  // REQUESTED ROLE
  // --------------------------------------------------

  const urlRole = useMemo(
    () => getRoleIdFromValue(urlRoleParam),
    [urlRoleParam, getRoleIdFromValue]
  );

  const moduleRole = useMemo(
    () => getRoleIdFromValue(moduleParam),
    [moduleParam, getRoleIdFromValue]
  );

  const requestedRole =
    urlRole !== null
      ? urlRole
      : moduleRole;

  // --------------------------------------------------
  // ROLE ACCESS
  // --------------------------------------------------

  const isRoleAllowed = useMemo(() => {
    if (
      roleId === null ||
      requestedRole === null
    ) {
      return false;
    }

    // Staff access comes from the assigned profile, not role hierarchy.
    if (roleId === 9) {
      const role = roles.find(
        (item) => Number(item?.role_id) === requestedRole
      );
      return hasRolePermission(staffPermissions, role);
    }

    // User can access own role
    if (requestedRole === roleId) {
      return true;
    }

    return (
      allowedRoles[roleId]?.includes(requestedRole) ||
      false
    );
  }, [roleId, requestedRole, roles, staffPermissions]);

  const selectedRole =
    requestedRole !== null && isRoleAllowed
      ? requestedRole
      : null;

  // --------------------------------------------------
  // ROLE LIST NAVIGATION
  // --------------------------------------------------

  const handleRoleList = useCallback(
    (role) => {
      router.push(
        `/dashboard?role=${encodeURIComponent(role)}`
      );
    },
    [router]
  );

  // --------------------------------------------------
  // ROLE NAME
  // --------------------------------------------------

  const getRoleName = useCallback(
    (id) => {
      const numericRoleId = Number(id);

      if (numericRoleId === 0) {
        return "Master Admin";
      }

      const role = roles.find(
        (item) =>
          Number(item?.role_id) === numericRoleId
      );

      return role?.name || "Unknown";
    },
    [roles]
  );

  // --------------------------------------------------
  // ROLE PARAM VALIDATION
  // --------------------------------------------------

  useEffect(() => {
    if (
      roleId === null ||
      !hasRoleParam
    ) {
      return;
    }

    if (
      urlRole === null ||
      !isRoleAllowed
    ) {
      console.log("role bwcbwb",isRoleAllowed)
      console.log("ebwubyg",urlRole)
      toast.error(
        "You are not allowed to access this role"
      );

      router.replace("/dashboard");
    }
  }, [
    roleId,
    hasRoleParam,
    urlRole,
    isRoleAllowed,
    router,
  ]);

  // --------------------------------------------------
  // MODULE PARAM VALIDATION
  // --------------------------------------------------

  useEffect(() => {
    if (
      roleId === null ||
      !hasModuleParam ||
      moduleRole === null
    ) {
      return;
    }

    if (!isRoleAllowed) {
      toast.error(
        "You are not allowed to access this module"
      );

      router.replace("/dashboard");
    }
  }, [
    roleId,
    hasModuleParam,
    moduleRole,
    isRoleAllowed,
    router,
  ]);

  // --------------------------------------------------
  // RESET PAGE WHEN ROLE / MODULE CHANGES
  // --------------------------------------------------

  useEffect(() => {
    setPage(1);
  }, [urlRoleParam, moduleParam]);

  // --------------------------------------------------
  // ROLE CARDS
  // IMPORTANT: cards is declared BEFORE visibleCards
  // --------------------------------------------------

  const cards = useMemo(() => {
    return roles.map((role) => {
      const numericRoleId = Number(role?.role_id);

      return {
        id: role?.id,
        roleId: numericRoleId,
        title:
          role?.name ||
          role?.slug ||
          "Unknown Role",
        count: counts[numericRoleId] || 0,
        icon: role?.icon || null,
        sequence: Number(role?.sequence) || 0,
        status: Number(role?.status ?? 1),
      };
    });
  }, [roles, counts]);

  // --------------------------------------------------
  // VISIBLE ROLE CARDS
  // --------------------------------------------------

  const visibleCards = useMemo(() => {
    const currentRole = Number(roleId);

    // Master Admin can see all roles
    if (currentRole === 0) {
      return cards;
    }

    if (currentRole === 9) {
      return cards.filter((card) => {
        const role = roles.find(
          (item) => Number(item?.role_id) === Number(card.roleId)
        );
        return hasRolePermission(staffPermissions, role);
      });
    }

    const roleIds =
      allowedRoles[currentRole] || [];

    return cards.filter((card) =>
      roleIds.includes(Number(card.roleId))
    );
  }, [cards, roleId, roles, staffPermissions]);

  // --------------------------------------------------
  // FETCH USERS
  // --------------------------------------------------

  const fetchUsers = useCallback(async () => {
    try {
      const roleCounts = {};

      roles.forEach((role) => {
        const numericRoleId = Number(
          role?.role_id
        );

        if (Number.isFinite(numericRoleId)) {
          roleCounts[numericRoleId] = 0;
        }
      });

      if (roleId === 9) {
        const permittedRoles = roles.filter((role) =>
          hasRolePermission(staffPermissions, role)
        );
        const responses = await Promise.all(
          permittedRoles.map((role) =>
            getAllStaffData(1, 1, Number(role.role_id))
          )
        );

        responses.forEach((response, index) => {
          roleCounts[Number(permittedRoles[index].role_id)] =
            Number(response?.pagination?.totalUsers || 0);
        });
      } else {
        const countResponse = await getAllStaffData(1, 10000, "");
        const allUsers = Array.isArray(countResponse?.data)
          ? countResponse.data
          : [];

        allUsers.forEach((user) => {
          const userRoleId = Number(user?.role_id);
          if (Object.prototype.hasOwnProperty.call(roleCounts, userRoleId)) {
            roleCounts[userRoleId] += 1;
          }
        });
      }

      setCounts(roleCounts);

      // Dashboard home does not need table data
      if (isDashboardHome) {
        setUsers([]);
        setPagination({});
        return;
      }

      // Invalid / unauthorized role
      if (selectedRole === null) {
        setUsers([]);
        setPagination({});
        return;
      }

      // Get selected role users
      const response =
        await getAllStaffData(
          page,
          10,
          selectedRole
        );

      setUsers(
        Array.isArray(response?.data)
          ? response.data
          : []
      );

      setPagination(
        response?.pagination || {}
      );
    } catch (error) {
      console.error(
        "FETCH USERS ERROR:",
        error
      );

      setUsers([]);
      setPagination({});
    }
  }, [
    roles,
    roleId,
    staffPermissions,
    page,
    selectedRole,
    isDashboardHome,
  ]);

  // --------------------------------------------------
  // FETCH USERS EFFECT
  // --------------------------------------------------

  useEffect(() => {
    if (
      roleId === null ||
      roles.length === 0
    ) {
      return;
    }

    fetchUsers();
  }, [
    roleId,
    roles.length,
    page,
    selectedRole,
    isDashboardHome,
    fetchUsers,
  ]);

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="bg-gray-100">
      <main className="pt-0 p-0">

        <h1 className="md:text-3xl font-bold md:mb-6 mb-0 text-[20px]">
          Welcome Dashboard
        </h1>

        {/* ==========================================
            DASHBOARD HOME
        ========================================== */}

        {isDashboardHome && (
          <>
            {/* ROLE CARDS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {visibleCards.map((card) => (
                <div
                  key={
                    card.id ||
                    card.roleId
                  }
                  className="bg-white p-5 rounded-xl shadow"
                >
                  <h3 className="text-gray-500">
                    {card.title}
                  </h3>

                  <p className="text-3xl font-bold">
                    {card.count}
                  </p>
                </div>
              ))}
            </div>

            {/* CHARTS */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

              {/* BAR CHART */}

              <div className="bg-white p-5 rounded-xl shadow">
                <h3 className="text-gray-700 font-semibold mb-4">
                  Role-wise Users (Bar Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart data={visibleCards}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="title"
                      tick={{
                        fontSize: 12,
                      }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />

                    <YAxis
                      allowDecimals={false}
                    />

                    <Tooltip />

                    <Bar
                      dataKey="count"
                      fill="#6366f1"
                      radius={[
                        4,
                        4,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* PIE CHART */}

              <div className="bg-white p-5 rounded-xl shadow">
                <h3 className="text-gray-700 font-semibold mb-4">
                  Role Distribution (Pie Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
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
                      {visibleCards.map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${entry.roleId}`}
                            fill={
                              PIE_COLORS[
                                index %
                                  PIE_COLORS.length
                              ]
                            }
                          />
                        )
                      )}
                    </Pie>

                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* LINE CHART */}

              <div className="bg-white p-5 rounded-xl shadow md:col-span-2">
                <h3 className="text-gray-700 font-semibold mb-4">
                  Role-wise Users (Line Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart data={visibleCards}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                    />

                    <XAxis
                      dataKey="title"
                      tick={{
                        fontSize: 12,
                      }}
                      interval={0}
                      angle={-20}
                      textAnchor="end"
                      height={60}
                    />

                    <YAxis
                      allowDecimals={false}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{
                        r: 4,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {/* ==========================================
            ROLE USERS TABLE
        ========================================== */}

        {!isDashboardHome &&
          selectedRole !== null && (
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
      </main>
    </div>
  );
}

