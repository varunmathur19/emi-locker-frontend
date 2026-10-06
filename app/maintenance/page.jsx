"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { RiLogoutBoxRLine } from "react-icons/ri";

import {
  logoutStaff,
  getCompanySetting,
} from "@/services/api";

import { getToken } from "@/utils/token";

export default function MaintenancePage() {
  const router = useRouter();

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const checkingMaintenance = useRef(false);

  // ==========================================
  // CHECK MAINTENANCE STATUS
  // ==========================================
  const checkMaintenanceStatus = async () => {
    // Prevent multiple API calls at the same time
    if (checkingMaintenance.current) {
      return;
    }

    checkingMaintenance.current = true;

    try {
      const response = await getCompanySetting();

      console.log(
        "Company Setting Response:",
        response
      );

      const settings =
        response?.data?.data || [];

      const maintenanceSetting =
        settings.find(
          (item) =>
            item?.key === "maintenance" &&
            Number(item?.role_id) === 0
        );

      const maintenanceStatus = Number(
        maintenanceSetting?.value || 0
      );

      // console.log(
      //   "Maintenance Status:",
      //   maintenanceStatus
      // );

      // ==========================================
      // Maintenance OFF
      // ==========================================
      if (maintenanceStatus === 0) {
        router.replace("/dashboard");
        return;
      }

      // ==========================================
      // Maintenance ON
      // Stay on maintenance page
      // ==========================================
      if (maintenanceStatus === 1) {
        return;
      }
    } catch (error) {
      console.error(
        "Maintenance status check error:",
        error
      );
    } finally {
      checkingMaintenance.current = false;
    }
  };

  // ==========================================
  // CHECK STATUS ON PAGE LOAD + EVERY 5 SEC
  // ==========================================
  useEffect(() => {
    checkMaintenanceStatus();

    const interval = setInterval(() => {
      checkMaintenanceStatus();
    }, 5000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);

      const token = getToken();

      // ==========================================
      // TOKEN NOT FOUND
      // ==========================================
      if (!token) {
        localStorage.clear();

        router.replace("/");

        return;
      }

      // ==========================================
      // LOGOUT API
      // ==========================================
      const response = await logoutStaff();

      console.log(
        "Logout Response:",
        response
      );

      // Clear all local storage
      localStorage.clear();

      toast.success(
        response?.message ||
          response?.data?.message ||
          "Logged out successfully"
      );

      router.replace("/");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      // Even if logout API fails,
      // remove local login data
      localStorage.clear();

      toast.error(
        error?.response?.data?.message ||
          "Logout failed"
      );

      router.replace("/");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm">

        {/* Maintenance Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <span className="text-3xl">
            🔧
          </span>
        </div>

        {/* Heading */}
        <h1 className="mb-3 text-2xl font-bold text-gray-800">
          Under Maintenance
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-6 text-gray-500">
          Our system is currently under maintenance.
          Please try again later.
        </p>

        {/* Logout Button */}
        <a
          href="/"
          onClick={async (event) => {
            event.preventDefault();

            await handleLogout();
          }}
          className="
            mx-auto
            flex
            w-fit
            cursor-pointer
            items-center
            justify-center
            gap-2
            rounded-md
            bg-red-500
            px-6
            py-2.5
            text-sm
            font-semibold
            text-white
            transition-all
            duration-200
            hover:bg-red-600
            hover:shadow-md
            active:scale-[0.98]
          "
        >
          {logoutLoading ? (
            <>
              <span
                className="
                  h-4
                  w-4
                  animate-spin
                  rounded-full
                  border-2
                  border-white/40
                  border-t-white
                "
              />

              Logging out...
            </>
          ) : (
            <>
              <RiLogoutBoxRLine size={18} />

              Logout
            </>
          )}
        </a>
      </div>
    </div>
  );
}