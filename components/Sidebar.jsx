
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import {
  RiDashboardLine,
  RiBuilding2Line,
  RiStore2Line,
  RiLogoutBoxLine,
  RiLoginBoxLine,
  RiSettings3Line,
} from "react-icons/ri";

import {
  getRoleId,
  removeToken,
  restoreOriginalLogin,
} from "@/utils/token";

import {
  logoutStaff,
  getModules,
} from "@/services/api";

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
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

  if (!baseURL) {
    return icon;
  }

  return `${baseURL}/${icon.replace(/^\/+/, "")}`;
};

export default function Sidebar({ sidebarOpen }) {
  const [roleId, setRoleId] = useState(null);
  const [modules, setModules] = useState([]);

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRole = searchParams.get("role");
  const activeModule = searchParams.get("module");

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
      currentRole !== undefined
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

  const getModuleRole = (moduleItem) => {
    if (
      moduleItem?.role_id !== undefined &&
      moduleItem?.role_id !== null &&
      moduleItem?.role_id !== ""
    ) {
      return Number(moduleItem.role_id);
    }

    const slug = String(
      moduleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    const roleBySlug = {
      admin: 1,
      cnf: 2,
      "super-distributor": 3,
      "super distributer": 3,
      "super distributor": 3,
      distributor: 4,
      fos: 5,
      retailer: 6,
      "sub-retailer": 7,
      "sub retailer": 7,
      employee: 8,
      staff: 9,
    };

    return roleBySlug[slug] ?? null;
  };

  const RoleLink = ({ moduleItem }) => {
    const slug = String(
      moduleItem?.slug || ""
    )
      .trim()
      .toLowerCase();

    const label =
      moduleItem?.name || slug || "Module";

    const icon = moduleItem?.icon;

    return (
      <Link
        href={`/dashboard?role=${encodeURIComponent(slug)}`}
        className={`
          flex
          items-center
          gap-3
          p-3
          rounded
          transition-all
          font-semibold
          ${
            activeRole === slug
              ? "bg-blue-400 text-black"
              : "hover:bg-gray-700"
          }
        `}
      >
        {icon ? (
          <img
            src={getIconUrl(icon)}
            alt={label}
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
            size={20}
          />
        )}

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

    return (
      <Link
        href={`/dashboard?module=${encodeURIComponent(slug)}`}
        className={`
          flex
          items-center
          gap-3
          p-3
          rounded
          transition-all
          font-semibold
          ${
            activeModule === slug
              ? "bg-blue-400 text-black"
              : "hover:bg-gray-700"
          }
        `}
      >
        {moduleItem?.icon ? (
          <img
            src={getIconUrl(moduleItem.icon)}
            alt={label}
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
            size={20}
          />
        )}

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
              !activeRole &&
              !activeModule
                ? "bg-blue-400 text-black"
                : "hover:bg-gray-700"
            }
          `}
        >
          <RiDashboardLine size={20} />
          Dashboard
        </Link>

        {Number(roleId) === 0 && (
          <>
            <RoleLink
              moduleItem={{
                name: "Admin",
                slug: "admin",
                icon: null,
              }}
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
              <RiSettings3Line size={20} />
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
              <RiStore2Line size={20} />
              Sub Module
            </Link>
          </>
        )}

        {Number(roleId) >= 1 &&
          Number(roleId) <= 9 &&
          renderModuleLinks()}

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
          <RiLoginBoxLine size={20} />
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
          <RiLogoutBoxLine size={20} />
          Logout
        </button>
      </div>
    </aside>
  );
}
