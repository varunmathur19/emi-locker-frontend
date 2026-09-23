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
    if (value.status !== undefined) {
      return Number(value.status) === 1;
    }

    if (value.access !== undefined) {
      return Number(value.access) === 1;
    }

    if (value.view !== undefined) {
      return Number(value.view) === 1;
    }

    if (value.enabled !== undefined) {
      return isPermissionEnabled(
        value.enabled
      );
    }

    return true;
  }

  return false;
};


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


const getPermissionObject = (
  permissionData
) => {
  if (!permissionData) {
    return {};
  }

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

  return false;
};



export default function Dashboard() {
  const router = useRouter();

  const searchParams =
    useSearchParams();

 

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

  const [keySettings, setKeySettings] =
    useState([]);

  const [keySettingsLoading, setKeySettingsLoading] =
    useState(true);

  const [
    staffPermissions,
    setStaffPermissions,
  ] = useState({});

  const [
    staffPermissionsLoaded,
    setStaffPermissionsLoaded,
  ] = useState(false);



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



  useEffect(() => {
    const loadKeySettings =
      async () => {
        try {
          setKeySettingsLoading(
            true
          );

          const response =
            await getKeySettings();

          if (
            response?.success &&
            Array.isArray(
              response?.data
            )
          ) {
            const activeKeys =
              response.data.filter(
                (item) =>
                  Number(
                    item?.status
                  ) === 1
              );

            setKeySettings(
              activeKeys
            );
          } else {
            setKeySettings([]);
          }
        } catch (error) {
          console.error(
            "GET KEY SETTINGS ERROR:",
            error
          );

          setKeySettings([]);
        } finally {
          setKeySettingsLoading(
            false
          );
        }
      };

    loadKeySettings();
  }, []);



  useEffect(() => {
    if (roleId !== 9) {
      setStaffPermissions({});
      setStaffPermissionsLoaded(
        true
      );

      return;
    }

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
      setStaffPermissionsLoaded(
        true
      );
    }
  }, [roleId]);



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

 

  const isRoleAllowed =
    useMemo(() => {
      if (roleId === null) {
        return false;
      }

      if (
        requestedRole === null
      ) {
        return true;
      }

      if (roleId === 9) {
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

      if (roleId === 0) {
        return true;
      }

      if (
        requestedRole ===
        roleId
      ) {
        return true;
      }

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



  const selectedRole =
    requestedRole !== null &&
    isRoleAllowed
      ? requestedRole
      : null;



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



  useEffect(() => {
    if (
      roleId === null ||
      !hasRoleParam
    ) {
      return;
    }

    if (
      roleId === 9 &&
      !staffPermissionsLoaded
    ) {
      return;
    }

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

 

  useEffect(() => {
    if (
      roleId === null ||
      !hasModuleParam ||
      moduleRole === null
    ) {
      return;
    }

    if (
      roleId === 9 &&
      !staffPermissionsLoaded
    ) {
      return;
    }

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



  useEffect(() => {
    setPage(1);
  }, [
    urlRoleParam,
    moduleParam,
  ]);



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



  const visibleCards =
    useMemo(() => {
      const currentRole =
        Number(roleId);

      if (
        currentRole === 0
      ) {
        return cards;
      }

      if (
        currentRole === 9
      ) {
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



  const fetchUsers =
    useCallback(async () => {
      try {
        if (
          roleId === 9 &&
          !staffPermissionsLoaded
        ) {
          return;
        }

        const roleCounts =
          {};

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

      

        if (
          isDashboardHome
        ) {
          setUsers([]);
          setPagination({});
          return;
        }

       

        if (
          selectedRole === null
        ) {
          setUsers([]);
          setPagination({});
          return;
        }

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



  useEffect(() => {
    if (
      roleId === null
    ) {
      return;
    }

    if (
      roles.length === 0
    ) {
      return;
    }

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



  const totalKeyBalance =
    useMemo(() => {
      return keySettings.reduce(
        (total, item) =>
          total +
          Number(
            item?.balance || 0
          ),
        0
      );
    }, [keySettings]);



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

  

  return (
    <div className="bg-gray-100">
      <main className="pt-0 p-0">

        

        <h1 className="md:text-3xl font-bold md:mb-6 mb-0 text-[20px]">
          Welcome Dashboard
        </h1>

       

        {isDashboardHome && (
          <>
           

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

          

            <div className="mt-6">
              <div className="bg-white p-5 rounded-xl shadow">

                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Key Settings
                    </h2>

                    <p className="text-sm text-gray-500 mt-1">
                      Current wallet balance
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 px-4 py-2">
                    <p className="text-xs text-blue-500">
                      Total Balance
                    </p>

                    <p className="text-lg font-bold text-blue-600">
                      {totalKeyBalance.toLocaleString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>

                {keySettingsLoading ? (
                  <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
                    Loading key settings...
                  </div>
                ) : keySettings.length === 0 ? (
                  <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
                    No active key settings found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {keySettings.map(
                      (item) => {
                        const balance =
                          Number(
                            item?.balance ||
                              0
                          );

                        return (
                          <div
                            key={
                              item.id
                            }
                            className="rounded-xl border border-gray-200 bg-gray-50 p-5"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <h3 className="text-sm font-semibold text-gray-700">
                                  {item.name ||
                                    "Unnamed Key"}
                                </h3>

                                <p className="mt-1 text-xs text-gray-400">
                                  Wallet Balance
                                </p>
                              </div>

                              <div className="rounded-lg bg-blue-50 px-3 py-2">
                                <span className="text-lg font-bold text-blue-600">
                                  {balance.toLocaleString(
                                    "en-IN"
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            </div>

            

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">

             

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
            </div>
          </>
        )}

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