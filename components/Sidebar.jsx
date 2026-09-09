"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import * as RiIcons from "react-icons/ri";
import {
  getRoleId,
  removeToken,
  restoreOriginalLogin,
} from "@/utils/token";
import {
  logoutStaff,
  getModules,
} from "@/services/api";

const roleIdBySlug = {
  "master-admin": 0,
  admin: 1,
  cnf: 2,
  "super-distributor": 3,
  distributor: 4,
  fos: 5,
  retailer: 6,
  "sub-retailer": 7,
  employee: 8,
  staff: 9,
};

const allowedRolesByRole = {
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

const getModuleIcon = (iconName, size = 20) => {
  if (!iconName) {
    return <RiIcons.RiBuilding2Line size={size} />;
  }

  const iconKey = String(iconName).trim();
  const IconComponent = RiIcons[iconKey];

  if (
    !IconComponent ||
    typeof IconComponent !== "function"
  ) {
    return <RiIcons.RiBuilding2Line size={size} />;
  }

  return <IconComponent size={size} />;
};

export default function Sidebar({ sidebarOpen }) {
  const [roleId, setRoleId] = useState(null);
  const [modules, setModules] = useState([]);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRoleParam = searchParams.get("role");
  const activeModuleParam = searchParams.get("module");

  const activeRole =
    activeRoleParam !== null &&
    activeRoleParam !== ""
      ? Number(activeRoleParam)
      : null;

  const activeModule = String(
    activeModuleParam || ""
  )
    .trim()
    .toLowerCase();

  const loadModules = useCallback(async () => {
    try {
      const response = await getModules();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        const activeModules = response.data
          .filter(
            (moduleItem) =>
              Number(moduleItem?.status ?? 1) === 1
          )
          .sort(
            (a, b) =>
              Number(a?.sequence ?? 0) -
              Number(b?.sequence ?? 0)
          );

        setModules(activeModules);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("GET MODULES ERROR:", error);
      setModules([]);
    }
  }, []);

  useEffect(() => {
    const currentRole = getRoleId();

    if (
      currentRole !== null &&
      currentRole !== undefined &&
      currentRole !== ""
    ) {
      setRoleId(Number(currentRole));
    }
  }, []);

  useEffect(() => {
    loadModules();

    const handleFocus = () => {
      loadModules();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadModules();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [loadModules]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "modules_updated") {
        loadModules();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, [loadModules]);

  const myLogin = () => {
    const restored = restoreOriginalLogin();

    if (!restored) {
      alert("Original login session not found");
      return;
    }

    window.location.href = "/dashboard";
  };

  const logout = async () => {
    try {
      await logoutStaff();
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      removeToken();
      localStorage.removeItem("user");
      localStorage.removeItem("original_token");
      window.location.href = "/";
    }
  };

  const getModuleRole = (moduleItem) => {
    if (
      moduleItem?.role_id !== undefined &&
      moduleItem?.role_id !== null &&
      moduleItem?.role_id !== ""
    ) {
      const numericRole = Number(
        moduleItem.role_id
      );

      if (Number.isFinite(numericRole)) {
        return numericRole;
      }
    }

    const slug = String(
      moduleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    return roleIdBySlug[slug] ?? null;
  };

  const isRoleLinkActive = (moduleItem) => {
    const slug = String(
      moduleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    const moduleRole = getModuleRole(moduleItem);

    if (
      activeRole !== null &&
      moduleRole !== null &&
      Number(activeRole) === Number(moduleRole)
    ) {
      return true;
    }

    if (
      activeModule &&
      slug &&
      activeModule === slug
    ) {
      return true;
    }

    if (!pathname || !slug) {
      return false;
    }

    const slugPath = `/${slug}`;

    return (
      pathname === `/dashboard${slugPath}` ||
      pathname.startsWith(
        `/dashboard${slugPath}/`
      )
    );
  };

  const isModuleLinkActive = (slug) => {
    const normalizedSlug = String(slug || "")
      .trim()
      .toLowerCase();

    if (
      activeModule &&
      normalizedSlug &&
      activeModule === normalizedSlug
    ) {
      return true;
    }

    if (!pathname || !normalizedSlug) {
      return false;
    }

    const slugPath = `/${normalizedSlug}`;

    return (
      pathname === `/dashboard${slugPath}` ||
      pathname.startsWith(
        `/dashboard${slugPath}/`
      )
    );
  };

  const RoleLink = ({ moduleItem }) => {
    const slug = String(
      moduleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    const label =
      moduleItem?.name || slug || "Module";

    const moduleRole = getModuleRole(moduleItem);
    const isActive =
      isRoleLinkActive(moduleItem);

    const role =
      moduleRole !== null
        ? moduleRole
        : roleIdBySlug[slug];

    const href =
      role !== undefined &&
      role !== null
        ? `/dashboard?role=${encodeURIComponent(
            role
          )}&module=${encodeURIComponent(slug)}`
        : `/dashboard?module=${encodeURIComponent(
            slug
          )}`;

    return (
      <Link
        href={href}
        className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
          isActive
            ? "bg-blue-400 text-black"
            : "hover:bg-gray-700"
        }`}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 flex-shrink-0 ${
            isActive
              ? "text-black"
              : "text-white"
          }`}
        >
          {getModuleIcon(
            moduleItem?.icon,
            20
          )}
        </span>

        <span>{label}</span>
      </Link>
    );
  };

  const ModuleLink = ({ moduleItem }) => {
    const slug = String(
      moduleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    const label =
      moduleItem?.name || slug || "Module";

    const isActive =
      isModuleLinkActive(slug);

    return (
      <Link
        href={`/dashboard?module=${encodeURIComponent(
          slug
        )}`}
        className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
          isActive
            ? "bg-blue-400 text-black"
            : "hover:bg-gray-700"
        }`}
      >
        <span
          className={`flex items-center justify-center w-5 h-5 flex-shrink-0 ${
            isActive
              ? "text-black"
              : "text-white"
          }`}
        >
          {getModuleIcon(
            moduleItem?.icon,
            20
          )}
        </span>

        <span>{label}</span>
      </Link>
    );
  };

  const renderModuleLinks = () => {
    const currentRole = Number(roleId);

    const allowedRoles =
      allowedRolesByRole[currentRole] || [];

    return modules
      .map((moduleItem, index) => {
        const moduleRole =
          getModuleRole(moduleItem);

        if (moduleRole !== null) {
          if (
            moduleRole === 9 &&
            currentRole !== 0 &&
            currentRole !== 1
          ) {
            return null;
          }

          if (
            !allowedRoles.includes(moduleRole)
          ) {
            return null;
          }

          return (
            <RoleLink
              key={
                moduleItem?.id ||
                `${moduleItem?.slug}-${index}`
              }
              moduleItem={moduleItem}
            />
          );
        }

        return (
          <ModuleLink
            key={
              moduleItem?.id ||
              `${moduleItem?.slug}-${index}`
            }
            moduleItem={moduleItem}
          />
        );
      })
      .filter(Boolean);
  };

  if (roleId === null) {
    return (
      <aside
        className={`fixed top-0 left-0 h-screen bg-gray-900 text-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-40 ${
          sidebarOpen
            ? "w-64 p-5"
            : "w-0 p-0"
        }`}
      >
        <h2 className="relative text-2xl font-bold mb-6 after:content-[''] after:absolute after:left-0 after:-bottom-3 after:w-full after:h-[1px] after:bg-gray-300">
          Dashboard
        </h2>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-gray-900 text-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out z-40 ${
        sidebarOpen
          ? "w-64 p-5"
          : "w-0 p-0"
      }`}
    >
      <h2 className="relative text-2xl font-bold mb-6 flex-shrink-0 after:content-[''] after:absolute after:left-0 after:-bottom-3 after:w-full after:h-[1px] after:bg-gray-300">
        Dashboard
      </h2>

      <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-2 pb-5 scrollbar-hide">
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
            pathname === "/dashboard" &&
            activeRole === null &&
            !activeModule
              ? "bg-blue-400 text-black"
              : "hover:bg-gray-700"
          }`}
        >
          <RiIcons.RiDashboardLine
            size={20}
          />
          <span>Dashboard</span>
        </Link>

        {Number(roleId) === 0 && (
          <>
            <RoleLink
              moduleItem={{
                name: "Admin",
                slug: "admin",
                role_id: 1,
                icon: "RiUserLine",
              }}
            />

            <Link
              href="/dashboard/modules"
              className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
                pathname ===
                  "/dashboard/modules" ||
                pathname.startsWith(
                  "/dashboard/modules/"
                )
                  ? "bg-blue-400 text-black"
                  : "hover:bg-gray-700"
              }`}
            >
              <RiIcons.RiSettings3Line
                size={20}
              />
              <span>Master Settings</span>
            </Link>

            <Link
              href="/dashboard/sub-modules"
              className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
                pathname ===
                  "/dashboard/sub-modules" ||
                pathname.startsWith(
                  "/dashboard/sub-modules/"
                )
                  ? "bg-blue-400 text-black"
                  : "hover:bg-gray-700"
              }`}
            >
              <RiIcons.RiStore2Line
                size={20}
              />
              <span>Sub Module</span>
            </Link>
          </>
        )}

        {Number(roleId) >= 1 &&
          Number(roleId) <= 9 &&
          renderModuleLinks()}

        <button
          type="button"
          onClick={myLogin}
          className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-3 rounded-md hover:bg-blue-600 transition-all cursor-pointer font-semibold mt-4"
        >
          <RiIcons.RiLoginBoxLine
            size={20}
          />
          My Login
        </button>

        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-md hover:bg-red-600 transition-all cursor-pointer font-semibold"
        >
          <RiIcons.RiLogoutBoxLine
            size={20}
          />
          Logout
        </button>
      </div>
    </aside>
  );
}