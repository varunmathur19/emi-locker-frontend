"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  RiUserLine,
  RiMenuLine,
} from "react-icons/ri";

import {
  getRoleId,
  getUserFromToken,
} from "@/utils/token";

export default function Navbar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const router = useRouter();

  // IMPORTANT:
  // Initial render par null rahega.
  // Isse server aur client ka first HTML same rahega.
  const [user, setUser] = useState(null);
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    // Browser me component mount hone ke baad
    // localStorage/token se user data lena
    const loggedInUser = getUserFromToken();

    if (loggedInUser) {
      setUser(loggedInUser);
    }

    const currentRoleId = getRoleId();

    if (currentRoleId !== null && currentRoleId !== undefined) {
      setRoleId(Number(currentRoleId));
    }
  }, []);

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  };

  // Role names
  const roleNames = {
    0: "Master Admin",
    1: "Admin",
    2: "CNF",
    3: "Super Distributor",
    4: "Distributor",
    5: "FOS",
    6: "Retailer",
    7: "Employee",
    8: "Staff",
  };

  const roleName = roleNames[roleId] || "User";

  return (
    <nav
      className={`fixed top-0 right-0 z-50 h-16 bg-white shadow flex items-center justify-between px-6 transition-all duration-300 ${
        sidebarOpen ? "left-64" : "left-0"
      }`}
    >
      {/* ================================================= */}
      {/* LEFT SIDE */}
      {/* ================================================= */}

      <div className="flex items-center md:gap-4 gap-1">
        {/* Sidebar Toggle */}
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-3xl cursor-pointer"
        >
          <RiMenuLine />
        </button>

        {/* Logo */}
        <div>
          <h1 className="md:text-2xl font-bold text-blue-500 text-[20px]">
            RechargeKit
          </h1>
        </div>
      </div>

      {/* ================================================= */}
      {/* RIGHT SIDE */}
      {/* ================================================= */}

      <div className="flex items-center gap-5">
        <div className="flex items-center md:gap-2 gap-1">
          <RiUserLine size={22} />

          <div>
            <p className="font-semibold md:text-2xl text-[15px]">
              {user?.name || roleName}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}