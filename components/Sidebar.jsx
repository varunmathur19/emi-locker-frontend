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

/* =========================================================
   ROLE ACCESS
========================================================= */

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
  9: [], // Staff -> permission based
};

const defaultAdminRole = {
  id: "default-admin",
  role_id: 1,
  name: "Admin",
  slug: "admin",
  icon: "RiAdminLine",
  sequence: 1,
  status: 1,
};

/* =========================================================
   ICON HELPERS
========================================================= */

const getRoleIcon = (iconName, size = 20) => {
  const iconKey = String(iconName || "").trim();

  const IconComponent = iconKey
    ? RiIcons[iconKey]
    : null;

  if (
    !IconComponent ||
    typeof IconComponent !== "function"
  ) {
    return <RiIcons.RiUserLine size={size} />;
  }

  return <IconComponent size={size} />;
};

const getModuleIcon = (iconName, size = 20) => {
  const iconKey = String(iconName || "").trim();

  const IconComponent = iconKey
    ? RiIcons[iconKey]
    : null;

  if (
    !IconComponent ||
    typeof IconComponent !== "function"
  ) {
    return <RiIcons.RiBuilding2Line size={size} />;
  }

  return <IconComponent size={size} />;
};

/* =========================================================
   SIDEBAR
========================================================= */

export default function Sidebar({ sidebarOpen }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [roleId, setRoleId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState(null);

  /* =======================================================
     URL STATE
  ======================================================= */

  const activeRoleParam = searchParams.get("role");

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

  /* =======================================================
     STAFF PERMISSION
  ======================================================= */

  const loadStaffPermissions = useCallback(() => {
    try {
      /*
       * First priority:
       * staff_permissions localStorage
       */
      const savedPermissions =
        localStorage.getItem("staff_permissions");

      if (savedPermissions) {
        const parsedPermissions =
          JSON.parse(savedPermissions);

        if (
          parsedPermissions &&
          typeof parsedPermissions === "object"
        ) {
          setPermissions(parsedPermissions);
          return parsedPermissions;
        }
      }

      /*
       * Fallback:
       * user.role_permission.permission
       */
      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        setPermissions(null);
        return null;
      }

      const user = JSON.parse(savedUser);

      const staffPermission =
        user?.role_permission?.permission || null;

      if (
        staffPermission &&
        typeof staffPermission === "object"
      ) {
        setPermissions(staffPermission);

        localStorage.setItem(
          "staff_permissions",
          JSON.stringify(staffPermission)
        );

        return staffPermission;
      }

      /*
       * IMPORTANT:
       * Yaha staff_permissions remove nahi karna.
       *
       * Agar pehle se permission saved hai aur
       * user object me permission nahi hai,
       * to permission ko remove nahi karna.
       */
      setPermissions(null);

      return null;
    } catch (error) {
      console.error(
        "LOAD STAFF PERMISSION ERROR:",
        error
      );

      /*
       * Last fallback
       */
      try {
        const savedPermissions =
          localStorage.getItem(
            "staff_permissions"
          );

        if (savedPermissions) {
          const parsedPermissions =
            JSON.parse(savedPermissions);

          if (
            parsedPermissions &&
            typeof parsedPermissions === "object"
          ) {
            setPermissions(parsedPermissions);
            return parsedPermissions;
          }
        }
      } catch (parseError) {
        console.error(
          "PARSE STAFF PERMISSION ERROR:",
          parseError
        );
      }

      setPermissions(null);
      return null;
    }
  }, []);

  /* =======================================================
     CURRENT USER
  ======================================================= */

  const loadCurrentUser = useCallback(() => {
    try {
      const currentRole = getRoleId();

      if (
        currentRole !== null &&
        currentRole !== undefined &&
        currentRole !== ""
      ) {
        const numericRole = Number(currentRole);

        setRoleId(numericRole);

        /*
         * Staff
         */
        if (numericRole === 9) {
          loadStaffPermissions();
          return;
        }

        /*
         * Non Staff
         */
        setPermissions(null);

        localStorage.removeItem(
          "staff_permissions"
        );

        return;
      }

      setRoleId(null);
      setPermissions(null);
    } catch (error) {
      console.error(
        "LOAD CURRENT USER ERROR:",
        error
      );

      setRoleId(null);
      setPermissions(null);
    }
  }, [loadStaffPermissions]);

  /* =======================================================
     LOAD ROLES
  ======================================================= */

  const loadRoles = useCallback(async () => {
    try {
      const response = await getRoles();

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

  /* =======================================================
     LOAD MODULES
  ======================================================= */

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
      console.error(
        "GET MODULES ERROR:",
        error
      );

      setModules([]);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadRoles();
    loadModules();
    loadCurrentUser();
  }, [
    loadRoles,
    loadModules,
    loadCurrentUser,
  ]);

  /* =======================================================
     FOCUS + VISIBILITY
  ======================================================= */

  useEffect(() => {
    const handleFocus = () => {
      loadRoles();
      loadModules();
      loadCurrentUser();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        loadRoles();
        loadModules();
        loadCurrentUser();
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
  }, [
    loadRoles,
    loadModules,
    loadCurrentUser,
  ]);

  /* =======================================================
     STORAGE CHANGE
  ======================================================= */

  useEffect(() => {
    const handleStorage = (event) => {
      /*
       * Modules updated
       */
      if (event.key === "modules_updated") {
        loadModules();
      }

      /*
       * Roles updated
       */
      if (event.key === "roles_updated") {
        loadRoles();
      }

      /*
       * User / Staff permission updated
       */
      if (
        event.key === "user" ||
        event.key === "staff_permissions"
      ) {
        loadCurrentUser();
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
  }, [
    loadRoles,
    loadModules,
    loadCurrentUser,
  ]);

  /* =======================================================
     PERMISSION VALUE CHECK
  ======================================================= */

  const isPermissionEnabled = useCallback(
    (value) => {
      if (
        value === undefined ||
        value === null
      ) {
        return false;
      }

      if (typeof value === "boolean") {
        return value;
      }

      if (typeof value === "number") {
        return value === 1;
      }

      if (typeof value === "string") {
        return (
          value === "1" ||
          value.toLowerCase() === "true"
        );
      }

      if (
        typeof value === "object"
      ) {
        if (
          value.status !== undefined
        ) {
          return (
            Number(value.status) === 1
          );
        }

        if (
          value.view !== undefined
        ) {
          return (
            Number(value.view) === 1
          );
        }

        if (
          value.access !== undefined
        ) {
          return (
            Number(value.access) === 1
          );
        }

        return true;
      }

      return false;
    },
    []
  );

  /* =======================================================
     PERMISSION BY SLUG
  ======================================================= */

  const hasPermissionForSlug = useCallback(
    (slug) => {
      if (!permissions) {
        return false;
      }

      const cleanSlug = String(
        slug || ""
      )
        .trim()
        .toLowerCase();

      if (!cleanSlug) {
        return false;
      }

      const permissionKeys =
        Object.keys(permissions);

      /*
       * Exact permission
       *
       * Example:
       * {
       *   "cnf": 1
       * }
       */
      if (
        permissions[cleanSlug] !==
        undefined
      ) {
        return isPermissionEnabled(
          permissions[cleanSlug]
        );
      }

      /*
       * Action permission
       *
       * Example:
       * cnf.add
       * cnf.edit
       * cnf.delete
       * cnf.view
       */
      const matchingKeys =
        permissionKeys.filter(
          (key) => {
            const cleanKey = String(key)
              .trim()
              .toLowerCase();

            return (
              cleanKey === cleanSlug ||
              cleanKey.startsWith(
                `${cleanSlug}.`
              )
            );
          }
        );

      return matchingKeys.some(
        (key) =>
          isPermissionEnabled(
            permissions[key]
          )
      );
    },
    [
      permissions,
      isPermissionEnabled,
    ]
  );

  /* =======================================================
     MODULE PERMISSION
  ======================================================= */

  const hasModulePermission = useCallback(
    (moduleItem) => {
      /*
       * Non Staff:
       * modules normally visible
       */
      if (Number(roleId) !== 9) {
        return true;
      }

      const slug = String(
        moduleItem?.slug || ""
      )
        .trim()
        .toLowerCase();

      const name = String(
        moduleItem?.name || ""
      )
        .trim()
        .toLowerCase();

      /*
       * Check slug
       */
      if (
        slug &&
        hasPermissionForSlug(slug)
      ) {
        return true;
      }

      /*
       * Check name
       */
      if (
        name &&
        hasPermissionForSlug(name)
      ) {
        return true;
      }

      return false;
    },
    [
      roleId,
      hasPermissionForSlug,
    ]
  );

  /* =======================================================
     ROLE PERMISSION
  ======================================================= */

  const hasRolePermission = useCallback(
    (roleItem) => {
      /*
       * Non Staff:
       * role access comes from hierarchy
       */
      if (Number(roleId) !== 9) {
        return true;
      }

      const roleSlug = String(
        roleItem?.slug || ""
      )
        .trim()
        .toLowerCase();

      const roleName = String(
        roleItem?.name || ""
      )
        .trim()
        .toLowerCase();

      /*
       * Example:
       *
       * {
       *   "cnf.add": 1
       * }
       *
       * CNF will be visible.
       */
      if (
        roleSlug &&
        hasPermissionForSlug(roleSlug)
      ) {
        return true;
      }

      if (
        roleName &&
        hasPermissionForSlug(roleName)
      ) {
        return true;
      }

      return false;
    },
    [
      roleId,
      hasPermissionForSlug,
    ]
  );

  /* =======================================================
     MY LOGIN
  ======================================================= */

  const myLogin = () => {
    const restored =
      restoreOriginalLogin();

    if (!restored) {
      alert(
        "Original login session not found"
      );
      return;
    }

    /*
     * Staff permission belongs to
     * impersonated Staff session.
     */
    localStorage.removeItem(
      "staff_permissions"
    );

    window.location.href =
      "/dashboard";
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = async () => {
    try {
      await logoutStaff();
    } catch (error) {
      console.error(
        "LOGOUT API ERROR:",
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

      localStorage.removeItem(
        "original_user"
      );

      localStorage.removeItem(
        "staff_permissions"
      );

      window.location.href = "/";
    }
  };

  /* =======================================================
     ACTIVE ROLE
  ======================================================= */

  const isRoleLinkActive = useCallback(
    (roleItem) => {
      const currentRoleId =
        Number(roleItem?.role_id);

      if (
        activeRole !== null &&
        Number.isFinite(
          currentRoleId
        ) &&
        activeRole ===
          currentRoleId
      ) {
        return true;
      }

      const slug = String(
        roleItem?.slug || ""
      )
        .trim()
        .toLowerCase();

      return (
        activeModule &&
        slug &&
        activeModule === slug
      );
    },
    [
      activeRole,
      activeModule,
    ]
  );

  /* =======================================================
     ACTIVE MODULE
  ======================================================= */

  const isModuleLinkActive =
    useCallback(
      (moduleItem) => {
        const slug = String(
          moduleItem?.slug || ""
        )
          .trim()
          .toLowerCase();

        if (!slug) {
          return false;
        }

        /*
         * URL module param
         */
        if (
          activeModule &&
          activeModule === slug
        ) {
          return true;
        }

        /*
         * Role Permission
         */
        if (
          slug === "role-permission"
        ) {
          return (
            pathname ===
              "/dashboard/role-permission" ||
            pathname.startsWith(
              "/dashboard/role-permission/"
            )
          );
        }

        /*
         * Normal module
         */
        const slugPath =
          `/${slug}`;

        return (
          pathname ===
            `/dashboard${slugPath}` ||
          pathname.startsWith(
            `/dashboard${slugPath}/`
          )
        );
      },
      [
        pathname,
        activeModule,
      ]
    );

  /* =======================================================
     ROLE LINK
  ======================================================= */

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

    const roleValue =
      Number(roleItem?.role_id);

    const isActive =
      isRoleLinkActive(
        roleItem
      );

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

        <span>{label}</span>
      </Link>
    );
  };

  /* =======================================================
     MODULE LINK
  ======================================================= */

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

    const isRolePermission =
      slug === "role-permission";

    const href =
      isRolePermission
        ? "/dashboard/role-permission"
        : `/dashboard?module=${encodeURIComponent(
            slug
          )}`;

    const isActive =
      isModuleLinkActive(
        moduleItem
      );

    return (
      <Link
        href={href}
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

        <span>{label}</span>
      </Link>
    );
  };

  /* =======================================================
     PROFILE LINK
  ======================================================= */

  const ProfileLink = () => {
    const isActive =
      pathname ===
        "/dashboard/profile" ||
      pathname.startsWith(
        "/dashboard/profile/"
      );

    return (
      <Link
        href="/dashboard/profile"
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
          <RiIcons.RiUserSettingsLine
            size={20}
          />
        </span>

        <span>Profile</span>
      </Link>
    );
  };

  /* =======================================================
     RENDER ROLE LINKS
  ======================================================= */

  const renderRoleLinks = () => {
    const currentRole =
      Number(roleId);

    /*
     * Master Admin
     * Only Admin
     */
    if (currentRole === 0) {
      const adminFromApi =
        roles.find(
          (roleItem) =>
            Number(
              roleItem?.role_id
            ) === 1
        );

      return (
        <RoleLink
          key="master-admin-admin"
          roleItem={
            adminFromApi ||
            defaultAdminRole
          }
        />
      );
    }

    /*
     * Staff
     *
     * Staff hierarchy restriction
     * does not apply.
     *
     * Permissions decide visibility.
     */
    if (currentRole === 9) {
      return roles
        .filter(
          (roleItem) =>
            hasRolePermission(
              roleItem
            )
        )
        .map(
          (roleItem) => (
            <RoleLink
              key={
                roleItem?.id ??
                roleItem?.role_id
              }
              roleItem={roleItem}
            />
          )
        );
    }

    /*
     * Normal roles
     */
    const allowedRoles =
      allowedRolesByRole[
        currentRole
      ] || [];

    return roles
      .filter((roleItem) => {
        const targetRole =
          Number(
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

  /* =======================================================
     RENDER MODULE LINKS
  ======================================================= */

  const renderModuleLinks =
    () => {
      return modules
        .filter(
          (moduleItem) =>
            hasModulePermission(
              moduleItem
            )
        )
        .map(
          (
            moduleItem,
            index
          ) => (
            <ModuleLink
              key={
                moduleItem?.id ||
                `${moduleItem?.slug}-${index}`
              }
              moduleItem={
                moduleItem
              }
            />
          )
        );
    };

  /* =======================================================
     LOADING STATE
  ======================================================= */

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

  /* =======================================================
     MAIN SIDEBAR
  ======================================================= */

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-gray-900 text-white transition-all duration-300 ease-in-out ${
        sidebarOpen
          ? "w-64 p-5"
          : "w-0 p-0"
      }`}
    >
      {/* HEADER */}
      <h2 className="relative mb-6 flex-shrink-0 text-2xl font-bold after:absolute after:-bottom-3 after:left-0 after:h-px after:w-full after:bg-gray-300 after:content-['']">
        Dashboard
      </h2>

      {/* MENU */}
      <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto overflow-x-hidden pb-5">

        {/* DASHBOARD */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
            pathname ===
              "/dashboard" &&
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

        {/* ROLES */}
        <div className="space-y-2">
          {renderRoleLinks()}
        </div>

        {/* MASTER ADMIN SETTINGS */}
        {Number(roleId) === 0 && (
          <>
            {/* MASTER SETTINGS */}
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

            {/* SUB MODULE */}
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

            {/* PROFILE */}
            <ProfileLink />
          </>
        )}

        {/* MODULES */}
        <div className="space-y-2">
          {renderModuleLinks()}
        </div>

        {/* MY LOGIN */}
        <button
          type="button"
          onClick={myLogin}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-600"
        >
          <RiIcons.RiLoginBoxLine
            size={20}
          />

          <span>
            My Login
          </span>
        </button>

        {/* LOGOUT */}
        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-3 font-semibold text-white transition-all hover:bg-red-600"
        >
          <RiIcons.RiLogoutBoxLine
            size={20}
          />

          <span>
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}
