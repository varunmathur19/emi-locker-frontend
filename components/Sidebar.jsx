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
  useCallback,
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
  RiSettings3Line,
} from "react-icons/ri";

const getIconUrl = (icon) => {
  if (!icon) {
    return "";
  }

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

export default function Sidebar({
  sidebarOpen,
}) {
  const [roleId, setRoleId] = useState(null);
  const [modules, setModules] = useState([]);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRole =
    searchParams.get("role") ||
    searchParams.get("role_id");

  const loadModules = useCallback(async () => {
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
      console.error(
        "GET MODULES ERROR:",
        error
      );

      setModules([]);
    }
  }, []);

  useEffect(() => {
    loadModules();

    const handleFocus = () => {
      loadModules();
    };

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible"
      ) {
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
  }, [loadModules]);

  useEffect(() => {
    const currentRole = getRoleId();
    const originalRole = getOriginalRoleId();

    console.log(
      "Current Role:",
      currentRole
    );

    console.log(
      "Original Role:",
      originalRole
    );

    if (
      currentRole !== null &&
      currentRole !== undefined
    ) {
      setRoleId(Number(currentRole));
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event) => {
      if (
        event.key === "modules_updated"
      ) {
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

  const logout = async () => {
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
      console.error(
        "Logout API error:",
        error
      );

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

  const roleMap = {
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

  const allowedRolesByRole = {
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

    2: [
      3,
      4,
      5,
      6,
      7,
      8,
      9,
    ],

    3: [
      4,
      5,
      6,
      7,
      8,
      9,
    ],

    4: [
      5,
      6,
      7,
      8,
      9,
    ],

    5: [
      6,
      7,
      8,
      9,
    ],

    6: [
      7,
      8,
      9,
    ],

    7: [
      8,
      9,
    ],

    8: [
      9,
    ],

    9: [],
  };

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

  const renderModuleLinks = () => {
    const currentRole =
      Number(roleId);

    const allowedRoles =
      allowedRolesByRole[
        currentRole
      ] || [];

    return modules
      .filter((moduleItem) => {
        if (
          typeof moduleItem === "string"
        ) {
          return true;
        }

        return (
          Number(
            moduleItem?.status ?? 1
          ) === 1
        );
      })
      .map(
        (moduleItem, index) => {
          const moduleName =
            typeof moduleItem === "string"
              ? moduleItem
              : moduleItem?.name || "";

          if (!moduleName) {
            return null;
          }

          const moduleIcon =
            typeof moduleItem === "object"
              ? moduleItem?.icon
              : null;

          const key =
            String(moduleName)
              .trim()
              .toLowerCase();

          const module =
            roleMap[key];

          if (module) {
            if (
              !allowedRoles.includes(
                Number(module.role)
              )
            ) {
              return null;
            }

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

            const finalIcon =
              apiIcon ||
              module.icon;

            return (
              <RoleLink
                key={`${key}-${index}`}
                role={module.role}
                label={module.label}
                icon={finalIcon}
              />
            );
          }

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

              <span>
                {moduleName}
              </span>
            </Link>
          );
        }
      )
      .filter(Boolean);
  };

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

        {Number(roleId) === 0 && (
          <>
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

        {Number(roleId) >= 1 &&
          Number(roleId) <= 8 && (
            <>
              {renderModuleLinks()}

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

        {Number(roleId) === 9 && (
          <>
            {renderModuleLinks()}
          </>
        )}

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