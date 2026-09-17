"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

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

import {
  getAllStaffData,
  getRoles,
} from "@/services/api";

import { getRoleId } from "@/utils/token";

import UsersTable from "../../components/dashboard/UsersTable";

/* =========================================================
   CHART COLORS
========================================================= */

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

/* =========================================================
   NORMAL ROLE HIERARCHY
========================================================= */

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

/* =========================================================
   PERMISSION VALUE CHECK
========================================================= */

const isPermissionEnabled = (value) => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value
      .trim()
      .toLowerCase();

    return (
      normalized === "1" ||
      normalized === "true" ||
      normalized === "yes"
    );
  }

  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    if (
      value.status !== undefined
    ) {
      return Number(value.status) === 1;
    }

    if (
      value.access !== undefined
    ) {
      return Number(value.access) === 1;
    }

    if (
      value.view !== undefined
    ) {
      return Number(value.view) === 1;
    }

    if (
      value.enabled !== undefined
    ) {
      return isPermissionEnabled(
        value.enabled
      );
    }

    return true;
  }

  return false;
};

/* =========================================================
   NORMALIZE PERMISSIONS
========================================================= */

const normalizePermissions = (
  permissions
) => {
  if (!permissions) {
    return {};
  }

  if (
    typeof permissions === "string"
  ) {
    try {
      const parsed =
        JSON.parse(permissions);

      if (
        parsed &&
        typeof parsed === "object" &&
        !Array.isArray(parsed)
      ) {
        return parsed;
      }

      return {};
    } catch {
      return {};
    }
  }

  if (
    typeof permissions === "object" &&
    !Array.isArray(permissions)
  ) {
    return permissions;
  }

  return {};
};

/* =========================================================
   GET PERMISSION OBJECT
========================================================= */

const getPermissionObject = (
  permissionData
) => {
  if (!permissionData) {
    return {};
  }

  /*
   * Direct permission object
   *
   * {
   *   "wallet.view": 1
   * }
   */
  if (
    typeof permissionData === "object" &&
    !Array.isArray(permissionData)
  ) {
    if (
      permissionData.permission &&
      typeof permissionData.permission ===
        "object"
    ) {
      return normalizePermissions(
        permissionData.permission
      );
    }

    return normalizePermissions(
      permissionData
    );
  }

  return {};
};

/* =========================================================
   ROLE PERMISSION CHECK
========================================================= */

const hasRolePermission = (
  permissions,
  role
) => {
  if (!role) {
    return false;
  }

  const normalizedPermissions =
    getPermissionObject(
      permissions
    );

  const roleId = Number(
    role?.role_id
  );

  const roleName = String(
    role?.name || ""
  )
    .trim()
    .toLowerCase();

  const roleSlug = String(
    role?.slug || ""
  )
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");

  /*
   * ---------------------------------------------------------
   * 1. DIRECT ROLE-ID PERMISSION
   *
   * Example:
   *
   * {
   *   "9": 1,
   *   "8": 1
   * }
   *
   * ---------------------------------------------------------
   */

  const roleIdKeys = [
    String(roleId),
    `role.${roleId}`,
    `role_${roleId}`,
    `role-${roleId}`,
  ];

  for (
    const key of roleIdKeys
  ) {
    if (
      Object.prototype.hasOwnProperty.call(
        normalizedPermissions,
        key
      )
    ) {
      if (
        isPermissionEnabled(
          normalizedPermissions[key]
        )
      ) {
        return true;
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * 2. ROLE NAME / SLUG PERMISSION
   *
   * Example:
   *
   * {
   *   "retailer": 1
   * }
   *
   * OR
   *
   * {
   *   "retailer.view": 1
   * }
   *
   * ---------------------------------------------------------
   */

  const roleKeys = [
    roleName,
    roleSlug,
  ].filter(Boolean);

  for (
    const roleKey of roleKeys
  ) {
    const matchingKey =
      Object.keys(
        normalizedPermissions
      ).find(
        (permissionKey) => {
          const normalizedKey =
            String(permissionKey)
              .trim()
              .toLowerCase()
              .replace(/_/g, "-");

          return (
            normalizedKey ===
              roleKey ||
            normalizedKey.startsWith(
              `${roleKey}.`
            )
          );
        }
      );

    if (matchingKey) {
      if (
        isPermissionEnabled(
          normalizedPermissions[
            matchingKey
          ]
        )
      ) {
        return true;
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * 3. NESTED ROLE PERMISSION
   *
   * Example:
   *
   * {
   *   "retailer": {
   *      "view": 1
   *   }
   * }
   *
   * ---------------------------------------------------------
   */

  for (
    const roleKey of roleKeys
  ) {
    const nestedValue =
      normalizedPermissions[
        roleKey
      ];

    if (
      nestedValue &&
      typeof nestedValue ===
        "object" &&
      !Array.isArray(nestedValue)
    ) {
      if (
        isPermissionEnabled(
          nestedValue
        )
      ) {
        return true;
      }
    }
  }

  /*
   * ---------------------------------------------------------
   * 4. MODULE BASED ROLE ACCESS
   *
   * If your permission object contains:
   *
   * {
   *   "user-list": {
   *      "view": 1
   *   }
   * }
   *
   * or
   *
   * {
   *   "user-list.view": 1
   * }
   *
   * it is intentionally NOT treated as role access here.
   *
   * Role access and module permissions should remain separate.
   * ---------------------------------------------------------
   */

  return false;
};

/* =========================================================
   DASHBOARD
========================================================= */

export default function Dashboard() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

  /* =======================================================
     STATE
  ======================================================= */

  const [roleId, setRoleId] =
    useState(null);

  const [roles, setRoles] =
    useState([]);

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({});

  const [users, setUsers] =
    useState([]);

  const [counts, setCounts] =
    useState({});

  const [
    staffPermissions,
    setStaffPermissions,
  ] = useState({});

  const [
    staffPermissionsLoaded,
    setStaffPermissionsLoaded,
  ] = useState(false);

  /* =======================================================
     URL PARAMS
  ======================================================= */

  const urlRoleParam =
    searchParams.get("role");

  const moduleParam =
    searchParams.get("module");

  const hasRoleParam =
    urlRoleParam !== null;

  const hasModuleParam =
    moduleParam !== null;

  const isDashboardHome =
    !hasRoleParam &&
    !hasModuleParam;

  /* =======================================================
     CURRENT LOGGED-IN ROLE
  ======================================================= */

  useEffect(() => {
    const currentRoleId =
      getRoleId();

    if (
      currentRoleId === null ||
      currentRoleId === undefined
    ) {
      return;
    }

    setRoleId(
      Number(currentRoleId)
    );
  }, []);

  /* =======================================================
     LOAD STAFF PERMISSIONS
  ======================================================= */

  useEffect(() => {
    /*
     * Non-staff does not need staff permissions.
     */

    if (roleId !== 9) {
      setStaffPermissions({});
      setStaffPermissionsLoaded(
        true
      );

      return;
    }

    /*
     * IMPORTANT:
     *
     * Permission validation must wait until
     * localStorage has been checked.
     */

    setStaffPermissionsLoaded(
      false
    );

    try {
      const possibleKeys = [
        "staff_permissions",
        "permissions",
      ];

      let permissions = null;

      for (
        const key of possibleKeys
      ) {
        const saved =
          localStorage.getItem(key);

        if (!saved) {
          continue;
        }

        try {
          const parsed =
            JSON.parse(saved);

          if (
            parsed &&
            typeof parsed ===
              "object" &&
            !Array.isArray(parsed)
          ) {
            permissions = parsed;
            break;
          }
        } catch {
          // Continue checking next key
        }
      }

      const normalized =
        normalizePermissions(
          permissions
        );

      console.log(
        "STAFF PERMISSIONS:",
        normalized
      );

      setStaffPermissions(
        normalized
      );
    } catch (error) {
      console.error(
        "STAFF PERMISSION LOAD ERROR:",
        error
      );

      setStaffPermissions({});
    } finally {
      /*
       * Validation can start only after this
       * becomes true.
       */

      setStaffPermissionsLoaded(
        true
      );
    }
  }, [roleId]);

  /* =======================================================
     GET ROLES
  ======================================================= */

  useEffect(() => {
    const loadRoles =
      async () => {
        try {
          const response =
            await getRoles();

          const roleData =
            Array.isArray(
              response?.data
            )
              ? response.data
              : [];

          const activeRoles =
            roleData
              .filter(
                (role) =>
                  Number(
                    role?.status ?? 1
                  ) === 1
              )
              .sort(
                (a, b) =>
                  Number(
                    a?.sequence ?? 0
                  ) -
                  Number(
                    b?.sequence ?? 0
                  )
              );

          setRoles(
            activeRoles
          );
        } catch (error) {
          console.error(
            "GET ROLES ERROR:",
            error
          );

          setRoles([]);
        }
      };

    loadRoles();
  }, []);

  /* =======================================================
     ROLE HELPERS
  ======================================================= */

  const normalizeRoleValue =
    useCallback(
      (value) => {
        return String(
          value || ""
        )
          .trim()
          .toLowerCase()
          .replace(/_/g, " ")
          .replace(/-/g, " ")
          .replace(/\s+/g, " ");
      },
      []
    );

  const getRoleIdFromValue =
    useCallback(
      (value) => {
        if (
          value === null ||
          value === undefined ||
          value === ""
        ) {
          return null;
        }

        const valueString =
          String(value).trim();

        /*
         * Numeric role ID
         */

        if (
          /^\d+$/.test(
            valueString
          )
        ) {
          return Number(
            valueString
          );
        }

        const normalizedValue =
          normalizeRoleValue(
            valueString
          );

        const foundRole =
          roles.find(
            (role) => {
              const roleName =
                normalizeRoleValue(
                  role?.name
                );

              const roleSlug =
                normalizeRoleValue(
                  role?.slug
                );

              return (
                roleName ===
                  normalizedValue ||
                roleSlug ===
                  normalizedValue
              );
            }
          );

        return foundRole
          ? Number(
              foundRole.role_id
            )
          : null;
      },
      [
        roles,
        normalizeRoleValue,
      ]
    );

  /* =======================================================
     REQUESTED ROLE
  ======================================================= */

  const urlRole = useMemo(
    () =>
      getRoleIdFromValue(
        urlRoleParam
      ),
    [
      urlRoleParam,
      getRoleIdFromValue,
    ]
  );

  const moduleRole =
    useMemo(
      () =>
        getRoleIdFromValue(
          moduleParam
        ),
      [
        moduleParam,
        getRoleIdFromValue,
      ]
    );

  const requestedRole =
    urlRole !== null
      ? urlRole
      : moduleRole;

  /* =======================================================
     ROLE ACCESS
  ======================================================= */

  const isRoleAllowed =
    useMemo(() => {
      /*
       * No logged-in role yet.
       */

      if (roleId === null) {
        return false;
      }

      /*
       * No requested role means dashboard home.
       */

      if (
        requestedRole === null
      ) {
        return true;
      }

      /*
       * ---------------------------------------------------
       * STAFF
       * ---------------------------------------------------
       *
       * Staff does NOT use normal hierarchy.
       */

      if (roleId === 9) {
        /*
         * Permission is still loading.
         *
         * Don't mark it unauthorized yet.
         */

        if (
          !staffPermissionsLoaded
        ) {
          return true;
        }

        const role =
          roles.find(
            (item) =>
              Number(
                item?.role_id
              ) ===
              Number(
                requestedRole
              )
          );

        if (!role) {
          return false;
        }

        return hasRolePermission(
          staffPermissions,
          role
        );
      }

      /*
       * ---------------------------------------------------
       * MASTER ADMIN
       * ---------------------------------------------------
       */

      if (roleId === 0) {
        return true;
      }

      /*
       * ---------------------------------------------------
       * OWN ROLE
       * ---------------------------------------------------
       */

      if (
        requestedRole ===
        roleId
      ) {
        return true;
      }

      /*
       * ---------------------------------------------------
       * NORMAL HIERARCHY
       * ---------------------------------------------------
       */

      return (
        allowedRoles[
          roleId
        ]?.includes(
          requestedRole
        ) || false
      );
    }, [
      roleId,
      requestedRole,
      roles,
      staffPermissions,
      staffPermissionsLoaded,
    ]);

  /* =======================================================
     SELECTED ROLE
  ======================================================= */

  const selectedRole =
    requestedRole !== null &&
    isRoleAllowed
      ? requestedRole
      : null;

  /* =======================================================
     ROLE LIST NAVIGATION
  ======================================================= */

  const handleRoleList =
    useCallback(
      (role) => {
        router.push(
          `/dashboard?role=${encodeURIComponent(
            role
          )}`
        );
      },
      [router]
    );

  /* =======================================================
     ROLE NAME
  ======================================================= */

  const getRoleName =
    useCallback(
      (id) => {
        const numericRoleId =
          Number(id);

        if (
          numericRoleId === 0
        ) {
          return "Master Admin";
        }

        const role =
          roles.find(
            (item) =>
              Number(
                item?.role_id
              ) ===
              numericRoleId
          );

        return (
          role?.name ||
          "Unknown"
        );
      },
      [roles]
    );

  /* =======================================================
     ROLE PARAM VALIDATION
  ======================================================= */

  useEffect(() => {
    /*
     * Nothing to validate yet.
     */

    if (
      roleId === null ||
      !hasRoleParam
    ) {
      return;
    }

    /*
     * ---------------------------------------------------
     * VERY IMPORTANT FOR STAFF
     * ---------------------------------------------------
     *
     * Don't show unauthorized message while permission
     * is still being loaded.
     */

    if (
      roleId === 9 &&
      !staffPermissionsLoaded
    ) {
      return;
    }

    /*
     * Roles API should also be ready.
     */

    if (
      roles.length === 0
    ) {
      return;
    }

    if (
      urlRole === null ||
      !isRoleAllowed
    ) {
      console.log(
        "ROLE ACCESS DENIED:",
        {
          roleId,
          requestedRole: urlRole,
          staffPermissions,
        }
      );

      toast.error(
        "You are not allowed to access this role"
      );

      router.replace(
        "/dashboard"
      );
    }
  }, [
    roleId,
    hasRoleParam,
    urlRole,
    isRoleAllowed,
    staffPermissionsLoaded,
    roles.length,
    staffPermissions,
    router,
  ]);

  /* =======================================================
     MODULE PARAM VALIDATION
  ======================================================= */

  useEffect(() => {
    if (
      roleId === null ||
      !hasModuleParam ||
      moduleRole === null
    ) {
      return;
    }

    /*
     * Staff permission still loading.
     */

    if (
      roleId === 9 &&
      !staffPermissionsLoaded
    ) {
      return;
    }

    /*
     * Roles not loaded yet.
     */

    if (
      roles.length === 0
    ) {
      return;
    }

    if (!isRoleAllowed) {
      toast.error(
        "You are not allowed to access this module"
      );

      router.replace(
        "/dashboard"
      );
    }
  }, [
    roleId,
    hasModuleParam,
    moduleRole,
    isRoleAllowed,
    staffPermissionsLoaded,
    roles.length,
    router,
  ]);

  /* =======================================================
     RESET PAGE
  ======================================================= */

  useEffect(() => {
    setPage(1);
  }, [
    urlRoleParam,
    moduleParam,
  ]);

  /* =======================================================
     ROLE CARDS
  ======================================================= */

  const cards = useMemo(() => {
    return roles.map(
      (role) => {
        const numericRoleId =
          Number(
            role?.role_id
          );

        return {
          id: role?.id,

          roleId:
            numericRoleId,

          title:
            role?.name ||
            role?.slug ||
            "Unknown Role",

          count:
            counts[
              numericRoleId
            ] || 0,

          icon:
            role?.icon || null,

          sequence:
            Number(
              role?.sequence
            ) || 0,

          status:
            Number(
              role?.status ?? 1
            ),
        };
      }
    );
  }, [
    roles,
    counts,
  ]);

  /* =======================================================
     VISIBLE ROLE CARDS
  ======================================================= */

  const visibleCards =
    useMemo(() => {
      const currentRole =
        Number(roleId);

      /*
       * Master Admin
       */

      if (
        currentRole === 0
      ) {
        return cards;
      }

      /*
       * Staff
       */

      if (
        currentRole === 9
      ) {
        /*
         * While permissions are loading,
         * don't show incorrect role cards.
         */

        if (
          !staffPermissionsLoaded
        ) {
          return [];
        }

        return cards.filter(
          (card) => {
            const role =
              roles.find(
                (item) =>
                  Number(
                    item?.role_id
                  ) ===
                  Number(
                    card.roleId
                  )
              );

            return hasRolePermission(
              staffPermissions,
              role
            );
          }
        );
      }

      /*
       * Normal roles
       */

      const roleIds =
        allowedRoles[
          currentRole
        ] || [];

      return cards.filter(
        (card) =>
          roleIds.includes(
            Number(
              card.roleId
            )
          )
      );
    }, [
      cards,
      roleId,
      roles,
      staffPermissions,
      staffPermissionsLoaded,
    ]);

  /* =======================================================
     FETCH USERS
  ======================================================= */

  const fetchUsers =
    useCallback(async () => {
      try {
        /*
         * -------------------------------------------------
         * Staff permission is not ready.
         * Don't make API calls.
         * -------------------------------------------------
         */

        if (
          roleId === 9 &&
          !staffPermissionsLoaded
        ) {
          return;
        }

        const roleCounts =
          {};

        /*
         * Initialize all active roles.
         */

        roles.forEach(
          (role) => {
            const numericRoleId =
              Number(
                role?.role_id
              );

            if (
              Number.isFinite(
                numericRoleId
              )
            ) {
              roleCounts[
                numericRoleId
              ] = 0;
            }
          }
        );

        /* ===============================================
           STAFF
        =============================================== */

        if (
          roleId === 9
        ) {
          const permittedRoles =
            roles.filter(
              (role) =>
                hasRolePermission(
                  staffPermissions,
                  role
                )
            );

          /*
           * Get count for only permitted roles.
           */

          const responses =
            await Promise.all(
              permittedRoles.map(
                (role) =>
                  getAllStaffData(
                    1,
                    1,
                    Number(
                      role.role_id
                    )
                  )
              )
            );

          responses.forEach(
            (
              response,
              index
            ) => {
              const currentRoleId =
                Number(
                  permittedRoles[
                    index
                  ]?.role_id
                );

              roleCounts[
                currentRoleId
              ] = Number(
                response
                  ?.pagination
                  ?.totalUsers || 0
              );
            }
          );
        }

        /* ===============================================
           MASTER / ADMIN / NORMAL
        =============================================== */

        else {
          const countResponse =
            await getAllStaffData(
              1,
              10000,
              ""
            );

          const allUsers =
            Array.isArray(
              countResponse?.data
            )
              ? countResponse.data
              : [];

          allUsers.forEach(
            (user) => {
              const userRoleId =
                Number(
                  user?.role_id
                );

              if (
                Object.prototype.hasOwnProperty.call(
                  roleCounts,
                  userRoleId
                )
              ) {
                roleCounts[
                  userRoleId
                ] += 1;
              }
            }
          );
        }

        setCounts(
          roleCounts
        );

        /* ===============================================
           DASHBOARD HOME
        =============================================== */

        if (
          isDashboardHome
        ) {
          setUsers([]);
          setPagination({});
          return;
        }

        /* ===============================================
           INVALID ROLE
        =============================================== */

        if (
          selectedRole === null
        ) {
          setUsers([]);
          setPagination({});
          return;
        }

        /* ===============================================
           SELECTED ROLE USERS
        =============================================== */

        const response =
          await getAllStaffData(
            page,
            10,
            selectedRole
          );

        setUsers(
          Array.isArray(
            response?.data
          )
            ? response.data
            : []
        );

        setPagination(
          response?.pagination ||
            {}
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
      staffPermissionsLoaded,
      page,
      selectedRole,
      isDashboardHome,
    ]);

  /* =======================================================
     FETCH USERS EFFECT
  ======================================================= */

  useEffect(() => {
    /*
     * Wait for role.
     */

    if (
      roleId === null
    ) {
      return;
    }

    /*
     * Wait for roles.
     */

    if (
      roles.length === 0
    ) {
      return;
    }

    /*
     * Staff permission must be loaded.
     */

    if (
      roleId === 9 &&
      !staffPermissionsLoaded
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
    staffPermissionsLoaded,
    fetchUsers,
  ]);

  /* =======================================================
     LOADING SCREEN FOR STAFF
  ======================================================= */

  if (
    roleId === 9 &&
    !staffPermissionsLoaded
  ) {
    return (
      <div className="bg-gray-100 min-h-[200px] flex items-center justify-center">
        <div className="bg-white rounded-xl shadow px-6 py-5">
          <p className="text-gray-600 text-sm">
            Loading permissions...
          </p>
        </div>
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="bg-gray-100">
      <main className="pt-0 p-0">

        {/* =================================================
            PAGE TITLE
        ================================================= */}

        <h1 className="md:text-3xl font-bold md:mb-6 mb-0 text-[20px]">
          Welcome Dashboard
        </h1>

        {/* =================================================
            DASHBOARD HOME
        ================================================= */}

        {isDashboardHome && (
          <>
            {/* =============================================
                ROLE CARDS
            ============================================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {visibleCards.map(
                (card) => (
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
                )
              )}
            </div>

            {/* =============================================
                CHARTS
            ============================================= */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

              {/* =========================================
                  BAR CHART
              ========================================= */}

              <div className="bg-white p-5 rounded-xl shadow">
                <h3 className="text-gray-700 font-semibold mb-4">
                  Role-wise Users (Bar Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart
                    data={
                      visibleCards
                    }
                  >
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
                      allowDecimals={
                        false
                      }
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

              {/* =========================================
                  PIE CHART
              ========================================= */}

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
                      data={
                        visibleCards
                      }
                      dataKey="count"
                      nameKey="title"
                      cx="50%"
                      cy="50%"
                      outerRadius={
                        100
                      }
                      label
                    >
                      {visibleCards.map(
                        (
                          entry,
                          index
                        ) => (
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

              {/* =========================================
                  LINE CHART
              ========================================= */}

              <div className="bg-white p-5 rounded-xl shadow md:col-span-2">
                <h3 className="text-gray-700 font-semibold mb-4">
                  Role-wise Users (Line Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart
                    data={
                      visibleCards
                    }
                  >
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
                      allowDecimals={
                        false
                      }
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

        {/* =================================================
            ROLE USERS TABLE
        ================================================= */}

        {!isDashboardHome &&
          selectedRole !== null && (
            <UsersTable
              users={users}
              page={page}
              pagination={
                pagination
              }
              setPage={setPage}
              getRoleName={
                getRoleName
              }
              selectedRole={Number(
                selectedRole
              )}
              handleRoleList={
                handleRoleList
              }
            />
          )}
      </main>
    </div>
  );
}