"use client";
import { addStaff } from "@/services/api";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import Link from "next/link";
import {
  Country,
  State,
  City,
} from "country-state-city";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";

export default function Page() {
  const [formData, setFormData] = useState({
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
     new_device: 0,
  old_device: 0,
  supreme_device: 0,
  pro_star: 0,
  lite: 0,
  google_tv: 0,
  supreme_lock: 0,
  });
  const searchParams = useSearchParams();
  const selectedRole = Number(searchParams.get("role_id"));
  
  const roleButtons = {
  1: "Add Admin",
  2: "Add CNF",
  3: "Add Super Distributor",
  4: "Add Distributor",
  5: "Add FOS",
  6: "Add Retailer",
  7: "Add Employee",
  8: "Add Staff",
};

const getRoleName = (roleId) => {
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

  return roles[roleId] || "User";
};




  const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);



useEffect(()=>{

 const roleId = searchParams.get("role_id");

 if(roleId){

   setFormData(prev=>({
     ...prev,
     role_id:Number(roleId)
   }));

 }

},[searchParams]);

  // Sample data – replace with API data later
 

 const countries = Country.getAllCountries();

const states = formData.country
  ? State.getStatesOfCountry(formData.country)
  : [];

const cities =
  formData.country && formData.state
    ? City.getCitiesOfState(formData.country, formData.state)
    : [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = { ...prev, [name]: value };

      // Reset dependent fields
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

  if (!formData.role_id) {
    toast.error("Role ID missing. Please select role again");
    return;
  }

  if (formData.password !== formData.confirm_password) {
    toast.error("Password and Confirm Password do not match!");
    return;
  }

  try {

    const res = await addStaff(formData);

    console.log("Staff Created:", res);

    toast.success(
      res?.message || "Staff Created Successfully"
    );


    setFormData({
      organization_name: "",
      role_id: formData.role_id,
      name: "",
      email: "",
      phone: "",
      password: "",
      confirm_password: "",
      company_address: "",
      country: "",
      state: "",
      city: "",
    });


  } catch(error){

    console.log(error);


    toast.error(
      error?.response?.data?.message ||
      "Something went wrong"
    );

  }

};

  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
    
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6">
              <div className="flex justify-between items-center mb-0">
  <div className="flex gap-3">
    <Link
      href={`/dashboard?role=${selectedRole}`}
      className="bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-800 whitespace-nowrap"
    >
      {getRoleName(selectedRole)} List
    </Link>

    {/* <Link
      href={`/dashboard/form?role=${selectedRole}&role_id=${selectedRole}`}
      className="bg-blue-400 text-white px-4 py-2 rounded-sm hover:bg-blue-500 whitespace-nowrap"
    >
      {roleButtons[selectedRole]}
    </Link> */}
  </div>
</div>
          {/* Header */}
          {/* <div className="bg-gradient-to-r from-blue-400 to-indigo-400 px-8 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Create Staff
            </h1>
            
          </div> */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="pt-6 md:pt-5 md:px-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Organization Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Organization Name <span className="text-red-500">*</span>
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

              {/* Role ID (readonly) */}
              {/* <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Role ID
                </label>
              <input
  type="number"
  name="role_id"
  placeholder="Enter Role ID"
  value={formData.role_id}
  onChange={handleChange}
  required
  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
/>
              </div> */}

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Full Name <span className="text-red-500">*</span>
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
                  Email Address <span className="text-red-500">*</span>
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
                  Phone Number <span className="text-red-500">*</span>
                </label>
             <input
  type="tel"
  name="phone"
  placeholder="+91 98765 43210"
  value={formData.phone}
  onChange={(e) =>
    setFormData({
      ...formData,
      phone: e.target.value.replace(/[^\d+\s]/g, ""),
    })
  }
  required
  pattern="^(\+91\s?)?[6-9]\d{9}$"
  title="Enter a valid Indian mobile number"
  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
/>
              </div>

              {/* Company Address */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Company Address <span className="text-red-500">*</span>
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
    Password <span className="text-red-500">*</span>
  </label>

  <div className="relative">
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      placeholder="Enter password"
      value={formData.password}
      onChange={handleChange}
      required
      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
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
    Confirm Password <span className="text-red-500">*</span>
  </label>

  <div className="relative">
    <input
      type={showConfirmPassword ? "text" : "password"}
      name="confirm_password"
      placeholder="Re-enter password"
      value={formData.confirm_password}
      onChange={handleChange}
      required
      className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />

    <button
      type="button"
      onClick={() =>
        setShowConfirmPassword(!showConfirmPassword)
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

              {/* Country Dropdown */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Country <span className="text-red-500">*</span>
                </label>
              <select
  name="country"
  value={formData.country}
  onChange={handleChange}
  required
  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none"
>
  <option value="">Select Country</option>

  {countries.map((country) => (
    <option key={country.isoCode} value={country.isoCode}>
      {country.name}
    </option>
  ))}
</select>
              </div>

              {/* State Dropdown */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  State <span className="text-red-500">*</span>
                </label>
              <select
  name="state"
  value={formData.state}
  onChange={handleChange}
  required
  disabled={!formData.country}
  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
>
  <option value="">Select State</option>

  {states.map((state) => (
    <option key={state.isoCode} value={state.isoCode}>
      {state.name}
    </option>
  ))}
</select>
              </div>

              {/* City Dropdown */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  City <span className="text-red-500">*</span>
                </label>
           <select
  name="city"
  value={formData.city}
  onChange={handleChange}
  required
  disabled={!formData.state}
  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
>
  <option value="">Select City</option>

  {cities.map((city) => (
    <option key={city.name} value={city.name}>
      {city.name}
    </option>
  ))}
</select>
              </div>
              {/* Retailer Device Permissions */}
{Number(formData.role_id) === 6 && (
  <div className="md:col-span-3 space-y-4">
    <h3 className="text-lg font-semibold text-slate-700">
      Device Permissions
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[
        { label: "New Device", name: "new_device" },
        { label: "Old Device", name: "old_device" },
        { label: "Supreme Device", name: "supreme_device" },
        { label: "Pro Star", name: "pro_star" },
        { label: "Lite", name: "lite" },
        { label: "Google TV", name: "google_tv" },
        { label: "Supreme Lock", name: "supreme_lock" },
      ].map((item) => (
        <label
          key={item.name}
          className={`flex items-center justify-between px-4 py-3 rounded-lg border transition cursor-pointer
            ${
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
            checked={formData[item.name] === 1}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                [item.name]: e.target.checked ? 1 : 0,
              }))
            }
            className="h-5 w-5 accent-blue-600 cursor-pointer"
          />
        </label>
      ))}
    </div>
  </div>
)}
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="bg-blue-400 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                Create Staff
              </button>
            </div>
          </form>
        </div>
      </div>
    // </div>
  );
}