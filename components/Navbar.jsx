"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { RiUserLine, RiMenuLine } from "react-icons/ri";

import { getRoleId } from "@/utils/token";

export default function Navbar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [roleId, setRoleId] = useState(null);

  useEffect(() => {
    // localStorage se logged-in user lena
    const storedUser = localStorage.getItem("user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Invalid user data:", error);
      }
    }

    // Token se role ID lena
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
    7: "Sub Retailer",
    8: "Employee",
    9: "Staff",
  };

  const roleName = roleNames[roleId] || "User";

  return (
    <nav
      className={`fixed top-0 right-0 z-50 h-16  bg-gradient-to-r from-white via-white to-blue-200 shadow flex items-center justify-between pl-3 pr-8 transition-all duration-300 ${
        sidebarOpen ? "left-68" : "left-0"
      }`}
    >
      {/* LEFT SIDE */}
      <div className="flex items-center md:gap-4 gap-1">
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-3xl cursor-pointer"
        >
          <RiMenuLine />
        </button>

        <div>
          <h1 className="md:text-2xl font-bold text-blue-500 text-[20px]">
            EMI LOCKER
          </h1>
        </div>
      </div>

      {/* RIGHT SIDE */}
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