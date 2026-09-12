"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  RiFilterLine,
  RiEditLine,
  RiLoginBoxLine,
  RiArrowDownSLine,
  RiSearchLine,
} from "react-icons/ri";

import { toast } from "react-toastify";

import {
  loginAsUser,
  updateUserStatus,
  getAllStaffData,
} from "@/services/api";

import { saveToken, saveUser, getRoleId } from "@/utils/token";

import {
  Country,
  State,
  City,
} from "country-state-city";

export default function UsersTable({
  users = [],
  page = 1,
  pagination = {},
  setPage,
  getRoleName,
  selectedRole,
  handleRoleList,
  onSearch,
}) {
  const router = useRouter();

  /* =====================================================
     STATE
  ===================================================== */

  const [search, setSearch] = useState("");

  const [filterSearch, setFilterSearch] =
    useState("");

  const [filterSearchResults, setFilterSearchResults] =
    useState([]);

  const [filterSearchApplied, setFilterSearchApplied] =
    useState(false);

  const [loginLoading, setLoginLoading] =
    useState(null);

  const [statusLoading, setStatusLoading] =
    useState(null);

  const [filterOpen, setFilterOpen] =
    useState(false);

  const [searchSuggestions, setSearchSuggestions] =
    useState([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [searchLoading, setSearchLoading] =
    useState(false);

  const [searchResults, setSearchResults] =
    useState([]);

  const [searchApplied, setSearchApplied] =
    useState(false);

  const [staffPermissions, setStaffPermissions] =
    useState(null);

  const [currentRoleId, setCurrentRoleId] =
    useState(null);

  const [filters, setFilters] = useState({
    country: "",
    state: "",
    city: "",
    status: "",
  });

  /* =====================================================
     ROLE MAP
  ===================================================== */

  const roleMap = {
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

  const roleSlugMap = {
    0: "master-admin",
    1: "admin",
    2: "cnf",
    3: "super-distributor",
    4: "distributor",
    5: "fos",
    6: "retailer",
    7: "sub-retailer",
    8: "employee",
    9: "staff",
  };

  const roleButtons = {
    1: "Add Admin",
    2: "Add CNF",
    3: "Add Super Distributor",
    4: "Add Distributor",
    5: "Add FOS",
    6: "Add Retailer",
    7: "Add Sub Retailer",
    8: "Add Employee",
    9: "Add Staff",
  };

  /* =====================================================
     CURRENT ROLE + SELECTED ROLE
  ===================================================== */

  const selectedRoleId = Number(
    selectedRole
  );

  const selectedRoleName =
    roleMap[selectedRoleId] ||
    getRoleName?.(selectedRoleId) ||
    "Unknown";

  const selectedRoleSlug =
    roleSlugMap[selectedRoleId] || "";

  /* =====================================================
     LOAD STAFF PERMISSIONS
  ===================================================== */

  useEffect(() => {
    const loadPermissions = () => {
      try {
        const roleId = Number(
          getRoleId()
        );

        setCurrentRoleId(roleId);

        /*
         * Only Staff needs permission based UI.
         */
        if (roleId !== 9) {
          setStaffPermissions(null);
          return;
        }

        /*
         * First priority:
         * staff_permissions
         */
        const savedPermissions =
          localStorage.getItem(
            "staff_permissions"
          );

        if (savedPermissions) {
          const parsed =
            JSON.parse(savedPermissions);

          if (
            parsed &&
            typeof parsed === "object"
          ) {
            setStaffPermissions(parsed);
            return;
          }
        }

        /*
         * Fallback:
         * user.role_permission.permission
         */
        const savedUser =
          localStorage.getItem("user");

        if (!savedUser) {
          setStaffPermissions(null);
          return;
        }

        const user =
          JSON.parse(savedUser);

        const permission =
          user?.role_permission
            ?.permission || null;

        if (
          permission &&
          typeof permission === "object"
        ) {
          setStaffPermissions(
            permission
          );

          localStorage.setItem(
            "staff_permissions",
            JSON.stringify(permission)
          );

          return;
        }

        setStaffPermissions(null);
      } catch (error) {
        console.error(
          "LOAD STAFF PERMISSIONS ERROR:",
          error
        );

        setStaffPermissions(null);
      }
    };

    loadPermissions();

    const handleStorage = (event) => {
      if (
        event.key ===
          "staff_permissions" ||
        event.key === "user"
      ) {
        loadPermissions();
      }
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =====================================================
     PERMISSION VALUE
  ===================================================== */

  const isPermissionEnabled = (
    value
  ) => {
    if (
      value === undefined ||
      value === null
    ) {
      return false;
    }

    if (typeof value === "boolean") {
      return value;
    }

    if (typeof value === "number") {
      return value === 1;
    }

    if (typeof value === "string") {
      return (
        value === "1" ||
        value.toLowerCase() === "true"
      );
    }

    if (
      typeof value === "object"
    ) {
      if (
        value.status !== undefined
      ) {
        return (
          Number(value.status) === 1
        );
      }

      if (
        value.access !== undefined
      ) {
        return (
          Number(value.access) === 1
        );
      }

      if (
        value.view !== undefined
      ) {
        return (
          Number(value.view) === 1
        );
      }

      return true;
    }

    return false;
  };

  /* =====================================================
     CHECK PERMISSION
  ===================================================== */

  const hasPermission = (
    slug,
    action = null
  ) => {
    /*
     * Non Staff:
     * normal hierarchy access.
     */
    if (Number(currentRoleId) !== 9) {
      return true;
    }

    if (!staffPermissions) {
      return false;
    }

    const cleanSlug = String(
      slug || ""
    )
      .trim()
      .toLowerCase();

    if (!cleanSlug) {
      return false;
    }

    /*
     * Exact action:
     *
     * cnf.add
     * cnf.edit
     * cnf.login
     * cnf.status
     */
    if (action) {
      const actionKey =
        `${cleanSlug}.${action}`;

      if (
        staffPermissions[
          actionKey
        ] !== undefined
      ) {
        return isPermissionEnabled(
          staffPermissions[
            actionKey
          ]
        );
      }
    }

    /*
     * Direct module/role permission:
     *
     * cnf: 1
     */
    if (
      staffPermissions[
        cleanSlug
      ] !== undefined
    ) {
      return isPermissionEnabled(
        staffPermissions[
          cleanSlug
        ]
      );
    }

    /*
     * If any permission exists:
     *
     * cnf.add
     * cnf.edit
     * cnf.delete
     *
     * then role itself is accessible.
     */
    const matchingKeys =
      Object.keys(
        staffPermissions
      ).filter((key) => {
        const cleanKey =
          String(key)
            .trim()
            .toLowerCase();

        return (
          cleanKey === cleanSlug ||
          cleanKey.startsWith(
            `${cleanSlug}.`
          )
        );
      });

    return matchingKeys.some(
      (key) =>
        isPermissionEnabled(
          staffPermissions[key]
        )
    );
  };

  /* =====================================================
     SELECTED ROLE ACCESS
  ===================================================== */

  const canViewSelectedRole =
    hasPermission(
      selectedRoleSlug
    );

  const canAddSelectedRole =
    hasPermission(
      selectedRoleSlug,
      "add"
    );

  const canEditSelectedRole =
    hasPermission(
      selectedRoleSlug,
      "edit"
    );

  const canLoginSelectedRole =
    hasPermission(
      selectedRoleSlug,
      "login"
    );

  const canChangeStatus =
    hasPermission(
      selectedRoleSlug,
      "status"
    );

  /*
   * If explicit view permission exists,
   * respect it.
   *
   * Otherwise role/add/edit/login/status
   * permission itself gives access.
   */
  const hasExplicitViewPermission =
    Number(currentRoleId) === 9 &&
    staffPermissions &&
    Object.prototype.hasOwnProperty.call(
      staffPermissions,
      `${selectedRoleSlug}.view`
    );

  const canViewRole =
    Number(currentRoleId) !== 9
      ? true
      : hasExplicitViewPermission
      ? isPermissionEnabled(
          staffPermissions[
            `${selectedRoleSlug}.view`
          ]
        )
      : canViewSelectedRole;

  /* =====================================================
     SEARCH LIMIT
  ===================================================== */

  const getSearchLimit = () => {
    const total =
      Number(pagination?.total) ||
      Number(
        pagination?.totalRecords
      ) ||
      Number(pagination?.count) ||
      0;

    return total > 0
      ? total
      : 10000;
  };

  /* =====================================================
     FILTER CHANGE
  ===================================================== */

  const handleFilterChange = async (
    field,
    value
  ) => {
    setFilters((previous) => {
      const updatedFilters = {
        ...previous,
        [field]: value,
      };

      if (field === "country") {
        updatedFilters.state = "";
        updatedFilters.city = "";
      }

      if (field === "state") {
        updatedFilters.city = "";
      }

      return updatedFilters;
    });

    setFilterSearchResults([]);
    setFilterSearchApplied(false);
    setPage?.(1);

    if (field === "status") {
      try {
        setSearchLoading(true);

        const response =
          await getAllStaffData(
            1,
            getSearchLimit(),
            selectedRoleId || "",
            "",
            value
          );

        const data =
          Array.isArray(
            response?.data
          )
            ? response.data
            : [];

        setSearchResults(data);
        setSearchApplied(
          Boolean(value)
        );
      } catch (error) {
        console.error(
          "STATUS SEARCH ERROR:",
          error
        );

        setSearchResults([]);
        setSearchApplied(true);

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Status search failed"
        );
      } finally {
        setSearchLoading(false);
      }
    }
  };

  /* =====================================================
     COUNTRY / STATE / CITY
  ===================================================== */

  const countryOptions =
    Country.getAllCountries();

  const stateOptions = filters.country
    ? State.getStatesOfCountry(
        filters.country
      ).map((state) => ({
        ...state,
        countryCode:
          filters.country,
      }))
    : [];

  const cityOptions = (() => {
    if (!filters.state) {
      return [];
    }

    const stateParts =
      filters.state.split("-");

    const countryCode =
      stateParts[0];

    const stateCode =
      stateParts[1];

    if (
      !countryCode ||
      !stateCode
    ) {
      return [];
    }

    try {
      const cities =
        City.getCitiesOfState(
          countryCode.toUpperCase(),
          stateCode.toUpperCase()
        );

      return Array.isArray(cities)
        ? cities
        : [];
    } catch (error) {
      console.error(
        "CITY LOAD ERROR:",
        error
      );

      return [];
    }
  })();

  const selectedStateParts =
    filters.state
      ? filters.state.split("-")
      : [];

  const selectedCountryCode =
    selectedStateParts[0] || "";

  const selectedStateCode =
    selectedStateParts[1] || "";

  const selectedState =
    selectedCountryCode &&
    selectedStateCode
      ? State.getStateByCodeAndCountry(
          selectedStateCode.toUpperCase(),
          selectedCountryCode.toUpperCase()
        )
      : null;

  const selectedStateName =
    selectedState?.name
      ?.trim()
      .toLowerCase() || "";

  /* =====================================================
     FILTER SEARCH
  ===================================================== */

  useEffect(() => {
    const searchValue =
      filterSearch.trim();

    if (!searchValue) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);
      setFilterSearchResults([]);
      setFilterSearchApplied(false);
      return;
    }

    let cancelled = false;

    const timer = setTimeout(
      async () => {
        try {
          setSearchLoading(true);

          const response =
            await getAllStaffData(
              1,
              getSearchLimit(),
              selectedRoleId || "",
              searchValue
            );

          if (cancelled) {
            return;
          }

          const data =
            Array.isArray(
              response?.data
            )
              ? response.data
              : [];

          setSearchSuggestions(
            data
          );

          setShowSuggestions(true);
        } catch (error) {
          if (!cancelled) {
            console.error(
              "FILTER SEARCH ERROR:",
              error
            );

            setSearchSuggestions(
              []
            );

            setShowSuggestions(
              false
            );
          }
        } finally {
          if (!cancelled) {
            setSearchLoading(false);
          }
        }
      },
      400
    );

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    filterSearch,
    selectedRoleId,
    pagination?.total,
    pagination?.totalRecords,
    pagination?.count,
  ]);

  /* =====================================================
     SUGGESTION VALUE
  ===================================================== */

  const getSuggestionValue = (
    user
  ) => {
    const query =
      filterSearch
        .trim()
        .toLowerCase();

    const fields = [
      {
        value: user?.name,
        label: "Name",
      },
      {
        value:
          user?.organization_name,
        label: "Organization",
      },
      {
        value: user?.city,
        label: "City",
      },
      {
        value: user?.state,
        label: "State",
      },
      {
        value: user?.country,
        label: "Country",
      },
      {
        value: user?.phone,
        label: "Phone",
      },
    ];

    const matchedField =
      fields.find(
        (field) =>
          field.value &&
          String(field.value)
            .toLowerCase()
            .includes(query)
      );

    if (matchedField) {
      return matchedField;
    }

    return {
      value:
        user?.name ||
        user?.organization_name ||
        user?.city ||
        user?.state ||
        user?.phone ||
        "",
      label: "User",
    };
  };

  /* =====================================================
     SUGGESTION CLICK
  ===================================================== */

  const handleSuggestionClick = (
    user
  ) => {
    const suggestion =
      getSuggestionValue(user);

    const selectedValue =
      String(
        suggestion?.value || ""
      ).trim();

    if (!selectedValue) {
      return;
    }

    setFilterSearch(
      selectedValue
    );

    setShowSuggestions(false);
    setSearchSuggestions([]);

    setFilterSearchResults([
      user,
    ]);

    setFilterSearchApplied(true);
    setPage?.(1);
  };

  /* =====================================================
     CLEAR FILTER
  ===================================================== */

  const clearFilters = () => {
    setFilters({
      country: "",
      state: "",
      city: "",
      status: "",
    });

    setFilterSearch("");
    setFilterSearchResults([]);
    setFilterSearchApplied(false);

    setSearchSuggestions([]);
    setShowSuggestions(false);

    setSearchResults([]);
    setSearchApplied(false);

    setPage?.(1);
  };

  /* =====================================================
     MAIN SEARCH
  ===================================================== */

  const handleSearch = async () => {
    const trimmedSearch =
      search.trim();

    setShowSuggestions(false);
    setSearchSuggestions([]);

    if (!trimmedSearch) {
      setSearchResults([]);
      setSearchApplied(false);
      setPage?.(1);

      if (
        typeof onSearch ===
        "function"
      ) {
        onSearch("");
      }

      return;
    }

    try {
      setSearchLoading(true);
      setPage?.(1);

      const response =
        await getAllStaffData(
          1,
          getSearchLimit(),
          selectedRoleId || "",
          trimmedSearch,
          filters.status
        );

      const data =
        Array.isArray(
          response?.data
        )
          ? response.data
          : [];

      setSearchResults(data);
      setSearchApplied(true);

      if (
        typeof onSearch ===
        "function"
      ) {
        onSearch(trimmedSearch);
      }
    } catch (error) {
      console.error(
        "BACKEND SEARCH ERROR:",
        error
      );

      setSearchResults([]);
      setSearchApplied(true);

      toast.error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Search failed"
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchKeyDown = (
    event
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  /* =====================================================
     CLEAR SEARCH
  ===================================================== */

  const handleClearSearch = () => {
    setSearch("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setSearchResults([]);
    setSearchApplied(false);
    setPage?.(1);

    if (
      typeof onSearch ===
      "function"
    ) {
      onSearch("");
    }
  };

  /* =====================================================
     LOGIN AS USER
  ===================================================== */

  const handleLoginAsUser = async (
    user
  ) => {
    /*
     * Permission check
     */
    if (
      Number(currentRoleId) === 9 &&
      !canLoginSelectedRole
    ) {
      toast.error(
        `You don't have login permission for ${selectedRoleName}`
      );
      return;
    }

    try {
      setLoginLoading(user.id);

      const response =
        await loginAsUser(
          user.id
        );

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Login failed"
        );
        return;
      }

      if (!response?.token) {
        toast.error(
          "Login token not received"
        );
        return;
      }

      if (!response?.user) {
        toast.error(
          "User data not received"
        );
        return;
      }

      saveToken(
        response.token
      );

      saveUser(
        response.user
      );

      /*
       * IMPORTANT:
       * If logged in user is Staff,
       * preserve its permission.
       */
      if (
        Number(
          response.user?.role_id
        ) === 9
      ) {
        const permission =
          response.user
            ?.role_permission
            ?.permission;

        if (
          permission &&
          typeof permission ===
            "object"
        ) {
          localStorage.setItem(
            "staff_permissions",
            JSON.stringify(
              permission
            )
          );
        }
      } else {
        localStorage.removeItem(
          "staff_permissions"
        );
      }

      toast.success(
        `Logged in as ${response.user.name}`
      );

      window.location.href =
        "/dashboard";
    } catch (error) {
      console.error(
        "LOGIN AS USER ERROR:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "Unable to login as user"
      );
    } finally {
      setLoginLoading(null);
    }
  };

  /* =====================================================
     STATUS TOGGLE
  ===================================================== */

  const handleStatusToggle =
    async (user) => {
      if (
        Number(currentRoleId) === 9 &&
        !canChangeStatus
      ) {
        toast.error(
          `You don't have status permission for ${selectedRoleName}`
        );
        return;
      }

      try {
        setStatusLoading(user.id);

        const currentStatus =
          Number(
            user?.userStatus ?? 1
          );

        const newStatus =
          currentStatus === 1
            ? 0
            : 1;

        const response =
          await updateUserStatus(
            user.id,
            newStatus
          );

        if (!response?.success) {
          toast.error(
            response?.message ||
              "Failed to update user status"
          );
          return;
        }

        user.userStatus =
          newStatus;

        setSearchResults(
          (previous) =>
            previous.map(
              (item) =>
                item.id === user.id
                  ? {
                      ...item,
                      userStatus:
                        newStatus,
                    }
                  : item
            )
        );

        setFilterSearchResults(
          (previous) =>
            previous.map(
              (item) =>
                item.id === user.id
                  ? {
                      ...item,
                      userStatus:
                        newStatus,
                    }
                  : item
            )
        );

        if (newStatus === 1) {
          toast.success(
            "User activated successfully"
          );
        } else {
          toast.success(
            "User deactivated successfully"
          );
        }
      } catch (error) {
        console.error(
          "USER STATUS ERROR:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to update user status"
        );
      } finally {
        setStatusLoading(null);
      }
    };

  /* =====================================================
     PAGINATION
  ===================================================== */

  const handlePreviousPage =
    async () => {
      if (page <= 1) {
        return;
      }

      const previousPage =
        page - 1;

      if (!filters.status) {
        setPage(previousPage);
        return;
      }

      try {
        setSearchLoading(true);

        const response =
          await getAllStaffData(
            previousPage,
            getSearchLimit(),
            selectedRoleId || "",
            "",
            filters.status
          );

        const data =
          Array.isArray(
            response?.data
          )
            ? response.data
            : [];

        setSearchResults(data);
        setSearchApplied(true);
        setPage(previousPage);
      } catch (error) {
        console.error(
          "STATUS PAGINATION ERROR:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to load users"
        );
      } finally {
        setSearchLoading(false);
      }
    };

  const handleNextPage =
    async () => {
      const totalPages =
        pagination?.totalPages ||
        1;

      if (page >= totalPages) {
        return;
      }

      const nextPage =
        page + 1;

      if (!filters.status) {
        setPage(nextPage);
        return;
      }

      try {
        setSearchLoading(true);

        const response =
          await getAllStaffData(
            nextPage,
            getSearchLimit(),
            selectedRoleId || "",
            "",
            filters.status
          );

        const data =
          Array.isArray(
            response?.data
          )
            ? response.data
            : [];

        setSearchResults(data);
        setSearchApplied(true);
        setPage(nextPage);
      } catch (error) {
        console.error(
          "STATUS PAGINATION ERROR:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to load users"
        );
      } finally {
        setSearchLoading(false);
      }
    };

  /* =====================================================
     TABLE DATA
  ===================================================== */

  let tableUsers = users;

  if (filterSearchApplied) {
    tableUsers =
      filterSearchResults;
  } else if (searchApplied) {
    tableUsers =
      searchResults;
  }

  /* =====================================================
     LOCAL FILTER
  ===================================================== */

  const filteredUsers =
    tableUsers.filter((user) => {
      const searchValue =
        search
          .trim()
          .toLowerCase();

      const userName =
        String(user?.name || "")
          .trim()
          .toLowerCase();

      const organizationName =
        String(
          user?.organization_name ||
            ""
        )
          .trim()
          .toLowerCase();

      const userPhone =
        String(user?.phone || "")
          .trim()
          .toLowerCase();

      const userCity =
        String(user?.city || "")
          .trim()
          .toLowerCase();

      const userState =
        String(user?.state || "")
          .trim()
          .toLowerCase();

      const userCountry =
        String(user?.country || "")
          .trim()
          .toLowerCase();

      const matchesSearch =
        !searchValue ||
        userName.includes(
          searchValue
        ) ||
        organizationName.includes(
          searchValue
        ) ||
        userPhone.includes(
          searchValue
        ) ||
        userCity.includes(
          searchValue
        ) ||
        userState.includes(
          searchValue
        ) ||
        userCountry.includes(
          searchValue
        );

      const selectedCountry =
        filters.country
          .trim()
          .toLowerCase();

      const selectedCountryName =
        countryOptions
          .find(
            (country) =>
              country.isoCode.toLowerCase() ===
              selectedCountry
          )
          ?.name?.trim()
          .toLowerCase() || "";

      const matchesCountry =
        !selectedCountry ||
        userCountry ===
          selectedCountry ||
        userCountry ===
          selectedCountryName;

      const matchesState =
        !selectedStateCode ||
        userState ===
          selectedStateCode
            .trim()
            .toLowerCase() ||
        userState ===
          selectedStateName;

      const selectedCity =
        String(
          filters.city || ""
        )
          .trim()
          .toLowerCase();

      const matchesCity =
        !selectedCity ||
        userCity ===
          selectedCity;

      const userStatus =
        Number(
          user?.userStatus ?? 1
        );

      const matchesStatus =
        !filters.status ||
        (filters.status ===
          "active" &&
          userStatus === 1) ||
        (filters.status ===
          "inactive" &&
          userStatus === 0);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesState &&
        matchesCity &&
        matchesStatus
      );
    });

  /* =====================================================
     URLS
  ===================================================== */

  const addPageUrl =
    `/dashboard/form?role=${selectedRoleId}` +
    `&role_id=${selectedRoleId}` +
    `&module=${encodeURIComponent(
      selectedRoleSlug
    )}`;

  const getEditFormUrl = (
    user
  ) => {
    const actualRoleId =
      Number(user?.role_id);

    const actualRoleSlug =
      roleSlugMap[
        actualRoleId
      ] || "";

    return (
      `/dashboard/form?id=${encodeURIComponent(
        user.id
      )}` +
      `&role=${actualRoleId}` +
      `&role_id=${actualRoleId}` +
      `&module=${encodeURIComponent(
        actualRoleSlug
      )}`
    );
  };

  /* =====================================================
     IF STAFF HAS NO ACCESS
  ===================================================== */

  if (
    Number(currentRoleId) === 9 &&
    !canViewRole
  ) {
    return (
      <div className="md:mt-8 mt-5 bg-white rounded-xl shadow p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-lg font-semibold text-gray-700">
            Access Denied
          </div>

          <p className="mt-2 text-sm text-gray-500">
            You don't have permission to access{" "}
            {selectedRoleName}.
          </p>
        </div>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="md:mt-8 mt-5 bg-white rounded-xl shadow p-6 max-w-full overflow-hidden">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex justify-between items-center mb-4">

        <div className="flex gap-3 overflow-x-auto whitespace-nowrap w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {/* ROLE LIST */}
          <button
            type="button"
            onClick={() =>
              handleRoleList?.(
                selectedRoleId,
                selectedRoleSlug
              )
            }
            className="bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-800 cursor-pointer whitespace-nowrap"
          >
            {selectedRoleName} List
          </button>

          {/* ADD ROLE */}
          {canAddSelectedRole && (
            <Link
              href={addPageUrl}
              className="bg-blue-400 text-white px-4 py-2 rounded-sm hover:bg-blue-500 cursor-pointer whitespace-nowrap inline-block"
            >
              {roleButtons[
                selectedRoleId
              ] ||
                `Add ${selectedRoleName}`}
            </Link>
          )}
        </div>
      </div>

      {/* =================================================
          SEARCH HEADER
      ================================================= */}

      <div className="flex justify-between items-center mb-4 max-lg:flex-col max-lg:items-start max-lg:gap-3">

        <h2 className="lg:text-xl md:text-[15px] font-bold">
          Recent Users
        </h2>

        <div className="flex items-center gap-2 max-lg:w-full max-sm:flex-col max-sm:items-stretch">

          {/* FILTER */}
          <button
            type="button"
            onClick={() =>
              setFilterOpen(
                (previous) =>
                  !previous
              )
            }
            className={`flex items-center justify-center text-white cursor-pointer gap-2 border px-4 py-2 rounded-md transition-all duration-200 ease-in-out ${
              filterOpen
                ? "bg-gray-700 border-gray-700"
                : "bg-blue-400 border-white hover:bg-white hover:text-blue-400 hover:border-blue-500"
            }`}
          >
            <RiFilterLine
              size={18}
            />

            Filter
          </button>

          {/* SEARCH */}
          <div className="flex items-center gap-2 max-sm:w-full">

            <input
              type="text"
              placeholder="Search by name, city, state, phone..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              onKeyDown={
                handleSearchKeyDown
              }
              className="border border-gray-300 rounded-md px-4 py-2 w-72 max-lg:w-64 max-sm:w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {search.trim() && (
              <button
                type="button"
                onClick={
                  handleClearSearch
                }
                className="px-3 py-2 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================
          FILTER PANEL
      ================================================= */}

      {filterOpen && (
        <div className="mb-5 border border-gray-200 rounded-xl bg-gray-50 p-5">

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* SEARCH FILTER */}
            <div className="relative">

              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>

              <div className="relative">

                <input
                  type="text"
                  value={
                    filterSearch
                  }
                  onChange={(e) => {
                    setFilterSearch(
                      e.target.value
                    );

                    setFilterSearchApplied(
                      false
                    );

                    setShowSuggestions(
                      true
                    );
                  }}
                  onFocus={() => {
                    if (
                      filterSearch.trim()
                    ) {
                      setShowSuggestions(
                        true
                      );
                    }
                  }}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();
                    }
                  }}
                  placeholder="Search"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />

                <RiSearchLine className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
              </div>

              {showSuggestions &&
                filterSearch.trim() && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">

                    {searchLoading ? (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        Searching...
                      </div>
                    ) : searchSuggestions.length >
                      0 ? (
                      searchSuggestions.map(
                        (
                          user,
                          index
                        ) => {
                          const suggestion =
                            getSuggestionValue(
                              user
                            );

                          return (
                            <button
                              type="button"
                              key={
                                user?.id ||
                                `${suggestion?.value}-${index}`
                              }
                              onClick={() =>
                                handleSuggestionClick(
                                  user
                                )
                              }
                              className="w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
                            >
                              <div className="font-semibold text-gray-800">
                                {user?.name ||
                                  "-"}
                              </div>

                              <div className="text-sm text-gray-500 mt-1">
                                {user?.organization_name ||
                                  "-"}
                              </div>

                              <div className="flex gap-3 text-xs text-gray-400 mt-1">
                                <span>
                                  {user?.city ||
                                    "-"}
                                </span>

                                <span>
                                  {user?.state ||
                                    "-"}
                                </span>

                                <span>
                                  {user?.phone ||
                                    "-"}
                                </span>
                              </div>
                            </button>
                          );
                        }
                      )
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No matching users found
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* COUNTRY */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>

              <div className="relative">

                <select
                  value={
                    filters.country
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "country",
                      e.target.value
                    )
                  }
                  className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">
                    All Countries
                  </option>

                  {countryOptions.map(
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
                  size={20}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* STATE */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>

              <div className="relative">

                <select
                  value={
                    filters.state
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "state",
                      e.target.value
                    )
                  }
                  disabled={
                    !filters.country
                  }
                  className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">
                    All States
                  </option>

                  {stateOptions.map(
                    (state) => (
                      <option
                        key={`${state.countryCode}-${state.isoCode}`}
                        value={`${state.countryCode}-${state.isoCode}`}
                      >
                        {state.name}
                      </option>
                    )
                  )}
                </select>

                <RiArrowDownSLine
                  size={20}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* CITY */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>

              <div className="relative">

                <select
                  value={
                    filters.city
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "city",
                      e.target.value
                    )
                  }
                  disabled={
                    !filters.country ||
                    !filters.state
                  }
                  className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">
                    All Cities
                  </option>

                  {cityOptions.map(
                    (
                      city,
                      index
                    ) => (
                      <option
                        key={`${city.name}-${index}`}
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
                  size={20}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* STATUS */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>

              <div className="relative">

                <select
                  value={
                    filters.status
                  }
                  onChange={(e) =>
                    handleFilterChange(
                      "status",
                      e.target.value
                    )
                  }
                  className="w-full appearance-none border border-gray-300 rounded-md px-3 py-2 pr-10 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>
                </select>

                <RiArrowDownSLine
                  size={20}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

            {/* CLEAR */}
            <div className="flex items-end">

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 cursor-pointer"
              >
                Clear Filters
              </button>

            </div>
          </div>
        </div>
      )}

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        <div className="w-full min-w-[1000px]">

          <table className="w-full">

            <thead>
              <tr className="border-b">

                <th className="text-left p-3">
                  S.No
                </th>

                <th className="text-left p-3">
                  Parent Name
                  <br />

                  <span className="text-sm text-gray-500">
                    Parent Organization
                  </span>
                </th>

                <th className="text-left p-3">
                  Name
                  <br />

                  <span className="text-sm text-gray-500">
                    Organization Name
                  </span>
                </th>

                <th className="text-left p-3">
                  Phone
                </th>

                <th className="text-left p-3">
                  Role
                </th>

                <th className="text-left p-3">
                  Created At
                </th>

                <th className="text-left p-3">
                  Actions
                </th>

                <th className="text-left p-3">
                  Status
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredUsers.length >
              0 ? (
                filteredUsers.map(
                  (
                    user,
                    index
                  ) => {
                    const actualRoleId =
                      Number(
                        user?.role_id
                      );

                    const actualRoleName =
                      roleMap[
                        actualRoleId
                      ] ||
                      getRoleName?.(
                        actualRoleId
                      ) ||
                      "Unknown";

                    const actualRoleSlug =
                      roleSlugMap[
                        actualRoleId
                      ] || "";

                    const isActive =
                      Number(
                        user?.userStatus ??
                          1
                      ) === 1;

                    /*
                     * Row permission.
                     *
                     * This is important if table
                     * accidentally contains another
                     * role.
                     */
                    const canEditRow =
                      Number(
                        currentRoleId
                      ) !== 9 ||
                      hasPermission(
                        actualRoleSlug,
                        "edit"
                      );

                    const canLoginRow =
                      Number(
                        currentRoleId
                      ) !== 9 ||
                      hasPermission(
                        actualRoleSlug,
                        "login"
                      );

                    const canStatusRow =
                      Number(
                        currentRoleId
                      ) !== 9 ||
                      hasPermission(
                        actualRoleSlug,
                        "status"
                      );

                    return (
                      <tr
                        key={
                          user.id
                        }
                        className="border-b"
                      >

                        {/* S.NO */}
                        <td className="p-3">
                          {(page - 1) *
                            (pagination?.limit ||
                              10) +
                            index +
                            1}
                        </td>

                        {/* PARENT */}
                        <td className="p-3 py-1">

                          <div className="font-semibold">
                            {user.parent_name ||
                              "-"}
                          </div>

                          <div className="text-sm text-gray-500">
                            {user.parent_organization_name ||
                              "-"}
                          </div>

                        </td>

                        {/* USER */}
                        <td className="p-3 py-1">

                          <div className="font-semibold">
                            {user.name ||
                              "-"}
                          </div>

                          <div className="text-sm text-gray-500">
                            {user.organization_name ||
                              "-"}
                          </div>

                        </td>

                        {/* PHONE */}
                        <td className="p-3 py-1">
                          {user.phone ||
                            "-"}
                        </td>

                        {/* ROLE */}
                        <td className="p-3 py-1">
                          {actualRoleName}
                        </td>

                        {/* CREATED */}
                        <td className="p-3 py-1">

                          {user.created_at ? (
                            <div className="text-sm leading-5">

                              <div>
                                <span className="font-bold">
                                  Date:
                                </span>{" "}

                                {new Date(
                                  user.created_at
                                ).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  }
                                )}
                              </div>

                              <div>
                                <span className="font-bold">
                                  Time:
                                </span>{" "}

                                {new Date(
                                  user.created_at
                                ).toLocaleTimeString(
                                  "en-IN",
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </div>

                            </div>
                          ) : (
                            "-"
                          )}

                        </td>

                        {/* ACTIONS */}
                        <td className="p-3 py-1 text-center">

                          <div className="flex items-center justify-center gap-2">

                            {/* EDIT */}
                            {isActive &&
                              canEditRow && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    router.push(
                                      getEditFormUrl(
                                        user
                                      )
                                    )
                                  }
                                  className="inline-flex items-center justify-center p-2 rounded-md text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                                  title={`Edit ${actualRoleName}`}
                                >
                                  <RiEditLine
                                    size={
                                      20
                                    }
                                  />
                                </button>
                              )}

                            {/* LOGIN */}
                            {isActive &&
                              canLoginRow && (
                                <button
                                  type="button"
                                  disabled={
                                    loginLoading ===
                                    user.id
                                  }
                                  onClick={() =>
                                    handleLoginAsUser(
                                      user
                                    )
                                  }
                                  className="inline-flex items-center justify-center p-2 rounded-md text-green-600 hover:bg-green-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title={`Login as ${actualRoleName}`}
                                >
                                  {loginLoading ===
                                  user.id ? (
                                    <span className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <RiLoginBoxLine
                                      size={
                                        20
                                      }
                                    />
                                  )}
                                </button>
                              )}

                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="p-3 py-1">

                          {canStatusRow ? (
                            <div className="flex items-center gap-3">

                              <button
                                type="button"
                                disabled={
                                  statusLoading ===
                                  user.id
                                }
                                onClick={() =>
                                  handleStatusToggle(
                                    user
                                  )
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                  isActive
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                                title={
                                  isActive
                                    ? "Deactivate User"
                                    : "Activate User"
                                }
                              >

                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                                    isActive
                                      ? "translate-x-5"
                                      : "translate-x-1"
                                  }`}
                                />

                              </button>

                            </div>
                          ) : (
                            <span className="text-gray-400">
                              -
                            </span>
                          )}

                        </td>

                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center p-5 text-gray-500"
                  >
                    No Users Found
                  </td>
                </tr>
              )}

            </tbody>

          </table>
        </div>
      </div>

      {/* =================================================
          PAGINATION
      ================================================= */}

      <div className="flex justify-center items-center gap-3 mt-5">

        <button
          type="button"
          disabled={page <= 1}
          onClick={
            handlePreviousPage
          }
          className={`px-4 py-2 rounded cursor-pointer ${
            page <= 1
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Previous
        </button>

        <span className="px-4 py-2 font-semibold">
          Page{" "}
          {pagination?.currentPage ||
            page}{" "}
          /{" "}
          {pagination?.totalPages ||
            1}
        </span>

        <button
          type="button"
          disabled={
            page >=
            (pagination?.totalPages ||
              1)
          }
          onClick={
            handleNextPage
          }
          className={`px-4 py-2 rounded cursor-pointer ${
            page >=
            (pagination?.totalPages ||
              1)
              ? "bg-gray-200 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          Next
        </button>

      </div>
    </div>
  );
}