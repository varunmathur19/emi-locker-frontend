"use client";

import { useParams, useRouter  } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

import {
  RiEyeLine,
  RiEyeOffLine,
  RiArrowDownSLine,
} from "react-icons/ri";

import {
  updateStaffData,
  getStaffDataById,
  getDropdownUsers,
} from "@/services/api";

import { getUserFromToken } from "@/utils/token";
import { toast } from "react-toastify";

import {
  Country,
  State,
  City,
} from "country-state-city";


// =====================================================
// INITIAL FORM DATA
// =====================================================

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

  parent_id: null,

  new_device: 0,
  old_device: 0,
  supreme_device: 0,
  pro_star: 0,
  lite: 0,
  google_tv: 0,
  supreme_lock: 0,
};


// =====================================================
// ROLE MAPPING
// =====================================================

const roles = {
  1: "Admin",
  2: "CNF",
  3: "Super Distributor",
  4: "Distributor",
  5: "FOS",
  6: "Retailer",
  7: "Sub Retailer",
  8: "Employee",
  9: "Staff",
};


// =====================================================
// PARENT HIERARCHY
// =====================================================
//
// Admin           -> No Parent
// CNF             -> Admin
// Super Distributor -> CNF
// Distributor     -> CNF -> Super Distributor
// FOS             -> CNF -> Super Distributor -> Distributor
// Retailer        -> CNF -> SD -> Distributor -> FOS
// Sub Retailer    -> CNF -> SD -> Distributor -> FOS -> Retailer
// Employee        -> CNF -> SD -> Distributor -> FOS -> Retailer -> Sub Retailer
// Staff           -> No Parent
//
// Last role in array = DIRECT PARENT
// =====================================================

const parentRoles = {
  1: [],

  2: [1],

  3: [2],

  4: [2, 3],

  5: [2, 3, 4],

  6: [2, 3, 4, 5],

  7: [2, 3, 4, 5, 6],

  8: [2, 3, 4, 5, 6, 7],

  9: [],
};


// =====================================================
// HIERARCHY ROLES
// =====================================================

const hierarchyRoles = [
  2, // CNF
  3, // Super Distributor
  4, // Distributor
  5, // FOS
  6, // Retailer
  7, // Sub Retailer
];


// =====================================================
// COMPONENT
// =====================================================

export default function EditStaffPage() {
  const params = useParams();
  const router = useRouter();

  const userId = params.id;


  // ===================================================
  // STATES
  // ===================================================

  const [formData, setFormData] =
    useState(initialFormData);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

 const [loggedInRoleId, setLoggedInRoleId] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);

  // Parent dropdown users
  const [parentUsers, setParentUsers] =
    useState({});

  // Selected parent IDs
  const [selectedParents, setSelectedParents] =
    useState({});

  // Search value for every dropdown
  const [parentSearch, setParentSearch] =
    useState({});

  // Loading state for every dropdown
  const [parentLoading, setParentLoading] =
    useState({});

  // Search timers
  const searchTimers = useRef({});


  // ===================================================
  // COUNTRY / STATE / CITY
  // ===================================================

  const countries =
    Country.getAllCountries();

  const states = formData.country
    ? State.getStatesOfCountry(
        formData.country
      )
    : [];

  const cities =
    formData.country && formData.state
      ? City.getCitiesOfState(
          formData.country,
          formData.state
        )
      : [];


  // ===================================================
  // ROLE NAME
  // ===================================================

  const getRoleName = (roleId) => {
    return (
      roles[Number(roleId)] ||
      "Parent"
    );
  };


  // ===================================================
  // GET LOGGED-IN USER ROLE
  // ===================================================

  useEffect(() => {
    const loggedInUser =
      getUserFromToken();

    if (
      loggedInUser?.role_id !== null &&
      loggedInUser?.role_id !== undefined
    ) {
      setLoggedInRoleId(
        Number(loggedInUser.role_id)
      );
    }
  }, []);


  // ===================================================
  // GET NEXT PARENT ROLE
  // ===================================================

  const getNextParentRole = (
    currentRoleId
  ) => {
    const currentIndex =
      hierarchyRoles.indexOf(
        Number(currentRoleId)
      );

    if (currentIndex === -1) {
      return null;
    }

    if (
      currentIndex >=
      hierarchyRoles.length - 1
    ) {
      return null;
    }

    return hierarchyRoles[
      currentIndex + 1
    ];
  };


  // ===================================================
  // VISIBLE PARENT ROLES
  // ===================================================

  const visibleParentRoles =
  (() => {
    const currentRole =
      Number(formData.role_id);

    if (
      !loggedInRoleId ||
      !currentRole
    ) {
      return [];
    }

    const loggedRole =
      Number(loggedInRoleId);

    const requiredParents =
      parentRoles[currentRole] || [];

    return requiredParents.filter(
      (roleId) => {

        if (
          roleId === loggedRole
        ) {
          return false;
        }

        if (
          roleId < loggedRole
        ) {
          return false;
        }

        return true;
      }
    );
  })();

  // ===================================================
  // COMMON INPUT CHANGE
  // ===================================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => {

      const updated = {
        ...prev,
        [name]: value,
      };

      if (
        name === "country"
      ) {
        updated.state = "";
        updated.city = "";
      }

      if (
        name === "state"
      ) {
        updated.city = "";
      }

      return updated;
    });
  };


  // ===================================================
  // LOAD PARENT DROPDOWN
  // ===================================================

  const loadParentDropdown = async (
    parentRoleId,
    parentId = null,
    search = ""
  ) => {

    const roleId =
      Number(parentRoleId);

    try {

      setParentLoading((prev) => ({
        ...prev,
        [roleId]: true,
      }));


      console.log(
        "================================="
      );

      console.log(
        "DROPDOWN API CALL"
      );

      console.log({
        role_id: roleId,
        parent_id: parentId,
        search,
      });

      console.log(
        "================================="
      );


      const response =
        await getDropdownUsers(
          roleId,
          parentId,
          search
        );


      console.log(
        `DROPDOWN RESPONSE ROLE ${roleId}:`,
        response
      );


      // =================================================
      // RESPONSE SUPPORT
      // =================================================

      let users = [];

      if (
        Array.isArray(
          response?.data?.users
        )
      ) {
        users =
          response.data.users;
      } else if (
        Array.isArray(
          response?.data
        )
      ) {
        users =
          response.data;
      } else if (
        Array.isArray(
          response?.users
        )
      ) {
        users =
          response.users;
      }


      // =================================================
      // IMPORTANT
      // Empty result par error/message nahi show karna
      // =================================================

      setParentUsers((prev) => ({
        ...prev,
        [roleId]:
          Array.isArray(users)
            ? users
            : [],
      }));

    } catch (error) {

      console.error(
        `Dropdown API failed for role ${roleId}:`,
        error
      );


      // =================================================
      // ERROR PAR EMPTY ARRAY
      // Toast nahi dikhana
      // "No Super Distributor found"
      // type message bhi show nahi karna
      // =================================================

      setParentUsers((prev) => ({
        ...prev,
        [roleId]: [],
      }));

    } finally {

      setParentLoading((prev) => ({
        ...prev,
        [roleId]: false,
      }));
    }
  };


  // ===================================================
  // SEARCH PARENT DROPDOWN
  // ===================================================

  const handleParentSearch = (
    parentRoleId,
    parentId,
    value
  ) => {

    const roleId =
      Number(parentRoleId);


    // =================================================
    // SAVE SEARCH TEXT
    // =================================================

    setParentSearch((prev) => ({
      ...prev,
      [roleId]: value,
    }));


    // =================================================
    // CLEAR OLD TIMER
    // =================================================

    if (
      searchTimers.current[roleId]
    ) {
      clearTimeout(
        searchTimers.current[roleId]
      );
    }


    // =================================================
    // EMPTY SEARCH
    // =================================================

    if (!value.trim()) {

      searchTimers.current[roleId] =
        setTimeout(() => {

          loadParentDropdown(
            roleId,
            parentId,
            ""
          );

        }, 200);

      return;
    }


    // =================================================
    // DEBOUNCED SEARCH API
    // =================================================

    searchTimers.current[roleId] =
      setTimeout(() => {

        loadParentDropdown(
          roleId,
          parentId,
          value.trim()
        );

      }, 400);
  };


  // ===================================================
  // CLEAN SEARCH TIMERS
  // ===================================================

  useEffect(() => {

    return () => {

      Object.values(
        searchTimers.current
      ).forEach((timer) => {
        clearTimeout(timer);
      });

    };

  }, []);


  // ===================================================
  // CLEAR NEXT PARENT DROPDOWNS
  // ===================================================

  const clearNextParentDropdowns = (
    parentRoleId
  ) => {

    const currentIndex =
      visibleParentRoles.indexOf(
        Number(parentRoleId)
      );

    if (currentIndex === -1) {
      return;
    }


    const nextRoles =
      visibleParentRoles.slice(
        currentIndex + 1
      );


    // =================================================
    // CLEAR SELECTED
    // =================================================

    setSelectedParents((prev) => {

      const updated = {
        ...prev,
      };

      nextRoles.forEach(
        (roleId) => {
          delete updated[roleId];
        }
      );

      return updated;
    });


    // =================================================
    // CLEAR USERS
    // =================================================

    setParentUsers((prev) => {

      const updated = {
        ...prev,
      };

      nextRoles.forEach(
        (roleId) => {
          delete updated[roleId];
        }
      );

      return updated;
    });


    // =================================================
    // CLEAR SEARCH
    // =================================================

    setParentSearch((prev) => {

      const updated = {
        ...prev,
      };

      nextRoles.forEach(
        (roleId) => {
          delete updated[roleId];
        }
      );

      return updated;
    });
  };


  // ===================================================
  // PARENT SELECT CHANGE
  // ===================================================

  const handleParentChange = async (
    parentRoleId,
    value,
    index
  ) => {

    const roleId =
      Number(parentRoleId);

    const selectedId =
      value
        ? Number(value)
        : null;


    // =================================================
    // SAVE SELECTED PARENT
    // =================================================

    setSelectedParents((prev) => ({
      ...prev,
      [roleId]: selectedId,
    }));


    // =================================================
    // IMPORTANT:
    // Selected last parent = actual parent_id
    // =================================================

    setFormData((prev) => ({
      ...prev,
      parent_id:
        selectedId,
    }));


    // =================================================
    // CLEAR SEARCH
    // =================================================

    setParentSearch((prev) => ({
      ...prev,
      [roleId]: "",
    }));


    // =================================================
    // CLEAR NEXT DROPDOWNS
    // =================================================

    clearNextParentDropdowns(
      roleId
    );


    // =================================================
    // NOTHING SELECTED
    // =================================================

    if (!selectedId) {
      return;
    }


    // =================================================
    // NEXT VISIBLE ROLE
    // =================================================
    //
    // visibleParentRoles use karna important hai.
    // Isse logged-in role ke according hierarchy
    // break nahi hogi.
    // =================================================

    const nextRoleId =
      visibleParentRoles[
        index + 1
      ];


    if (!nextRoleId) {
      return;
    }


    // =================================================
    // LOAD NEXT DROPDOWN
    // =================================================

    await loadParentDropdown(
      nextRoleId,
      selectedId,
      ""
    );
  };


  // ===================================================
  // LOAD EDIT USER DATA
  // ===================================================

  useEffect(() => {

    if (!userId) {
      return;
    }


    const fetchStaffData =
      async () => {

        try {

          const id =
            Number(userId);


          if (
            !Number.isInteger(id)
          ) {
            toast.error(
              "Invalid user ID"
            );

            return;
          }


          // ===========================================
          // GET USER
          // ===========================================

          const res =
            await getStaffDataById(id);


          console.log(
            "GET STAFF API RESPONSE:",
            res
          );


          if (!res?.success) {

            toast.error(
              res?.message ||
                "Failed to load staff data"
            );

            return;
          }


          const user =
            res?.data;


          if (!user) {

            toast.error(
              "Staff data not found"
            );

            return;
          }


          // ===========================================
          // SET FORM DATA
          // ===========================================

          setFormData({

            organization_name:
              user.organization_name ||
              "",

            role_id:
              user.role_id != null
                ? Number(
                    user.role_id
                  )
                : "",

            name:
              user.name ||
              "",

            email:
              user.email ||
              "",

            phone:
              user.phone ||
              "",

            password: "",

            confirm_password: "",

            company_address:
              user.company_address ||
              "",

            country:
              user.country ||
              "",

            state:
              user.state ||
              "",

            city:
              user.city ||
              "",

            parent_id:
              user.parent_id != null
                ? Number(
                    user.parent_id
                  )
                : null,

            new_device:
              Number(
                user.new_device || 0
              ),

            old_device:
              Number(
                user.old_device || 0
              ),

            supreme_device:
              Number(
                user.supreme_device ||
                  0
              ),

            pro_star:
              Number(
                user.pro_star || 0
              ),

            lite:
              Number(
                user.lite || 0
              ),

            google_tv:
              Number(
                user.google_tv || 0
              ),

            supreme_lock:
              Number(
                user.supreme_lock ||
                  0
              ),
          });


          // ===========================================
          // SET DIRECT PARENT
          // ===========================================

          if (
            user.parent_id != null
          ) {

            const currentRole =
              Number(
                user.role_id
              );

            const requiredParents =
              parentRoles[
                currentRole
              ] || [];


            const directParentRole =
              requiredParents[
                requiredParents.length - 1
              ];


            if (
              directParentRole !=
              null
            ) {

              setSelectedParents({
                [directParentRole]:
                  Number(
                    user.parent_id
                  ),
              });
            }
          }


          // ===========================================
          // LOAD FIRST PARENT DROPDOWN
          // ===========================================

          const currentRole =
            Number(
              user.role_id
            );

          const requiredParents =
            parentRoles[
              currentRole
            ] || [];


          if (
            requiredParents.length > 0
          ) {

            await loadParentDropdown(
              requiredParents[0],
              null,
              ""
            );
          }


        } catch (error) {

          console.error(
            "GET STAFF ERROR:",
            error
          );

          console.error(
            "ERROR RESPONSE:",
            error?.response?.data
          );


          toast.error(
            error?.response?.data
              ?.message ||
              error?.message ||
              "Failed to load staff data"
          );
        }
      };


    fetchStaffData();

  }, [userId]);


  // ===================================================
  // SUBMIT
  // ===================================================

  const handleSubmit = async (
    e
  ) => {

    e.preventDefault();


    if (!userId) {

      toast.error(
        "User ID not found"
      );

      return;
    }


    // =================================================
    // PASSWORD CHECK
    // =================================================

    if (
      formData.password &&
      formData.password !==
        formData.confirm_password
    ) {

      toast.error(
        "Password and Confirm Password do not match!"
      );

      return;
    }


    try {

      const payload = {

        ...formData,

        id:
          Number(userId),

        role_id:
          Number(
            formData.role_id
          ),

        parent_id:
          formData.parent_id
            ? Number(
                formData.parent_id
              )
            : null,

        new_device:
          Number(
            formData.new_device || 0
          ),

        old_device:
          Number(
            formData.old_device || 0
          ),

        supreme_device:
          Number(
            formData.supreme_device ||
              0
          ),

        pro_star:
          Number(
            formData.pro_star || 0
          ),

        lite:
          Number(
            formData.lite || 0
          ),

        google_tv:
          Number(
            formData.google_tv || 0
          ),

        supreme_lock:
          Number(
            formData.supreme_lock ||
              0
          ),
      };


      // =================================================
      // PASSWORD EMPTY
      // =================================================

      if (!payload.password) {

        delete payload.password;

        delete payload.confirm_password;
      }


      console.log(
        "UPDATE PAYLOAD:",
        payload
      );


      // =================================================
      // UPDATE API
      // =================================================

      const res =
        await updateStaffData(
          Number(userId),
          payload
        );


      console.log(
        "UPDATE RESPONSE:",
        res
      );


      // =================================================
      // SUCCESS
      // =================================================

      toast.success(
        res?.message ||
          "Staff updated successfully"
      );


    } catch (error) {

      console.error(
        "Update Staff Error:",
        error?.response?.data ||
          error
      );


      toast.error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Failed to update staff data"
      );
    }
  };


  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div>

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6">

        <form
          onSubmit={handleSubmit}
          className="pt-2 md:pt-3"
        >
           <div className="mb-6 flex  gap-3">

    {/* ROLE LIST */}
    {formData.role_id && (
      <Link
        href={`/dashboard?role=${Number(
          formData.role_id
        )}`}
        className="
          bg-gray-700
          text-white
          px-4
          py-2
          rounded-sm
          hover:bg-gray-800
          whitespace-nowrap
          flex
          items-center
          justify-center
        "
      >
        {getRoleName(formData.role_id)} List
      </Link>
    )}



  </div>


          {/* ================================================= */}
          {/* PARENT DROPDOWNS */}
          {/* ================================================= */}

          {visibleParentRoles.length > 0 && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {visibleParentRoles.map((parentRoleId, index) => {
      const role = Number(parentRoleId);

      const users = parentUsers[role] || [];

      const searchValue = parentSearch[role] || "";

      const isLoading = parentLoading[role] || false;

      const previousRoleId =
        visibleParentRoles[index - 1];

      const previousSelectedId =
        previousRoleId
          ? selectedParents[previousRoleId]
          : null;

      const apiParentId =
        previousSelectedId || null;

      return (
        <div
          key={role}
          className="space-y-1.5"
        >
          {/* ROLE LABEL */}
          <label className="text-sm font-medium text-slate-700">
            {getRoleName(role)}

            {/* <span className="text-red-500 ml-1">
              *
            </span> */}
          </label>

          {/* CUSTOM DROPDOWN */}
          <div className="relative">
            {/* DROPDOWN BUTTON */}
          <button
  type="button"
  disabled={index > 0 && !previousSelectedId}
  onClick={() => {
    if (index > 0 && !previousSelectedId) {
      return;
    }

    setOpenDropdown((prev) =>
      prev === role ? null : role
    );

    // First time dropdown open hone par users load karo
    if (
      openDropdown !== role &&
      (!parentUsers[role] ||
        parentUsers[role].length === 0)
    ) {
      loadParentDropdown(
        role,
        apiParentId,
        parentSearch[role] || ""
      );
    }
  }}
  className={`
    w-full
    flex
    items-center
    justify-between
    border
    border-slate-300
    rounded-lg
    px-4
    py-2.5
    text-sm
    text-left
    bg-white
    focus:outline-none
    focus:ring-2
    focus:ring-blue-500
    ${
      index > 0 && !previousSelectedId
        ? "bg-slate-50 text-slate-400 cursor-not-allowed"
        : "text-slate-700 cursor-pointer"
    }
  `}
>
  <span
    className={
      selectedParents[role]
        ? "text-slate-700"
        : "text-slate-400"
    }
  >
    {selectedParents[role]
      ? users.find(
          (user) =>
            Number(user.id) ===
            Number(selectedParents[role])
        )?.name || `Select ${getRoleName(role)}`
      : `Select ${getRoleName(role)}`}
  </span>

  <RiArrowDownSLine
    size={20}
    className={`transition-transform ${
      openDropdown === role
        ? "rotate-180"
        : ""
    }`}
  />
</button>

            {/* DROPDOWN PANEL */}
            {openDropdown === role && (
              <div
                className="
                  absolute
                  z-50
                  left-0
                  right-0
                  mt-1
                  bg-white
                  border
                  border-slate-200
                  rounded-lg
                  shadow-xl
                  overflow-hidden
                "
              >
                {/* SEARCH INSIDE DROPDOWN */}
                <div className="p-2 border-b border-slate-200">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchValue}
                      onChange={(e) =>
                        handleParentSearch(
                          role,
                          apiParentId,
                          e.target.value
                        )
                      }
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                      placeholder={`Search ${getRoleName(
                        role
                      )}...`}
                      autoFocus
                      className="
                        w-full
                        border
                        border-slate-300
                        rounded-md
                        px-3
                        py-2
                        pr-10
                        text-sm
                        focus:outline-none
                        focus:ring-2
                        focus:ring-blue-500
                      "
                    />

                    {isLoading && (
                      <div
                        className="
                          absolute
                          right-3
                          top-1/2
                          -translate-y-1/2
                        "
                      >
                        <div
                          className="
                            h-4
                            w-4
                            border-2
                            border-blue-500
                            border-t-transparent
                            rounded-full
                            animate-spin
                          "
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* USER LIST */}
                <div className="max-h-60 overflow-y-auto">
                  {/* CLEAR */}
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        handleParentChange(
                          role,
                          "",
                          index
                        );

                        setOpenDropdown(null);

                        setParentSearch(
                          (prev) => ({
                            ...prev,
                            [role]: "",
                          })
                        );
                      }}
                      className="
                        w-full
                        text-left
                        px-4
                        py-2.5
                        text-sm
                        text-slate-500
                        hover:bg-slate-50
                      "
                    >
                      Select {getRoleName(role)}
                    </button>
                  )}

                  {/* LOADING */}
                  {isLoading && (
                    <div
                      className="
                        flex
                        items-center
                        justify-center
                        gap-2
                        px-4
                        py-4
                        text-sm
                        text-blue-600
                      "
                    >
                      <div
                        className="
                          h-4
                          w-4
                          border-2
                          border-blue-500
                          border-t-transparent
                          rounded-full
                          animate-spin
                        "
                      />

                      Searching{" "}
                      {getRoleName(role)}...
                    </div>
                  )}

                  {/* USERS */}
                  {!isLoading &&
                    users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => {
                          handleParentChange(
                            role,
                            user.id,
                            index
                          );

                          setOpenDropdown(null);

                          setParentSearch(
                            (prev) => ({
                              ...prev,
                              [role]: "",
                            })
                          );
                        }}
                        className={`
                          w-full
                          text-left
                          px-4
                          py-2.5
                          text-sm
                          transition
                          ${
                            Number(
                              selectedParents[role]
                            ) ===
                            Number(user.id)
                              ? "bg-blue-50 text-blue-700 font-medium"
                              : "text-slate-700 hover:bg-slate-50"
                          }
                        `}
                      >
                        <div>
                          {user.name}
                        </div>

                        {user.email && (
                          <div className="text-xs text-slate-400 mt-0.5">
                            {user.email}
                          </div>
                        )}
                      </button>
                    ))}

                  {/* NO RESULT */}
                  {!isLoading &&
                    users.length === 0 && (
                      <div
                        className="
                          px-4
                          py-4
                          text-center
                          text-sm
                          text-slate-400
                        "
                      >
                        {searchValue.trim()
                          ? `No ${getRoleName(
                              role
                            )} found`
                          : `No ${getRoleName(
                              role
                            )} available`}
                      </div>
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
)}


          {/* ================================================= */}
          {/* MAIN USER DETAILS */}
          {/* ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">


            {/* ORGANIZATION */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Organization Name{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <input
                type="text"
                name="organization_name"
                placeholder="Enter organization name"
                value={
                  formData.organization_name
                }
                onChange={
                  handleChange
                }
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            {/* FULL NAME */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Full Name{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            {/* EMAIL */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Email Address{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <input
                type="email"
                name="email"
                placeholder="staff@example.com"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            {/* PHONE */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Phone Number{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={
                  formData.phone
                }
                onChange={(e) =>
                  setFormData(
                    (prev) => ({
                      ...prev,
                      phone:
                        e.target.value.replace(
                          /[^\d+\s]/g,
                          ""
                        ),
                    })
                  )
                }
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            {/* ADDRESS */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Company Address{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <input
                type="text"
                name="company_address"
                placeholder="Street, Building, Area"
                value={
                  formData.company_address
                }
                onChange={
                  handleChange
                }
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>


            {/* PASSWORD */}

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
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) =>
                        !prev
                    )
                  }
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >

                  {showPassword ? (
                    <RiEyeOffLine
                      size={20}
                    />
                  ) : (
                    <RiEyeLine
                      size={20}
                    />
                  )}

                </button>

              </div>

            </div>


            {/* CONFIRM PASSWORD */}

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
                  value={
                    formData.confirm_password
                  }
                  onChange={
                    handleChange
                  }
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) =>
                        !prev
                    )
                  }
                  className="absolute cursor-pointer right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600"
                >

                  {showConfirmPassword ? (
                    <RiEyeOffLine
                      size={20}
                    />
                  ) : (
                    <RiEyeLine
                      size={20}
                    />
                  )}

                </button>

              </div>

            </div>


            {/* COUNTRY */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Country{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <div className="relative">

                <select
                  name="country"
                  value={
                    formData.country
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >

                  <option value="">
                    Select Country
                  </option>

                  {countries.map(
                    (country) => (

                      <option
                        key={
                          country.isoCode
                        }
                        value={
                          country.isoCode
                        }
                      >
                        {country.name}
                      </option>

                    )
                  )}

                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />

              </div>

            </div>


            {/* STATE */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                State{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <div className="relative">

                <select
                  name="state"
                  value={
                    formData.state
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    !formData.country
                  }
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                >

                  <option value="">
                    Select State
                  </option>

                  {states.map(
                    (state) => (

                      <option
                        key={
                          state.isoCode
                        }
                        value={
                          state.isoCode
                        }
                      >
                        {state.name}
                      </option>

                    )
                  )}

                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />

              </div>

            </div>


            {/* CITY */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                City{" "}
                {/* <span className="text-red-500">
                  *
                </span> */}
              </label>

              <div className="relative">

                <select
                  name="city"
                  value={
                    formData.city
                  }
                  onChange={
                    handleChange
                  }
                  required
                  disabled={
                    !formData.state
                  }
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                >

                  <option value="">
                    Select City
                  </option>

                  {cities.map(
                    (city) => (

                      <option
                        key={
                          city.name
                        }
                        value={
                          city.name
                        }
                      >
                        {city.name}
                      </option>

                    )
                  )}

                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />

              </div>

            </div>

          </div>


          {/* ================================================= */}
          {/* RETAILER DEVICE PERMISSIONS */}
          {/* ================================================= */}

          {Number(
            formData.role_id
          ) === 6 && (

            <div className="mt-8">

              <h2 className="text-base font-semibold text-slate-700 mb-4">
                Retailer Device Permissions
              </h2>


              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">

                {[
                  {
                    label:
                      "New Device",
                    name:
                      "new_device",
                  },
                  {
                    label:
                      "Old Device",
                    name:
                      "old_device",
                  },
                  {
                    label:
                      "Supreme Device",
                    name:
                      "supreme_device",
                  },
                  {
                    label:
                      "Pro Star",
                    name:
                      "pro_star",
                  },
                  {
                    label:
                      "Lite",
                    name:
                      "lite",
                  },
                  {
                    label:
                      "Google TV",
                    name:
                      "google_tv",
                  },
                  {
                    label:
                      "Supreme Lock",
                    name:
                      "supreme_lock",
                  },
                ].map(
                  (item) => (

                    <label
                      key={
                        item.name
                      }
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border transition cursor-pointer ${
                        formData[
                          item.name
                        ] === 1
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-300 bg-white hover:border-blue-400"
                      }`}
                    >

                      <span className="text-sm font-medium text-slate-700">
                        {
                          item.label
                        }
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          formData[
                            item.name
                          ] === 1
                        }
                        onChange={(
                          e
                        ) =>
                          setFormData(
                            (
                              prev
                            ) => ({
                              ...prev,
                              [item.name]:
                                e.target
                                  .checked
                                  ? 1
                                  : 0,
                            })
                          )
                        }
                        className="h-5 w-5 accent-blue-600 cursor-pointer"
                      />

                    </label>

                  )
                )}

              </div>

            </div>

          )}


          {/* ================================================= */}
          {/* SUBMIT */}
          {/* ================================================= */}

  

<div className="mt-8 flex justify-end gap-3">

  {/* ROLE LIST */}

  {formData.role_id && (
    <Link
      href={`/dashboard?role=${Number(
        formData.role_id
      )}`}
      className="
        bg-gray-700
        text-white
        px-4
        py-2
        rounded-sm
        hover:bg-gray-800
        whitespace-nowrap
        flex
        items-center
        justify-center
      "
    >
      {getRoleName(
        formData.role_id
      )} List
    </Link>
  )}


  {/* UPDATE */}

  <button
    type="submit"
    className="
      bg-blue-400
      text-white
      font-medium
      px-8
      py-3
      rounded-lg
      shadow-md
      hover:shadow-lg
      transition-all
      duration-200
      active:scale-[0.98]
      cursor-pointer
    "
  >
    Update
  </button>

</div>

        </form>

      </div>

    </div>
  );
}