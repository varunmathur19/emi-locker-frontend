"use client";

import { useEffect, useState } from "react";
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

import {
  getAllStaffData,
  getModules,
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

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [roleId, setRoleId] = useState(null);
  const [modules, setModules] = useState([]);
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

  const allowedRoles = {
    0: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    1: [2, 3, 4, 5, 6, 7, 8, 9],
    2: [3, 4, 5, 6, 7, 8],
    3: [4, 5, 6, 7, 8],
    4: [5, 6, 7, 8],
    5: [6, 7, 8],
    6: [7, 8],
    7: [8],
    8: [],
    9: [],
  };

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

  useEffect(() => {
    const role = getRoleId();

    if (role === null || role === undefined) {
      return;
    }

    setRoleId(Number(role));
  }, []);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await getModules();

        if (
          response?.success &&
          Array.isArray(response?.modules)
        ) {
          setModules(response.modules);
        } else {
          setModules([]);
        }
      } catch (error) {
        console.error("GET MODULES ERROR:", error);
        setModules([]);
      }
    };

    loadModules();
  }, []);

  const urlRoleParam = searchParams.get("role");

  const urlRole =
    urlRoleParam !== null
      ? Number(urlRoleParam)
      : null;

  const selectedRole =
    roleId !== null &&
    urlRole !== null &&
    (
      urlRole === roleId ||
      allowedRoles[roleId]?.includes(urlRole)
    )
      ? urlRole
      : null;

  const isDashboardHome = selectedRole === null;

  const handleRoleList = (role) => {
    router.push(`/dashboard?role=${role}`);
  };

  const getRoleName = (id) => {
    return roles[Number(id)] || "Unknown";
  };

  const roleMap = {
    admin: 1,
    cnf: 2,
    "super distributor": 3,
    "super distributer": 3,
    distributor: 4,
    fos: 5,
    retailer: 6,
    "sub retailer": 7,
    employee: 8,
    staff: 9,
  };

  const activeRoleIds = modules
    .filter((module) => {
      if (typeof module === "string") {
        return true;
      }

      return Number(module?.status) === 1;
    })
    .map((module) => {
      const name =
        typeof module === "string"
          ? module
          : module?.name;

      if (!name) {
        return null;
      }

      const key = String(name)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

      return roleMap[key] ?? null;
    })
    .filter(
      (role, index, array) =>
        role !== null &&
        array.indexOf(role) === index
    );

  const isRoleActive = (role) => {
    return activeRoleIds.includes(Number(role));
  };

  useEffect(() => {
    if (roleId === null || !urlRoleParam) {
      return;
    }

    const currentUrlRole = Number(urlRoleParam);

    const isOwnRole = currentUrlRole === roleId;

    const isChildRole =
      allowedRoles[roleId]?.includes(currentUrlRole);

    if (!isOwnRole && !isChildRole) {
      toast.error(
        "You are not allowed to access this role"
      );

      router.replace("/dashboard");
    }
  }, [
    roleId,
    urlRoleParam,
    router,
  ]);

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

  const fetchUsers = async () => {
    try {
      const countRes = await getAllStaffData(
        1,
        10000,
        ""
      );

      const allData =
        countRes?.data || [];

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
        switch (Number(user.role_id)) {
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

      if (isDashboardHome) {
        setUsers([]);
        setPagination({});
        return;
      }

      let roleFilter = selectedRole;

      if (
        roleFilter === null ||
        roleFilter === undefined
      ) {
        roleFilter =
          Number(roleId) + 1;
      }

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

  const visibleCards = cards.filter((card) => {
    if (!isRoleActive(card.roleId)) {
      return false;
    }

    if (roleId === 0) {
      return true;
    }

    return allowedRoles[roleId]?.includes(
      card.roleId
    );
  });

  return (
    <div className="bg-gray-100">
      <main className="pt-0 p-0">
        <h1 className="md:text-3xl font-bold md:mb-6 mb-0 text-[20px]">
          Welcome Dashboard
        </h1>

        {isDashboardHome && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {visibleCards.map((card) => (
                <div
                  key={card.roleId}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <div className="bg-white p-5 rounded-xl shadow">
                <h3 className="text-gray-700 font-semibold mb-4">
                  Role-wise Users (Bar Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
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
              </div>

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

              <div className="bg-white p-5 rounded-xl shadow md:col-span-2">
                <h3 className="text-gray-700 font-semibold mb-4">
                  Role-wise Users (Line Chart)
                </h3>

                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <LineChart data={visibleCards}>
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

                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

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