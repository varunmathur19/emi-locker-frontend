"use client";

import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  RiArrowDownSLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";

import {
  updateStaffData,
  getStaffDataById,
  getDropdownUsers,
  getModules,
} from "@/services/api";

import { getUserFromToken } from "@/utils/token";
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
  parent_id: null,
  new_device: 0,
  old_device: 0,
  supreme_device: 0,
  pro_star: 0,
  lite: 0,
  google_tv: 0,
  supreme_lock: 0,
};

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

const devicePermissions = [
  { label: "New Device", name: "new_device" },
  { label: "Old Device", name: "old_device" },
  { label: "Supreme Device", name: "supreme_device" },
  { label: "Pro Star", name: "pro_star" },
  { label: "Lite", name: "lite" },
  { label: "Google TV", name: "google_tv" },
  { label: "Supreme Lock", name: "supreme_lock" },
];

export default function EditStaffPage() {
  const params = useParams();
  const userId = params.id;

  const [formData, setFormData] = useState(initialFormData);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loggedInRoleId, setLoggedInRoleId] = useState(null);

  const [openDropdown, setOpenDropdown] = useState(null);
  const [parentUsers, setParentUsers] = useState({});
  const [selectedParents, setSelectedParents] = useState({});
  const [parentSearch, setParentSearch] = useState({});
  const [parentLoading, setParentLoading] = useState({});
  const [modules, setModules] = useState([]);

  const searchTimers = useRef({});

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

  const getRoleName = (roleId) =>
    roles[Number(roleId)] || "Parent";

  const normalizeRoleName = (name) =>
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");

  const isRoleActive = (roleId) => {
    const role = Number(roleId);
    const roleName = normalizeRoleName(getRoleName(role));

    const module = modules.find((item) => {
      const moduleName =
        typeof item === "string" ? item : item?.name;

      const normalizedName = normalizeRoleName(moduleName);

      if (
        role === 3 &&
        ["superdistributor", "superdistributer"].includes(
          normalizedName
        )
      ) {
        return true;
      }

      return normalizedName === roleName;
    });

    return Number(module?.status) === 1;
  };

  
const visibleParentRoles = (() => {
  const currentRole = Number(formData.role_id);
  if (!currentRole) {
    return [];
  }

  const requiredParents = parentRoles[currentRole] || [];

  return requiredParents.filter((roleId) => {
    const role = Number(roleId);

    return isRoleActive(role);
  });
})();
  useEffect(() => {
    const user = getUserFromToken();

    if (user?.role_id != null) {
      setLoggedInRoleId(Number(user.role_id));
    }
  }, []);

  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await getModules();

        if (
          response?.success &&
          Array.isArray(response.modules)
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

  const loadParentDropdown = async (
    parentRoleId,
    parentId = null,
    search = "",
    selectedUser = null
  ) => {
    const roleId = Number(parentRoleId);

    setParentLoading((prev) => ({
      ...prev,
      [roleId]: true,
    }));

    try {
      const response = await getDropdownUsers(
        roleId,
        parentId,
        search
      );

      let users = [];

      if (Array.isArray(response?.data?.users)) {
        users = response.data.users;
      } else if (Array.isArray(response?.data)) {
        users = response.data;
      } else if (Array.isArray(response?.users)) {
        users = response.users;
      }

      if (
        selectedUser?.id &&
        !users.some(
          (user) =>
            Number(user.id) === Number(selectedUser.id)
        )
      ) {
        users = [selectedUser, ...users];
      }

      setParentUsers((prev) => ({
        ...prev,
        [roleId]: users,
      }));
    } catch (error) {
      console.error(
        `Dropdown API failed for role ${roleId}:`,
        error
      );

      setParentUsers((prev) => ({
        ...prev,
        [roleId]: selectedUser
          ? [selectedUser]
          : [],
      }));
    } finally {
      setParentLoading((prev) => ({
        ...prev,
        [roleId]: false,
      }));
    }
  };

  const loadEditParentHierarchy = async (
    roleId,
    parentChain = []
  ) => {
    const requiredParents = parentRoles[roleId] || [];

    if (!requiredParents.length) {
      setSelectedParents({});
      setParentUsers({});
      return;
    }

    const chainMap = new Map(
      parentChain.map((parent) => [
        Number(parent.role_id),
        parent,
      ])
    );

    const selected = {};

    requiredParents.forEach((parentRoleId) => {
      const parent = chainMap.get(Number(parentRoleId));

      if (parent?.id) {
        selected[Number(parentRoleId)] = Number(parent.id);
      }
    });

    setSelectedParents(selected);

    const usersByRole = {};

    let previousSelectedId = null;

    for (const parentRoleId of requiredParents) {
      const role = Number(parentRoleId);
      const selectedId = selected[role];

      const selectedUser = chainMap.get(role) || null;

      try {
        const response = await getDropdownUsers(
          role,
          previousSelectedId,
          ""
        );

        let users = [];

        if (Array.isArray(response?.data?.users)) {
          users = response.data.users;
        } else if (Array.isArray(response?.data)) {
          users = response.data;
        } else if (Array.isArray(response?.users)) {
          users = response.users;
        }

        if (
          selectedUser?.id &&
          !users.some(
            (user) =>
              Number(user.id) ===
              Number(selectedUser.id)
          )
        ) {
          users = [selectedUser, ...users];
        }

        usersByRole[role] = users;

        if (selectedId) {
          previousSelectedId = selectedId;
        }
      } catch (error) {
        console.error(
          `EDIT PARENT LOAD ERROR ROLE ${role}:`,
          error
        );

        usersByRole[role] = selectedUser
          ? [selectedUser]
          : [];

        if (selectedId) {
          previousSelectedId = selectedId;
        }
      }
    }

    setParentUsers(usersByRole);
  };

  const handleParentSearch = (
    parentRoleId,
    parentId,
    value
  ) => {
    const roleId = Number(parentRoleId);

    setParentSearch((prev) => ({
      ...prev,
      [roleId]: value,
    }));

    if (searchTimers.current[roleId]) {
      clearTimeout(searchTimers.current[roleId]);
    }

    searchTimers.current[roleId] = setTimeout(
      () => {
        loadParentDropdown(
          roleId,
          parentId,
          value.trim()
        );
      },
      value.trim() ? 400 : 200
    );
  };

  useEffect(() => {
    return () => {
      Object.values(searchTimers.current).forEach(
        clearTimeout
      );
    };
  }, []);

  const clearNextParentDropdowns = (parentRoleId) => {
    const index = visibleParentRoles.indexOf(
      Number(parentRoleId)
    );

    if (index === -1) {
      return;
    }

    const nextRoles =
      visibleParentRoles.slice(index + 1);

    setSelectedParents((prev) => {
      const updated = { ...prev };

      nextRoles.forEach((roleId) => {
        delete updated[roleId];
      });

      return updated;
    });

    setParentUsers((prev) => {
      const updated = { ...prev };

      nextRoles.forEach((roleId) => {
        delete updated[roleId];
      });

      return updated;
    });

    setParentSearch((prev) => {
      const updated = { ...prev };

      nextRoles.forEach((roleId) => {
        delete updated[roleId];
      });

      return updated;
    });
  };

  const handleParentChange = async (
    parentRoleId,
    value,
    index
  ) => {
    const roleId = Number(parentRoleId);
    const selectedId = value ? Number(value) : null;

    setSelectedParents((prev) => ({
      ...prev,
      [roleId]: selectedId,
    }));

    setFormData((prev) => ({
      ...prev,
      parent_id: selectedId,
    }));

    setParentSearch((prev) => ({
      ...prev,
      [roleId]: "",
    }));

    clearNextParentDropdowns(roleId);

    if (!selectedId) {
      return;
    }

    const nextRoleId =
      visibleParentRoles[index + 1];

    if (!nextRoleId) {
      return;
    }

    await loadParentDropdown(
      nextRoleId,
      selectedId,
      ""
    );
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchStaffData = async () => {
      try {
        const id = Number(userId);

        if (!Number.isInteger(id) || id <= 0) {
          toast.error("Invalid user ID");
          return;
        }

        const response = await getStaffDataById(id);

        if (!response?.success) {
          toast.error(
            response?.message ||
              "Failed to load staff data"
          );
          return;
        }

        const user = response?.data;

        if (!user) {
          toast.error("Staff data not found");
          return;
        }

        const roleId =
          user.role_id != null
            ? Number(user.role_id)
            : "";

        const parentId =
          user.parent_id != null
            ? Number(user.parent_id)
            : null;

        setFormData({
          organization_name:
            user.organization_name || "",
          role_id: roleId,
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          password: "",
          confirm_password: "",
          company_address:
            user.company_address || "",
          country: user.country || "",
          state: user.state || "",
          city: user.city || "",
          parent_id: parentId,
          new_device: Number(user.new_device || 0),
          old_device: Number(user.old_device || 0),
          supreme_device: Number(
            user.supreme_device || 0
          ),
          pro_star: Number(user.pro_star || 0),
          lite: Number(user.lite || 0),
          google_tv: Number(user.google_tv || 0),
          supreme_lock: Number(
            user.supreme_lock || 0
          ),
        });

        const parentChain =
          Array.isArray(user.parent_chain)
            ? user.parent_chain
            : [];

        await loadEditParentHierarchy(
          roleId,
          parentChain
        );
      } catch (error) {
        console.error("GET STAFF ERROR:", error);

        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load staff data"
        );
      }
    };

    fetchStaffData();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error("User ID not found");
      return;
    }

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
        id: Number(userId),
        role_id: Number(formData.role_id),
        parent_id: formData.parent_id
          ? Number(formData.parent_id)
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

      if (!payload.password) {
        delete payload.password;
        delete payload.confirm_password;
      }

      const response = await updateStaffData(
        Number(userId),
        payload
      );

      toast.success(
        response?.message ||
          "Staff updated successfully"
      );
    } catch (error) {
      console.error(
        "UPDATE STAFF ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update staff data"
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {visibleParentRoles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {visibleParentRoles.map(
              (parentRoleId, index) => {
                const role = Number(parentRoleId);

                const users =
                  parentUsers[role] || [];

                const searchValue =
                  parentSearch[role] || "";

                const isLoading =
                  parentLoading[role] || false;

                const previousRoleId =
                  visibleParentRoles[index - 1];

                const previousSelectedId =
                  previousRoleId
                    ? selectedParents[
                        previousRoleId
                      ]
                    : null;

                const apiParentId =
                  previousSelectedId || null;

                const isDisabled =
                  index > 0 &&
                  !previousSelectedId;

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
                        disabled={isDisabled}
                        onClick={() => {
                          if (isDisabled) return;

                          setOpenDropdown((prev) =>
                            prev === role
                              ? null
                              : role
                          );

                          if (
                            openDropdown !== role &&
                            !parentUsers[role]?.length
                          ) {
                            loadParentDropdown(
                              role,
                              apiParentId,
                              ""
                            );
                          }
                        }}
                        className={`w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDisabled
                            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "text-slate-700 cursor-pointer"
                        }`}
                      >
                        <span
                          className={
                            selectedUser
                              ? "text-slate-700"
                              : "text-slate-400"
                          }
                        >
                          {selectedUser?.name ||
                            `Select ${getRoleName(
                              role
                            )}`}
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

                      {openDropdown === role && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
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
                                className="w-full border border-slate-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              {isLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="max-h-60 overflow-y-auto">
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
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
                              >
                                Select{" "}
                                {getRoleName(role)}
                              </button>
                            )}

                            {isLoading && (
                              <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-blue-600">
                                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                Searching{" "}
                                {getRoleName(role)}...
                              </div>
                            )}

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

                            {!isLoading &&
                              users.length === 0 && (
                                <div className="px-4 py-4 text-center text-sm text-slate-400">
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
              }
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Organization Name
            </label>

            <input
              type="text"
              name="organization_name"
              placeholder="Enter organization name"
              value={formData.organization_name}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Full Name
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
              Email Address
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
              Phone Number
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
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Company Address
            </label>

            <input
              type="text"
              name="company_address"
              placeholder="Street, Building, Area"
              value={formData.company_address}
              onChange={handleChange}
              required
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (prev) => !prev
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 cursor-pointer"
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
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword(
                    (prev) => !prev
                  )
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 cursor-pointer"
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
              Country
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

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              State
            </label>

            <div className="relative">
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                disabled={!formData.country}
                className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
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
              City
            </label>

            <div className="relative">
              <select
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                disabled={!formData.state}
                className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
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

        {Number(formData.role_id) === 6 && (
          <div>
            <h2 className="text-base font-semibold text-slate-700 mb-3">
              Retailer Device Permissions
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {devicePermissions.map((item) => (
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
                          e.target.checked ? 1 : 0,
                      }))
                    }
                    className="h-5 w-5 accent-blue-600 cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {formData.role_id && (
            <Link
              href={`/dashboard?role=${Number(
                formData.role_id
              )}`}
              className="bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition"
            >
              {getRoleName(formData.role_id)} List
            </Link>
          )}

          <button
            type="submit"
            className="bg-blue-500 text-white font-medium px-8 py-2.5 rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg transition cursor-pointer"
          >
            Update
          </button>
        </div>
      </form>
    </div>
  );
}