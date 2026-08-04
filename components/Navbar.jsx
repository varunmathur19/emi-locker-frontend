"use client";

import { useRouter } from "next/navigation";
import { RiLogoutBoxLine, RiUserLine } from "react-icons/ri";
import { getRoleId } from "@/utils/token";

export default function Navbar() {
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  };

  const user =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : {};

  const roleId = getRoleId();

  const roleNames = {
    0: "Master Admin",
    1: "Admin",
    2: "CNF",
    3: "Super Distributor",
    4: "Distributor",
    5: "FOS",
    6: "Retailer",
    7: "Employee",
  };

  const roleName = roleNames[roleId] || "User";

  return (
    <nav className="h-16 bg-white shadow flex items-center justify-between px-6">

      {/* Left */}
      <div>
        <h1 className="text-2xl font-bold text-blue-600">
          RechargeKit
        </h1>

        <p className="text-sm text-gray-500">
          Welcome, <span className="font-semibold">{roleName}</span>
        </p>
      </div>

      {/* Right */}
      <div className="flex items-center gap-5">

        <div className="flex items-center gap-2">
          <RiUserLine size={22} />

          <div>
            <p className="font-semibold text-2xl">
              {user.name || roleName}
            </p>

            {/* <span className="text-sm text-gray-500">
              {roleName}
            </span> */}
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
        >
          <RiLogoutBoxLine />
          Logout
        </button>

      </div>
    </nav>
  );
}