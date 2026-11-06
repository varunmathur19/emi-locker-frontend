
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { RiArrowDownSLine, RiSearchLine } from "react-icons/ri";

import {
  getCountries,
  getDropdownUsers,
  getEnrollment,
  getRoles,
  addDevice,
} from "@/services/api";

import { getUserFromToken } from "@/utils/token";

const initialFormData = {
  enrollment_type: "",
  serial_number: "",
  customer_name: "",
  phone_number: "",
  imei_1: "",
  imei_2: "",
  guarantor_name: "",
  guarantor_number: "",
};

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const LABEL_CLASS = "mb-2 block text-sm font-medium text-gray-700";

const FILE_INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium file:text-gray-700";

const normalizeEnrollmentType = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const isSerialNumberEnrollmentType = (value) => {
  const type = normalizeEnrollmentType(value);
  return type.includes("iphone") || type.includes("googletv");
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

const getArrayFromResponse = (response, key) => {
  if (Array.isArray(response)) return response;

  const candidates = [
    response?.data?.data,
    response?.data?.[key],
    response?.data?.users,
    response?.data?.enrollments,
    response?.data?.countries,
    response?.data?.roles,
    response?.data?.result,
    response?.users,
    response?.enrollments,
    response?.countries,
    response?.roles,
    response?.[key],
    response?.result,
    response?.data,
  ];

  return candidates.find(Array.isArray) || [];
};

function SearchableDropdown({
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
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
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
                    className={`block w-full cursor-pointer truncate px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
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
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-left text-sm text-slate-700 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
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
                    className={`block w-full cursor-pointer truncate px-4 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
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
        className="flex h-[42px] cursor-pointer items-center gap-3 rounded-l-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
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
            className="h-14 w-14 shrink-0 rounded-lg border border-gray-200 object-contain p-1"
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

export default function DeviceDetailForm({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData);

  const [signatureImage, setSignatureImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState("");

  const [enrollments, setEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);

  const [loggedInUser, setLoggedInUser] = useState(null);

  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);

  const [hierarchySelections, setHierarchySelections] = useState({});
  const [hierarchyUsers, setHierarchyUsers] = useState({});
  const [hierarchyLoading, setHierarchyLoading] = useState({});

  const currentUserId = getUserId(loggedInUser);

  const currentRoleId = Number(
    loggedInUser?.role_id ?? loggedInUser?.roleId
  );

  const hierarchyRoles = useMemo(() => {
    if (!Number.isFinite(currentRoleId)) return [];

    return roles
      .filter((role) => {
        const roleId = Number(role.role_id ?? role.id);
        return roleId > currentRoleId && roleId <= 6;
      })
      .sort(
        (a, b) =>
          Number(a.role_id ?? a.id) -
          Number(b.role_id ?? b.id)
      )
      .map((role) => Number(role.role_id ?? role.id));
  }, [roles, currentRoleId]);

  const getRoleName = useCallback(
    (roleId) => {
      const role = roles.find(
        (item) =>
          Number(item.role_id ?? item.id) === Number(roleId)
      );

      return (
        role?.role_name ??
        role?.name ??
        role?.title ??
        `Role ${roleId}`
      );
    },
    [roles]
  );



  const selectedRetailerId =
    currentRoleId === 6
      ? currentUserId
      : hierarchySelections[6] || "";

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
        toast.error(
          "Unable to identify your login details. Please log in again."
        );
      }
    } catch (error) {
      console.error("Failed to read logged-in user:", error);
      toast.error("Unable to read login details.");
    }
  }, []);

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
        if (isMounted) setRolesLoading(false);
      }
    };

    fetchRoles();

    return () => {
      isMounted = false;
    };
  }, []);

  const loadHierarchyUsers = useCallback(
    async (roleId, parentId) => {
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
          "HIERARCHY API ERROR:",
          error?.response?.data || error
        );

        toast.error(
          error?.response?.data?.message ||
            `Failed to load ${getRoleName(roleId)} users.`
        );
      } finally {
        setHierarchyLoading((previous) => ({
          ...previous,
          [roleId]: false,
        }));
      }
    },
    [getRoleName]
  );

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
        console.error("GET COUNTRIES ERROR:", error);

        if (isMounted) {
          setCountries([]);

          toast.error(
            error?.response?.data?.message ||
              "Failed to load countries."
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

  const enrollmentOptions = useMemo(
    () =>
      enrollments
        .map((item) => {
          const id =
            item.id ?? item.enrollment_id ?? item.type_id;

          const name =
            item.name ??
            item.enrollment_type ??
            item.enrollment_name ??
            item.title;

          if (id == null || !name) return null;

          return {
            value: String(id),
            label: String(name).trim(),
          };
        })
        .filter(Boolean),
    [enrollments]
  );

  const selectedEnrollment = enrollmentOptions.find(
  (option) => String(option.value) === String(formData.enrollment_type)
);

const showSerialNumber = isSerialNumberEnrollmentType(
  selectedEnrollment?.label
);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

   const selectedEnrollment = enrollmentOptions.find(
  (option) => String(option.value) === String(formData.enrollment_type)
);

const isSerialNumber = isSerialNumberEnrollmentType(
  selectedEnrollment?.label
);

    const requiredFields = [
      ["enrollment_type", "Enrollment Type"],
      ["customer_name", "Customer Name"],
      ["phone_number", "Phone Number"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(formData[field] ?? "").trim()) {
        toast.error(`${label} is required.`);
        return;
      }
    }

    if (isSerialNumber) {
      if (!String(formData.serial_number ?? "").trim()) {
        toast.error("Serial Number is required.");
        return;
      }
    } else {
      if (!/^\d{15}$/.test(String(formData.imei_1 ?? "").trim())) {
        toast.error("IMEI 1 must contain exactly 15 numeric digits.");
        return;
      }

      if (
        String(formData.imei_2 ?? "").trim() &&
        !/^\d{15}$/.test(String(formData.imei_2).trim())
      ) {
        toast.error("IMEI 2 must contain exactly 15 numeric digits.");
        return;
      }
    }

    if (!signatureImage) {
      toast.error("Signature image is required.");
      return;
    }

    if (!/^\d+$/.test(String(formData.phone_number).trim())) {
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
        if (
          isSerialNumber &&
          (key === "imei_1" || key === "imei_2")
        ) {
          return;
        }

        if (!isSerialNumber && key === "serial_number") {
          return;
        }

        payload.append(key, String(value ?? "").trim());
      });

      payload.set("device_status", "pending");
      payload.append("country_code", countryCode);
      payload.append("retailer_id", String(selectedRetailerId));
      payload.append("signatureImage", signatureImage);

      const result = await addDevice(payload);

      if (result?.success === false) {
        throw new Error(result.message || "Failed to add device.");
      }

      toast.success(result?.message || "Device added successfully.");

      setFormData(initialFormData);
      setSignatureImage(null);
      setHierarchySelections({});

      const signatureInput = document.getElementById("signatureImage");

      if (signatureInput) {
        signatureInput.value = "";
      }

      const defaultCountry = countries.find(isIndia) || countries[0];

      if (defaultCountry) {
        setSelectedCountryId(
          getCountryId(defaultCountry, countries.indexOf(defaultCountry))
        );
      }

      onSuccess?.(result);
    } catch (error) {
      console.error(
        "ADD DEVICE ERROR:",
        error?.response?.data || error
      );

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
              Enter device details, upload the signature image, and
              select its retailer.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            autoComplete="off"
          >
            {hierarchyRoles.length > 0 && (
              <section className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 sm:p-5">
                <div className="mb-4">
                  <h2 className="text-base font-semibold text-gray-900">
                    Retailer Assignment
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Select the retailer under whom you want to register
                    this device.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {hierarchyRoles.map((roleId) => {
                    const roleName = getRoleName(roleId);
                    const users = hierarchyUsers[roleId] || [];
                    const selectedValue =
                      hierarchySelections[roleId] || "";
                    const loadingRole = Boolean(
                      hierarchyLoading[roleId]
                    );

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

            <section>
              <h2 className="mb-4 text-base font-semibold text-gray-900">
                Device Details
              </h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                <SearchableDropdown
                  id="enrollment_type"
                  name="enrollment_type"
                  label="Enrollment Type"
                  value={formData.enrollment_type}
                  onChange={handleChange}
                  options={enrollmentOptions}
                  loading={enrollmentsLoading}
                  disabled={
                    enrollmentsLoading ||
                    enrollmentOptions.length === 0
                  }
                  placeholder="Select enrollment type"
                  required
                />

                {showSerialNumber ? (
                  <div className="min-w-0">
                    <label
                      htmlFor="serial_number"
                      className={LABEL_CLASS}
                    >
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
                ) : (
                  <>
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
                        maxLength={15}
                        pattern="[0-9]{15}"
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

                    <div className="min-w-0">
                      <div className="mb-2 flex items-center justify-between">
                        <label
                          htmlFor="imei_2"
                          className="text-sm font-medium text-gray-700"
                        >
                          IMEI 2
                        </label>

                        <span className="text-xs font-medium text-gray-500">
                          Optional
                        </span>
                      </div>

                      <input
                        id="imei_2"
                        name="imei_2"
                        type="text"
                        inputMode="numeric"
                        maxLength={15}
                        pattern="[0-9]{15}"
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
                        placeholder="Enter 15-digit IMEI 2 (Optional)"
                        className={INPUT_CLASS}
                      />
                    </div>
                  </>
                )}

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

                <div className="min-w-0">
                  <label
                    htmlFor="guarantor_name"
                    className={LABEL_CLASS}
                  >
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
                  <label
                    htmlFor="guarantor_number"
                    className={LABEL_CLASS}
                  >
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
                  rolesLoading ||
                  (currentRoleId !== 6 && hierarchyRoles.length > 0 &&
                    !hierarchySelections[6]) ||
                  enrollmentsLoading ||
                  enrollmentOptions.length === 0
                }
                className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Processing..." : "Add Device"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
