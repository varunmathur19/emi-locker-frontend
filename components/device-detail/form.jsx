"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { RiArrowDownSLine, RiSearchLine } from "react-icons/ri";

import {
  getKeySettings,
  getCountries,
  getDropdownUsers,
  getEnrollment,
  addDevice,
  getBrands,
  getRoles
} from "@/services/api";
// import { parsePhoneNumberFromString } from "libphonenumber-js";

import { getUserFromToken } from "@/utils/token";

// Constants
const initialFormData = {
  enrollment_type: "",
  serial_number: "",
  customer_name: "",
  phone_number: "",
  imei_1: "",
  imei_2: "",
  guarantor_name: "",
  guarantor_number: "",
  key_type: "",
  fl_version: "",
  brand_id: "",
};



const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LABEL_CLASS = "mb-2 block text-sm font-medium text-gray-700";

const FILE_INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium file:text-gray-700";

// Utility functions
const isIPhoneEnrollmentType = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .includes("iphone");

const isSupremeKeyEnrollmentType = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .includes("supremekey");

const getArrayFromResponse = (response, key) => {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.data?.data,
    response?.data?.[key],
    response?.data?.users,
    response?.data?.enrollments,
    response?.data?.settings,
    response?.data?.countries,
    response?.data?.brands,
    response?.data?.result,
    response?.users,
    response?.enrollments,
    response?.settings,
    response?.countries,
    response?.brands,
    response?.[key],
    response?.result,
    response?.data,
  ];

  return candidates.find(Array.isArray) || [];
};

const isActiveStatus = (status) =>
  status === true ||
  status === 1 ||
  ["1", "true", "active"].includes(
    String(status ?? "").trim().toLowerCase()
  );

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
  String(
    country?.country_name ??
      country?.name ??
      country?.country ??
      "Unknown"
  );

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

const getUserDisplayName = (user) =>
  user?.name ??
  user?.full_name ??
  user?.username ??
  `User ${getUserId(user) ?? ""}`;

// Searchable hierarchy dropdown
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
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>

      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((previous) => !previous);
          setSearch("");
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer"
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
        <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
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
            {filteredUsers.length ? (
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
                    className={`block w-full truncate px-4 py-2.5 text-left text-sm transition cursor-pointer hover:bg-blue-50 ${
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

// Searchable enrollment and key dropdown
function SearchableEnrollmentDropdown({
  id,
  name,
  label,
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  loading = false,
  required = true,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  const filteredOptions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return options;

    return options.filter((option) =>
      String(option.label).toLowerCase().includes(query)
    );
  }, [options, search]);

  const handleSelect = (option) => {
    onChange({
      target: {
        name: name || id,
        value: option.value,
      },
    });

    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative min-w-0">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <button
        id={id}
        type="button"
        disabled={disabled || loading}
        onClick={() => {
          setOpen((previous) => !previous);
          setSearch("");
        }}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer"
      >
        <span className="truncate">
          {loading
            ? `Loading ${label.toLowerCase()}...`
            : selectedOption?.label || placeholder}
        </span>

        <RiArrowDownSLine
          size={22}
          className={`shrink-0 text-slate-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && !loading && (
        <div className="absolute left-0 top-full z-[60] mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
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
                placeholder={`Search ${label.toLowerCase()}...`}
                autoFocus
                className="w-full rounded-md border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto py-1" role="listbox">
            {filteredOptions.length ? (
              filteredOptions.map((option) => {
                const isSelected =
                  String(option.value) === String(value);

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option)}
                    className={`block w-full truncate px-4 py-2.5 text-left text-sm transition cursor-pointer hover:bg-blue-50 ${
                      isSelected
                        ? "bg-blue-50 font-medium text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-4 text-center text-sm text-slate-400">
                {options.length
                  ? `No ${label.toLowerCase()} found`
                  : `No ${label.toLowerCase()} available`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Searchable country code dropdown
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

  const handleSelect = (country) => {
    onChange(getCountryId(country, countries.indexOf(country)));
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={loading || countries.length === 0}
        onClick={() => {
          setOpen((previous) => !previous);
          setSearch("");
        }}
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
            {filteredCountries.length ? (
              filteredCountries.map((country) => {
                const countryId = getCountryId(
                  country,
                  countries.indexOf(country)
                );

                const isSelected =
                  countryId === String(selectedCountryId);

                return (
                  <button
                    key={countryId}
                    type="button"
                    onClick={() => handleSelect(country)}
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

// Image upload component
function ImageUploadField({
  id,
  label,
  image,
  setImage,
  required = false,
}) {
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Image size must not exceed 2 MB.");
      event.target.value = "";
      return;
    }

    setImage(file);
  };

  const removeImage = () => {
    setImage(null);

    const input = document.getElementById(id);
    if (input) input.value = "";
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={id}
        name={id}
        type="file"
        accept="image/*"
        required={required && !image}
        onChange={handleImageChange}
        className={FILE_INPUT_CLASS}
      />

      <p className="mt-1 text-xs text-gray-400">
        Image file, maximum size 2 MB.
      </p>

      {image && previewUrl && (
        <div className="mt-2 flex min-w-0 items-center gap-3">
          <img
            src={previewUrl}
            alt={`${label} preview`}
            className={`h-14 w-14 shrink-0 rounded-lg border border-gray-200 p-1 ${
              id === "customerImage" ? "object-cover" : "object-contain"
            }`}
          />

          <div className="min-w-0">
            <p className="truncate text-xs text-gray-600">
              {image.name}
            </p>

            <button
              type="button"
              onClick={removeImage}
              className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
            >
              Remove image
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Device Detail Form
export default function DeviceDetailForm({ onCancel, onSuccess }) {
  const [brands, setBrands] = useState([]);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [roles, setRoles] = useState([]);
const [rolesLoading, setRolesLoading] = useState(true);

  const [brandImage, setBrandImage] = useState(null);
  const [customerImage, setCustomerImage] = useState(null);
  const [signatureImage, setSignatureImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState("");

  const [keySettings, setKeySettings] = useState([]);
  const [keySettingsLoading, setKeySettingsLoading] = useState(true);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [hierarchySelections, setHierarchySelections] = useState({});
  const [hierarchyUsers, setHierarchyUsers] = useState({});
  const [hierarchyLoading, setHierarchyLoading] = useState({});

const currentRoleId = Number(
  loggedInUser?.role_id ?? loggedInUser?.roleId
);

const currentUserId = Number(getUserId(loggedInUser));

const hierarchyRoles = useMemo(() => {
  if (!Number.isFinite(currentRoleId)) return [];

  return roles
    .filter((role) => {
      const roleId = Number(role.role_id ?? role.id);

      return roleId > currentRoleId && roleId <= 6;
    })
    .sort(
      (a, b) =>
        Number(a.role_id ?? a.id) - Number(b.role_id ?? b.id)
    )
    .map((role) => Number(role.role_id ?? role.id));
}, [roles, currentRoleId]);

const getRoleName = (roleId) => {
  const role = roles.find(
    (item) => Number(item.role_id ?? item.id) === Number(roleId)
  );

  return (
    role?.role_name ??
    role?.name ??
    role?.title ??
    `Role ${roleId}`
  );
};

  // Check Supreme Key enrollment
  const isSupremeKeyEnrollment = isSupremeKeyEnrollmentType(
    formData.enrollment_type
  );
  useEffect(() => {
  let isMounted = true;

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);

      const response = await getRoles();

      const list = getArrayFromResponse(response, "roles");

      if (isMounted) {
        setRoles(
          list.filter((role) =>
            isActiveStatus(role?.status ?? role?.is_active)
          )
        );
      }
    } catch (error) {
      console.error("GET ROLES ERROR:", error);

      if (isMounted) {
        setRoles([]);

        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load roles."
        );
      }
    } finally {
      if (isMounted) {
        setRolesLoading(false);
      }
    }
  };

  fetchRoles();

  return () => {
    isMounted = false;
  };
}, []);

  // Fetch brands only when Supreme Key is selected
  useEffect(() => {
    if (!isSupremeKeyEnrollment) {
      setBrands([]);
      setBrandsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchBrands = async () => {
      try {
        setBrandsLoading(true);

        const response = await getBrands();

        console.log("BRANDS API RESPONSE:", response);

        // Robust extraction of brands array
        const list = getArrayFromResponse(response, "brands");

        console.log("BRANDS LIST:", list);

        // Filter only active brands
        const activeBrands = list.filter((item) =>
          isActiveStatus(item?.is_active ?? item?.status)
        );

        console.log("ACTIVE BRANDS:", activeBrands);

        if (isMounted) {
          setBrands(activeBrands);
        }
      } catch (error) {
        console.error(
          "GET BRANDS ERROR:",
          error?.response?.data || error
        );

        if (isMounted) {
          setBrands([]);

          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to load brands."
          );
        }
      } finally {
        if (isMounted) {
          setBrandsLoading(false);
        }
      }
    };

    fetchBrands();

    return () => {
      isMounted = false;
    };
  }, [isSupremeKeyEnrollment]);

  // Brand dropdown options
  const brandOptions = useMemo(() => {
    return brands
      .map((item) => ({
        value: String(item?.brand_id ?? item?.id ?? ""),
        label: String(item?.brand_name ?? item?.name ?? ""),
      }))
      .filter((item) => item.value && item.label);
  }, [brands]);

  // Get logged-in user.
  useEffect(() => {
    try {
      const tokenUser = getUserFromToken?.() || {};
      const storedUser =
        typeof window !== "undefined"
          ? JSON.parse(localStorage.getItem("user") || "{}")
          : {};

      const user = {
        ...storedUser,
        ...tokenUser,
        id:
          tokenUser?.id ??
          tokenUser?.user_id ??
          storedUser?.id ??
          storedUser?.user_id,
        role_id:
          tokenUser?.role_id ??
          tokenUser?.roleId ??
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
        toast.error(
          "Unable to identify your login role. Please log in again."
        );
      }
    } catch (error) {
      console.error("Failed to read logged-in user:", error);
      toast.error("Unable to read login details.");
    }
  }, []);

  // Fetch active enrollment types.
  useEffect(() => {
    let isMounted = true;

    const fetchEnrollments = async () => {
      try {
        setEnrollmentsLoading(true);

        const response = await getEnrollment();
        const list = getArrayFromResponse(response, "enrollments");

        if (isMounted) {
          setEnrollments(
            list.filter((item) => isActiveStatus(item?.status))
          );
        }
      } catch (error) {
        console.error("GET ENROLLMENT ERROR:", error);

        if (isMounted) {
          setEnrollments([]);
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to load enrollment types."
          );
        }
      } finally {
        if (isMounted) setEnrollmentsLoading(false);
      }
    };

    fetchEnrollments();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch active key settings.
  useEffect(() => {
    let isMounted = true;

    const fetchKeySettings = async () => {
      try {
        setKeySettingsLoading(true);

        const response = await getKeySettings();
        const settings = getArrayFromResponse(response, "settings");

        if (isMounted) {
          setKeySettings(
            settings.filter((item) => isActiveStatus(item?.status))
          );
        }
      } catch (error) {
        console.error("Failed to fetch key settings:", error);

        if (isMounted) {
          setKeySettings([]);
          toast.error(
            error?.response?.data?.message || "Failed to load key types."
          );
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

  // Fetch countries and default to India.
  useEffect(() => {
    let isMounted = true;

    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);

        const response = await getCountries();
        const list = getArrayFromResponse(response, "countries");

        if (!isMounted) return;

        setCountries(list);

        const defaultCountry = list.find(isIndia) || list[0];

        if (defaultCountry) {
          setSelectedCountryId(
            getCountryId(defaultCountry, list.indexOf(defaultCountry))
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

  // Fetch hierarchy users.
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

        if (Number(roleId) === 6) {
          const uniqueUsers = new Map();

          [...existingUsers, ...users].forEach((user) => {
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

  // Load the first level of the hierarchy.
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
    hierarchyRoles,
    loadHierarchyUsers,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "enrollment_type" ? { brand_id: "" } : {}),
    }));
  };

  // Enrollment dropdown options.
  const enrollmentOptions = useMemo(
    () =>
      enrollments
        .map((item) => {
          const name =
            item?.name ??
            item?.enrollment_type ??
            item?.enrollment_name ??
            item?.title;

          if (name == null || !String(name).trim()) return null;

          return {
            value: String(name).trim(),
            label: String(name).trim(),
          };
        })
        .filter(Boolean),
    [enrollments]
  );

  const isIPhoneEnrollment = isIPhoneEnrollmentType(
    formData.enrollment_type
  );

  // Key type dropdown options.
  const keyTypeOptions = useMemo(
    () =>
      keySettings
        .map((item) => {
          const label =
            item?.name ??
            item?.key_name ??
            item?.key_type ??
            item?.title;

          if (label == null || !String(label).trim()) return null;

          const value =
            item?.id ?? item?.key_setting_id ?? String(label).trim();

          return {
            value: String(value).trim(),
            label: String(label).trim(),
          };
        })
        .filter(Boolean),
    [keySettings]
  );

  // Handle hierarchy selection.
  const handleHierarchyChange = async (roleId, selectedUserId) => {
    const selectedId = String(selectedUserId);
    const roleIndex = hierarchyRoles.indexOf(roleId);
    const childRoles = hierarchyRoles.slice(roleIndex + 1);

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

    setHierarchyUsers((previous) => {
      const updated = { ...previous };

      childRoles.forEach((childRole) => {
        delete updated[childRole];
      });

      return updated;
    });

    if (!selectedId) return;

    const nextRole = hierarchyRoles[roleIndex + 1];

    if (nextRole) {
      await loadHierarchyUsers(nextRole, selectedId);
    }

    if (roleId === 4) {
      await loadHierarchyUsers(6, selectedId);
    }
  };

  const selectedRetailerId =
    currentRoleId === 6
      ? currentUserId
      : Number(hierarchySelections[6]) || null;

  // Validate and submit the form.
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    const isIPhoneEnrollment = isIPhoneEnrollmentType(
      formData.enrollment_type
    );

    const isSupremeKeyEnrollment = isSupremeKeyEnrollmentType(
      formData.enrollment_type
    );

    const requiredFields = [
      ["enrollment_type", "Enrollment Type"],
      ["serial_number", "Serial Number"],
      ["customer_name", "Customer Name"],
      ["phone_number", "Phone Number"],
      ["imei_1", "IMEI 1"],
      ["key_type", "Key Type"],
      ["fl_version", "FL Version"],
    ];

    // IMEI 2 is required except for iPhone
    if (!isIPhoneEnrollment) {
      requiredFields.push(["imei_2", "IMEI 2"]);
    }

    // Required field validation
    for (const [field, label] of requiredFields) {
      if (!String(formData[field] ?? "").trim()) {
        toast.error(`${label} is required.`);
        return;
      }
    }

    // Brand is required only for Supreme Key
    if (isSupremeKeyEnrollment && !formData.brand_id) {
      toast.error("Please select a brand.");
      return;
    }

    // Brand image validation
    if (!brandImage) {
      toast.error("Brand image is required.");
      return;
    }

    // Signature image validation
    if (!signatureImage) {
      toast.error("Signature image is required.");
      return;
    }

    // IMEI 1 validation
    if (!/^\d{15}$/.test(String(formData.imei_1).trim())) {
      toast.error("IMEI 1 must contain exactly 15 numeric digits.");
      return;
    }

    // IMEI 2 validation (only when provided)
    if (
      String(formData.imei_2 ?? "").trim() &&
      !/^\d{15}$/.test(String(formData.imei_2).trim())
    ) {
      toast.error("IMEI 2 must contain exactly 15 numeric digits.");
      return;
    }

    // Phone number validation
    if (!/^\d+$/.test(String(formData.phone_number).trim())) {
      toast.error("Phone number must contain numeric digits only.");
      return;
    }

    // Retailer validation
    if (!selectedRetailerId) {
      toast.error("Please select a retailer.");
      return;
    }

    // Country validation
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

      // Append form fields
      Object.entries(formData).forEach(([key, value]) => {
        // Send brand_id only for Supreme Key
        if (key === "brand_id" && !isSupremeKeyEnrollment) {
          return;
        }

        payload.append(key, String(value ?? "").trim());
      });

      // Every new device starts with pending status
      payload.set("device_status", "pending");

      // Additional fields
      payload.append("country_code", countryCode);
      payload.append("retailer_id", String(selectedRetailerId));

      // Upload images
      payload.append("brandImage", brandImage);
      payload.append("signatureImage", signatureImage);

      if (customerImage) {
        payload.append("customerImage", customerImage);
      }

      // Add device API
      const result = await addDevice(payload);

      if (result?.success === false) {
        throw new Error(result.message || "Failed to add device.");
      }

      toast.success(result?.message || "Device added successfully.");

      // Reset form
      setFormData(initialFormData);
      setBrandImage(null);
      setCustomerImage(null);
      setSignatureImage(null);
      setHierarchySelections({});

      // Reset image inputs
      ["brandImage", "customerImage", "signatureImage"].forEach((id) => {
        const input = document.getElementById(id);
        if (input) input.value = "";
      });

      // Reset country to India
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
          {/* Header */}
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
                aria-hidden="true"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </button>

            <h1 className="text-2xl font-bold text-gray-900">Add Device</h1>

            <p className="mt-1 text-sm text-gray-500">
              Enter device details, upload the required images, and select its
              retailer.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            {/* Retailer hierarchy */}
            {hierarchyRoles.length > 0 && (
              <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-gray-900">
                    Retailer Assignment
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select the retailer under whom you want to register this
                    device.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {hierarchyRoles.map((roleId) => {
    const roleName = getRoleName(roleId);

    const users = hierarchyUsers[roleId] || [];
    const selectedValue = hierarchySelections[roleId] || "";
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

    let placeholder = `Select ${roleName}`;

    if (loadingRole) {
      placeholder = `Loading ${roleName}...`;
    } else if (!parentSelected) {
      placeholder = `Select ${getRoleName(parentRole)} first`;
    } else if (users.length === 0) {
      placeholder = `No ${roleName} found`;
    }

    return (
      <HierarchyDropdown
        key={roleId}
        id={`hierarchy_${roleId}`}
        label={roleName}
        users={users}
        value={selectedValue}
        placeholder={placeholder}
        loading={loadingRole}
        disabled={
          rolesLoading ||
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

            {/* Device details */}
            <section>
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Device Details
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <ImageUploadField
                  id="customerImage"
                  label="Customer Image"
                  image={customerImage}
                  setImage={setCustomerImage}
                />

                <ImageUploadField
                  id="brandImage"
                  label="Brand Image"
                  image={brandImage}
                  setImage={setBrandImage}
                  required
                />

                <SearchableEnrollmentDropdown
                  id="enrollment_type"
                  name="enrollment_type"
                  label="Enrollment Type"
                  value={formData.enrollment_type}
                  onChange={handleChange}
                  options={enrollmentOptions}
                  loading={enrollmentsLoading}
                  disabled={
                    enrollmentsLoading || enrollmentOptions.length === 0
                  }
                  placeholder={
                    enrollmentOptions.length
                      ? "Select enrollment type"
                      : "No active enrollment types available"
                  }
                  required
                />

                {/* Brand - Only visible for Supreme Key */}
                {isSupremeKeyEnrollment && (
                  <SearchableEnrollmentDropdown
                    id="brand_id"
                    name="brand_id"
                    label="Brand"
                    value={formData.brand_id}
                    onChange={handleChange}
                    options={brandOptions}
                    loading={brandsLoading}
                    disabled={brandsLoading || brandOptions.length === 0}
                    placeholder={
                      brandsLoading
                        ? "Loading brands..."
                        : brandOptions.length
                          ? "Select brand"
                          : "No active brands available"
                    }
                    required
                  />
                )}

                {/* Serial Number */}
                <div className="min-w-0">
                  <label htmlFor="serial_number" className={LABEL_CLASS}>
                    Serial Number
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="serial_number"
                    name="serial_number"
                    type="text"
                    value={formData.serial_number}
                    onChange={handleChange}
                    placeholder="Enter serial number"
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                {/* Customer Name */}
                <div className="min-w-0">
                  <label htmlFor="customer_name" className={LABEL_CLASS}>
                    Customer Name
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="customer_name"
                    name="customer_name"
                    type="text"
                    value={formData.customer_name}
                    onChange={handleChange}
                    placeholder="Enter customer name"
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                {/* Phone Number */}
                <div className="min-w-0">
                  <label htmlFor="phone_number" className={LABEL_CLASS}>
                    Phone Number
                    <span className="ml-1 text-red-500">*</span>
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

                {/* IMEI 1 */}
                <div className="min-w-0">
                  <label htmlFor="imei_1" className={LABEL_CLASS}>
                    IMEI 1
                    <span className="ml-1 text-red-500">*</span>
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
                    placeholder="Enter 15-digit IMEI 1"
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                {/* IMEI 2 */}
                <div className="min-w-0">
                  <div className="mb-2 flex items-center justify-between">
                    <label
                      htmlFor="imei_2"
                      className="text-sm font-medium text-gray-700"
                    >
                      IMEI 2
                      {!isIPhoneEnrollment && (
                        <span className="ml-1 text-red-500">*</span>
                      )}
                    </label>

                    {isIPhoneEnrollment && (
                      <span className="text-xs font-medium text-gray-500">
                        Optional
                      </span>
                    )}
                  </div>

                  <input
                    id="imei_2"
                    name="imei_2"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{15}"
                    maxLength={15}
                    value={formData.imei_2}
                    onChange={(event) => {
                      const value = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 15);

                      setFormData((previous) => ({
                        ...previous,
                        imei_2: value,
                      }));
                    }}
                    placeholder={
                      isIPhoneEnrollment
                        ? "Enter 15-digit IMEI 2 (Optional)"
                        : "Enter 15-digit IMEI 2"
                    }
                    className={INPUT_CLASS}
                    required={!isIPhoneEnrollment}
                  />
                </div>

                {/* Key Type */}
                <SearchableEnrollmentDropdown
                  id="key_type"
                  name="key_type"
                  label="Key Type"
                  value={formData.key_type}
                  onChange={handleChange}
                  options={keyTypeOptions}
                  loading={keySettingsLoading}
                  disabled={
                    keySettingsLoading || keyTypeOptions.length === 0
                  }
                  placeholder={
                    keyTypeOptions.length
                      ? "Select key type"
                      : "No active key types available"
                  }
                  required
                />

                <div className="min-w-0">
                  <label htmlFor="fl_version" className={LABEL_CLASS}>
                    FL Version
                    <span className="ml-1 text-red-500">*</span>
                  </label>

                  <input
                    id="fl_version"
                    name="fl_version"
                    type="text"
                    value={formData.fl_version}
                    onChange={handleChange}
                    placeholder="Enter FL version"
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                <div className="min-w-0">
                  <label htmlFor="guarantor_name" className={LABEL_CLASS}>
                    Guarantor Name
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    id="guarantor_name"
                    name="guarantor_name"
                    type="text"
                    value={formData.guarantor_name}
                    onChange={handleChange}
                    placeholder="Enter guarantor name"
                    className={INPUT_CLASS}
                  />
                </div>

                <div className="min-w-0">
                  <label htmlFor="guarantor_number" className={LABEL_CLASS}>
                    Guarantor Number
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      (Optional)
                    </span>
                  </label>

                  <input
                    id="guarantor_number"
                    name="guarantor_number"
                    type="tel"
                    inputMode="numeric"
                    value={formData.guarantor_number}
                    onChange={(event) => {
                      const value = event.target.value.replace(/\D/g, "");

                      setFormData((previous) => ({
                        ...previous,
                        guarantor_number: value,
                      }));
                    }}
                    placeholder="Enter guarantor number"
                    className={INPUT_CLASS}
                  />
                </div>

                <ImageUploadField
                  id="signatureImage"
                  label="Signature Image"
                  image={signatureImage}
                  setImage={setSignatureImage}
                  required
                />
              </div>
            </section>

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
                disabled={
                  loading ||
                  !selectedRetailerId ||
                  enrollmentsLoading ||
                  keySettingsLoading ||
                  enrollmentOptions.length === 0 ||
                  keyTypeOptions.length === 0
                }
                className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Processing..."
                  : isSupremeKeyEnrollment
                    ? "Check Eligibility"
                    : "Add Device"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}