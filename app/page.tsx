"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiMailLine,
  RiLockLine,
} from "react-icons/ri";

import { login } from "@/services/api";

import {
  saveToken,
  getToken,
  saveUser,
  saveOriginalLogin,
} from "@/utils/token";

import type {
  ChangeEvent,
  FormEvent,
} from "react";

export default function Page() {
  const router = useRouter();

  // ==========================================
  // STATES
  // ==========================================

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // ==========================================
  // LOGIN PAGE PROTECTION
  // ==========================================

  useEffect(() => {
    const token = getToken();

    if (token) {
      router.replace("/dashboard");
      return;
    }

    setMounted(true);
  }, [router]);

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // SAVE STAFF PERMISSIONS
  // ==========================================

  const saveStaffPermissions = (user: any) => {
    // Remove old staff permission first
    localStorage.removeItem("staff_permissions");

    // Only Staff role can have staff permissions
    if (Number(user?.role_id) !== 9) {
      return;
    }

    const permission =
      user?.staff_permission?.permission;

    // No permission received
    if (!permission) {
      return;
    }

    let parsedPermission = permission;

    // If permission comes as JSON string
    if (typeof parsedPermission === "string") {
      try {
        parsedPermission = JSON.parse(
          parsedPermission
        );
      } catch (error) {
        console.error(
          "STAFF PERMISSION PARSE ERROR:",
          error
        );

        parsedPermission = {};
      }
    }

    // Make sure permission is an object
    if (
      !parsedPermission ||
      typeof parsedPermission !== "object" ||
      Array.isArray(parsedPermission)
    ) {
      parsedPermission = {};
    }

    // ========================================
    // ONLY LOCAL STORAGE KEY
    // ========================================

    localStorage.setItem(
      "staff_permissions",
      JSON.stringify(parsedPermission)
    );

    console.log(
      "Staff Permissions Saved:",
      parsedPermission
    );
  };

  // ==========================================
  // LOGIN
  // ==========================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      // ========================================
      // LOGIN API
      // ========================================

      const res = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      console.log("Login Response:", res);

      // ========================================
      // LOGIN VALIDATION
      // ========================================

      if (!res?.success || !res?.token) {
        toast.error(
          res?.message ||
            "Invalid email or password"
        );

        return;
      }

      // ========================================
      // CURRENT USER
      // ========================================

      const loggedInUser = res?.user;

      if (!loggedInUser) {
        toast.error(
          "User data not received from server"
        );

        return;
      }

      // ========================================
      // DEBUG
      // ========================================

      console.log(
        "Logged In User:",
        loggedInUser
      );

      console.log(
        "Role ID:",
        loggedInUser?.role_id
      );

      console.log(
        "Role Permission ID:",
        loggedInUser?.role_permission_id
      );

      console.log(
        "Staff Permission:",
        loggedInUser?.staff_permission
      );

      // ========================================
      // ORIGINAL LOGIN
      // ========================================

      saveOriginalLogin(
        res.token,
        loggedInUser
      );

      // ========================================
      // SAVE TOKEN
      // ========================================

      saveToken(res.token);

      // ========================================
      // SAVE COMPLETE USER
      // ========================================

      saveUser(loggedInUser);

      // ========================================
      // SAVE STAFF PERMISSION
      // ========================================

      saveStaffPermissions(loggedInUser);

      // ========================================
      // DEBUG LOCAL STORAGE
      // ========================================

      console.log(
        "Saved User:",
        localStorage.getItem("user")
      );

      console.log(
        "Saved Staff Permissions:",
        localStorage.getItem(
          "staff_permissions"
        )
      );

      // ========================================
      // SUCCESS
      // ========================================

      toast.success(
        res?.message ||
          "Login Successfully"
      );

      // ========================================
      // REDIRECT
      // ========================================

      router.replace("/dashboard");
    } catch (error: any) {
      console.error(
        "LOGIN ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className={`
          bg-white
          md:p-8
          p-5
          rounded-2xl
          shadow-xl
          md:w-96
          w-full
          border
          border-gray-100
          transition-all
          duration-700
          ease-out
          ${
            mounted
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }
        `}
      >
        {/* ======================================
            ICON
        ====================================== */}

        <div className="flex justify-center mb-4">
          <div
            className="
              w-14
              h-14
              rounded-full
              bg-blue-50
              flex
              items-center
              justify-center
            "
          >
            <RiLockLine
              size={28}
              className="text-blue-500"
            />
          </div>
        </div>

        {/* ======================================
            TITLE
        ====================================== */}

        <h2
          className="
            text-3xl
            font-bold
            text-center
            text-gray-800
            mb-1
          "
        >
          Login
        </h2>

        <p
          className="
            text-center
            text-gray-400
            text-sm
            mb-6
          "
        >
          Welcome back, please enter your details
        </p>

        {/* ======================================
            EMAIL
        ====================================== */}

        <div className="mb-4">
          <label
            className="
              block
              mb-2
              text-sm
              font-medium
              text-gray-700
            "
          >
            Email
          </label>

          <div className="relative">
            <RiMailLine
              size={18}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email"
              required
              autoComplete="email"
              className="
                w-full
                border
                border-gray-200
                rounded-md
                pl-10
                pr-3
                py-2
                outline-none
                transition-colors
                duration-200
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />
          </div>
        </div>

        {/* ======================================
            PASSWORD
        ====================================== */}

        <div className="mb-5">
          <label
            className="
              block
              mb-2
              text-sm
              font-medium
              text-gray-700
            "
          >
            Password
          </label>

          <div className="relative">
            <RiLockLine
              size={18}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-gray-400
              "
            />

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter Password"
              required
              autoComplete="current-password"
              className="
                w-full
                border
                border-gray-200
                rounded-md
                pl-10
                pr-10
                py-2
                outline-none
                transition-colors
                duration-200
                focus:border-blue-500
                focus:ring-2
                focus:ring-blue-100
              "
            />

            {/* SHOW / HIDE */}

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  (prev) => !prev
                )
              }
              className="
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-gray-500
                hover:text-blue-700
                transition-colors
                cursor-pointer
              "
            >
              {showPassword ? (
                <RiEyeOffLine size={22} />
              ) : (
                <RiEyeLine size={22} />
              )}
            </button>
          </div>
        </div>

        {/* ======================================
            LOGIN BUTTON
        ====================================== */}

        <button
          type="submit"
          disabled={loading}
          className="
            w-full
            bg-blue-500
            text-white
            py-2.5
            rounded-md
            hover:bg-blue-700
            hover:shadow-lg
            hover:shadow-blue-200
            active:scale-[0.98]
            transition-all
            duration-200
            cursor-pointer
            disabled:opacity-50
            disabled:cursor-not-allowed
            flex
            items-center
            justify-center
            gap-2
          "
        >
          {loading ? (
            <>
              <span
                className="
                  w-4
                  h-4
                  border-2
                  border-white/40
                  border-t-white
                  rounded-full
                  animate-spin
                "
              />

              Logging...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>
    </div>
  );
}