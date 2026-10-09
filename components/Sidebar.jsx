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

const allowedRolesByRole = {
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

const roleMap = {
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
const IconComponent = iconKey ? RiIcons[iconKey] : null;

if (!IconComponent || typeof IconComponent !== "function") {
return <RiIcons.RiUserLine size={size} />;
}

return <IconComponent size={size} />;
};

const getModuleIcon = (iconName, size = 20) => {
const iconKey = String(iconName || "").trim();
const IconComponent = iconKey ? RiIcons[iconKey] : null;

if (!IconComponent || typeof IconComponent !== "function") {
return <RiIcons.RiBuilding2Line size={size} />;
}

return <IconComponent size={size} />;
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
if (typeof window === "undefined") {
return;
}


localStorage.removeItem("permission");
localStorage.removeItem("permissions");
localStorage.removeItem("role_permission");
localStorage.removeItem("rolePermission");


}, []);

const parsePermissions = useCallback((value) => {
if (!value) {
return null;
}


try {
  const parsed =
    typeof value === "string" ? JSON.parse(value) : value;

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
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


}, []);

const loadStaffPermissions = useCallback(() => {
if (typeof window === "undefined") {
return null;
}


try {
  const storedPermission = localStorage.getItem("staff_permission");

  if (storedPermission) {
    const parsedPermission = parsePermissions(storedPermission);

    if (parsedPermission) {
      setPermissions(parsedPermission);

      localStorage.setItem(
        "staff_permission",
        JSON.stringify(parsedPermission)
      );

      return parsedPermission;
    }
  }

  const savedUser = localStorage.getItem("user");

  if (!savedUser) {
    setPermissions(null);
    return null;
  }

  const user = JSON.parse(savedUser);

  const userPermission =
    user?.staff_permission?.permission ||
    user?.staff_permission ||
    null;

  const parsedPermission = parsePermissions(userPermission);

  if (parsedPermission) {
    setPermissions(parsedPermission);

    localStorage.setItem(
      "staff_permission",
      JSON.stringify(parsedPermission)
    );

    return parsedPermission;
  }
} catch (error) {
  console.error("STAFF PERMISSION STORAGE ERROR:", error);
}

setPermissions(null);
return null;


}, [parsePermissions]);

const loadCurrentUser = useCallback(() => {
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
  localStorage.removeItem("staff_permission");
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
      .filter((moduleItem) => Number(moduleItem?.status ?? 1) === 1)
      .sort(
        (a, b) =>
          Number(a?.sequence ?? 0) - Number(b?.sequence ?? 0)
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

const loadWalletBalance = useCallback(async () => {
try {
const response = await getKeySettings();


  if (response?.success && Array.isArray(response?.data)) {
    const total = response.data
      .filter((item) => Number(item?.status) === 1)
      .reduce((sum, item) => sum + Number(item?.balance || 0), 0);

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
loadModules();
loadCurrentUser();
loadWalletBalance();
loadCompanySetting();
}, [
pathname,
removeInvalidPermissionKeys,
loadModules,
loadCurrentUser,
loadWalletBalance,
loadCompanySetting,
]);

useEffect(() => {
if (typeof window === "undefined") {
return;
}


const handleCompanySettingUpdated = () => {
  loadCompanySetting();
};

window.addEventListener(
  "company_setting_updated",
  handleCompanySettingUpdated
);

return () => {
  window.removeEventListener(
    "company_setting_updated",
    handleCompanySettingUpdated
  );
};

}, [loadCompanySetting]);

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


const handleModulesUpdated = () => {
  loadModules();
};

window.addEventListener("modules_updated", handleModulesUpdated);

return () => {
  window.removeEventListener(
    "modules_updated",
    handleModulesUpdated
  );
};


}, [loadModules]);

useEffect(() => {
if (typeof window === "undefined") {
return;
}


const handleStorage = (event) => {
  if (event.key === "modules_updated") {
    loadModules();
  }

  if (
    event.key === "user" ||
    event.key === "staff_permission"
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

window.addEventListener("storage", handleStorage);

return () => {
  window.removeEventListener("storage", handleStorage);
};


}, [
loadModules,
loadCurrentUser,
loadWalletBalance,
removeInvalidPermissionKeys,
]);

const isPermissionEnabled = useCallback((value) => {
if (value === undefined || value === null) {
return false;
}


if (typeof value === "boolean") {
  return value;
}

if (typeof value === "number") {
  return value === 1;
}

if (typeof value === "string") {
  const normalized = value.trim().toLowerCase();

  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes"
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

  if (value.enabled !== undefined) {
    return isPermissionEnabled(value.enabled);
  }

  return true;
}

return false;


}, []);

const hasModulePermission = useCallback(
(moduleItem) => {
if (Number(roleId) !== 9) {
return true;
}


  if (!permissions) {
    return false;
  }

  const moduleId = Number(moduleItem?.id);

  if (!Number.isFinite(moduleId)) {
    return false;
  }

  const modulePrefix = `${moduleId}.`;

  return Object.entries(permissions).some(
    ([permissionKey, value]) => {
      const normalizedKey = String(permissionKey).trim();

      if (!normalizedKey.startsWith(modulePrefix)) {
        return false;
      }

      return isPermissionEnabled(value);
    }
  );
},
[roleId, permissions, isPermissionEnabled]


);

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

  removeInvalidPermissionKeys();

  window.location.href = "/";
}


};

const isRoleLinkActive = useCallback(
(roleItem) => {
const currentRoleId = Number(roleItem?.role_id);


  if (
    activeRole !== null &&
    Number.isFinite(currentRoleId) &&
    activeRole === currentRoleId
  ) {
    return true;
  }

  const slug = String(roleItem?.slug || "")
    .trim()
    .toLowerCase();

  return Boolean(activeModule && slug && activeModule === slug);
},
[activeRole, activeModule]


);

const isModuleLinkActive = useCallback(
(moduleItem) => {
const slug = String(moduleItem?.slug || "")
.trim()
.toLowerCase();


  if (!slug) {
    return false;
  }

  if (slug === "key-settings") {
    return (
      pathname === "/dashboard/key-setting" ||
      pathname.startsWith("/dashboard/key-setting/")
    );
  }

  if (slug === "role-permission") {
    return (
      pathname === "/dashboard/role-permission" ||
      pathname.startsWith("/dashboard/role-permission/")
    );
  }

  if (slug === "company-setting") {
    return (
      pathname === "/dashboard/company-setting" ||
      pathname.startsWith("/dashboard/company-setting/")
    );
  }

  if (slug === "system-control") {
    return (
      pathname === "/dashboard/system-controll" ||
      pathname.startsWith("/dashboard/system-controll/")
    );
  }

  if (pointTransactionSlugs.includes(slug)) {
    if (
      pathname !== "/dashboard/transfer-point" &&
      !pathname.startsWith("/dashboard/transfer-point/")
    ) {
      return false;
    }

    const expectedType = pointTransactionTypes[slug];

    return Number(activeTransactionType) === expectedType;
  }

  if (activeModule && activeModule === slug) {
    return true;
  }

  return (
    pathname === `/dashboard/${slug}` ||
    pathname.startsWith(`/dashboard/${slug}/`)
  );
},
[pathname, activeModule, activeTransactionType]


);

const RoleLink = ({ moduleItem }) => {
const roleValue = Number(moduleItem?.role_id);


const roleSlug = String(moduleItem?.slug || "")
  .trim()
  .toLowerCase();

if (
  !Number.isFinite(roleValue) ||
  roleValue < 1 ||
  roleValue > 9 ||
  !roleSlug
) {
  return null;
}

const href =
  `/dashboard?role=${roleValue}` +
  `&module=${encodeURIComponent(roleSlug)}`;

const isActive = isRoleLinkActive(moduleItem);

return (
  <Link
    href={href}
    className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
      isActive ? "bg-blue-400 text-black" : "hover:bg-gray-700"
    }`}
  >
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${
        isActive ? "text-black" : "text-white"
      }`}
    >
      {getModuleIcon(moduleItem?.icon)}
    </span>

    <span className="truncate">
      {moduleItem?.name || roleMap[roleValue] || "Role"}
    </span>
  </Link>
);


};

const ModuleLink = ({ moduleItem }) => {
const slug = String(moduleItem?.slug || "")
.trim()
.toLowerCase();

const label = moduleItem?.name || slug || "Module";

let href = `/dashboard?module=${encodeURIComponent(slug)}`;

if (slug === "key-settings") {
  href = "/dashboard/key-setting";
}

if (slug === "role-permission") {
  href = "/dashboard/role-permission";
}

if (slug === "company-setting") {
  href = "/dashboard/company-setting";
}

if (slug === "system-control") {
  href = "/dashboard/system-controll";
}

if (slug === "transaction" || slug === "my-transaction") {
  href = "/dashboard/my-transaction";
}

if (pointTransactionSlugs.includes(slug)) {
  const transactionType = pointTransactionTypes[slug];

  href = `/dashboard/transfer-point?transaction_type=${transactionType}`;
}

const isActive = isModuleLinkActive(moduleItem);

return (
  <Link
    href={href}
    className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
      isActive ? "bg-blue-400 text-black" : "hover:bg-gray-700"
    }`}
  >
    <span
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center ${
        isActive ? "text-black" : "text-white"
      }`}
    >
      {getModuleIcon(moduleItem?.icon)}
    </span>

    <span className="flex min-w-0 flex-1 items-center">
      <span className="truncate">{label}</span>

      {slug === "transfer-points" && (
        <span
          className={`ml-auto shrink-0 rounded-md border px-2.5 py-1 text-xs font-bold shadow-sm ${
            isActive
              ? "border-red-600 bg-red-600 text-white"
              : "border-red-500 bg-red-500 text-white"
          }`}
        >
          {totalWalletBalance.toLocaleString("en-IN")}
        </span>
      )}
    </span>
  </Link>
);


};

const renderRoleLinks = () => {
const currentRole = Number(roleId);


if (!Number.isFinite(currentRole)) {
  return null;
}

const roleModules = modules.filter((moduleItem) => {
  const moduleRoleId = Number(moduleItem?.role_id);

  return moduleRoleId >= 1 && moduleRoleId <= 9;
});

if (currentRole === 9) {
  return roleModules
    .filter((moduleItem) => hasModulePermission(moduleItem))
    .map((moduleItem) => (
      <RoleLink
        key={moduleItem?.id ?? moduleItem?.role_id}
        moduleItem={moduleItem}
      />
    ));
}

const allowedRoles = allowedRolesByRole[currentRole] || [];

return roleModules
  .filter((moduleItem) =>
    allowedRoles.includes(Number(moduleItem?.role_id))
  )
  .map((moduleItem) => (
    <RoleLink
      key={moduleItem?.id ?? moduleItem?.role_id}
      moduleItem={moduleItem}
    />
  ));


};

const renderModuleLinks = () => {
return modules
.filter((moduleItem) => {
const slug = String(moduleItem?.slug || "")
.trim()
.toLowerCase();


    const currentRole = Number(roleId);
    const moduleRoleId = Number(moduleItem?.role_id);

    if (moduleRoleId >= 1 && moduleRoleId <= 9) {
      return false;
    }

    if (slug === "role-permission" && currentRole === 0) {
      return false;
    }

    if (slug === "revert-point" && currentRole !== 0) {
      return false;
    }

    if (slug === "company-setting" && currentRole !== 1) {
      return false;
    }

    if (slug === "system-control" && currentRole !== 0) {
      return false;
    }

    if (slug === "schema-transfer-point" && currentRole === 0) {
      return false;
    }

    if (slug === "key-settings" && currentRole !== 0) {
      return false;
    }

    return hasModulePermission(moduleItem);
  })
  .map((moduleItem, index) => (
    <ModuleLink
      key={moduleItem?.id || `${moduleItem?.slug}-${index}`}
      moduleItem={moduleItem}
    />
  ));


};

const companyLogoUrl = companyLogo
? `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/api$/, "")}${companyLogo}`
: null;

return (
<aside
className={`fixed left-0 top-0 z-40 flex h-screen flex-col overflow-hidden bg-gray-900 text-white transition-all duration-300 ease-in-out ${
        sidebarOpen ? "w-68 p-5" : "w-0 p-0"
      }`}
> <h2 className="relative mb-6 flex h-8 w-[230px] items-center after:absolute after:-bottom-3 after:left-0 after:h-px after:w-full after:bg-gray-300 after:content-['']">
{companyLogoUrl && ( <img
         src={companyLogoUrl}
         alt="Company Logo"
         className="h-8 w-[230px]"
       />
)} </h2>


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
      <RiIcons.RiDashboardLine size={20} />
      <span>Dashboard</span>
    </Link>

    <div className="space-y-2">{renderRoleLinks()}</div>

    {Number(roleId) === 0 && (
      <>
        <Link
          href="/dashboard/modules"
          className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
            pathname === "/dashboard/modules" ||
            pathname.startsWith("/dashboard/modules/")
              ? "bg-blue-400 text-black"
              : "hover:bg-gray-700"
          }`}
        >
          <RiIcons.RiSettings3Line size={20} />
          <span>Master Settings</span>
        </Link>

        <Link
          href="/dashboard/sub-modules"
          className={`flex items-center gap-3 rounded p-3 font-semibold transition-all ${
            pathname === "/dashboard/sub-modules" ||
            pathname.startsWith("/dashboard/sub-modules/")
              ? "bg-blue-400 text-black"
              : "hover:bg-gray-700"
          }`}
        >
          <RiIcons.RiStore2Line size={20} />
          <span>Sub Module</span>
        </Link>
      </>
    )}

    <div className="space-y-2">{renderModuleLinks()}</div>

    <button
      type="button"
      onClick={myLogin}
      className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-500 px-4 py-3 font-semibold text-white transition-all hover:bg-blue-600"
    >
      <RiIcons.RiLoginBoxLine size={20} />
      <span>My Login</span>
    </button>

    <button
      type="button"
      onClick={logout}
      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-500 px-4 py-3 font-semibold text-white transition-all hover:bg-red-600"
    >
      <RiIcons.RiLogoutBoxLine size={20} />
      <span>Logout</span>
    </button>
  </div>
</aside>


);
}
