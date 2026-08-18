"use client";

import { useEffect, useState } from "react";
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

import { getAllStaffData } from "@/services/api";

import {
  getRoleId,
  getUserFromToken,
} from "@/utils/token";

import UsersTable from "../../components/dashboard/UsersTable";

// ======================================================
// PIE COLORS
// ======================================================

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

// ======================================================
// DASHBOARD
// ======================================================

export default function Dashboard() {
  // ====================================================
  // ROUTER
  // ====================================================

  const router = useRouter();

  const searchParams = useSearchParams();

  // ====================================================
  // STATE
  // ====================================================

  const [allUsers, setAllUsers] = useState([]);

  const [roleId, setRoleId] = useState(null);

  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState({});

  const [users, setUsers] = useState([]);

  const [counts, setCounts] = useState({
    admin: 0,
    cnf: 0,
    super: 0,
    distributor: 0,
    fos: 0,
    retailer: 0,
    subRetailer: 0,
    employee: 0,
    staff: 0,
  });

  // ====================================================
  // ROLE HIERARCHY
  // ====================================================
  //
  // 0 = MASTER ADMIN
  // 1 = ADMIN
  // 2 = CNF
  // 3 = SUPER DISTRIBUTOR
  // 4 = DISTRIBUTOR
  // 5 = FOS
  // 6 = RETAILER
  // 7 = SUB RETAILER
  // 8 = EMPLOYEE
  // 9 = STAFF
  //
  // STAFF KO SIRF ADMIN ACCESS KAR SAKTA HAI
  //
  // ====================================================

  const allowedRoles = {
    // ==================================================
    // MASTER ADMIN
    // ==================================================

    0: [
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ],

    // ==================================================
    // ADMIN
    // ==================================================

    1: [
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ],

    // ==================================================
    // CNF
    // ==================================================

    2: [
      3,
      4,
      5,
      6,
      7,
      8,
    ],

    // ==================================================
    // SUPER DISTRIBUTOR
    // ==================================================

    3: [
      4,
      5,
      6,
      7,
      8,
    ],

    // ==================================================
    // DISTRIBUTOR
    // ==================================================

    4: [
      5,
      6,
      7,
      8,
    ],

    // ==================================================
    // FOS
    // ==================================================

    5: [
      6,
      7,
      8,
    ],

    // ==================================================
    // RETAILER
    // ==================================================

    6: [
      7,
      8,
    ],

    // ==================================================
    // SUB RETAILER
    // ==================================================

    7: [
      8,
    ],

    // ==================================================
    // EMPLOYEE
    // ==================================================

    8: [],

    // ==================================================
    // STAFF
    // ==================================================

    9: [],
  };

  // ====================================================
  // GET LOGGED-IN ROLE
  // ====================================================

  useEffect(() => {
    const tokenUser = getUserFromToken();

    const role = getRoleId();

    console.log(
      "================================"
    );

    console.log(
      "Dashboard Token User:",
      tokenUser
    );

    console.log(
      "Dashboard Role:",
      role
    );

    console.log(
      "================================"
    );

    if (
      role === null ||
      role === undefined
    ) {
      return;
    }

    setRoleId(Number(role));
  }, []);

  // ====================================================
  // URL ROLE
  // ====================================================

  const urlRoleParam =
    searchParams.get("role");

  const urlRole =
    urlRoleParam !== null
      ? Number(urlRoleParam)
      : null;

  // ====================================================
  // SELECTED ROLE
  // ====================================================

  const selectedRole =
    roleId !== null &&
    urlRole !== null &&
    (
      urlRole === roleId ||
      allowedRoles[roleId]?.includes(urlRole)
    )
      ? urlRole
      : null;

  // ====================================================
  // DASHBOARD HOME
  // ====================================================

  const isDashboardHome =
    selectedRole === null;

  // ====================================================
  // HANDLE ROLE LIST
  // ====================================================

  const handleRoleList = (role) => {
    router.push(
      `/dashboard?role=${role}`
    );
  };

  // ====================================================
  // ROLE NAME
  // ====================================================

  const getRoleName = (id) => {
    const roles = {
      0: "Master Admin",
      1: "Admin",
      2: "CNF",
      3: "Super Distributor",
      4: "Distributor",
      5: "FOS",
      6: "Retailer",
      7: "Sub Retailer",
      8: "Employee",
      9: "Staff",
    };

    return (
      roles[Number(id)] ||
      "Unknown"
    );
  };

  // ====================================================
  // URL ROLE ACCESS CHECK
  // ====================================================

  useEffect(() => {
    if (roleId === null) {
      return;
    }

    // URL me role nahi hai
    if (!urlRoleParam) {
      return;
    }

    const currentUrlRole =
      Number(urlRoleParam);

    // ==================================================
    // OWN ROLE
    // ==================================================

    const isOwnRole =
      currentUrlRole === roleId;

    // ==================================================
    // CHILD ROLE
    // ==================================================

    const isChildRole =
      allowedRoles[roleId]?.includes(
        currentUrlRole
      );

    console.log(
      "================================"
    );

    console.log(
      "Dashboard Access Check"
    );

    console.log(
      "Logged Role:",
      roleId
    );

    console.log(
      "URL Role:",
      currentUrlRole
    );

    console.log(
      "Allowed Roles:",
      allowedRoles[roleId]
    );

    console.log(
      "Is Own Role:",
      isOwnRole
    );

    console.log(
      "Is Child Role:",
      isChildRole
    );

    console.log(
      "================================"
    );

    // ==================================================
    // NOT ALLOWED
    // ==================================================

    if (
      !isOwnRole &&
      !isChildRole
    ) {
      toast.error(
        "You are not allowed to access this role"
      );

      router.replace(
        "/dashboard"
      );
    }
  }, [
    roleId,
    urlRoleParam,
    router,
  ]);

  // ====================================================
  // FETCH USERS
  // ====================================================

  useEffect(() => {
    if (roleId === null) {
      return;
    }

    fetchUsers();
  }, [
    page,
    selectedRole,
    roleId,
  ]);

  // ====================================================
  // FETCH USERS
  // ====================================================

  const fetchUsers = async () => {
    try {
      // ==================================================
      // GET ALL USERS
      // ==================================================

      const countRes =
        await getAllStaffData(
          1,
          10000,
          ""
        );

      const allData =
        countRes?.data || [];

      setAllUsers(allData);

      // ==================================================
      // ROLE COUNTS
      // ==================================================

      const roleCounts = {
        admin: 0,
        cnf: 0,
        super: 0,
        distributor: 0,
        fos: 0,
        retailer: 0,
        subRetailer: 0,
        employee: 0,
        staff: 0,
      };

      allData.forEach((user) => {
        switch (
          Number(user.role_id)
        ) {
          case 1:
            roleCounts.admin++;
            break;

          case 2:
            roleCounts.cnf++;
            break;

          case 3:
            roleCounts.super++;
            break;

          case 4:
            roleCounts.distributor++;
            break;

          case 5:
            roleCounts.fos++;
            break;

          case 6:
            roleCounts.retailer++;
            break;

          case 7:
            roleCounts.subRetailer++;
            break;

          case 8:
            roleCounts.employee++;
            break;

          case 9:
            roleCounts.staff++;
            break;

          default:
            break;
        }
      });

      setCounts(roleCounts);

      // ==================================================
      // DASHBOARD HOME
      // ==================================================

      if (isDashboardHome) {
        setUsers([]);
        setPagination({});
        return;
      }

      // ==================================================
      // SELECTED ROLE
      // ==================================================

      let roleFilter =
        selectedRole;

      if (
        roleFilter === null ||
        roleFilter === undefined
      ) {
        roleFilter =
          Number(roleId) + 1;
      }

      // ==================================================
      // GET ROLE USERS
      // ==================================================

      const res =
        await getAllStaffData(
          page,
          10,
          roleFilter
        );

      setUsers(
        res?.data || []
      );

      setPagination(
        res?.pagination || {}
      );
    } catch (error) {
      console.error(
        "Fetch Users Error:",
        error
      );
    }
  };

  // ====================================================
  // CARDS
  // ====================================================

  const cards = [
    {
      title: "Admin",
      count: counts.admin,
      roleId: 1,
    },

    {
      title: "CNF",
      count: counts.cnf,
      roleId: 2,
    },

    {
      title: "Super Distributor",
      count: counts.super,
      roleId: 3,
    },

    {
      title: "Distributor",
      count: counts.distributor,
      roleId: 4,
    },

    {
      title: "FOS",
      count: counts.fos,
      roleId: 5,
    },

    {
      title: "Retailer",
      count: counts.retailer,
      roleId: 6,
    },

    {
      title: "Sub Retailer",
      count: counts.subRetailer,
      roleId: 7,
    },

    {
      title: "Employee",
      count: counts.employee,
      roleId: 8,
    },

    {
      title: "Staff",
      count: counts.staff,
      roleId: 9,
    },
  ];

  // ====================================================
  // CHART DATA
  // ====================================================

  const chartData =
    cards.filter((card) => {
      // Master Admin
      if (roleId === 0) {
        return true;
      }

      // Other roles
      return allowedRoles[
        roleId
      ]?.includes(
        card.roleId
      );
    });

  // ====================================================
  // RENDER
  // ====================================================

  return (
    <div className="bg-gray-100">

      <main className="pt-0 p-0">

        <h1
          className="
            md:text-3xl
            font-bold
            md:mb-6
            mb-0
            text-[20px]
          "
        >
          Welcome Dashboard
        </h1>

        {/* ==================================================
            DASHBOARD HOME
        ================================================== */}

        {isDashboardHome && (
          <>
            {/* ==============================================
                ROLE CARDS
            ============================================== */}

            <div
              className="
                grid
                grid-cols-1
                sm:grid-cols-2
                md:grid-cols-4
                gap-5
              "
            >
              {cards
                .filter((card) => {
                  if (roleId === 0) {
                    return true;
                  }

                  return allowedRoles[
                    roleId
                  ]?.includes(
                    card.roleId
                  );
                })
                .map((card) => (
                  <div
                    key={card.roleId}
                    className="
                      bg-white
                      p-5
                      rounded-xl
                      shadow
                    "
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

            {/* ==================================================
                CHARTS
            ================================================== */}

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-2
                gap-5
                mt-6
              "
            >
              {/* BAR */}

              <div
                className="
                  bg-white
                  p-5
                  rounded-xl
                  shadow
                "
              >
                <h3
                  className="
                    text-gray-700
                    font-semibold
                    mb-4
                  "
                >
                  Role-wise Users
                  (Bar Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <BarChart
                    data={chartData}
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

              {/* PIE */}

              <div
                className="
                  bg-white
                  p-5
                  rounded-xl
                  shadow
                "
              >
                <h3
                  className="
                    text-gray-700
                    font-semibold
                    mb-4
                  "
                >
                  Role Distribution
                  (Pie Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <PieChart>

                    <Pie
                      data={chartData}
                      dataKey="count"
                      nameKey="title"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {chartData.map(
                        (
                          entry,
                          index
                        ) => (
                          <Cell
                            key={
                              `cell-${entry.roleId}`
                            }
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

              {/* LINE */}

              <div
                className="
                  bg-white
                  p-5
                  rounded-xl
                  shadow
                  md:col-span-2
                "
              >
                <h3
                  className="
                    text-gray-700
                    font-semibold
                    mb-4
                  "
                >
                  Role-wise Users
                  (Line Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart
                    data={chartData}
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

        {/* ==================================================
            ROLE USER TABLE
        ================================================== */}

        {!isDashboardHome && (
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