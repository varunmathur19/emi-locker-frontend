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
  getRoles,
} from "@/services/api";

// --------------------------------------------------
// ROLE HIERARCHY
// --------------------------------------------------

const allowedRolesByRole = {
  0: [1], // Master Admin -> Admin

  1: [2, 3, 4, 5, 6, 7, 8, 9], // Admin

  2: [3, 4, 5, 6, 7, 8, 9], // CNF

  3: [4, 5, 6, 7, 8, 9], // Super Distributor

  4: [5, 6, 7, 8, 9], // Distributor

  5: [6, 7, 8, 9], // FOS

  6: [7, 8, 9], // Retailer

  7: [8, 9], // Sub Retailer

  8: [9], // Employee

  9: [], // Staff
};

// --------------------------------------------------
// DEFAULT ADMIN
// --------------------------------------------------
// Master Admin ke liye Admin hamesha available rahega.
// API se Admin milega to API ka data use hoga.
// API se Admin na mile to ye default data use hoga.
// --------------------------------------------------

const defaultAdminRole = {
  id: "default-admin",
  role_id: 1,
  name: "Admin",
  slug: "admin",
  icon: "RiAdminLine",
  sequence: 1,
  status: 1,
};

// --------------------------------------------------
// ROLE ICON
// --------------------------------------------------

const getRoleIcon = (iconName, size = 20) => {
  const iconKey = String(iconName || "").trim();

  const IconComponent = iconKey
    ? RiIcons[iconKey]
    : null;

  if (
    !IconComponent ||
    typeof IconComponent !== "function"
  ) {
    return (
      <RiIcons.RiUserLine size={size} />
    );
  }

  return <IconComponent size={size} />;
};

// --------------------------------------------------
// MODULE ICON
// --------------------------------------------------

const getModuleIcon = (iconName, size = 20) => {
  const iconKey = String(iconName || "").trim();

  const IconComponent = iconKey
    ? RiIcons[iconKey]
    : null;

  if (
    !IconComponent ||
    typeof IconComponent !== "function"
  ) {
    return (
      <RiIcons.RiBuilding2Line size={size} />
    );
  }

  return <IconComponent size={size} />;
};

// --------------------------------------------------
// SIDEBAR
// --------------------------------------------------

export default function Sidebar({ sidebarOpen }) {
  const [roleId, setRoleId] = useState(null);

  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // --------------------------------------------------
  // URL PARAMS
  // --------------------------------------------------

  const activeRoleParam =
    searchParams.get("role");

  const activeModule = String(
    searchParams.get("module") || ""
  )
    .trim()
    .toLowerCase();

  const activeRole =
    activeRoleParam !== null &&
    activeRoleParam !== ""
      ? Number(activeRoleParam)
      : null;

  // --------------------------------------------------
  // GET LOGGED-IN ROLE
  // --------------------------------------------------

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

  // --------------------------------------------------
  // LOAD ROLES
  // --------------------------------------------------

  const loadRoles = useCallback(async () => {
    try {
      const response = await getRoles();

      console.log(
        "GET ROLES RESPONSE:",
        response
      );

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        const activeRoles = response.data
          .filter(
            (role) =>
              Number(role?.status ?? 1) === 1
          )
          .sort(
            (a, b) =>
              Number(a?.sequence ?? 0) -
              Number(b?.sequence ?? 0)
          );

        setRoles(activeRoles);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error(
        "GET ROLES ERROR:",
        error
      );

      setRoles([]);
    }
  }, []);

  // --------------------------------------------------
  // LOAD MODULES
  // --------------------------------------------------

  const loadModules = useCallback(async () => {
    try {
      const response = await getModules();

      console.log(
        "GET MODULES RESPONSE:",
        response
      );

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        const activeModules = response.data
          .filter(
            (moduleItem) =>
              Number(
                moduleItem?.status ?? 1
              ) === 1
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
      console.error(
        "GET MODULES ERROR:",
        error
      );

      setModules([]);
    }
  }, []);

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    loadRoles();
    loadModules();

    const handleFocus = () => {
      loadRoles();
      loadModules();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        loadRoles();
        loadModules();
      }
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

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
  }, [loadRoles, loadModules]);

  // --------------------------------------------------
  // STORAGE UPDATE
  // --------------------------------------------------

  useEffect(() => {
    const handleStorage = (event) => {
      if (
        event.key === "modules_updated"
      ) {
        loadModules();
      }

      if (
        event.key === "roles_updated"
      ) {
        loadRoles();
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
  }, [loadRoles, loadModules]);

  // --------------------------------------------------
  // MY LOGIN
  // --------------------------------------------------

  const myLogin = () => {
    const restored =
      restoreOriginalLogin();

    if (!restored) {
      alert(
        "Original login session not found"
      );
      return;
    }

    window.location.href =
      "/dashboard";
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = async () => {
    try {
      await logoutStaff();
    } catch (error) {
      console.error(
        "Logout API error:",
        error
      );
    } finally {
      removeToken();

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "original_token"
      );

      window.location.href = "/";
    }
  };

  // --------------------------------------------------
  // ROLE LINK ACTIVE
  // --------------------------------------------------

  const isRoleLinkActive = (
    roleItem
  ) => {
    const currentRoleId = Number(
      roleItem?.role_id
    );

    // Active by role query
    if (
      activeRole !== null &&
      Number.isFinite(currentRoleId) &&
      activeRole === currentRoleId
    ) {
      return true;
    }

    // Active by module slug
    const slug = String(
      roleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    if (
      activeModule &&
      slug &&
      activeModule === slug
    ) {
      return true;
    }

    return false;
  };

  // --------------------------------------------------
  // MODULE LINK ACTIVE
  // --------------------------------------------------

  const isModuleLinkActive = (
    slug
  ) => {
    const normalizedSlug = String(
      slug || ""
    )
      .trim()
      .toLowerCase();

    // Query parameter
    if (
      activeModule &&
      normalizedSlug &&
      activeModule === normalizedSlug
    ) {
      return true;
    }

    if (
      !pathname ||
      !normalizedSlug
    ) {
      return false;
    }

    const slugPath =
      `/${normalizedSlug}`;

    return (
      pathname ===
        `/dashboard${slugPath}` ||
      pathname.startsWith(
        `/dashboard${slugPath}/`
      )
    );
  };

  // --------------------------------------------------
  // ROLE LINK
  // --------------------------------------------------

  const RoleLink = ({
    roleItem,
  }) => {
    const roleSlug = String(
      roleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    const label =
      roleItem?.name ||
      roleSlug ||
      "Role";

    const roleValue = Number(
      roleItem?.role_id
    );

    const isActive =
      isRoleLinkActive(roleItem);

    return (
      <Link
        href={`/dashboard?role=${encodeURIComponent(
          roleValue
        )}&module=${encodeURIComponent(
          roleSlug
        )}`}
        className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
          isActive
            ? "bg-blue-400 text-black"
            : "hover:bg-gray-700"
        }`}
      >
        <span
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${
            isActive
              ? "text-black"
              : "text-white"
          }`}
        >
          {getRoleIcon(
            roleItem?.icon
          )}
        </span>

        <span>
          {label}
        </span>
      </Link>
    );
  };

  // --------------------------------------------------
  // MODULE LINK
  // --------------------------------------------------

  const ModuleLink = ({
    moduleItem,
  }) => {
    const slug = String(
      moduleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    const label =
      moduleItem?.name ||
      slug ||
      "Module";

    const isActive =
      isModuleLinkActive(slug);

    return (
      <Link
        href={`/dashboard?module=${encodeURIComponent(
          slug
        )}`}
        className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
          isActive
            ? "bg-blue-400 text-black"
            : "hover:bg-gray-700"
        }`}
      >
        <span
          className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${
            isActive
              ? "text-black"
              : "text-white"
          }`}
        >
          {getModuleIcon(
            moduleItem?.icon
          )}
        </span>

        <span>
          {label}
        </span>
      </Link>
    );
  };

  // --------------------------------------------------
  // RENDER ROLE LINKS
  // --------------------------------------------------

  const renderRoleLinks = () => {
    const currentRole =
      Number(roleId);

    // ------------------------------------------------
    // MASTER ADMIN
    // ------------------------------------------------
    // Master Admin ko Admin ALWAYS show hoga.
    // API mein Admin available hai to API data use hoga.
    // API mein Admin nahi hai to defaultAdminRole use hoga.
    // ------------------------------------------------

    if (currentRole === 0) {
      const adminFromApi = roles.find(
        (roleItem) =>
          Number(roleItem?.role_id) === 1
      );

      const adminRole =
        adminFromApi || defaultAdminRole;

      return (
        <RoleLink
          key="master-admin-admin"
          roleItem={adminRole}
        />
      );
    }

    // ------------------------------------------------
    // OTHER ROLES
    // ------------------------------------------------

    const allowedRoles =
      allowedRolesByRole[currentRole] ||
      [];

    return roles
      .filter((roleItem) => {
        const targetRole = Number(
          roleItem?.role_id
        );

        return allowedRoles.includes(
          targetRole
        );
      })
      .map((roleItem) => (
        <RoleLink
          key={
            roleItem?.id ??
            roleItem?.role_id
          }
          roleItem={roleItem}
        />
      ));
  };

  // --------------------------------------------------
  // RENDER MODULE LINKS
  // --------------------------------------------------

  const renderModuleLinks = () => {
    return modules.map(
      (moduleItem, index) => (
        <ModuleLink
          key={
            moduleItem?.id ||
            `${moduleItem?.slug}-${index}`
          }
          moduleItem={moduleItem}
        />
      )
    );
  };

  // --------------------------------------------------
  // ROLE LOADING
  // --------------------------------------------------

  if (roleId === null) {
    return (
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-gray-900 text-white transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "w-64 p-5"
            : "w-0 p-0"
        }`}
      >
        <h2 className="relative mb-6 text-2xl font-bold after:absolute after:-bottom-3 after:left-0 after:h-px after:w-full after:bg-gray-300 after:content-['']">
          Dashboard
        </h2>
      </aside>
    );
  }

  // --------------------------------------------------
  // SIDEBAR
  // --------------------------------------------------

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-gray-900 text-white transition-all duration-300 ease-in-out ${
        sidebarOpen
          ? "w-64 p-5"
          : "w-0 p-0"
      }`}
    >
      {/* ------------------------------------------------
          TITLE
      ------------------------------------------------ */}

      <h2 className="relative mb-6 flex-shrink-0 text-2xl font-bold after:absolute after:-bottom-3 after:left-0 after:h-px after:w-full after:bg-gray-300 after:content-['']">
        Dashboard
      </h2>

      <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto overflow-x-hidden pb-5">

        {/* ------------------------------------------------
            DASHBOARD
        ------------------------------------------------ */}

        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
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

          <span>
            Dashboard
          </span>
        </Link>

        {/* ------------------------------------------------
            ROLES
        ------------------------------------------------ */}

        <div className="space-y-2">
          {renderRoleLinks()}
        </div>

        {/* ------------------------------------------------
            MASTER SETTINGS
        ------------------------------------------------ */}

        {Number(roleId) === 0 && (
          <>
            <Link
              href="/dashboard/modules"
              className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
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

              <span>
                Master Settings
              </span>
            </Link>

            <Link
              href="/dashboard/sub-modules"
              className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
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

              <span>
                Sub Module
              </span>
            </Link>
          </>
        )}

        {/* ------------------------------------------------
            MODULES
        ------------------------------------------------ */}

        <div className="space-y-2">
          {renderModuleLinks()}
        </div>

        {/* ------------------------------------------------
            MY LOGIN
        ------------------------------------------------ */}

        <button
          type="button"
          onClick={myLogin}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-600"
        >
          <RiIcons.RiLoginBoxLine
            size={20}
          />

          My Login
        </button>

        {/* ------------------------------------------------
            LOGOUT
        ------------------------------------------------ */}

        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-3 font-semibold text-white transition-all hover:bg-red-600"
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