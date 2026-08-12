"use client";
import {  addStaff, getDropdownUsers } from "@/services/api";
import { getUserFromToken } from "@/utils/token";
import { RiEyeLine, RiEyeOffLine , RiArrowDownSLine  } from "react-icons/ri";
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

  // Parent hierarchy
  parent_admin_id: null,
  parent_cnf_id: null,
  parent_super_distributor_id: null,
  parent_distributor_id: null,
  parent_fos_id: null,
  parent_retailer_id: null,
  parent_employee_id: null,
  parent_staff_id: null,

  // Device permissions
  new_device: 0,
  old_device: 0,
  supreme_device: 0,
  pro_star: 0,
  lite: 0,
  google_tv: 0,
  supreme_lock: 0,
});
  const [parentUsers, setParentUsers] = useState({});
  const searchParams = useSearchParams();
  const selectedRole = Number(searchParams.get("role_id"));

  const loggedInUser = getUserFromToken();
const loggedInRoleId = Number(loggedInUser?.role_id);
  
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

const parentRoles = {
  2: [],             // CNF -> Admin internally
  3: [2],            // Super -> CNF
  4: [2, 3],         // Distributor -> CNF -> Super
  5: [2, 3, 4],      // FOS -> CNF -> Super -> Distributor
  6: [2, 3, 4, 5],   // Retailer -> CNF -> Super -> Distributor -> FOS
  7: [2, 3, 4, 5, 6], // Employee -> CNF -> Super -> Distributor -> FOS -> Retailer
  8: []              // Staff -> Admin internally
};

const visibleParentRoles = (parentRoles[selectedRole] || []).filter(
  (roleId) => {
    // Admin ko dropdown mein nahi dikhana
    if (roleId === 1) return false;

    // Logged-in role aur uske upar wale roles hide
    if (roleId <= loggedInRoleId) return false;

    return true;
  }
);

const loadParentUsers = async (roleId, parentId = null) => {
  try {
    console.log("Loading Dropdown");
    console.log("Role ID:", roleId);
    console.log("Parent ID:", parentId);

    const res = await getDropdownUsers(
      Number(roleId),
      parentId ? Number(parentId) : null
    );

    console.log("API Response:", res);
    console.log("API Data:", res?.data);

    // API response handle
    const users =
      Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : [];

    console.log("Users for dropdown:", users);

    setParentUsers((prev) => ({
      ...prev,
      [Number(roleId)]: users,
    }));

  } catch (error) {

    console.error(
      "Dropdown Error:",
      error?.response?.data || error
    );

  }
};

useEffect(() => {
  if (!selectedRole || selectedRole <= 1) return;

  const user = getUserFromToken();

  if (!user?.id) {
    console.log("Logged-in user not found");
    return;
  }

  const userId = Number(user.id);
  const userRoleId = Number(user.role_id);

  console.log("=================================");
  console.log("LOGGED USER");
  console.log("User ID:", userId);
  console.log("User Role:", userRoleId);
  console.log("Creating Role:", selectedRole);

  // ==========================================
  // LOGGED-IN USER KO AUTOMATIC PARENT SET KARO
  // ==========================================

  setFormData((prev) => {
    const updated = { ...prev };

    if (userRoleId === 1) {
      updated.parent_admin_id = userId;
    }

    if (userRoleId === 2) {
      updated.parent_cnf_id = userId;
    }

    if (userRoleId === 3) {
      updated.parent_super_distributor_id = userId;
    }

    if (userRoleId === 4) {
      updated.parent_distributor_id = userId;
    }

    if (userRoleId === 5) {
      updated.parent_fos_id = userId;
    }

    if (userRoleId === 6) {
      updated.parent_retailer_id = userId;
    }

    if (userRoleId === 7) {
      updated.parent_employee_id = userId;
    }

    if (userRoleId === 8) {
      updated.parent_staff_id = userId;
    }

    return updated;
  });

  // ==========================================
  // VISIBLE PARENT DROPDOWN LOAD KARO
  // ==========================================

  const parents = visibleParentRoles;

  if (!parents.length) return;

  const firstParentRole = parents[0];

  console.log("First Visible Parent:", firstParentRole);

  loadParentUsers(firstParentRole, null);

}, [selectedRole, loggedInRoleId]);
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
const handleParentChange = async (
  parentRoleId,
  parentId
) => {

  // IMPORTANT:
  // Ab complete hierarchy nahi,
  // sirf visible hierarchy use hogi
  const parents = visibleParentRoles;

  const currentIndex =
    parents.indexOf(Number(parentRoleId));

  const selectedId =
    parentId
      ? Number(parentId)
      : null;

  console.log("=================================");
  console.log("PARENT CHANGED");
  console.log("Logged User Role:", loggedInRoleId);
  console.log("Selected Role:", selectedRole);
  console.log("Selected Parent Role:", parentRoleId);
  console.log("Selected Parent ID:", selectedId);

  // Selected user
  const selectedUser =
    (parentUsers[parentRoleId] || []).find(
      (user) =>
        Number(user.id) === selectedId
    );

  console.log("Selected User:", selectedUser);

  setFormData((prev) => {

    const updated = {
      ...prev,
      [`parent_${parentRoleId}`]: selectedId,
    };

    // ==========================================
    // CNF SELECTED
    // ==========================================

    if (Number(parentRoleId) === 2) {

      updated.parent_cnf_id = selectedId;

      updated.parent_admin_id =
        selectedUser?.parent_admin_id
          ? Number(selectedUser.parent_admin_id)
          : updated.parent_admin_id;
    }

    // ==========================================
    // SUPER DISTRIBUTOR SELECTED
    // ==========================================

    if (Number(parentRoleId) === 3) {

      updated.parent_super_distributor_id =
        selectedId;

      updated.parent_admin_id =
        selectedUser?.parent_admin_id
          ? Number(selectedUser.parent_admin_id)
          : updated.parent_admin_id;

      updated.parent_cnf_id =
        selectedUser?.parent_cnf_id
          ? Number(selectedUser.parent_cnf_id)
          : updated.parent_cnf_id;
    }

    // ==========================================
    // DISTRIBUTOR SELECTED
    // ==========================================

    if (Number(parentRoleId) === 4) {

      updated.parent_distributor_id =
        selectedId;

      updated.parent_admin_id =
        selectedUser?.parent_admin_id
          ? Number(selectedUser.parent_admin_id)
          : updated.parent_admin_id;

      updated.parent_cnf_id =
        selectedUser?.parent_cnf_id
          ? Number(selectedUser.parent_cnf_id)
          : updated.parent_cnf_id;

      updated.parent_super_distributor_id =
        selectedUser?.parent_super_distributor_id
          ? Number(
              selectedUser.parent_super_distributor_id
            )
          : updated.parent_super_distributor_id;
    }

    // ==========================================
    // FOS SELECTED
    // ==========================================

    if (Number(parentRoleId) === 5) {

      updated.parent_fos_id =
        selectedId;

      updated.parent_admin_id =
        selectedUser?.parent_admin_id
          ? Number(selectedUser.parent_admin_id)
          : updated.parent_admin_id;

      updated.parent_cnf_id =
        selectedUser?.parent_cnf_id
          ? Number(selectedUser.parent_cnf_id)
          : updated.parent_cnf_id;

      updated.parent_super_distributor_id =
        selectedUser?.parent_super_distributor_id
          ? Number(
              selectedUser.parent_super_distributor_id
            )
          : updated.parent_super_distributor_id;

      updated.parent_distributor_id =
        selectedUser?.parent_distributor_id
          ? Number(
              selectedUser.parent_distributor_id
            )
          : updated.parent_distributor_id;
    }

    // ==========================================
    // RETAILER SELECTED
    // ==========================================

    if (Number(parentRoleId) === 6) {

      updated.parent_retailer_id =
        selectedId;

      updated.parent_admin_id =
        selectedUser?.parent_admin_id
          ? Number(selectedUser.parent_admin_id)
          : updated.parent_admin_id;

      updated.parent_cnf_id =
        selectedUser?.parent_cnf_id
          ? Number(selectedUser.parent_cnf_id)
          : updated.parent_cnf_id;

      updated.parent_super_distributor_id =
        selectedUser?.parent_super_distributor_id
          ? Number(
              selectedUser.parent_super_distributor_id
            )
          : updated.parent_super_distributor_id;

      updated.parent_distributor_id =
        selectedUser?.parent_distributor_id
          ? Number(
              selectedUser.parent_distributor_id
            )
          : updated.parent_distributor_id;

      updated.parent_fos_id =
        selectedUser?.parent_fos_id
          ? Number(selectedUser.parent_fos_id)
          : updated.parent_fos_id;
    }

    return updated;
  });

  // ==========================================
  // CLEAR NEXT DROPDOWNS
  // ==========================================

  const updatedParentUsers = {
    ...parentUsers,
  };

  parents
    .slice(currentIndex + 1)
    .forEach((roleId) => {
      updatedParentUsers[roleId] = [];
    });

  setParentUsers(updatedParentUsers);

  // ==========================================
  // EMPTY SELECTION
  // ==========================================

  if (!selectedId) {
    return;
  }

  // ==========================================
  // NEXT PARENT
  // ==========================================

  const nextRoleId =
    parents[currentIndex + 1];

  if (!nextRoleId) {
    return;
  }

  await loadParentUsers(
    nextRoleId,
    selectedId
  );
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const roleId = Number(formData.role_id);

  if (!roleId) {
    toast.error("Role ID missing. Please select role again");
    return;
  }

  const user = getUserFromToken();

  if (!user?.id) {
    toast.error("Logged-in user not found");
    return;
  }

  console.log("=================================");
  console.log("SUBMIT FORM");
  console.log("Logged User:", user);
  console.log("Logged User ID:", user.id);
  console.log("Logged User Role:", user.role_id);
  console.log("Creating Role:", roleId);
  console.log("Form Data Before Submit:", formData);

  // =====================================================
  // ADMIN -> CNF
  // =====================================================

  if (
    roleId === 2 &&
    Number(user.role_id) === 1
  ) {
    formData.parent_admin_id = Number(user.id);
  }

  // =====================================================
  // ADMIN -> STAFF
  // =====================================================

  if (
    roleId === 8 &&
    Number(user.role_id) === 1
  ) {
    formData.parent_admin_id = Number(user.id);
  }

  // =====================================================
  // PARENT VALIDATION
  // =====================================================

 const parents = visibleParentRoles;

for (const parentRoleId of parents) {
  const parentValue =
    formData[`parent_${parentRoleId}`];

  if (!parentValue) {
    toast.error(
      `Please select ${getRoleName(parentRoleId)}`
    );

    return;
  }
}

  // =====================================================
  // PASSWORD VALIDATION
  // =====================================================

  if (
    formData.password !==
    formData.confirm_password
  ) {
    toast.error(
      "Password and Confirm Password do not match!"
    );

    return;
  }

  // =====================================================
  // CREATE FINAL PAYLOAD
  // =====================================================

  const payload = {
    ...formData,

    role_id: roleId,

    // Make sure parent IDs are numbers
   parent_admin_id:
  formData.parent_admin_id
    ? Number(formData.parent_admin_id)
    : null,

parent_cnf_id:
  formData.parent_cnf_id
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

parent_fos_id:
  formData.parent_fos_id
    ? Number(formData.parent_fos_id)
    : null,

parent_retailer_id:
  formData.parent_retailer_id
    ? Number(formData.parent_retailer_id)
    : null,

parent_employee_id:
  formData.parent_employee_id
    ? Number(formData.parent_employee_id)
    : null,

parent_staff_id:
  formData.parent_staff_id
    ? Number(formData.parent_staff_id)
    : null,
  };

  console.log(
    "FINAL PAYLOAD:",
    payload
  );

  try {

    const res = await addStaff(payload);

    console.log(
      "Staff Created:",
      res
    );

    toast.success(
      res?.message ||
      "Staff Created Successfully"
    );

    setFormData({
      organization_name: "",
      role_id: roleId,
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
    });

  } catch (error) {

    console.log(
      "Create Staff Error:",
      error?.response?.data || error
    );

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
            <div className="mb-5">

  {/* Top Buttons */}
  <div className="flex justify-between items-center">
    <div className="flex gap-3">
      <Link
        href={`/dashboard?role=${selectedRole}`}
        className="bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-800 whitespace-nowrap"
      >
        {getRoleName(selectedRole)} List
      </Link>
    </div>
  </div>

  {/* Parent Role Dropdowns */}
{/* Parent Role Dropdowns */}

{selectedRole > 1 &&
  visibleParentRoles.length > 0 && (

  <div className="mb-6">

    <h3 className="text-[20px] font-bold text-blue-500 mb-3">
      Select Parent
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

      {visibleParentRoles.map((parentRoleId, index) => {

        // Previous parent role
        const previousRoleId =
          visibleParentRoles[index - 1];

        // Previous parent selected hai ya nahi
        const previousSelectedId =
          previousRoleId
            ? formData[`parent_${previousRoleId}`]
            : true;

        // Current role ke users
        const users =
          parentUsers[parentRoleId] || [];

        // First dropdown hamesha show
        // Next dropdown previous selection ke baad show
        const shouldShow =
          index === 0 ||
          Boolean(previousSelectedId);

        if (!shouldShow) {
          return null;
        }

        return (
          <div
            key={parentRoleId}
            className="space-y-1.5"
          >

            <label className="text-sm font-medium text-slate-700">
              {getRoleName(parentRoleId)}
            </label>

            <div className="relative">

              <select
                value={
                  formData[`parent_${parentRoleId}`] || ""
                }
                onChange={(e) =>
                  handleParentChange(
                    parentRoleId,
                    e.target.value
                  )
                }
                required
                className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white"
              >

                <option value="">
                  Select {getRoleName(parentRoleId)}
                </option>

                {users.map((user) => (
                  <option
                    key={user.id}
                    value={user.id}
                  >
                    {user.name}
                  </option>
                ))}

              </select>

              <RiArrowDownSLine
                size={22}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />

            </div>

          </div>
        );
      })}

    </div>

  </div>
)}

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