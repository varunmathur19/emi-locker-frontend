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
  getKeySettings,
  getNormalCompanySetting,
} from "@/services/api";

const ALLOWED_ROLES_BY_ROLE = {
  0: [1],
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

const ROLE_MAP = {
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

const POINT_TRANSACTION_TYPES = {
  "transfer-points": 0,
  "schema-transfer-point": 1,
  "revert-point": 2,
};

const POINT_TRANSACTION_SLUGS = Object.keys(POINT_TRANSACTION_TYPES);

const INVALID_PERMISSION_KEYS = [
  "permission",
  "permissions",
  "role_permission",
  "rolePermission",
];

const SPECIAL_PATHS = {
  "key-settings": "/dashboard/key-setting",
  "role-permission": "/dashboard/role-permission",
  "company-setting": "/dashboard/company-setting",
  "system-control": "/dashboard/system-controll",
  "user-list": "/dashboard/device-detail",
  transaction: "/dashboard/my-transaction",
  "my-transaction": "/dashboard/my-transaction",
};

const getModuleIcon = (iconName, size = 20) => {
  const IconComponent = RiIcons[String(iconName || "").trim()];
  if (typeof IconComponent !== "function") {
    return <RiIcons.RiBuilding2Line size={size} />;
  }
  return <IconComponent size={size} />;
};

const parsePermissions = (value) => {
  if (!value) return null;

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    if (parsed.permission !== undefined) {
      const nestedPermission =
        typeof parsed.permission === "string"
          ? JSON.parse(parsed.permission)
          : parsed.permission;

      if (
        nestedPermission &&
        typeof nestedPermission === "object" &&
        !Array.isArray(nestedPermission)
      ) {
        return nestedPermission;
      }
    }

    return parsed;
  } catch (error) {
    console.error("PERMISSION PARSE ERROR:", error);
    return null;
  }
};

const isPermissionEnabled = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  if (typeof value === "string") {
    return ["1", "true", "yes"].includes(value.trim().toLowerCase());
  }

  if (typeof value === "object") {
    if (value.status !== undefined) return Number(value.status) === 1;
    if (value.view !== undefined) return Number(value.view) === 1;
    if (value.access !== undefined) return Number(value.access) === 1;
    if (value.enabled !== undefined) return isPermissionEnabled(value.enabled);
  }

  return false;
};

export default function Sidebar({ sidebarOpen }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [roleId, setRoleId] = useState(null);
  const [modules, setModules] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [totalWalletBalance, setTotalWalletBalance] = useState(0);
  const [companyLogo, setCompanyLogo] = useState(null);

  const activeRoleParam = searchParams.get("role");
  const activeModule = String(searchParams.get("module") || "")
    .trim()
    .toLowerCase();
  const activeTransactionType = searchParams.get("transaction_type");

  const activeRole =
    activeRoleParam !== null && activeRoleParam !== ""
      ? Number(activeRoleParam)
      : null;

  const removeInvalidPermissionKeys = useCallback(() => {
    if (typeof window === "undefined") return;
    INVALID_PERMISSION_KEYS.forEach((key) => localStorage.removeItem(key));
  }, []);

  const loadStaffPermissions = useCallback(() => {
    if (typeof window === "undefined") return null;

    try {
      const storedPermission = localStorage.getItem("staff_permission");
      if (storedPermission) {
        const parsed = parsePermissions(storedPermission);
        if (parsed) {
          setPermissions(parsed);
          localStorage.setItem("staff_permission", JSON.stringify(parsed));
          return parsed;
        }
      }

      const savedUser = localStorage.getItem("user");
      if (!savedUser) {
        setPermissions(null);
        return null;
      }

      const user = JSON.parse(savedUser);
      const userPermission =
        user?.staff_permission?.permission ?? user?.staff_permission ?? null;
      const parsed = parsePermissions(userPermission);

      if (parsed) {
        setPermissions(parsed);
        localStorage.setItem("staff_permission", JSON.stringify(parsed));
        return parsed;
      }
    } catch (error) {
      console.error("STAFF PERMISSION STORAGE ERROR:", error);
    }

    setPermissions(null);
    return null;
  }, []);

  const loadCurrentUser = useCallback(() => {
    try {
      const currentRole = getRoleId();
      if (currentRole === null || currentRole === undefined || currentRole === "") {
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
      localStorage.removeItem("staff_permission");
      localStorage.removeItem("staff_permissions");
      removeInvalidPermissionKeys();
    } catch (error) {
      console.error("LOAD CURRENT USER ERROR:", error);
      setRoleId(null);
      setPermissions(null);
      removeInvalidPermissionKeys();
    }
  }, [loadStaffPermissions, removeInvalidPermissionKeys]);

  const loadModules = useCallback(async () => {
    try {
      const response = await getModules();
      if (response?.success && Array.isArray(response?.data)) {
        const activeModules = response.data
          .filter((item) => Number(item?.status ?? 1) === 1)
          .sort((a, b) => Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0));
        setModules(activeModules);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("GET MODULES ERROR:", error);
      setModules([]);
    }
  }, []);

  const loadWalletBalance = useCallback(async () => {
    try {
      const response = await getKeySettings();
      if (response?.success && Array.isArray(response?.data)) {
        const total = response.data.reduce((sum, item) => {
          if (Number(item?.status) !== 1) return sum;
          const available = Number(item?.available ?? 0);
          return sum + (Number.isFinite(available) && available > 0 ? available : 0);
        }, 0);
        setTotalWalletBalance(total);
      } else {
        setTotalWalletBalance(0);
      }
    } catch (error) {
      console.error("GET WALLET BALANCE ERROR:", error);
      setTotalWalletBalance(0);
    }
  }, []);

  const loadCompanySetting = useCallback(async () => {
    try {
      const response = await getNormalCompanySetting();
      if (response?.success) {
        setCompanyLogo(response?.data?.company_logo || null);
      } else {
        setCompanyLogo(null);
      }
    } catch (error) {
      console.error("GET COMPANY SETTING ERROR:", error);
      setCompanyLogo(null);
    }
  }, []);

  useEffect(() => {
    removeInvalidPermissionKeys();
    loadCurrentUser();
  }, [removeInvalidPermissionKeys, loadCurrentUser]);

  useEffect(() => { loadModules(); }, [loadModules]);
  useEffect(() => { loadWalletBalance(); }, [loadWalletBalance]);
  useEffect(() => { loadCompanySetting(); }, [loadCompanySetting]);

  useEffect(() => {
    const handleCompanySettingUpdated = () => loadCompanySetting();
    window.addEventListener("company_setting_updated", handleCompanySettingUpdated);
    return () => window.removeEventListener("company_setting_updated", handleCompanySettingUpdated);
  }, [loadCompanySetting]);

  useEffect(() => {
    const handleWalletBalanceUpdate = () => loadWalletBalance();
    window.addEventListener("wallet_balance_updated", handleWalletBalanceUpdate);
    return () => window.removeEventListener("wallet_balance_updated", handleWalletBalanceUpdate);
  }, [loadWalletBalance]);

  useEffect(() => {
    const handleModulesUpdated = () => loadModules();
    window.addEventListener("modules_updated", handleModulesUpdated);
    return () => window.removeEventListener("modules_updated", handleModulesUpdated);
  }, [loadModules]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === "modules_updated") loadModules();
      if (event.key === "user" || event.key === "staff_permission") loadCurrentUser();
      if (INVALID_PERMISSION_KEYS.includes(event.key)) removeInvalidPermissionKeys();
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [loadModules, loadCurrentUser, removeInvalidPermissionKeys]);

  const hasModulePermission = useCallback((moduleItem) => {
    // Non-staff roles retain their existing access.
    if (Number(roleId) !== 9) return true;

    // Staff must have at least one enabled permission for this exact module.
    if (!permissions || typeof permissions !== "object") return false;

    const moduleId = Number(moduleItem?.id);
    if (!Number.isFinite(moduleId)) return false;

    return Object.entries(permissions).some(([permissionKey, value]) => {
      const [permissionModuleId, subModuleId] = String(permissionKey).trim().split(".");
      if (
        Number(permissionModuleId) !== moduleId ||
        !Number.isFinite(Number(subModuleId))
      ) {
        return false;
      }
      return isPermissionEnabled(value);
    });
  }, [roleId, permissions]);

  const myLogin = () => {
    removeInvalidPermissionKeys();
    const restored = restoreOriginalLogin();
    if (!restored) {
      alert("Original login session not found");
      return;
    }
    removeInvalidPermissionKeys();
    window.location.href = "/dashboard";
  };

  const logout = async () => {
    try {
      await logoutStaff();
    } catch (error) {
      console.error("LOGOUT API ERROR:", error);
    } finally {
      removeToken();
      localStorage.removeItem("user");
      localStorage.removeItem("original_token");
      localStorage.removeItem("original_user");
      localStorage.removeItem("staff_permission");
      localStorage.removeItem("staff_permissions");
      removeInvalidPermissionKeys();
      window.location.href = "/";
    }
  };

  const isRoleLinkActive = useCallback((roleItem) => {
    const currentRoleId = Number(roleItem?.role_id);
    if (
      activeRole !== null &&
      Number.isFinite(currentRoleId) &&
      activeRole === currentRoleId
    ) return true;

    const slug = String(roleItem?.slug || "").trim().toLowerCase();
    return Boolean(activeModule && slug && activeModule === slug);
  }, [activeRole, activeModule]);

  const isModuleLinkActive = useCallback((moduleItem) => {
    const slug = String(moduleItem?.slug || "").trim().toLowerCase();
    if (!slug) return false;

    if (SPECIAL_PATHS[slug]) {
      const targetPath = SPECIAL_PATHS[slug];
      return pathname === targetPath || pathname.startsWith(`${targetPath}/`);
    }

    if (POINT_TRANSACTION_SLUGS.includes(slug)) {
      if (
        pathname !== "/dashboard/transfer-point" &&
        !pathname.startsWith("/dashboard/transfer-point/")
      ) return false;
      return Number(activeTransactionType) === POINT_TRANSACTION_TYPES[slug];
    }

    if (activeModule && activeModule === slug) return true;
    return pathname === `/dashboard/${slug}` || pathname.startsWith(`/dashboard/${slug}/`);
  }, [pathname, activeModule, activeTransactionType]);

  const RoleLink = ({ moduleItem }) => {
    const roleValue = Number(moduleItem?.role_id);
    const roleSlug = String(moduleItem?.slug || "").trim().toLowerCase();
    if (!Number.isFinite(roleValue) || roleValue < 1 || roleValue > 9 || !roleSlug) return null;

    const href = `/dashboard?role=${roleValue}&module=${encodeURIComponent(roleSlug)}`;
    const isActive = isRoleLinkActive(moduleItem);

    return (
      <Link href={href} className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${isActive ? "bg-blue-400 text-black" : "hover:bg-gray-700"}`}>
        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${isActive ? "text-black" : "text-white"}`}>
          {getModuleIcon(moduleItem?.icon)}
        </span>
        <span className="truncate">{moduleItem?.name || ROLE_MAP[roleValue] || "Role"}</span>
      </Link>
    );
  };

  const ModuleLink = ({ moduleItem }) => {
    const slug = String(moduleItem?.slug || "").trim().toLowerCase();
    const label = moduleItem?.name || slug || "Module";
    let href = `/dashboard?module=${encodeURIComponent(slug)}`;

    if (SPECIAL_PATHS[slug]) href = SPECIAL_PATHS[slug];
    if (POINT_TRANSACTION_SLUGS.includes(slug)) {
      href = `/dashboard/transfer-point?transaction_type=${POINT_TRANSACTION_TYPES[slug]}`;
    }

    const isActive = isModuleLinkActive(moduleItem);
    return (
      <Link href={href} className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${isActive ? "bg-blue-400 text-black" : "hover:bg-gray-700"}`}>
        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${isActive ? "text-black" : "text-white"}`}>
          {getModuleIcon(moduleItem?.icon)}
        </span>
        <span className="flex min-w-0 flex-1 items-center">
          <span className="truncate">{label}</span>
          {slug === "transfer-points" && (
            <span className={`ml-auto shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm ${isActive ? "border-red-600 bg-red-600 text-white" : "border-red-500 bg-red-500 text-white"}`}>
              {totalWalletBalance.toLocaleString("en-IN")}
            </span>
          )}
        </span>
      </Link>
    );
  };

  const renderRoleLinks = () => {
    const currentRole = Number(roleId);
    if (!Number.isFinite(currentRole)) return null;

    const roleModules = modules.filter((moduleItem) => {
      const moduleRoleId = Number(moduleItem?.role_id);
      return moduleRoleId >= 1 && moduleRoleId <= 9;
    });

    if (currentRole === 9) {
      return roleModules.filter(hasModulePermission).map((moduleItem) => (
        <RoleLink key={moduleItem?.id ?? moduleItem?.role_id} moduleItem={moduleItem} />
      ));
    }

    const allowedRoles = ALLOWED_ROLES_BY_ROLE[currentRole] || [];
    return roleModules.filter((moduleItem) => allowedRoles.includes(Number(moduleItem?.role_id))).map((moduleItem) => (
      <RoleLink key={moduleItem?.id ?? moduleItem?.role_id} moduleItem={moduleItem} />
    ));
  };

  const renderModuleLinks = () => {
    const currentRole = Number(roleId);

    return modules.filter((moduleItem) => {
      const slug = String(moduleItem?.slug || "").trim().toLowerCase();
      const moduleRoleId = Number(moduleItem?.role_id);

      if (moduleRoleId >= 1 && moduleRoleId <= 9) return false;
      if (slug === "role-permission" && currentRole === 0) return false;
      if (slug === "company-setting" && currentRole !== 1) return false;
      if (slug === "system-control" && currentRole !== 0) return false;
      if (slug === "schema-transfer-point" && currentRole === 0) return false;
      if (slug === "key-settings" && currentRole !== 0) return false;

      // No unconditional exception for revert-point: staff permission is checked too.
      return hasModulePermission(moduleItem);
    }).map((moduleItem, index) => (
      <ModuleLink key={moduleItem?.id || `${moduleItem?.slug}-${index}`} moduleItem={moduleItem} />
    ));
  };

  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api\/?$/, "");
  const companyLogoUrl = companyLogo ? `${apiBaseUrl}${companyLogo}` : null;

  return (
    <aside className={`fixed left-0 top-0 z-[99] flex h-screen flex-col overflow-hidden bg-gray-900 text-white transition-all duration-300 ease-in-out ${sidebarOpen ? "w-68 p-5" : "w-0 p-0"}`}>
      <h2 className="relative mb-6 flex h-8 w-[230px] items-center after:absolute after:-bottom-3 after:left-0 after:h-px after:w-full after:bg-gray-300 after:content-['']">
        {companyLogoUrl && <img src={companyLogoUrl} alt="Company Logo" className="h-8 w-[230px] object-contain object-center" />}
      </h2>

      <div className="scrollbar-hide flex-1 space-y-2 overflow-y-auto overflow-x-hidden pb-5">
        <Link href="/dashboard" className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${pathname === "/dashboard" && activeRole === null && !activeModule ? "bg-blue-400 text-black" : "hover:bg-gray-700"}`}>
          <RiIcons.RiDashboardLine size={20} />
          <span>Dashboard</span>
        </Link>

        <div className="space-y-2">{renderRoleLinks()}</div>

        {Number(roleId) === 0 && (
          <>
            <Link href="/dashboard/modules" className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${pathname === "/dashboard/modules" || pathname.startsWith("/dashboard/modules/") ? "bg-blue-400 text-black" : "hover:bg-gray-700"}`}>
              <RiIcons.RiSettings3Line size={20} />
              <span>Master Settings</span>
            </Link>
            <Link href="/dashboard/sub-modules" className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${pathname === "/dashboard/sub-modules" || pathname.startsWith("/dashboard/sub-modules/") ? "bg-blue-400 text-black" : "hover:bg-gray-700"}`}>
              <RiIcons.RiStore2Line size={20} />
              <span>Sub Module</span>
            </Link>
          </>
        )}

        <div className="space-y-2">{renderModuleLinks()}</div>

        <button type="button" onClick={myLogin} className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-600">
          <RiIcons.RiLoginBoxLine size={20} />
          <span>My Login</span>
        </button>

        <button type="button" onClick={logout} className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-3 font-semibold text-white transition-all hover:bg-red-600">
          <RiIcons.RiLogoutBoxLine size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
