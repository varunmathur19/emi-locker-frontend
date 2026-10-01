
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { RiLogoutBoxRLine } from "react-icons/ri";

import { logoutStaff } from "@/services/api";

import { getToken } from "@/utils/token";

export default function MaintenancePage() {
  const router = useRouter();

  const [logoutLoading, setLogoutLoading] =
    useState(false);

  const handleLogout = async () => {
    if (logoutLoading) {
      return;
    }

    try {
      setLogoutLoading(true);

      const token = getToken();

      if (!token) {
        localStorage.clear();
        router.replace("/");
        return;
      }

      const response = await logoutStaff();

      localStorage.clear();

      toast.success(
        response?.message ||
          "Logged out successfully"
      );

      router.replace("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      localStorage.clear();

      toast.error(
        error?.response?.data?.message ||
          "Logout failed"
      );

      router.replace("/login");
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-10 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
          <span className="text-3xl">
            🔧
          </span>
        </div>

        <h1 className="mb-3 text-2xl font-bold text-gray-800">
          Under Maintenance
        </h1>

        <p className="mb-8 text-sm leading-6 text-gray-500">
          Our system is currently under maintenance.
          Please try again later.
        </p>

  <a
  href="/login"
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
