"use client";

import Link from "next/link";
import {
  getRoleId,
  removeToken,
  restoreOriginalLogin,
} from "@/utils/token";

import { logoutStaff } from "@/services/api";

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
} from "react-icons/ri";

export default function Sidebar({
  sidebarOpen,
}) {
  // ==========================================
  // ROLE ID
  // ==========================================

  const [roleId, setRoleId] =
    useState(null);

  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const activeRole =
    searchParams.get("role") ||
    searchParams.get("role_id");

  // ==========================================
  // GET LOGGED-IN USER ROLE
  // ==========================================
// ==========================================
// MY LOGIN
// ==========================================

const myLogin = () => {
  const restored =
    restoreOriginalLogin();

  if (!restored) {
    alert(
      "Original login session not found"
    );

    return;
  }

  // Original user ke dashboard par
  window.location.href =
    "/dashboard";
};
  useEffect(() => {
    const currentRoleId =
      getRoleId();

    console.log(
      "Logged In Role ID:",
      currentRoleId
    );

    if (
      currentRoleId !== null &&
      currentRoleId !== undefined
    ) {
      setRoleId(
        Number(currentRoleId)
      );
    }
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

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

      // API fail ho tab bhi local logout
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

  // ==========================================
  // ROLE ABHI LOAD NAHI HUA
  // ==========================================

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

      {/* ==========================================
          HEADER
      ========================================== */}

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

      {/* ==========================================
          SCROLLABLE CONTENT
      ========================================== */}

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

        {/* ==========================================
            DASHBOARD
        ========================================== */}

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

        {/* ==========================================
            ADMIN
            ONLY MASTER ADMIN
        ========================================== */}

        {Number(roleId) === 0 && (
          <Link
            href="/dashboard?role=1"
            className={`
              flex
              items-center
              gap-3
              p-3
              rounded
              transition-all
              font-semibold
              ${
                activeRole === "1"
                  ? "bg-blue-400 text-black"
                  : "hover:bg-gray-700"
              }
            `}
          >
            <RiShieldUserLine
              size={18}
              className="text-[1.4rem]"
            />

            Admin
          </Link>
        )}

        {/* ==========================================
            CNF
        ========================================== */}

        {Number(roleId) !== 0 &&
          Number(roleId) < 2 && (
            <Link
              href="/dashboard?role=2"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  activeRole === "2"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiUserStarLine
                size={18}
                className="text-[1.4rem]"
              />

              CNF
            </Link>
          )}

        {/* ==========================================
            SUPER DISTRIBUTOR
        ========================================== */}

        {Number(roleId) !== 0 &&
          Number(roleId) < 3 && (
            <Link
              href="/dashboard?role=3"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  activeRole === "3"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiBuilding2Line
                size={18}
                className="text-[1.4rem]"
              />

              Super Distributor
            </Link>
          )}

        {/* ==========================================
            DISTRIBUTOR
        ========================================== */}

        {Number(roleId) !== 0 &&
          Number(roleId) < 4 && (
            <Link
              href="/dashboard?role=4"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  activeRole === "4"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiStore2Line
                size={18}
                className="text-[1.4rem]"
              />

              Distributor
            </Link>
          )}

        {/* ==========================================
            FOS
        ========================================== */}

        {Number(roleId) !== 0 &&
          Number(roleId) < 5 && (
            <Link
              href="/dashboard?role=5"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  activeRole === "5"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiUserLocationLine
                size={18}
                className="text-[1.4rem]"
              />

              FOS
            </Link>
          )}

        {/* ==========================================
            RETAILER
        ========================================== */}

        {Number(roleId) !== 0 &&
          Number(roleId) < 6 && (
            <Link
              href="/dashboard?role=6"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  activeRole === "6"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiStore2Line
                size={18}
                className="text-[1.4rem]"
              />

              Retailer
            </Link>
          )}

        {/* ==========================================
            EMPLOYEE
        ========================================== */}

        {Number(roleId) !== 0 &&
          Number(roleId) < 7 && (
            <Link
              href="/dashboard?role=7"
              className={`
                flex
                items-center
                gap-3
                p-3
                rounded
                transition-all
                font-semibold
                ${
                  activeRole === "7"
                    ? "bg-blue-400 text-black"
                    : "hover:bg-gray-700"
                }
              `}
            >
              <RiUser3Line
                size={18}
                className="text-[1.4rem]"
              />

              Employee
            </Link>
          )}

        {/* ==========================================
            MY LOGIN
            BLUE BUTTON
        ========================================== */}

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

        {/* ==========================================
            LOGOUT
        ========================================== */}

        <button
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