"use client";
import { addStaff } from "@/services/api";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

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
  });

  const searchParams = useSearchParams();

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
  const locationData = {
    India: {
      Maharashtra: ["Mumbai", "Pune", "Nagpur", "Nashik"],
      Delhi: ["New Delhi", "North Delhi", "South Delhi"],
      Karnataka: ["Bangalore", "Mysore", "Mangalore"],
      Gujarat: ["Ahmedabad", "Surat", "Vadodara"],
      "Uttar Pradesh": ["Lucknow", "Kanpur", "Varanasi"],
    },
    "United States": {
      California: ["Los Angeles", "San Francisco", "San Diego"],
      Texas: ["Houston", "Dallas", "Austin"],
      "New York": ["New York City", "Buffalo", "Rochester"],
    },
    "United Kingdom": {
      England: ["London", "Manchester", "Birmingham"],
      Scotland: ["Edinburgh", "Glasgow"],
    },
    Canada: {
      Ontario: ["Toronto", "Ottawa", "Mississauga"],
      "British Columbia": ["Vancouver", "Victoria"],
    },
  };

  const countries = Object.keys(locationData);
  const states = formData.country ? Object.keys(locationData[formData.country] || {}) : [];
  const cities =
    formData.country && formData.state
      ? locationData[formData.country]?.[formData.state] || []
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

  if (formData.password !== formData.confirm_password) {
    alert("Password and Confirm Password do not match!");
    return;
  }


  try {

    const res = await addStaff(formData);

    console.log("Staff Created:", res);

    alert("Staff Created Successfully");


    setFormData({
      organization_name: "",
      role_id: 8,
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

    alert(
      error?.response?.data?.message || 
      "Something went wrong"
    );

  }

};

  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          
          {/* Header */}
          {/* <div className="bg-gradient-to-r from-blue-400 to-indigo-400 px-8 py-6">
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Create Staff
            </h1>
            
          </div> */}

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
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
                  onChange={handleChange}
                  required
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
                <input
                  type="password"
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="confirm_password"
                  placeholder="Re-enter password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
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
                    <option key={country} value={country}>
                      {country}
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
                    <option key={state} value={state}>
                      {state}
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
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98]"
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