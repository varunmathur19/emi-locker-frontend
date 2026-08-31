"use client";

import { addStaff, getDropdownUsers, getModules } from "@/services/api";
import { getUserFromToken } from "@/utils/token";

import {
  RiEyeLine,
  RiEyeOffLine,
  RiArrowDownSLine,
} from "react-icons/ri";

import Link from "next/link";

import { Country, State, City } from "country-state-city";

import { useEffect, useState } from "react";

import { useSearchParams } from "next/navigation";

import { toast } from "react-toastify";

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

export default function Page() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState(initialFormData);

  const [parentUsers, setParentUsers] = useState({});

  const [selectedParents, setSelectedParents] = useState({});

  const [openDropdown, setOpenDropdown] = useState(null);

  const [parentSearch, setParentSearch] = useState({});

  const [searchLoading, setSearchLoading] = useState({});

  const [modules, setModules] = useState([]);

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedRole = Number(searchParams.get("role_id"));

  const loggedInUser = getUserFromToken();

  const loggedInRoleId = Number(loggedInUser?.role_id);

  const loggedInUserId = Number(loggedInUser?.id);

  const getRoleName = (roleId) => {
    const roles = {
      0: "Master Admin",
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

    return roles[Number(roleId)] || "User";
  };

  const parentRoles = {
    2: [1],
    3: [2],
    4: [2, 3],
    5: [2, 3, 4],
    6: [2, 3, 4, 5],
    7: [2, 3, 4, 5, 6],
    8: [2, 3, 4, 5, 6, 7],
    9: [1],
  };

  const normalizeRoleName = (name) => {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  };

  const isRoleActive = (roleId) => {
    const role = Number(roleId);

    const roleName = normalizeRoleName(getRoleName(role));

    const module = modules.find((item) => {
      const moduleName =
        typeof item === "string" ? item : item?.name;

      const normalizedModuleName = normalizeRoleName(moduleName);

      if (
        role === 3 &&
        (normalizedModuleName === "superdistributor" ||
          normalizedModuleName === "superdistributer")
      ) {
        return true;
      }

      return normalizedModuleName === roleName;
    });

    if (!module) {
      return false;
    }

    return Number(module?.status) === 1;
  };

  const visibleParentRoles = (parentRoles[selectedRole] || []).filter(
    (roleId) => {
      const role = Number(roleId);
      const loggedRole = Number(loggedInRoleId);
      const createRole = Number(selectedRole);

      if (!isRoleActive(role)) {
        return false;
      }

      if (loggedRole === 0) {
        return role < createRole;
      }

      return role > loggedRole && role < createRole;
    }
  );

  const getUsersFromResponse = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data?.users)) {
      return response.data.users;
    }

    if (Array.isArray(response?.users)) {
      return response.users;
    }

    return [];
  };

  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await getModules();

        if (
          response?.success &&
          Array.isArray(response?.modules)
        ) {
          setModules(response.modules);
        } else {
          setModules([]);
        }
      } catch (error) {
        console.error("GET MODULES ERROR:", error);
        setModules([]);
      }
    };

    loadModules();
  }, []);

  useEffect(() => {
    const roleId = searchParams.get("role_id");

    if (!roleId) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      role_id: Number(roleId),
      parent_id: null,
    }));

    setSelectedParents({});
    setParentUsers({});
    setParentSearch({});
    setOpenDropdown(null);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedRole || selectedRole <= 1) {
      return;
    }

    if (!loggedInUserId) {
      return;
    }

    const parents = visibleParentRoles;

    if (!parents.length) {
      return;
    }

    const firstParentRole = Number(parents[0]);

    const shouldUseLoggedInUser =
      firstParentRole === loggedInRoleId;

    const parentId = shouldUseLoggedInUser
      ? loggedInUserId
      : null;

    const loadFirstParent = async () => {
      try {
        const response = await getDropdownUsers(
          firstParentRole,
          parentId
        );

        const users = getUsersFromResponse(response);

        setParentUsers((prev) => ({
          ...prev,
          [firstParentRole]: users,
        }));
      } catch (error) {
        console.error(
          "INITIAL PARENT ERROR:",
          error?.response?.data || error
        );

        setParentUsers((prev) => ({
          ...prev,
          [firstParentRole]: [],
        }));
      }
    };

    loadFirstParent();
  }, [
    selectedRole,
    loggedInRoleId,
    loggedInUserId,
    modules,
  ]);

  const loadNextParentUsers = async (
    currentRoleId,
    selectedParentId,
    nextRoleId
  ) => {
    try {
      if (!selectedParentId || !nextRoleId) {
        return;
      }

      setSearchLoading((prev) => ({
        ...prev,
        [Number(nextRoleId)]: true,
      }));

      const response = await getDropdownUsers(
        Number(nextRoleId),
        Number(selectedParentId)
      );

      let users = getUsersFromResponse(response);

      if (Number(nextRoleId) === 5) {
        users = users.filter(
          (user) =>
            Number(user?.role_id) === 5 &&
            Number(user?.parent_id) ===
              Number(selectedParentId)
        );
      }

      setParentUsers((prev) => ({
        ...prev,
        [Number(nextRoleId)]: users,
      }));
    } catch (error) {
      console.error(
        `LOAD ${getRoleName(nextRoleId)} ERROR:`,
        error?.response?.data || error
      );

      setParentUsers((prev) => ({
        ...prev,
        [Number(nextRoleId)]: [],
      }));
    } finally {
      setSearchLoading((prev) => ({
        ...prev,
        [Number(nextRoleId)]: false,
      }));
    }
  };

  const handleParentChange = async (
    parentRoleId,
    parentId
  ) => {
    const roleId = Number(parentRoleId);

    const selectedId = parentId
      ? Number(parentId)
      : null;

    const parents = visibleParentRoles;

    const currentIndex = parents.indexOf(roleId);

    const updatedSelectedParents = {
      ...selectedParents,
    };

    if (selectedId) {
      updatedSelectedParents[roleId] = selectedId;
    } else {
      delete updatedSelectedParents[roleId];
    }

    parents
      .slice(currentIndex + 1)
      .forEach((childRoleId) => {
        delete updatedSelectedParents[
          Number(childRoleId)
        ];
      });

    setSelectedParents(updatedSelectedParents);

    setFormData((prev) => ({
      ...prev,
      parent_id: selectedId,
    }));

    const updatedParentUsers = {
      ...parentUsers,
    };

    parents
      .slice(currentIndex + 1)
      .forEach((childRoleId) => {
        updatedParentUsers[
          Number(childRoleId)
        ] = [];
      });

    setParentUsers(updatedParentUsers);

    const updatedSearch = {
      ...parentSearch,
    };

    parents
      .slice(currentIndex + 1)
      .forEach((childRoleId) => {
        updatedSearch[
          Number(childRoleId)
        ] = "";
      });

    setParentSearch(updatedSearch);

    if (!selectedId) {
      return;
    }

    const nextRole = parents[currentIndex + 1];

    if (!nextRole) {
      return;
    }

    await loadNextParentUsers(
      roleId,
      selectedId,
      Number(nextRole)
    );
  };

  useEffect(() => {
    if (
      openDropdown === null ||
      openDropdown === undefined
    ) {
      return;
    }

    const roleId = Number(openDropdown);

    const search = (
      parentSearch[roleId] || ""
    ).trim();

    const parents = parentRoles[selectedRole] || [];

    const currentIndex = parents.indexOf(roleId);

    let parentId = null;

    if (currentIndex > 0) {
      const previousRole = Number(
        parents[currentIndex - 1]
      );

      parentId = selectedParents[
        previousRole
      ]
        ? Number(
            selectedParents[previousRole]
          )
        : null;
    }

    if (currentIndex === 0) {
      if (
        Number(roleId) ===
        Number(loggedInRoleId)
      ) {
        parentId = loggedInUserId;
      } else {
        parentId = null;
      }
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading((prev) => ({
          ...prev,
          [roleId]: true,
        }));

        const response =
          await getDropdownUsers(
            roleId,
            parentId,
            search
          );

        let users =
          getUsersFromResponse(response);

        if (roleId === 5) {
          users = users.filter(
            (user) =>
              Number(user?.role_id) === 5 &&
              (parentId === null ||
                Number(user?.parent_id) ===
                  Number(parentId))
          );
        }

        setParentUsers((prev) => ({
          ...prev,
          [roleId]: users,
        }));
      } catch (error) {
        console.error(
          "DROPDOWN SEARCH ERROR:",
          error?.response?.data || error
        );

        setParentUsers((prev) => ({
          ...prev,
          [roleId]: [],
        }));
      } finally {
        setSearchLoading((prev) => ({
          ...prev,
          [roleId]: false,
        }));
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    openDropdown,
    parentSearch,
    selectedRole,
    selectedParents,
    loggedInRoleId,
    loggedInUserId,
  ]);

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

  const countries = Country.getAllCountries();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const roleId = Number(formData.role_id);

    if (!roleId) {
      toast.error(
        "Role ID missing. Please select role again"
      );
      return;
    }

    const tokenUser = getUserFromToken();

    if (!tokenUser?.id) {
      toast.error("Logged-in user not found");
      return;
    }

    if (
      formData.password !==
      formData.confirm_password
    ) {
      toast.error(
        "Password and Confirm Password do not match!"
      );
      return;
    }

    let finalParentId = formData.parent_id
      ? Number(formData.parent_id)
      : null;

    if (
      !finalParentId &&
      roleId > 1 &&
      loggedInRoleId > 0 &&
      loggedInRoleId < roleId
    ) {
      finalParentId = loggedInUserId;
    }

    const payload = {
      ...formData,
      role_id: roleId,
      parent_id: finalParentId,
    };

    console.log(
      "FINAL ADD STAFF PAYLOAD:",
      payload
    );

    try {
      const response = await addStaff(payload);

      toast.success(
        response?.message ||
          "Registered Successfully"
      );

      setFormData({
        ...initialFormData,
        role_id: roleId,
      });

      setSelectedParents({});
      setParentUsers({});
      setParentSearch({});
      setOpenDropdown(null);

      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Something went wrong"
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6">
        <div className="flex justify-between items-center">
          <Link
            href={`/dashboard?role=${selectedRole}`}
            className="bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-800 whitespace-nowrap"
          >
            {getRoleName(selectedRole)} List
          </Link>
        </div>

        {selectedRole > 1 &&
          visibleParentRoles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {visibleParentRoles.map(
                (parentRoleId) => {
                  const role = Number(parentRoleId);

                  const users =
                    parentUsers[role] || [];

                  const selectedUser =
                    users.find(
                      (user) =>
                        Number(user.id) ===
                        Number(
                          selectedParents[role]
                        )
                    );

                  return (
                    <div
                      key={role}
                      className="space-y-1.5"
                    >
                      <label className="text-sm font-medium text-slate-700">
                        {getRoleName(role)}
                      </label>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown ===
                                role
                                ? null
                                : role
                            )
                          }
                          className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 cursor-pointer"
                        >
                          <span className="truncate">
                            {selectedUser?.name ||
                              `Select ${getRoleName(
                                role
                              )}`}
                          </span>

                          <RiArrowDownSLine
                            size={22}
                            className={`shrink-0 transition-transform text-slate-500 ${
                              openDropdown ===
                              role
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        {openDropdown === role && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-2 border-b border-slate-200">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={
                                    parentSearch[
                                      role
                                    ] || ""
                                  }
                                  onChange={(e) =>
                                    setParentSearch(
                                      (prev) => ({
                                        ...prev,
                                        [role]:
                                          e.target
                                            .value,
                                      })
                                    )
                                  }
                                  onClick={(e) =>
                                    e.stopPropagation()
                                  }
                                  placeholder={`Search ${getRoleName(
                                    role
                                  )}...`}
                                  autoFocus
                                  className="w-full border border-slate-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {searchLoading[
                                  role
                                ] && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto">
                              {!searchLoading[
                                role
                              ] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleParentChange(
                                      role,
                                      null
                                    );

                                    setOpenDropdown(
                                      null
                                    );

                                    setParentSearch(
                                      (prev) => ({
                                        ...prev,
                                        [role]:
                                          "",
                                      })
                                    );
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
                                >
                                  Select{" "}
                                  {getRoleName(role)}
                                </button>
                              )}

                              {searchLoading[
                                role
                              ] && (
                                <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-blue-600">
                                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />

                                  Searching{" "}
                                  {getRoleName(role)}
                                  ...
                                </div>
                              )}

                              {!searchLoading[
                                role
                              ] &&
                                users.map((user) => (
                                  <button
                                    key={user.id}
                                    type="button"
                                    onClick={() => {
                                      handleParentChange(
                                        role,
                                        user.id
                                      );

                                      setOpenDropdown(
                                        null
                                      );

                                      setParentSearch(
                                        (prev) => ({
                                          ...prev,
                                          [role]:
                                            "",
                                        })
                                      );
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition ${
                                      Number(
                                        selectedParents[
                                          role
                                        ]
                                      ) ===
                                      Number(user.id)
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >
                                    {user.name}
                                  </button>
                                ))}

                              {!searchLoading[
                                role
                              ] &&
                                users.length ===
                                  0 && (
                                  <div className="px-4 py-4 text-center text-sm text-slate-400">
                                    {parentSearch[
                                      role
                                    ]?.trim()
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
                }
              )}
            </div>
          )}

        <form
          onSubmit={handleSubmit}
          className="pt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Organization Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="organization_name"
                placeholder="Enter organization name"
                value={
                  formData.organization_name
                }
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Full Name{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email Address{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="email"
                name="email"
                placeholder="staff@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Phone Number{" "}
                <span className="text-red-500">
                  *
                </span>
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
                pattern="^(\+91\s?)?[6-9]\d{9}$"
                title="Enter a valid Indian mobile number"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Company Address{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <input
                type="text"
                name="company_address"
                placeholder="Street, Building, Area"
                value={
                  formData.company_address
                }
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Password{" "}
                <span className="text-red-500">
                  *
                </span>
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
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showPassword ? (
                    <RiEyeOffLine size={20} />
                  ) : (
                    <RiEyeLine size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Confirm Password{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirm_password"
                  placeholder="Re-enter password"
                  value={
                    formData.confirm_password
                  }
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <RiEyeOffLine size={20} />
                  ) : (
                    <RiEyeLine size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Country{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer"
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                State{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={!formData.country}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                City{" "}
                <span className="text-red-500">
                  *
                </span>
              </label>

              <div className="relative">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!formData.state}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
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

            {Number(formData.role_id) === 6 && (
              <div className="md:col-span-3 space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">
                  Device Permissions
                </h3>

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
                          formData[item.name] ===
                          1
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
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="bg-blue-400 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}