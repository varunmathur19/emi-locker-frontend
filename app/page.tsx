
"use client";

import { useState, useEffect } from "react";
import { login } from "@/services/api";
import { saveToken, getToken } from "@/utils/token";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

export default function Page() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);

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
  }, [router]);


  // =====================================
  // INPUT CHANGE
  // =====================================
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  // =====================================
  // LOGIN
  // =====================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await login(formData);

      console.log("Login Response:", res);

      if (res.token) {
        // Token save
        saveToken(res.token);

        toast.success(
          res.message || "Login Successfully"
        );

        // Dashboard par redirect
        router.replace("/dashboard");

      } else {
        toast.error("Token not found");
      }

    } catch (error) {
      console.error("Login Error:", error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.response?.data?.errors?.[0]?.msg ||
        "Something went wrong";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-lg shadow-md w-96"
      >

        <h2 className="text-3xl font-bold text-center mb-6">
          Login
        </h2>


        {/* EMAIL */}
        <div className="mb-4">

          <label className="block mb-2">
            Email
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter Email"
            className="w-full border rounded-md px-3 py-2 outline-none"
          />

        </div>


        {/* PASSWORD */}
        <div className="mb-4">

          <label className="block mb-2">
            Password
          </label>

          <div className="relative">

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
              className="w-full border rounded-md px-3 py-2 pr-10 outline-none"
            />


            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 cursor-pointer disabled:opacity-50"
        >
          {loading
            ? "Logging..."
            : "Login"}
        </button>

      </form>

    </div>
  );
}
