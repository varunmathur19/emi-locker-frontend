"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";
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
  getKeySettings,
} from "@/services/api";

const allowedRolesByRole = {
  0: [1],
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

const defaultAdminRole = {
  id: "default-admin",
  role_id: 1,
  name: "Admin",
  slug: "admin",
  icon: "RiAdminLine",
  sequence: 1,
  status: 1,
};

const pointTransactionTypes = {
  "transfer-points": 0,
  "schema-transfer-point": 1,
  "revert-point": 2,
};

const pointTransactionSlugs = [
  "transfer-points",
  "schema-transfer-point",
  "revert-point",
];

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
    return (
      <RiIcons.RiBuilding2Line size={size} />
    );
  }

  return <IconComponent size={size} />;
};

export default function Sidebar({
  sidebarOpen,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [roleId, setRoleId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] =
    useState(null);
  const [totalWalletBalance, setTotalWalletBalance] =
    useState(0);

  const activeRoleParam =
    searchParams.get("role");

  const activeModule = String(
    searchParams.get("module") || ""
  )
    .trim()
    .toLowerCase();

  const activeTransactionType =
    searchParams.get("transaction_type");

  const activeRole =
    activeRoleParam !== null &&
    activeRoleParam !== ""
      ? Number(activeRoleParam)
      : null;

  const removeInvalidPermissionKeys =
    useCallback(() => {
      if (typeof window === "undefined") {
        return;
      }

      localStorage.removeItem("permission");
      localStorage.removeItem("permissions");
      localStorage.removeItem("role_permission");
      localStorage.removeItem("rolePermission");
    }, []);

  const loadStaffPermissions =
    useCallback(() => {
      if (typeof window === "undefined") {
        return null;
      }

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
            typeof parsedPermissions === "object" &&
            !Array.isArray(parsedPermissions)
          ) {
            setPermissions(parsedPermissions);
            return parsedPermissions;
          }
        }
      } catch (error) {
        console.error(
          "STAFF PERMISSION STORAGE ERROR:",
          error
        );
      }

      try {
        const savedUser =
          localStorage.getItem("user");

        if (!savedUser) {
          setPermissions(null);
          return null;
        }

        const user = JSON.parse(savedUser);

        const permission =
          user?.staff_permission?.permission ||
          user?.role_permission?.permission ||
          null;

        if (
          permission &&
          typeof permission === "object" &&
          !Array.isArray(permission)
        ) {
          setPermissions(permission);

          localStorage.setItem(
            "staff_permissions",
            JSON.stringify(permission)
          );

          return permission;
        }
      } catch (error) {
        console.error(
          "STAFF USER PERMISSION ERROR:",
          error
        );
      }

      setPermissions(null);

      return null;
    }, []);

  const loadCurrentUser =
    useCallback(() => {
      try {
        const currentRole = getRoleId();

        if (
          currentRole === null ||
          currentRole === undefined ||
          currentRole === ""
        ) {
          setRoleId(null);
          setPermissions(null);
          removeInvalidPermissionKeys();
          return;
        }

        const numericRole = Number(currentRole);

        setRoleId(numericRole);

        if (numericRole === 9) {
          loadStaffPermissions();
          return;
        }

        setPermissions(null);

        localStorage.removeItem(
          "staff_permissions"
        );

        removeInvalidPermissionKeys();
      } catch (error) {
        console.error(
          "LOAD CURRENT USER ERROR:",
          error
        );

        setRoleId(null);
        setPermissions(null);

        removeInvalidPermissionKeys();
      }
    }, [
      loadStaffPermissions,
      removeInvalidPermissionKeys,
    ]);

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

  const loadWalletBalance =
    useCallback(async () => {
      try {
        const response =
          await getKeySettings();

        if (
          response?.success &&
          Array.isArray(response?.data)
        ) {
          const total = response.data
            .filter(
              (item) =>
                Number(item?.status) === 1
            )
            .reduce(
              (sum, item) =>
                sum +
                Number(item?.balance || 0),
              0
            );

          setTotalWalletBalance(total);
        } else {
          setTotalWalletBalance(0);
        }
      } catch (error) {
        console.error(
          "GET WALLET BALANCE ERROR:",
          error
        );

        setTotalWalletBalance(0);
      }
    }, []);

  useEffect(() => {
    removeInvalidPermissionKeys();
    loadRoles();
    loadModules();
    loadCurrentUser();
    loadWalletBalance();
  }, [
    removeInvalidPermissionKeys,
    loadRoles,
    loadModules,
    loadCurrentUser,
    loadWalletBalance,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleFocus = () => {
      removeInvalidPermissionKeys();
      loadRoles();
      loadModules();
      loadCurrentUser();
      loadWalletBalance();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
        removeInvalidPermissionKeys();
        loadRoles();
        loadModules();
        loadCurrentUser();
        loadWalletBalance();
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
    removeInvalidPermissionKeys,
    loadRoles,
    loadModules,
    loadCurrentUser,
    loadWalletBalance,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleWalletBalanceUpdate = () => {
      loadWalletBalance();
    };

    window.addEventListener(
      "wallet_balance_updated",
      handleWalletBalanceUpdate
    );

    return () => {
      window.removeEventListener(
        "wallet_balance_updated",
        handleWalletBalanceUpdate
      );
    };
  }, [loadWalletBalance]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event) => {
      if (event.key === "modules_updated") {
        loadModules();
      }

      if (event.key === "roles_updated") {
        loadRoles();
      }

      if (
        event.key === "user" ||
        event.key === "staff_permissions"
      ) {
        loadCurrentUser();
        loadWalletBalance();
      }

      if (
        event.key === "permission" ||
        event.key === "permissions" ||
        event.key === "role_permission" ||
        event.key === "rolePermission"
      ) {
        removeInvalidPermissionKeys();
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
    loadModules,
    loadRoles,
    loadCurrentUser,
    loadWalletBalance,
    removeInvalidPermissionKeys,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    removeInvalidPermissionKeys();

    const timer = setTimeout(() => {
      removeInvalidPermissionKeys();
    }, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [
    pathname,
    activeRole,
    activeModule,
    activeTransactionType,
    removeInvalidPermissionKeys,
  ]);

  const isPermissionEnabled =
    useCallback((value) => {
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

      if (typeof value === "object") {
        if (value.status !== undefined) {
          return Number(value.status) === 1;
        }

        if (value.view !== undefined) {
          return Number(value.view) === 1;
        }

        if (value.access !== undefined) {
          return Number(value.access) === 1;
        }

        return true;
      }

      return false;
    }, []);

  const hasPermissionForSlug =
    useCallback(
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

        if (
          permissions[cleanSlug] !==
          undefined
        ) {
          return isPermissionEnabled(
            permissions[cleanSlug]
          );
        }

        const matchingKeys =
          permissionKeys.filter((key) => {
            const cleanKey = String(key)
              .trim()
              .toLowerCase();

            return (
              cleanKey === cleanSlug ||
              cleanKey.startsWith(
                `${cleanSlug}.`
              )
            );
          });

        return matchingKeys.some((key) =>
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

  const hasModulePermission =
    useCallback(
      (moduleItem) => {
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

        if (
          slug &&
          hasPermissionForSlug(slug)
        ) {
          return true;
        }

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

  const hasRolePermission =
    useCallback(
      (roleItem) => {
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

  const myLogin = () => {
    removeInvalidPermissionKeys();

    const restored =
      restoreOriginalLogin();

    if (!restored) {
      alert(
        "Original login session not found"
      );
      return;
    }

    removeInvalidPermissionKeys();

    window.location.href = "/dashboard";
  };

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

      localStorage.removeItem("user");
      localStorage.removeItem("original_token");
      localStorage.removeItem("original_user");
      localStorage.removeItem(
        "staff_permissions"
      );

      removeInvalidPermissionKeys();

      window.location.href = "/";
    }
  };

  const isRoleLinkActive =
    useCallback(
      (roleItem) => {
        const currentRoleId = Number(
          roleItem?.role_id
        );

        if (
          activeRole !== null &&
          Number.isFinite(currentRoleId) &&
          activeRole === currentRoleId
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

        if (slug === "key-settings") {
          return (
            pathname ===
              "/dashboard/key-setting" ||
            pathname.startsWith(
              "/dashboard/key-setting/"
            )
          );
        }

        if (slug === "role-permission") {
          return (
            pathname ===
              "/dashboard/role-permission" ||
            pathname.startsWith(
              "/dashboard/role-permission/"
            )
          );
        }

        if (
          pointTransactionSlugs.includes(
            slug
          )
        ) {
          if (
            pathname !==
              "/dashboard/transfer-point" &&
            !pathname.startsWith(
              "/dashboard/transfer-point/"
            )
          ) {
            return false;
          }

          const expectedType =
            pointTransactionTypes[slug];

          return (
            Number(
              activeTransactionType
            ) === expectedType
          );
        }

        if (
          activeModule &&
          activeModule === slug
        ) {
          return true;
        }

        return (
          pathname ===
            `/dashboard/${slug}` ||
          pathname.startsWith(
            `/dashboard/${slug}/`
          )
        );
      },
      [
        pathname,
        activeModule,
        activeTransactionType,
      ]
    );

  const RoleLink = ({ roleItem }) => {
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
          {getRoleIcon(roleItem?.icon)}
        </span>

        <span>{label}</span>
      </Link>
    );
  };

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

    let href = `/dashboard?module=${encodeURIComponent(
      slug
    )}`;

    if (slug === "key-settings") {
      href = "/dashboard/key-setting";
    }

    if (slug === "role-permission") {
      href = "/dashboard/role-permission";
    }

    if (
      pointTransactionSlugs.includes(
        slug
      )
    ) {
      const transactionType =
        pointTransactionTypes[slug];

      href = `/dashboard/transfer-point?transaction_type=${transactionType}`;
    }

    const isActive =
      isModuleLinkActive(moduleItem);

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
          {getModuleIcon(moduleItem?.icon)}
        </span>

        <span className="flex min-w-0 flex-1 items-center">
          <span className="truncate">
            {label}
          </span>

          {slug === "transfer-points" && (
            <span
              className={`ml-auto shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm ${
                isActive
                  ? "border-red-600 bg-red-600 text-white"
                  : "border-red-500 bg-red-500 text-white"
              }`}
            >
              {totalWalletBalance.toLocaleString(
                "en-IN"
              )}
            </span>
          )}
        </span>
      </Link>
    );
  };

  const renderRoleLinks = () => {
    const currentRole = Number(roleId);

    if (currentRole === 0) {
      const adminFromApi = roles.find(
        (roleItem) =>
          Number(roleItem?.role_id) === 1
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

    if (currentRole === 9) {
      return roles
        .filter((roleItem) =>
          hasRolePermission(roleItem)
        )
        .map((roleItem) => (
          <RoleLink
            key={
              roleItem?.id ??
              roleItem?.role_id
            }
            roleItem={roleItem}
          />
        ));
    }

    const allowedRoles =
      allowedRolesByRole[currentRole] ||
      [];

    return roles
      .filter((roleItem) =>
        allowedRoles.includes(
          Number(roleItem?.role_id)
        )
      )
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

  const renderModuleLinks = () => {
    return modules
      .filter((moduleItem) => {
        const slug = String(
          moduleItem?.slug || ""
        )
          .trim()
          .toLowerCase();

        if (
          slug === "key-settings" &&
          Number(roleId) !== 0
        ) {
          return false;
        }

        return hasModulePermission(
          moduleItem
        );
      })
      .map((moduleItem, index) => (
        <ModuleLink
          key={
            moduleItem?.id ||
            `${moduleItem?.slug}-${index}`
          }
          moduleItem={moduleItem}
        />
      ));
  };

  if (roleId === null) {
    return (
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-gray-900 text-white transition-all duration-300 ease-in-out ${
          sidebarOpen
            ? "w-68 p-5"
            : "w-0 p-0"
        }`}
      >
        <h2 className="relative mb-6 text-2xl font-bold after:absolute after:-bottom-3 after:left-0 after:h-px after:w-full after:bg-gray-300 after:content-['']">
          Dashboard
        </h2>
      </aside>
    );
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-gray-900 text-white transition-all duration-300 ease-in-out ${
        sidebarOpen
          ? "w-68 p-5"
          : "w-0 p-0"
      }`}
    >
      <h2 className="relative mb-6 flex-shrink-0 text-2xl font-bold after:absolute after:-bottom-3 after:left-0 after:h-px after:w-full after:bg-gray-300 after:content-['']">
        Dashboard
      </h2>

      <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto overflow-x-hidden pb-5">
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

          <span>Dashboard</span>
        </Link>

        <div className="space-y-2">
          {renderRoleLinks()}
        </div>

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

              <span>Master Settings</span>
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

              <span>Sub Module</span>
            </Link>
          </>
        )}

        <div className="space-y-2">
          {renderModuleLinks()}
        </div>

        <button
          type="button"
          onClick={myLogin}
          className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-600"
        >
          <RiIcons.RiLoginBoxLine
            size={20}
          />

          <span>My Login</span>
        </button>

        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-3 font-semibold text-white transition-all hover:bg-red-600"
        >
          <RiIcons.RiLogoutBoxLine
            size={20}
          />

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}