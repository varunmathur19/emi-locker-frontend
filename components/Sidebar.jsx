"use client";

import Link from "next/link";

import {
  getRoleId,
  getOriginalRoleId,
  removeToken,
  restoreOriginalLogin,
} from "@/utils/token";

import {
  logoutStaff,
  getModules,
} from "@/services/api";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  RiDashboardLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiBuilding2Line,
  RiStore2Line,
  RiUserLocationLine,
  RiUser3Line,
  RiLogoutBoxLine,
  RiLoginBoxLine,
  RiSettings3Line 
} from "react-icons/ri";

// =====================================================
// GET API ICON URL
// =====================================================

const getIconUrl = (icon) => {
  if (!icon) {
    return "";
  }

  // Already full URL
  if (
    icon.startsWith("http://") ||
    icon.startsWith("https://")
  ) {
    return icon;
  }

  const baseURL =
    process.env.NEXT_PUBLIC_API_URL?.replace(
      /\/api\/?$/,
      ""
    );

  if (!baseURL) {
    return icon;
  }

  return `${baseURL}/${icon.replace(/^\/+/, "")}`;
};

// =====================================================
// SIDEBAR
// =====================================================

export default function Sidebar({
  sidebarOpen,
}) {
  // =====================================================
  // CURRENT LOGGED-IN ROLE
  // =====================================================

  const [roleId, setRoleId] = useState(null);

  // =====================================================
  // MODULES FROM API
  // =====================================================

  const [modules, setModules] = useState([]);

  // =====================================================
  // PATH
  // =====================================================

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRole =
    searchParams.get("role") ||
    searchParams.get("role_id");

  // =====================================================
  // GET MODULES FROM API
  // =====================================================

  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await getModules();

        console.log(
          "MODULE API RESPONSE:",
          response
        );

        if (
          response?.success &&
          Array.isArray(response?.modules)
        ) {
          setModules(response.modules);
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
    };

    loadModules();
  }, []);

  // =====================================================
  // GET CURRENT ROLE
  // =====================================================

  useEffect(() => {
    const currentRole = getRoleId();
    const originalRole = getOriginalRoleId();

    console.log(
      "======================================"
    );

    console.log(
      "SIDEBAR ROLE"
    );

    console.log(
      "Current Role:",
      currentRole
    );

    console.log(
      "Original Role:",
      originalRole
    );

    console.log(
      "======================================"
    );

    if (
      currentRole !== null &&
      currentRole !== undefined
    ) {
      setRoleId(Number(currentRole));
    }
  }, []);

  // =====================================================
  // MY LOGIN
  // =====================================================

  const myLogin = () => {
    console.log(
      "Restoring Original Login..."
    );

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

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    console.log(
      "Logout button clicked"
    );

    try {
      await logoutStaff();

      removeToken();

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "original_token"
      );

      window.location.href = "/";
    } catch (error) {
      console.log(
        "Logout API error:",
        error
      );

      // API fail hone par bhi logout
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

  // =====================================================
  // ROLE NOT LOADED
  // =====================================================

  if (roleId === null) {
    return (
      <aside
        className={`
          fixed
          top-0
          left-0
          h-screen
          bg-gray-900
          text-white
          flex
          flex-col
          overflow-hidden
          transition-all
          duration-300
          ease-in-out
          z-40
          ${
            sidebarOpen
              ? "w-64 p-5"
              : "w-0 p-0"
          }
        `}
      >
        <h2
          className="
            relative
            text-2xl
            font-bold
            mb-6
            after:content-['']
            after:absolute
            after:left-0
            after:-bottom-3
            after:w-full
            after:h-[1px]
            after:bg-gray-300
          "
        >
          Dashboard
        </h2>
      </aside>
    );
  }

  // =====================================================
  // ROLE MAP
  // =====================================================

  const roleMap = {
    // ===================================================
    // ADMIN
    // ===================================================

    admin: {
      role: 1,
      label: "Admin",
      icon: (
        <RiShieldUserLine
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // CNF
    // ===================================================

    cnf: {
      role: 2,
      label: "CNF",
      icon: (
        <RiUserStarLine
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // SUPER DISTRIBUTOR
    // ===================================================

    "super distributer": {
      role: 3,
      label: "Super Distributor",
      icon: (
        <RiBuilding2Line
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    "super distributor": {
      role: 3,
      label: "Super Distributor",
      icon: (
        <RiBuilding2Line
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // DISTRIBUTOR
    // ===================================================

    distributor: {
      role: 4,
      label: "Distributor",
      icon: (
        <RiStore2Line
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // FOS
    // ===================================================

    fos: {
      role: 5,
      label: "FOS",
      icon: (
        <RiUserLocationLine
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // RETAILER
    // ===================================================

    retailer: {
      role: 6,
      label: "Retailer",
      icon: (
        <RiStore2Line
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // SUB RETAILER
    // ===================================================

    "sub retailer": {
      role: 7,
      label: "Sub Retailer",
      icon: (
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // EMPLOYEE
    // ===================================================

    employee: {
      role: 8,
      label: "Employee",
      icon: (
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },

    // ===================================================
    // STAFF
    // ===================================================

    staff: {
      role: 9,
      label: "Staff",
      icon: (
        <RiShieldUserLine
          size={18}
          className="text-[1.4rem]"
        />
      ),
    },
  };

  // =====================================================
  // ROLE HIERARCHY
  //
  // CURRENT ROLE KE NICHE WALE ROLES HI ACCESSIBLE HAIN
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
  // =====================================================

  const allowedRolesByRole = {
    // Master Admin
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

    // Admin
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

    // CNF
    2: [
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ],

    // Super Distributor
    3: [
      4,
      5,
      6,
      7,
      8,
      9,
    ],

    // Distributor
    4: [
      5,
      6,
      7,
      8,
      9,
    ],

    // FOS
    5: [
      6,
      7,
      8,
      9,
    ],

    // Retailer
    6: [
      7,
      8,
      9,
    ],

    // Sub Retailer
    7: [
      8,
      9,
    ],

    // Employee
    8: [
      9,
    ],

    // Staff
    9: [],
  };

  
  // =====================================================
  // ROLE LINK COMPONENT
  // =====================================================

  const RoleLink = ({
    role,
    label,
    icon,
  }) => {
    return (
      <Link
        href={`/dashboard?role=${role}`}
        className={`
          flex
          items-center
          gap-3
          p-3
          rounded
          transition-all
          font-semibold
          ${
            activeRole === String(role)
              ? "bg-blue-400 text-black"
              : "hover:bg-gray-700"
          }
        `}
      >
        {icon}

        <span>
          {label}
        </span>
      </Link>
    );
  };

  // =====================================================
  // RENDER API MODULE LINKS
  // =====================================================

  const renderModuleLinks = () => {
    const currentRole =
      Number(roleId);

    const allowedRoles =
      allowedRolesByRole[
        currentRole
      ] || [];

    return (
      modules

        // =================================================
        // ONLY ACTIVE MODULES
        // =================================================

        .filter((moduleItem) => {
          // Old string format
          if (
            typeof moduleItem === "string"
          ) {
            return true;
          }

          // Object format
          return (
            Number(
              moduleItem?.status ?? 1
            ) === 1
          );
        })

        // =================================================
        // MAP MODULES
        // =================================================

        .map(
          (moduleItem, index) => {
            // =================================================
            // MODULE NAME
            // =================================================

            const moduleName =
              typeof moduleItem === "string"
                ? moduleItem
                : moduleItem?.name || "";

            if (!moduleName) {
              return null;
            }

            // =================================================
            // MODULE ICON
            // =================================================

            const moduleIcon =
              typeof moduleItem === "object"
                ? moduleItem?.icon
                : null;

            // =================================================
            // MODULE KEY
            // =================================================

            const key =
              String(moduleName)
                .trim()
                .toLowerCase();

            // =================================================
            // ROLE MODULE
            // =================================================

            const module =
              roleMap[key];

            // =================================================
            // ROLE MODULE FOUND
            // =================================================

            if (module) {
              // ===============================================
              // CURRENT ROLE SE UPPER ROLE HIDE
              // ===============================================

              if (
                !allowedRoles.includes(
                  Number(module.role)
                )
              ) {
                return null;
              }

              // ===============================================
              // API ICON
              // ===============================================

              let apiIcon = null;

              if (moduleIcon) {
                apiIcon = (
                  <img
                    src={getIconUrl(
                      moduleIcon
                    )}
                    alt={
                      module.label ||
                      moduleName ||
                      "Module icon"
                    }
                    className="
                      w-5
                      h-5
                      object-contain
                      flex-shrink-0
                      brightness-0
                      invert
                    "
                  />
                );
              }

              // ===============================================
              // FALLBACK ICON
              // ===============================================

              const finalIcon =
                apiIcon ||
                module.icon;

              // ===============================================
              // ROLE LINK
              // ===============================================

              return (
                <RoleLink
                  key={`${key}-${index}`}
                  role={module.role}
                  label={module.label}
                  icon={finalIcon}
                />
              );
            }

            // =================================================
            // CUSTOM MODULE
            // =================================================

            return (
              <Link
                key={`${key}-${index}`}
                href={`/dashboard?module=${encodeURIComponent(
                  moduleName
                )}`}
                className="
                  flex
                  items-center
                  gap-3
                  p-3
                  rounded
                  transition-all
                  font-semibold
                  hover:bg-gray-700
                "
              >
                {/* API MODULE ICON */}

                {moduleIcon ? (
                  <img
                    src={getIconUrl(
                      moduleIcon
                    )}
                    alt={
                      moduleName ||
                      "Module icon"
                    }
                    className="
                      w-5
                      h-5
                      object-contain
                      flex-shrink-0
                      brightness-0
                      invert
                    "
                  />
                ) : (
                  <RiBuilding2Line
                    size={18}
                    className="text-white"
                  />
                )}

                {/* MODULE NAME */}

                <span>
                  {moduleName}
                </span>
              </Link>
            );
          }
        )

        // =================================================
        // REMOVE NULL
        // =================================================

        .filter(Boolean)
    );
  };

  // =====================================================
  // SIDEBAR
  // =====================================================

  return (
    <aside
      className={`
        fixed
        top-0
        left-0
        h-screen
        bg-gray-900
        text-white
        flex
        flex-col
        overflow-hidden
        transition-all
        duration-300
        ease-in-out
        z-40
        ${
          sidebarOpen
            ? "w-64 p-5"
            : "w-0 p-0"
        }
      `}
    >
      {/* =================================================
          HEADER
      ================================================= */}

      <h2
        className="
          relative
          text-2xl
          font-bold
          mb-6
          flex-shrink-0
          after:content-['']
          after:absolute
          after:left-0
          after:-bottom-3
          after:w-full
          after:h-[1px]
          after:bg-gray-300
        "
      >
        Dashboard
      </h2>

      {/* =================================================
          SCROLLABLE CONTENT
      ================================================= */}

      <div
        className="
          flex-1
          overflow-y-auto
          overflow-x-hidden
          space-y-2
          pb-5
          scrollbar-hide
        "
      >
        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Link
          href="/dashboard"
          className={`
            flex
            items-center
            gap-3
            p-3
            rounded
            transition-all
            font-semibold
            ${
              pathname === "/dashboard" &&
              !activeRole
                ? "bg-blue-400 text-black"
                : "hover:bg-gray-700"
            }
          `}
        >
          <RiDashboardLine
            size={18}
            className="text-[1.4rem]"
          />

          Dashboard
        </Link>

        {/* =================================================
            MASTER ADMIN - ROLE 0
        ================================================= */}

        {Number(roleId) === 0 && (
          <>
            {/* ADMIN */}

            <RoleLink
              role={1}
              label="Admin"
              icon={
                <RiShieldUserLine
                  size={18}
                  className="text-[1.4rem]"
                />
              }
            />

            {/* MODULE */}

            <Link
              href="/dashboard/modules"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  pathname ===
                  "/dashboard/modules"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiSettings3Line
  size={18}
  className="text-[1.4rem]"
/>

              Master Settings
            </Link>

            {/* SUB MODULE */}

            <Link
              href="/dashboard/sub-modules"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  pathname ===
                  "/dashboard/sub-modules"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiStore2Line
                size={18}
                className="text-[1.4rem]"
              />

              Sub Module
            </Link>
          </>
        )}

        {/* =================================================
            ADMIN TO EMPLOYEE
            API MODULES
        ================================================= */}

        {Number(roleId) >= 1 &&
          Number(roleId) <= 8 && (
            <>
              {renderModuleLinks()}

              {/* ===========================================
                  STAFF
                  
                  IMPORTANT:
                  STAFF ONLY ADMIN KO SHOW HOGA
              =========================================== */}

              {Number(roleId) === 1 && (
                <RoleLink
                  role={9}
                  label="Staff"
                  icon={
                    <RiShieldUserLine
                      size={18}
                      className="text-[1.4rem]"
                    />
                  }
                />
              )}
            </>
          )}

        {/* =================================================
            STAFF - ROLE 9
        ================================================= */}

        {Number(roleId) === 9 && (
          <>
            {renderModuleLinks()}
          </>
        )}

        {/* =================================================
            MY LOGIN
        ================================================= */}

        <button
          type="button"
          onClick={myLogin}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-blue-500
            text-white
            px-4
            py-3
            rounded-md
            hover:bg-blue-600
            transition-all
            cursor-pointer
            font-semibold
            mt-4
          "
        >
          <RiLoginBoxLine
            size={20}
          />

          My Login
        </button>

        {/* =================================================
            LOGOUT
        ================================================= */}

        <button
          type="button"
          onClick={logout}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-red-500
            text-white
            px-4
            py-3
            rounded-md
            hover:bg-red-600
            transition-all
            cursor-pointer
            font-semibold
          "
        >
          <RiLogoutBoxLine
            size={20}
          />

          Logout
        </button>
      </div>
    </aside>
  );
}