"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  RiArrowDownSLine,
  RiSearchLine,
} from "react-icons/ri";

import {
  getKeySettings,
  getCountries,
  getDropdownUsers,
  addDevice,
} from "@/services/api";

import { getUserFromToken } from "@/utils/token";

const initialFormData = {
  enrollment_type: "",
  customer_name: "",
  phone_number: "",
  imei_1: "",
  key_type: "",
  device_status: "",
  fl_version: "",
};

const ROLE_NAMES = {
  0: "Master Admin",
  1: "Admin",
  2: "CNF",
  3: "Super Distributor",
  4: "Distributor",
  5: "FOS",
  6: "Retailer",
};

const ROLE_HIERARCHY = {
  0: [2, 3, 4, 5, 6],
  1: [2, 3, 4, 5, 6],
  2: [3, 4, 5, 6],
  3: [4, 5, 6],
  4: [5, 6],
  5: [6],
  6: [],
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

const fileInputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium file:text-gray-700";

const getArrayFromResponse = (response, key) => {
  if (Array.isArray(response)) return response;

  const values = [
    response?.data?.data,
    response?.data?.users,
    response?.data?.[key],
    response?.data?.result,
    response?.data,
    response?.users,
    response?.[key],
    response?.result,
  ];

  return values.find(Array.isArray) || [];
};

const getCountryDialCode = (country) => {
  const value =
    country?.mobile_code ??
    country?.phone_code ??
    country?.phonecode ??
    country?.dial_code ??
    country?.calling_code ??
    country?.phoneCode ??
    "";

  if (!String(value).trim()) return "";

  const code = String(value).trim().replace(/\s+/g, "");

  return code.startsWith("+") ? code : `+${code}`;
};

const getCountryId = (country, index = 0) =>
  String(
    country?.country_id ??
      country?.id ??
      country?.iso2 ??
      country?.iso_code ??
      country?.country_code ??
      index
  );

const getCountryName = (country) =>
  country?.country_name ?? country?.name ?? country?.country ?? "Unknown";

const getCountryIsoCode = (country) =>
  String(
    country?.country_code ??
      country?.isoCode ??
      country?.iso_code ??
      country?.iso2 ??
      ""
  )
    .trim()
    .toUpperCase();

const isIndia = (country) =>
  getCountryIsoCode(country) === "IN" ||
  getCountryName(country).toLowerCase() === "india";

const getUserId = (user) =>
  user?.id ?? user?.user_id ?? user?.userId ?? null;

// Name only — email and phone are intentionally excluded.
const getUserDisplayName = (user) =>
  user?.name ??
  user?.full_name ??
  user?.username ??
  `User ${getUserId(user) ?? ""}`;

function FormSelect({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  disabled = false,
  required = true,
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${inputClass} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-gray-100`}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <RiArrowDownSLine
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500"
        />
      </div>
    </div>
  );
}

/* Custom hierarchy dropdown */
function HierarchyDropdown({
  id,
  label,
  users = [],
  value,
  onChange,
  placeholder,
  disabled = false,
  loading = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedUser = users.find(
    (user) => String(getUserId(user)) === String(value)
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return users;

    return users.filter((user) =>
      getUserDisplayName(user).toLowerCase().includes(query)
    );
  }, [users, search]);

  const handleSelect = (user) => {
    onChange(String(getUserId(user)));
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative min-w-0">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((previous) => !previous)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span className="truncate">
          {loading
            ? `Loading ${label}...`
            : selectedUser
              ? getUserDisplayName(selectedUser)
              : placeholder}
        </span>

        <RiArrowDownSLine
          size={22}
          className={`shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-50 mt-1 w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {users.length > 5 && (
            <div className="border-b border-slate-100 p-2">
              <div className="relative">
                <RiSearchLine
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={`Search ${label}...`}
                  className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-52 overflow-y-auto py-1" role="listbox">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const userId = String(getUserId(user));
                const isSelected = userId === String(value);

                return (
                  <button
                    key={userId}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(user)}
                    className={`block w-full truncate px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                      isSelected
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {getUserDisplayName(user)}
                  </button>
                );
              })
            ) : (
              <p className="px-4 py-3 text-center text-sm text-slate-400">
                No users found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SearchableCountryDropdown({
  countries,
  selectedCountryId,
  onChange,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = useMemo(
    () =>
      countries.find(
        (country, index) =>
          getCountryId(country, index) === String(selectedCountryId)
      ),
    [countries, selectedCountryId]
  );

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return countries;

    return countries.filter(
      (country) =>
        getCountryName(country).toLowerCase().includes(query) ||
        getCountryIsoCode(country).toLowerCase().includes(query) ||
        getCountryDialCode(country).toLowerCase().includes(query)
    );
  }, [countries, search]);

  const handleSelect = (country, index) => {
    onChange(getCountryId(country, index));
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={loading || countries.length === 0}
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Select phone country code"
        aria-expanded={open}
        className="flex h-[42px] items-center gap-3 rounded-l-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selectedCountry?.emoji && (
            <span className="shrink-0 text-base">
              {selectedCountry.emoji}
            </span>
          )}

          <span className="truncate font-medium">
            {loading
              ? "Loading..."
              : selectedCountry
                ? getCountryDialCode(selectedCountry) || "Code"
                : "Code"}
          </span>
        </span>

        <RiArrowDownSLine
          size={18}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1 w-[290px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 p-2">
            <div className="relative">
              <RiSearchLine
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country or code..."
                autoFocus
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const originalIndex = countries.indexOf(country);
                const countryId = getCountryId(country, originalIndex);
                const isSelected =
                  countryId === String(selectedCountryId);

                return (
                  <button
                    key={countryId}
                    type="button"
                    onClick={() => handleSelect(country, originalIndex)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="shrink-0 text-lg">
                      {country.emoji || "🌐"}
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {getCountryName(country)}
                    </span>

                    <span className="shrink-0 text-gray-500">
                      {getCountryDialCode(country)}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-5 text-center text-sm text-gray-400">
                No country found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeviceDetailForm({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData);

  const [brandImage, setBrandImage] = useState(null);
  const [customerImage, setCustomerImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState("");

  const [keySettings, setKeySettings] = useState([]);
  const [keySettingsLoading, setKeySettingsLoading] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [hierarchySelections, setHierarchySelections] = useState({});
  const [hierarchyUsers, setHierarchyUsers] = useState({});
  const [hierarchyLoading, setHierarchyLoading] = useState({});

  const currentRoleId = Number(
    loggedInUser?.role_id ?? loggedInUser?.roleId
  );

  const currentUserId = Number(getUserId(loggedInUser));
  const hierarchyRoles = ROLE_HIERARCHY[currentRoleId] || [];

  // Logged-in user
  useEffect(() => {
    try {
      const userFromToken = getUserFromToken?.();

      let storedUser = {};

      if (typeof window !== "undefined") {
        storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      }

      const user = {
        ...storedUser,
        ...(userFromToken || {}),
        id:
          userFromToken?.id ??
          userFromToken?.user_id ??
          storedUser?.id ??
          storedUser?.user_id,
        role_id:
          userFromToken?.role_id ??
          userFromToken?.roleId ??
          storedUser?.role_id ??
          storedUser?.roleId,
      };

      if (
        getUserId(user) != null &&
        Number.isFinite(Number(user.role_id))
      ) {
        setLoggedInUser(user);
      } else {
        console.error("Unable to determine logged-in user or role.");
        toast.error("Unable to identify your login role. Please log in again.");
      }
    } catch (error) {
      console.error("Failed to read logged-in user:", error);
      toast.error("Unable to read login details.");
    }
  }, []);

  // Key settings
  useEffect(() => {
    let isMounted = true;

    const fetchKeySettings = async () => {
      try {
        setKeySettingsLoading(true);

        const response = await getKeySettings();
        const settings = getArrayFromResponse(response, "settings");

        const activeSettings = settings.filter((item) => {
          const status = item?.status;

          return (
            status === 1 ||
            status === true ||
            String(status).trim() === "1" ||
            String(status).trim().toLowerCase() === "true"
          );
        });

        if (isMounted) setKeySettings(activeSettings);
      } catch (error) {
        console.error("Failed to fetch key settings:", error);

        if (isMounted) {
          setKeySettings([]);
          toast.error("Failed to load key types.");
        }
      } finally {
        if (isMounted) setKeySettingsLoading(false);
      }
    };

    fetchKeySettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Countries
  useEffect(() => {
    let isMounted = true;

    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);

        const response = await getCountries();
        const countryList = getArrayFromResponse(response, "countries");

        if (!isMounted) return;

        setCountries(countryList);

        const defaultCountry =
          countryList.find(isIndia) || countryList[0];

        if (defaultCountry) {
          setSelectedCountryId(
            getCountryId(defaultCountry, countryList.indexOf(defaultCountry))
          );
        }
      } catch (error) {
        console.error("Failed to fetch countries:", error);

        if (isMounted) {
          setCountries([]);
          toast.error(
            error?.response?.data?.message || "Failed to load countries."
          );
        }
      } finally {
        if (isMounted) setCountriesLoading(false);
      }
    };

    fetchCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  // Load hierarchy users
const loadHierarchyUsers = useCallback(async (roleId, parentId) => {
  if (roleId == null) return;

  setHierarchyLoading((previous) => ({
    ...previous,
    [roleId]: true,
  }));

  try {
    const response = await getDropdownUsers(
      Number(roleId),
      parentId == null ? null : Number(parentId)
    );

    const users = getArrayFromResponse(response, "users").filter(
      (user) => getUserId(user) != null
    );

    setHierarchyUsers((previous) => {
      const existingUsers = previous[roleId] || [];

      // Retailers loaded directly under a Distributor must remain
      // available when retailers under a selected FOS are loaded.
      if (Number(roleId) === 6) {
        const mergedUsers = [...existingUsers, ...users];
        const uniqueUsers = new Map();

        mergedUsers.forEach((user) => {
          uniqueUsers.set(String(getUserId(user)), user);
        });

        return {
          ...previous,
          [roleId]: Array.from(uniqueUsers.values()),
        };
      }

      return {
        ...previous,
        [roleId]: users,
      };
    });
  } catch (error) {
    console.error(
      "Hierarchy API error:",
      error?.response?.data || error
    );

    toast.error(
      error?.response?.data?.message ||
        `Failed to load ${ROLE_NAMES[roleId]} users.`
    );
  } finally {
    setHierarchyLoading((previous) => ({
      ...previous,
      [roleId]: false,
    }));
  }
}, []);

  useEffect(() => {
    if (
      !loggedInUser ||
      !Number.isFinite(currentRoleId) ||
      !currentUserId ||
      hierarchyRoles.length === 0
    ) {
      return;
    }

    loadHierarchyUsers(hierarchyRoles[0], currentUserId);
  }, [
    loggedInUser,
    currentRoleId,
    currentUserId,
    loadHierarchyUsers,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event, setImage, label) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(`${label} must be an image.`);
      event.target.value = "";
      setImage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} must be smaller than 5 MB.`);
      event.target.value = "";
      setImage(null);
      return;
    }

    setImage(file);
  };

  const keyTypeOptions = useMemo(
    () =>
      keySettings
        .map((item) => {
          const label =
            item.name ??
            item.key_name ??
            item.key_type ??
            item.title;

          if (label == null || String(label).trim() === "") {
            return null;
          }

          return {
            value: String(label).trim(),
            label: String(label).trim(),
          };
        })
        .filter(Boolean),
    [keySettings]
  );

const handleHierarchyChange = async (roleId, selectedUserId) => {
  const selectedId = String(selectedUserId);
  const roleIndex = hierarchyRoles.indexOf(roleId);

  const childRoles = hierarchyRoles.slice(roleIndex + 1);

  // Update selected hierarchy and clear dependent selections.
  setHierarchySelections((previous) => {
    const updated = { ...previous };

    if (selectedId) {
      updated[roleId] = selectedId;
    } else {
      delete updated[roleId];
    }

    childRoles.forEach((childRole) => {
      delete updated[childRole];
    });

    return updated;
  });

  // Clear dependent dropdown data before loading new data.
  setHierarchyUsers((previous) => {
    const updated = { ...previous };

    childRoles.forEach((childRole) => {
      delete updated[childRole];
    });

    return updated;
  });

  if (!selectedId) return;

  const nextRole = hierarchyRoles[roleIndex + 1];

  // Load the next hierarchy role as usual.
  if (nextRole) {
    loadHierarchyUsers(nextRole, selectedId);
  }

  /*
   * Special case:
   * When a Distributor is selected, load both:
   * 1. FOS users created under that Distributor.
   * 2. Retailers created directly under that Distributor.
   */
  if (roleId === 4) {
    await loadHierarchyUsers(6, selectedId);
  }
};

  const selectedRetailerId =
    currentRoleId === 6
      ? currentUserId
      : Number(hierarchySelections[6]) || null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!brandImage) {
      toast.error("Brand image is required.");
      return;
    }

    const requiredFields = [
      ["enrollment_type", "Enrollment Type"],
      ["customer_name", "Customer Name"],
      ["phone_number", "Phone Number"],
      ["imei_1", "IMEI Number"],
      ["key_type", "Key Type"],
      ["device_status", "Device Status"],
      ["fl_version", "FL Version"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(formData[field] ?? "").trim()) {
        toast.error(`${label} is required.`);
        return;
      }
    }

    if (!/^\d{15}$/.test(formData.imei_1)) {
      toast.error("IMEI number must contain exactly 15 digits.");
      return;
    }

    if (!/^\d+$/.test(formData.phone_number.trim())) {
      toast.error("Phone number must contain numeric digits only.");
      return;
    }

    if (!selectedRetailerId) {
      toast.error("Please select a retailer.");
      return;
    }

    const selectedCountry = countries.find(
      (country, index) =>
        getCountryId(country, index) === String(selectedCountryId)
    );

    if (!selectedCountry) {
      toast.error("Please select a country code.");
      return;
    }

    const countryCode = getCountryDialCode(selectedCountry);

    if (!countryCode) {
      toast.error("Selected country has no calling code.");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, String(value).trim());
      });

      payload.append("country_code", countryCode);
      payload.append("retailer_id", String(selectedRetailerId));
      payload.append("brandImage", brandImage);

      if (customerImage) {
        payload.append("customerImage", customerImage);
      }

      const result = await addDevice(payload);

      if (result?.success === false) {
        throw new Error(result.message || "Failed to add device.");
      }

      toast.success(result?.message || "Device added successfully.");

      setFormData(initialFormData);
      setBrandImage(null);
      setCustomerImage(null);
      setHierarchySelections({});

      const brandInput = document.getElementById("brandImage");
      const customerInput = document.getElementById("customerImage");

      if (brandInput) brandInput.value = "";
      if (customerInput) customerInput.value = "";

      const defaultCountry = countries.find(isIndia) || countries[0];

      if (defaultCountry) {
        setSelectedCountryId(
          getCountryId(defaultCountry, countries.indexOf(defaultCountry))
        );
      }

      onSuccess?.(result);
    } catch (error) {
      console.error("Add device error:", error?.response?.data || error);

      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full">
        <div className="overflow-visible rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="relative mb-6 border-b border-gray-200 pb-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              title="Go Back"
              aria-label="Go Back"
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </button>

            <h1 className="text-2xl font-bold text-gray-900">
              Add Device
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enter the device details and select its retailer.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            {/* User hierarchy */}
            {hierarchyRoles.length > 0 && (
              <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
                <div className="mb-4">
  <h2 className="text-base font-semibold text-gray-900">
    Retailer Assignment
  </h2>

  <p className="mt-1 text-sm text-gray-500">
    Select the retailer under whom you want to register this device.
  </p>
</div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hierarchyRoles.map((roleId) => {
                    const users = hierarchyUsers[roleId] || [];
                    const selectedValue =
                      hierarchySelections[roleId] || "";
                    const loadingRole = Boolean(hierarchyLoading[roleId]);

                    const parentRoleIndex =
                      hierarchyRoles.indexOf(roleId) - 1;

                    const parentRole =
                      parentRoleIndex >= 0
                        ? hierarchyRoles[parentRoleIndex]
                        : null;

                   const directRetailersAvailable =
  roleId === 6 &&
  Number(currentRoleId) <= 4 &&
  Boolean(hierarchySelections[4]) &&
  users.length > 0;

const parentSelected =
  !parentRole ||
  Boolean(hierarchySelections[parentRole]) ||
  directRetailersAvailable;

                    let placeholder = `Select ${ROLE_NAMES[roleId]}`;

                    if (loadingRole) {
                      placeholder = `Loading ${ROLE_NAMES[roleId]}...`;
                    } else if (!parentSelected) {
                      placeholder = `Select ${ROLE_NAMES[parentRole]} first`;
                    } else if (users.length === 0) {
                      placeholder = `No ${ROLE_NAMES[roleId]} found`;
                    }

                    return (
                      <HierarchyDropdown
                        key={roleId}
                        id={`hierarchy_${roleId}`}
                        label={ROLE_NAMES[roleId]}
                        users={users}
                        value={selectedValue}
                        placeholder={placeholder}
                        loading={loadingRole}
                        disabled={
                          loadingRole ||
                          !parentSelected ||
                          users.length === 0
                        }
                        onChange={(selectedUserId) =>
                          handleHierarchyChange(roleId, selectedUserId)
                        }
                      />
                    );
                  })}
                </div>

             
              </section>
            )}

            {currentRoleId === 6 && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                You are logged in as a Retailer. The device will be associated
                with your retailer account.
              </div>
            )}

            {/* Device details */}
            <section>
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Device Details
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <div className="min-w-0">
                  <label htmlFor="brandImage" className={labelClass}>
                    Brand Image <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="brandImage"
                    name="brandImage"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(event) =>
                      handleImageChange(event, setBrandImage, "Brand image")
                    }
                    className={fileInputClass}
                  />

                  {brandImage && (
                    <div className="mt-2 flex items-center gap-3">
                      <img
                        src={URL.createObjectURL(brandImage)}
                        alt="Brand preview"
                        className="h-14 w-14 rounded-lg border border-gray-200 object-contain p-1"
                      />

                      <div className="min-w-0">
                        <p className="truncate text-xs text-gray-600">
                          {brandImage.name}
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setBrandImage(null);
                            const input =
                              document.getElementById("brandImage");
                            if (input) input.value = "";
                          }}
                          className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remove image
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="mt-1 text-xs text-gray-500">
                    Image only, maximum size 5 MB.
                  </p>
                </div>

                <FormSelect
                  id="enrollment_type"
                  name="enrollment_type"
                  label="Enrollment Type"
                  value={formData.enrollment_type}
                  onChange={handleChange}
                  placeholder="Select enrollment type"
                  options={[
                    { value: "old", label: "Old" },
                    { value: "new", label: "New" },
                  ]}
                />

                <div className="min-w-0">
                  <label htmlFor="customer_name" className={labelClass}>
                    Customer Name
                  </label>

                  <input
                    id="customer_name"
                    name="customer_name"
                    type="text"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className={inputClass}
                    required
                  />
                </div>

                <div className="min-w-0">
                  <label htmlFor="phone_number" className={labelClass}>
                    Phone Number <span className="text-red-500">*</span>
                  </label>

                  <div className="flex w-full">
                    <SearchableCountryDropdown
                      countries={countries}
                      selectedCountryId={selectedCountryId}
                      loading={countriesLoading}
                      onChange={setSelectedCountryId}
                    />

                    <input
                      id="phone_number"
                      name="phone_number"
                      type="tel"
                      inputMode="numeric"
                      value={formData.phone_number}
                      onChange={(event) => {
                        const value = event.target.value.replace(/\D/g, "");

                        setFormData((previous) => ({
                          ...previous,
                          phone_number: value,
                        }));
                      }}
                      placeholder="Enter phone number"
                      className="h-[42px] min-w-0 flex-1 rounded-r-lg border border-l-0 border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      required
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <label htmlFor="imei_1" className={labelClass}>
                    IMEI Number
                  </label>

                  <input
                    id="imei_1"
                    name="imei_1"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{15}"
                    maxLength={15}
                    value={formData.imei_1}
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 15);

                      setFormData((previous) => ({
                        ...previous,
                        imei_1: value,
                      }));
                    }}
                    placeholder="Enter 15-digit IMEI number"
                    className={inputClass}
                    required
                  />
                </div>

                <FormSelect
                  id="key_type"
                  name="key_type"
                  label="Key Type"
                  value={formData.key_type}
                  onChange={handleChange}
                  placeholder={
                    keySettingsLoading
                      ? "Loading key types..."
                      : keyTypeOptions.length
                        ? "Select key type"
                        : "No active key types available"
                  }
                  options={keyTypeOptions}
                  disabled={
                    keySettingsLoading || keyTypeOptions.length === 0
                  }
                />

                <FormSelect
                  id="device_status"
                  name="device_status"
                  label="Device Status"
                  value={formData.device_status}
                  onChange={handleChange}
                  placeholder="Select device status"
                  options={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "locked", label: "Locked" },
                    { value: "unlocked", label: "Unlocked" },
                  ]}
                />

                <div className="min-w-0">
                  <label htmlFor="fl_version" className={labelClass}>
                    FL Version
                  </label>

                  <input
                    id="fl_version"
                    name="fl_version"
                    type="text"
                    value={formData.fl_version}
                    onChange={handleChange}
                    placeholder="Enter FL version"
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </section>

            {/* Customer image */}
            <section>
              <label htmlFor="customerImage" className={labelClass}>
                Customer Image
              </label>

              <input
                id="customerImage"
                name="customerImage"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleImageChange(event, setCustomerImage, "Customer image")
                }
                className={fileInputClass}
              />

              {customerImage && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(customerImage)}
                    alt="Customer preview"
                    className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-xs text-gray-600">
                      {customerImage.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomerImage(null);
                        const input =
                          document.getElementById("customerImage");
                        if (input) input.value = "";
                      }}
                      className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove image
                    </button>
                  </div>
                </div>
              )}
            </section>

            {/* Form actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="cursor-pointer rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !selectedRetailerId}
                className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Device"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}