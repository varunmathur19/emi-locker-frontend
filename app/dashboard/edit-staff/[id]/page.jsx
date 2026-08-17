"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

import {
  RiEyeLine,
  RiEyeOffLine,
  RiArrowDownSLine,
} from "react-icons/ri";
import { updateStaffData } from "@/services/api";
import { toast } from "react-toastify";
import {
  Country,
  State,
  City,
} from "country-state-city";

const initialFormData = {
  organization_name: "",
  role_id: "",
  name: "",
  email: "",
  phone: "",
  password: "",
  confirm_password: "",
  company_address: "",
  country: "",
  state: "",
  city: "",

  parent_admin_id: null,
  parent_cnf_id: null,
  parent_super_distributor_id: null,
  parent_distributor_id: null,
  parent_fos_id: null,
  parent_retailer_id: null,
  parent_employee_id: null,
  parent_staff_id: null,

  new_device: 0,
  old_device: 0,
  supreme_device: 0,
  pro_star: 0,
  lite: 0,
  google_tv: 0,
  supreme_lock: 0,
};

export default function EditStaffPage() {
  const params = useParams();

  const userId = params.id;

  const [formData, setFormData] = useState(initialFormData);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const countries = Country.getAllCountries();

  const states = formData.country
    ? State.getStatesOfCountry(formData.country)
    : [];

  const cities =
    formData.country && formData.state
      ? City.getCitiesOfState(
          formData.country,
          formData.state
        )
      : [];

  const roles = {
    1: "Admin",
    2: "CNF",
    3: "Super Distributor",
    4: "Distributor",
    5: "FOS",
    6: "Retailer",
    7: "Employee",
    8: "Staff",
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "country") {
        updated.state = "";
        updated.city = "";
      }

      if (name === "state") {
        updated.city = "";
      }

      return updated;
    });
  };

const handleSubmit = async (e) => {
  e.preventDefault();

  if (!userId) {
    toast.error("User ID not found");
    return;
  }

  // Password match check
  if (
    formData.password &&
    formData.password !== formData.confirm_password
  ) {
    toast.error(
      "Password and Confirm Password do not match!"
    );
    return;
  }

  try {
    const payload = {
      ...formData,

      id: Number(userId),
      role_id: Number(formData.role_id),

      parent_admin_id: formData.parent_admin_id
        ? Number(formData.parent_admin_id)
        : null,

      parent_cnf_id: formData.parent_cnf_id
        ? Number(formData.parent_cnf_id)
        : null,

      parent_super_distributor_id:
        formData.parent_super_distributor_id
          ? Number(formData.parent_super_distributor_id)
          : null,

      parent_distributor_id:
        formData.parent_distributor_id
          ? Number(formData.parent_distributor_id)
          : null,

      parent_fos_id: formData.parent_fos_id
        ? Number(formData.parent_fos_id)
        : null,

      parent_retailer_id: formData.parent_retailer_id
        ? Number(formData.parent_retailer_id)
        : null,

      parent_employee_id: formData.parent_employee_id
        ? Number(formData.parent_employee_id)
        : null,

      parent_staff_id: formData.parent_staff_id
        ? Number(formData.parent_staff_id)
        : null,

      new_device: Number(formData.new_device || 0),
      old_device: Number(formData.old_device || 0),
      supreme_device: Number(
        formData.supreme_device || 0
      ),
      pro_star: Number(formData.pro_star || 0),
      lite: Number(formData.lite || 0),
      google_tv: Number(formData.google_tv || 0),
      supreme_lock: Number(
        formData.supreme_lock || 0
      ),
    };

    // Agar password empty hai to payload se hata do
    // taki existing password change na ho
    if (!payload.password) {
      delete payload.password;
      delete payload.confirm_password;
    }

    console.log("UPDATE USER ID:", userId);
    console.log("UPDATE PAYLOAD:", payload);

    const res = await updateStaffData(
      Number(userId),
      payload
    );

    console.log("UPDATE RESPONSE:", res);

    toast.success(
      res?.message || "Staff updated successfully"
    );

  } catch (error) {
    console.error(
      "Update Staff Error:",
      error?.response?.data || error
    );

    toast.error(
      error?.response?.data?.message ||
        "Failed to update staff data"
    );
  }
};
  return (
    <div className="">

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6">

        {/* Header */}
        {/* <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-semibold text-slate-800">
            Edit Staff
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Update staff information and details
          </p>
        </div> */}

        {/* User ID */}
        {/* <div className="mb-5 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
          <span className="text-sm font-medium text-slate-600">
            User ID:
          </span>{" "}
          <span className="text-sm font-semibold text-slate-800">
            {userId}
          </span>
        </div> */}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="pt-2 md:pt-3"
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Organization Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Organization Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="organization_name"
                placeholder="Enter organization name"
                value={formData.organization_name}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

        

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Full Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email Address{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="email"
                name="email"
                placeholder="staff@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Phone Number{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(
                      /[^\d+\s]/g,
                      ""
                    ),
                  }))
                }
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Company Address */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Company Address{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="company_address"
                placeholder="Street, Building, Area"
                value={formData.company_address}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
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
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showPassword ? (
                    <RiEyeOffLine size={20} />
                  ) : (
                    <RiEyeLine size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>

              <div className="relative">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirm_password"
                  placeholder="Confirm password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >
                  {showConfirmPassword ? (
                    <RiEyeOffLine size={20} />
                  ) : (
                    <RiEyeLine size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Country */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Country{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">
                    Select Country
                  </option>

                  {countries.map((country) => (
                    <option
                      key={country.isoCode}
                      value={country.isoCode}
                    >
                      {country.name}
                    </option>
                  ))}
                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                State{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={!formData.country}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    Select State
                  </option>

                  {states.map((state) => (
                    <option
                      key={state.isoCode}
                      value={state.isoCode}
                    >
                      {state.name}
                    </option>
                  ))}
                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {/* City */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                City{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!formData.state}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  <option value="">
                    Select City
                  </option>

                  {cities.map((city) => (
                    <option
                      key={city.name}
                      value={city.name}
                    >
                      {city.name}
                    </option>
                  ))}
                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

          </div>

          {/* Device Permissions */}
          {Number(formData.role_id) === 6 && (
            <div className="mt-8">

              <h2 className="text-base font-semibold text-slate-700 mb-4">
                Retailer Device Permissions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

                {[
                  {
                    label: "New Device",
                    name: "new_device",
                  },
                  {
                    label: "Old Device",
                    name: "old_device",
                  },
                  {
                    label: "Supreme Device",
                    name: "supreme_device",
                  },
                  {
                    label: "Pro Star",
                    name: "pro_star",
                  },
                  {
                    label: "Lite",
                    name: "lite",
                  },
                  {
                    label: "Google TV",
                    name: "google_tv",
                  },
                  {
                    label: "Supreme Lock",
                    name: "supreme_lock",
                  },
                ].map((item) => (
                  <label
                    key={item.name}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border transition cursor-pointer ${
                      formData[item.name] === 1
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-300 bg-white hover:border-blue-400"
                    }`}
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {item.label}
                    </span>

                    <input
                      type="checkbox"
                      checked={
                        formData[item.name] === 1
                      }
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [item.name]:
                            e.target.checked
                              ? 1
                              : 0,
                        }))
                      }
                      className="h-5 w-5 accent-blue-600 cursor-pointer"
                    />
                  </label>
                ))}

              </div>
            </div>
          )}

          {/* Submit */}
          <div className="mt-8 flex justify-end">

            <button
              type="submit"
              className="bg-blue-400 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
            >
              Update
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}