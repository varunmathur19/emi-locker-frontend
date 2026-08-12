"use client";

import { useState, useEffect } from "react";
import { login } from "@/services/api";
import { saveToken, getToken } from "@/utils/token";
import { RiEyeLine, RiEyeOffLine, RiMailLine, RiLockLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import axios from "axios";
import type { ChangeEvent, FormEvent } from "react";

export default function Page() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

  // Halka fade-in effect ke liye (no library)
  const [mounted, setMounted] = useState(false);

  // =====================================
  // LOGIN PAGE PROTECTION
  // =====================================
  useEffect(() => {
    const token = getToken();

    // Agar already login hai
    // toh "/" login page par nahi rehne dena
    if (token) {
      router.replace("/dashboard");
    }

    setMounted(true);
  }, [router]);

  // =====================================
  // INPUT CHANGE
  // =====================================
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // =====================================
  // LOGIN
  // =====================================
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  try {
    setLoading(true);

    const res = await login(formData);

    console.log("Login Response:", res);

    if (res.token) {
      saveToken(res.token);

      toast.success(res.message || "Login Successfully");

      router.replace("/dashboard");
    } else {
      toast.error("Invalid email or password");
    }
  } catch (error: any) {
    console.error("Login Error:", error);

    toast.error("Invalid email or password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className={`bg-white md:p-8 p-5 rounded-2xl shadow-xl md:w-96 w-none border border-gray-100 transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Icon */}
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
          <RiLockLine size={22} className="text-white" />
        </div>

        <h2 className="text-3xl font-bold text-center text-gray-800 mb-1">
          Login
        </h2>
        <p className="text-center text-gray-400 text-sm mb-6">
          Welcome back, please enter your details
        </p>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Email
          </label>

          <div className="relative">
            <RiMailLine
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter Email"
              className="w-full border border-gray-200 rounded-md pl-10 pr-3 py-2 outline-none transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {/* PASSWORD */}
        <div className="mb-5">
          <label className="block mb-2 text-sm font-medium text-gray-700">
            Password
          </label>

          <div className="relative">
            <RiLockLine
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter Password"
              className="w-full border border-gray-200 rounded-md pl-10 pr-10 py-2 outline-none transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-700 transition-colors cursor-pointer"
            >
              {showPassword ? (
                <RiEyeOffLine size={22} />
              ) : (
                <RiEyeLine size={22} />
              )}
            </button>
          </div>
        </div>

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2.5 rounded-md hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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