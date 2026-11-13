"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  RiUserLine,
  RiMenuLine,
} from "react-icons/ri";

import { getNormalCompanySetting } from "@/services/api";
import { getRoleId } from "@/utils/token";

export default function Navbar({
  sidebarOpen,
  setSidebarOpen,
}) {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [roleId, setRoleId] = useState(null);
  const [companyName, setCompanyName] = useState("");

  const loadCompanyName = async () => {
    try {
      const response = await getNormalCompanySetting();

      if (response?.success) {
        setCompanyName(
          response?.data?.company_name || ""
        );
      }
    } catch (error) {
      console.error(
        "Failed to fetch company setting:",
        error
      );
    }
  };

  useEffect(() => {
    const loadNavbarData = async () => {
      const storedUser = localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Invalid user data:", error);
        }
      }

      const currentRoleId = getRoleId();

      if (
        currentRoleId !== null &&
        currentRoleId !== undefined
      ) {
        setRoleId(Number(currentRoleId));
      }

      await loadCompanyName();
    };

    loadNavbarData();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleCompanySettingUpdated = () => {
      loadCompanyName();
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
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  };

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
    className={`fixed top-0 right-0 z-[99] flex h-16 items-center justify-between gap-2 bg-gradient-to-r from-white via-white to-blue-200 px-3 shadow transition-all duration-300 md:pr-8 ${
      sidebarOpen ? "left-68" : "left-16"
    }`}
  >
    {/* Left Section */}
    <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
      <button
        type="button"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="shrink-0 cursor-pointer text-2xl md:text-3xl"
      >
        <RiMenuLine />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-sm font-bold text-blue-500 sm:text-base md:text-2xl">
          {companyName || "Company"}
        </h1>
      </div>
    </div>

    {/* Right Section */}
    <div className="flex shrink-0 items-center gap-2 md:gap-5">
      <div className="flex min-w-0 items-center gap-1 md:gap-2">
        <RiUserLine className="shrink-0" size={20} />

        <div className="min-w-0">
          <p className="max-w-[90px] truncate text-xs font-semibold sm:max-w-[130px] sm:text-sm md:max-w-none md:text-xl">
            {user?.name || roleName}
          </p>
        </div>
      </div>
    </div>
  </nav>
);

}