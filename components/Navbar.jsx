"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  RiUserLine,
  RiMenuLine,
} from "react-icons/ri";

import { getCompanySetting } from "@/services/api";
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
      const response = await getCompanySetting();

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
      className={`fixed top-0 right-0 z-50 flex h-16 items-center justify-between bg-gradient-to-r from-white via-white to-blue-200 pl-3 pr-8 shadow transition-all duration-300 ${
        sidebarOpen ? "left-68" : "left-0"
      }`}
    >
      <div className="flex items-center gap-1 md:gap-4">
        <button
          type="button"
          onClick={() =>
            setSidebarOpen(!sidebarOpen)
          }
          className="cursor-pointer text-3xl"
        >
          <RiMenuLine />
        </button>

        <div>
          <h1 className="text-[20px] font-bold text-blue-500 md:text-2xl">
            {companyName || "Company"}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-1 md:gap-2">
          <RiUserLine size={22} />

          <div>
            <p className="text-[15px] font-semibold md:text-2xl">
              {user?.name || roleName}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}