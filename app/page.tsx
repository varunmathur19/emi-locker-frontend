
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

  const [showPassword, setShowPassword] =
    useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (token) {
      router.replace("/dashboard");
      return;
    }

    setMounted(true);
  }, [router]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const saveStaffPermissions = (user: any) => {
    localStorage.removeItem("staff_permissions");

    if (Number(user?.role_id) !== 9) {
      return;
    }

    const permission =
      user?.staff_permission?.permission;

    if (!permission) {
      return;
    }

    let parsedPermission = permission;

    if (typeof parsedPermission === "string") {
      try {
        parsedPermission = JSON.parse(
          parsedPermission
        );
      } catch (error) {
        console.error(
          "Staff permission parse error:",
          error
        );

        parsedPermission = {};
      }
    }

    if (
      !parsedPermission ||
      typeof parsedPermission !== "object" ||
      Array.isArray(parsedPermission)
    ) {
      parsedPermission = {};
    }

    localStorage.setItem(
      "staff_permissions",
      JSON.stringify(parsedPermission)
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (response?.maintenance === true) {
        toast.error(
          response?.message ||
            "Application is under maintenance"
        );

        router.replace("/maintenance");
        return;
      }

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Invalid email or password"
        );

        return;
      }

      const loggedInUser = response?.user;

      if (!loggedInUser) {
        toast.error(
          "User data not received from server"
        );

        return;
      }

      if (!response?.token) {
        toast.error(
          "Login token not received"
        );

        return;
      }

      saveOriginalLogin(
        response.token,
        loggedInUser
      );

      saveToken(response.token);

      saveUser(loggedInUser);

      saveStaffPermissions(loggedInUser);

      toast.success(
        response?.message ||
          "Login Successfully"
      );

      router.replace("/dashboard");
    } catch (error: any) {
      console.error(
        "Login error:",
        error
      );

      const status =
        error?.response?.status;

      const errorResponse =
        error?.response?.data;

      if (
        status === 503 ||
        errorResponse?.maintenance === true
      ) {
        toast.error(
          errorResponse?.message ||
            "Application is under maintenance"
        );

        router.replace("/maintenance");
        return;
      }

      toast.error(
        errorResponse?.message ||
          error?.message ||
          "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full rounded-2xl border border-gray-100 bg-white p-5 shadow-xl transition-all duration-700 ease-out md:w-96 md:p-8 ${
          mounted
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0"
        }`}
      >
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50">
            <RiLockLine
              size={28}
              className="text-blue-500"
            />
          </div>
        </div>

        <h2 className="mb-1 text-center text-3xl font-bold text-gray-800">
          Login
        </h2>

        <p className="mb-6 text-center text-sm text-gray-400">
          Welcome back, please enter your details
        </p>

        <div className="mb-4">
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Email
          </label>

          <div className="relative">
            <RiMailLine
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-3 outline-none transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mb-5">
          <label
            htmlFor="password"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Password
          </label>

          <div className="relative">
            <RiLockLine
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              id="password"
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
              className="w-full rounded-md border border-gray-200 py-2 pl-10 pr-10 outline-none transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              aria-label={
                showPassword
                  ? "Hide password"
                  : "Show password"
              }
              onClick={() =>
                setShowPassword(
                  (previous) => !previous
                )
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition-colors hover:text-blue-700"
            >
              {showPassword ? (
                <RiEyeOffLine size={22} />
              ) : (
                <RiEyeLine size={22} />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-blue-500 py-2.5 text-white transition-all duration-200 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
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
