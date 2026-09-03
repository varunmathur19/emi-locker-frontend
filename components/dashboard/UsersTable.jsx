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
  Country,
  State,
  City,
} from "country-state-city";

import {
  loginAsUser,
  updateUserStatus,
  getAllStaffData,
} from "@/services/api";

import {
  saveToken,
  saveUser,
} from "@/utils/token";

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

  // =========================================================
  // STATES
  // =========================================================

  // TOP SEARCH
  const [search, setSearch] = useState("");

  // FILTER PANEL SEARCH
  const [filterSearch, setFilterSearch] = useState("");

  const [loginLoading, setLoginLoading] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);

  const [filterOpen, setFilterOpen] = useState(false);

  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Backend search result
  const [searchResults, setSearchResults] = useState([]);
  const [searchApplied, setSearchApplied] = useState(false);

  const [filters, setFilters] = useState({
    country: "",
    state: "",
    city: "",
    status: "",
  });

  // =========================================================
  // ROLE MAP
  // =========================================================

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

  const getUserRoleName = (roleId) => {
    const numericRoleId = Number(roleId);

    return (
      roleMap[numericRoleId] ||
      getRoleName?.(numericRoleId) ||
      "Unknown"
    );
  };

  const selectedRoleName =
    getUserRoleName(selectedRole);

  // =========================================================
  // FILTER CHANGE
  // =========================================================

  const handleFilterChange = (field, value) => {
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
  };

  // =========================================================
  // FILTER SEARCH SUGGESTIONS
  // =========================================================

  useEffect(() => {
    const searchValue = filterSearch.trim();

    if (!searchValue) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setSearchLoading(false);

      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);

        const response = await getAllStaffData(
          1,
          10,
          selectedRole || "",
          searchValue
        );

        if (cancelled) {
          return;
        }

        const data = Array.isArray(response?.data)
          ? response.data
          : [];

        setSearchSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Search Suggestion Error:",
            error
          );

          setSearchSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filterSearch, selectedRole]);

  // =========================================================
  // GET SUGGESTION VALUE
  // =========================================================

  const getSuggestionValue = (user) => {
    const query = filterSearch
      .trim()
      .toLowerCase();

    const fields = [
      {
        value: user?.name,
        label: "Name",
      },
      {
        value: user?.organization_name,
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

    const matchedField = fields.find(
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

  // =========================================================
  // FILTER SEARCH SUGGESTION CLICK
  // =========================================================

  const handleSuggestionClick = (user) => {
    const suggestion =
      getSuggestionValue(user);

    const selectedValue = String(
      suggestion?.value || ""
    ).trim();

    if (!selectedValue) {
      return;
    }

    // IMPORTANT:
    // Sirf filter wala search change hoga.
    // TOP SEARCH bilkul change nahi hoga.
    setFilterSearch(selectedValue);

    setShowSuggestions(false);
    setSearchSuggestions([]);
  };

  // =========================================================
  // CLEAR FILTERS
  // =========================================================

  const clearFilters = () => {
    setFilters({
      country: "",
      state: "",
      city: "",
      status: "",
    });

    setFilterSearch("");
    setSearchSuggestions([]);
    setShowSuggestions(false);
  };

  // =========================================================
  // COUNTRY / STATE / CITY
  // =========================================================

  const selectedCountry = filters.country
    ? Country.getCountryByCode(filters.country)
    : null;

  const stateOptions = filters.country
    ? State.getStatesOfCountry(filters.country)
    : [];

  const cityOptions =
    filters.country && filters.state
      ? City.getCitiesOfState(
          filters.country,
          filters.state
        )
      : [];

  const selectedState = filters.state
    ? State.getStateByCodeAndCountry(
        filters.state,
        filters.country
      )
    : null;

  // =========================================================
  // BACKEND TOP SEARCH
  // =========================================================

  const handleSearch = async () => {
    const trimmedSearch =
      search.trim();

    setShowSuggestions(false);
    setSearchSuggestions([]);

    if (!trimmedSearch) {
      setSearchResults([]);
      setSearchApplied(false);

      setPage?.(1);

      if (typeof onSearch === "function") {
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
          10,
          selectedRole || "",
          trimmedSearch
        );

      const data = Array.isArray(
        response?.data
      )
        ? response.data
        : [];

      setSearchResults(data);
      setSearchApplied(true);

      if (typeof onSearch === "function") {
        onSearch(trimmedSearch);
      }
    } catch (error) {
      console.error(
        "Backend Search Error:",
        error
      );

      setSearchResults([]);
      setSearchApplied(true);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Search failed"
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // =========================================================
  // ENTER KEY SEARCH
  // =========================================================

  const handleSearchKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      handleSearch();
    }
  };

  // =========================================================
  // CLEAR TOP SEARCH
  // =========================================================

  const handleClearSearch = () => {
    setSearch("");

    setSearchSuggestions([]);
    setShowSuggestions(false);

    setSearchResults([]);
    setSearchApplied(false);

    setPage?.(1);

    if (typeof onSearch === "function") {
      onSearch("");
    }
  };

  // =========================================================
  // LOGIN AS USER
  // =========================================================

  const handleLoginAsUser = async (user) => {
    try {
      setLoginLoading(user.id);

      const response = await loginAsUser(
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

      saveToken(response.token);
      saveUser(response.user);

      toast.success(
        `Logged in as ${response.user.name}`
      );

      window.location.href =
        "/dashboard";
    } catch (error) {
      console.error(
        "Login As User Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to login as user"
      );
    } finally {
      setLoginLoading(null);
    }
  };

  // =========================================================
  // STATUS TOGGLE
  // =========================================================

  const handleStatusToggle = async (user) => {
    try {
      setStatusLoading(user.id);

      const currentStatus = Number(
        user?.userStatus ?? 1
      );

      const newStatus =
        currentStatus === 1 ? 0 : 1;

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

      user.userStatus = newStatus;

      setSearchResults((previous) =>
        previous.map((item) =>
          item.id === user.id
            ? {
                ...item,
                userStatus: newStatus,
              }
            : item
        )
      );

      if (newStatus === 1) {
        toast.success(
          "User activated successfully"
        );
      } else {
        toast.error(
          "User deactivated successfully"
        );
      }
    } catch (error) {
      console.error(
        "USER STATUS ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update user status"
      );
    } finally {
      setStatusLoading(null);
    }
  };

  // =========================================================
  // PAGINATION
  // =========================================================

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages =
      pagination?.totalPages || 1;

    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  // =========================================================
  // TABLE SOURCE
  // =========================================================

  const tableUsers = searchApplied
    ? searchResults
    : users;

  // =========================================================
  // TOP SEARCH + FILTER
  // =========================================================

  const filteredUsers = tableUsers.filter(
    (user) => {
      // =====================================================
      // TOP SEARCH ONLY
      // =====================================================

      const searchValue = search
        .trim()
        .toLowerCase();

      const userName = String(
        user?.name || ""
      )
        .trim()
        .toLowerCase();

      const organizationName = String(
        user?.organization_name || ""
      )
        .trim()
        .toLowerCase();

      const userPhone = String(
        user?.phone || ""
      )
        .trim()
        .toLowerCase();

      const userCity = String(
        user?.city || ""
      )
        .trim()
        .toLowerCase();

      const userState = String(
        user?.state || ""
      )
        .trim()
        .toLowerCase();

      const userCountry = String(
        user?.country || ""
      )
        .trim()
        .toLowerCase();

      const matchesSearch =
        !searchValue ||
        userName.includes(searchValue) ||
        organizationName.includes(searchValue) ||
        userPhone.includes(searchValue) ||
        userCity.includes(searchValue) ||
        userState.includes(searchValue) ||
        userCountry.includes(searchValue);

      // =====================================================
      // COUNTRY
      // =====================================================

      const selectedCountryName = String(
        selectedCountry?.name || ""
      )
        .trim()
        .toLowerCase();

      const matchesCountry =
        !filters.country ||
        userCountry === selectedCountryName;

      // =====================================================
      // STATE
      // =====================================================

      const selectedStateName = String(
        selectedState?.name || ""
      )
        .trim()
        .toLowerCase();

      const matchesState =
        !filters.state ||
        userState === selectedStateName;

      // =====================================================
      // CITY
      // =====================================================

      const selectedCityName = String(
        filters.city || ""
      )
        .trim()
        .toLowerCase();

      const matchesCity =
        !filters.city ||
        userCity === selectedCityName;

      // =====================================================
      // STATUS
      // =====================================================

      const userStatus = Number(
        user?.userStatus ?? 1
      );

      const matchesStatus =
        !filters.status ||
        (filters.status === "active" &&
          userStatus === 1) ||
        (filters.status === "inactive" &&
          userStatus === 0);

      return (
        matchesSearch &&
        matchesCountry &&
        matchesState &&
        matchesCity &&
        matchesStatus
      );
    }
  );

  // =========================================================
  // JSX
  // =========================================================

  return (
    <div
      className="
        md:mt-8
        mt-5
        bg-white
        rounded-xl
        shadow
        p-6
        max-w-full
        overflow-hidden
      "
    >
      {/* =====================================================
          TOP ROLE BUTTONS
      ====================================================== */}

      <div
        className="
          flex
          justify-between
          items-center
          mb-4
        "
      >
        <div
          className="
            flex
            gap-3
            overflow-x-auto
            whitespace-nowrap
            w-full
            [scrollbar-width:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <button
            type="button"
            onClick={() =>
              handleRoleList(selectedRole)
            }
            className="
              bg-gray-700
              text-white
              px-4
              py-2
              rounded-sm
              hover:bg-gray-800
              cursor-pointer
              whitespace-nowrap
            "
          >
            {selectedRoleName} List
          </button>

          <Link
            href={`/dashboard/form?role=${Number(
              selectedRole
            )}&role_id=${Number(
              selectedRole
            )}`}
            className="
              bg-blue-400
              text-white
              px-4
              py-2
              rounded-sm
              hover:bg-blue-500
              cursor-pointer
              whitespace-nowrap
              inline-block
            "
          >
            {roleButtons[
              Number(selectedRole)
            ] ||
              `Add ${selectedRoleName}`}
          </Link>
        </div>
      </div>

      {/* =====================================================
          SEARCH + FILTER BUTTON
      ====================================================== */}

      <div
        className="
          flex
          justify-between
          items-center
          mb-4
          max-lg:flex-col
          max-lg:items-start
          max-lg:gap-3
        "
      >
        <h2
          className="
            lg:text-xl
            md:text-[15px]
            font-bold
          "
        >
          Recent Users
        </h2>

        <div
          className="
            flex
            items-center
            gap-2
            max-lg:w-full
            max-sm:flex-col
            max-sm:items-stretch
          "
        >
          {/* FILTER BUTTON */}

          <button
            type="button"
            onClick={() =>
              setFilterOpen(
                (previous) => !previous
              )
            }
            className={`
              flex
              items-center
              justify-center
              text-white
              cursor-pointer
              gap-2
              border
              px-4
              py-2
              rounded-md
              transition-all
              duration-200
              ease-in-out
              ${
                filterOpen
                  ? "bg-gray-700 border-gray-700"
                  : "bg-blue-400 border-white hover:bg-white hover:text-blue-400 hover:border-blue-500"
              }
            `}
          >
            <RiFilterLine size={18} />
            Filter
          </button>

          {/* =================================================
              TOP SEARCH
          ================================================== */}

          <div
            className="
              flex
              items-center
              gap-2
              max-sm:w-full
            "
          >
            <input
              type="text"
              placeholder="Search by name, city, state, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              onKeyDown={
                handleSearchKeyDown
              }
              className="
                border
                border-gray-300
                rounded-md
                px-4
                py-2
                w-72
                max-lg:w-64
                max-sm:w-full
                focus:outline-none
                focus:ring-2
                focus:ring-blue-400
              "
            />

            {search.trim() && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="
                  px-3
                  py-2
                  rounded-md
                  bg-gray-200
                  text-gray-700
                  hover:bg-gray-300
                  cursor-pointer
                "
                title="Clear Search"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          FILTER PANEL
      ====================================================== */}

      {filterOpen && (
        <div
          className="
            mb-5
            border
            border-gray-200
            rounded-xl
            bg-gray-50
            p-5
          "
        >
          {/* =================================================
              FILTER SEARCH
          ================================================== */}

          <div className="mb-5 relative">
            <label
              className="
                block
                text-sm
                font-semibold
                text-gray-700
                mb-2
              "
            >
              Search
            </label>

            <div className="relative">
              <input
                type="text"
                value={filterSearch}
                onChange={(e) => {
                  setFilterSearch(
                    e.target.value
                  );
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  if (filterSearch.trim()) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                  }
                }}
                placeholder="Search "
                className="
                  w-full
                  border
                  border-gray-300
                  rounded-md
                  px-3
                  py-2
                  pr-10
                  bg-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-400
                "
              />

              <RiSearchLine
                size={20}
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  -translate-y-1/2
                  text-gray-500
                "
              />
            </div>

            {/* =================================================
                FILTER SEARCH DROPDOWN ONLY
            ================================================== */}

            {showSuggestions &&
              filterSearch.trim() && (
                <div
                  className="
                    absolute
                    z-50
                    left-0
                    right-0
                    mt-1
                    bg-white
                    border
                    border-gray-200
                    rounded-md
                    shadow-lg
                    max-h-64
                    overflow-y-auto
                  "
                >
                  {searchLoading ? (
                    <div
                      className="
                        px-4
                        py-3
                        text-sm
                        text-gray-500
                      "
                    >
                      Searching...
                    </div>
                  ) : searchSuggestions.length >
                    0 ? (
                    searchSuggestions.map(
                      (user, index) => {
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
                            className="
                              w-full
                              text-left
                              px-4
                              py-3
                              border-b
                              border-gray-100
                              last:border-b-0
                              hover:bg-gray-50
                              cursor-pointer
                            "
                          >
                            <div
                              className="
                                font-semibold
                                text-gray-800
                              "
                            >
                              {user?.name ||
                                "-"}
                            </div>

                            <div
                              className="
                                text-sm
                                text-gray-500
                                mt-1
                              "
                            >
                              {user?.organization_name ||
                                "-"}
                            </div>

                            <div
                              className="
                                flex
                                gap-3
                                text-xs
                                text-gray-400
                                mt-1
                              "
                            >
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
                    <div
                      className="
                        px-4
                        py-3
                        text-sm
                        text-gray-500
                      "
                    >
                      No matching users found
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* =================================================
              EXISTING FILTERS
          ================================================== */}

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-4
              gap-4
            "
          >
            {/* COUNTRY */}

            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                Country
              </label>

              <div className="relative">
                <select
                  value={filters.country}
                  onChange={(e) =>
                    handleFilterChange(
                      "country",
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    appearance-none
                    border
                    border-gray-300
                    rounded-md
                    px-3
                    py-2
                    pr-10
                    bg-white
                    cursor-pointer
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-400
                  "
                >
                  <option value="">
                    All Countries
                  </option>

                  {Country.getAllCountries().map(
                    (country) => (
                      <option
                        key={country.isoCode}
                        value={country.isoCode}
                      >
                        {country.name}
                      </option>
                    )
                  )}
                </select>

                <RiArrowDownSLine
                  size={20}
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                />
              </div>
            </div>

            {/* STATE */}

            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                State
              </label>

              <div className="relative">
                <select
                  value={filters.state}
                  onChange={(e) =>
                    handleFilterChange(
                      "state",
                      e.target.value
                    )
                  }
                  disabled={!filters.country}
                  className="
                    w-full
                    appearance-none
                    border
                    border-gray-300
                    rounded-md
                    px-3
                    py-2
                    pr-10
                    bg-white
                    cursor-pointer
                    disabled:bg-gray-100
                    disabled:cursor-not-allowed
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-400
                  "
                >
                  <option value="">
                    All States
                  </option>

                  {stateOptions.map(
                    (state) => (
                      <option
                        key={state.isoCode}
                        value={state.isoCode}
                      >
                        {state.name}
                      </option>
                    )
                  )}
                </select>

                <RiArrowDownSLine
                  size={20}
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                />
              </div>
            </div>

            {/* CITY */}

            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                City
              </label>

              <div className="relative">
                <select
                  value={filters.city}
                  onChange={(e) =>
                    handleFilterChange(
                      "city",
                      e.target.value
                    )
                  }
                  disabled={!filters.state}
                  className="
                    w-full
                    appearance-none
                    border
                    border-gray-300
                    rounded-md
                    px-3
                    py-2
                    pr-10
                    bg-white
                    cursor-pointer
                    disabled:bg-gray-100
                    disabled:cursor-not-allowed
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-400
                  "
                >
                  <option value="">
                    All Cities
                  </option>

                  {cityOptions.map(
                    (city, index) => (
                      <option
                        key={`${city.name}-${index}`}
                        value={city.name}
                      >
                        {city.name}
                      </option>
                    )
                  )}
                </select>

                <RiArrowDownSLine
                  size={20}
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                />
              </div>
            </div>

            {/* STATUS */}

            <div>
              <label
                className="
                  block
                  text-sm
                  font-semibold
                  text-gray-700
                  mb-2
                "
              >
                Status
              </label>

              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) =>
                    handleFilterChange(
                      "status",
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    appearance-none
                    border
                    border-gray-300
                    rounded-md
                    px-3
                    py-2
                    pr-10
                    bg-white
                    cursor-pointer
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-400
                  "
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
                  className="
                    pointer-events-none
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                  "
                />
              </div>
            </div>
          </div>

          {/* =================================================
              SEARCH + CLEAR FILTER
          ================================================== */}

          <div
            className="
              flex
              justify-end
              mt-4
              gap-2
            "
          >
            <button
              type="button"
              onClick={clearFilters}
              className="
                bg-gray-700
                text-white
                px-5
                py-2
                rounded-md
                hover:bg-gray-800
                cursor-pointer
              "
            >
              Clear Filter
            </button>
          </div>
        </div>
      )}

      {/* =====================================================
          TABLE
      ====================================================== */}

      <div
        className="
          w-full
          overflow-x-auto
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >
        <div
          className="
            w-full
            min-w-[1000px]
            table-auto
          "
        >
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map(
                  (user, index) => {
                    const actualRoleId =
                      Number(user?.role_id);

                    const actualRoleName =
                      getUserRoleName(
                        actualRoleId
                      );

                    const isActive =
                      Number(
                        user?.userStatus ?? 1
                      ) === 1;

                    return (
                      <tr
                        key={user.id}
                        className="border-b"
                      >
                        <td className="p-3">
                          {(page - 1) *
                            (pagination?.limit ||
                              10) +
                            index +
                            1}
                        </td>

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

                        <td className="p-3 py-1">
                          <div className="font-semibold">
                            {user.name || "-"}
                          </div>

                          <div className="text-sm text-gray-500">
                            {user.organization_name ||
                              "-"}
                          </div>
                        </td>

                        <td className="p-3 py-1">
                          {user.phone || "-"}
                        </td>

                        <td className="p-3 py-1">
                          {actualRoleName}
                        </td>

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

                        <td className="p-3 py-1 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/dashboard/edit-staff/${user.id}?role=${actualRoleId}`
                                )
                              }
                              className="
                                inline-flex
                                items-center
                                justify-center
                                p-2
                                rounded-md
                                text-blue-600
                                hover:bg-blue-50
                                transition
                                cursor-pointer
                              "
                              title={`Edit ${actualRoleName}`}
                            >
                              <RiEditLine
                                size={20}
                              />
                            </button>

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
                              className="
                                inline-flex
                                items-center
                                justify-center
                                p-2
                                rounded-md
                                text-green-600
                                hover:bg-green-50
                                transition
                                cursor-pointer
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                              "
                              title={`Login as ${actualRoleName}`}
                            >
                              {loginLoading ===
                              user.id ? (
                                <span
                                  className="
                                    h-5
                                    w-5
                                    border-2
                                    border-green-600
                                    border-t-transparent
                                    rounded-full
                                    animate-spin
                                  "
                                />
                              ) : (
                                <RiLoginBoxLine
                                  size={20}
                                />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="p-3 py-1">
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
                              className={`
                                relative
                                inline-flex
                                h-6
                                w-11
                                items-center
                                rounded-full
                                transition
                                duration-200
                                cursor-pointer
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                                ${
                                  isActive
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }
                              `}
                              title={
                                isActive
                                  ? "Deactivate User"
                                  : "Activate User"
                              }
                            >
                              <span
                                className={`
                                  inline-block
                                  h-5
                                  w-5
                                  transform
                                  rounded-full
                                  bg-white
                                  shadow
                                  transition
                                  duration-200
                                  ${
                                    isActive
                                      ? "translate-x-5"
                                      : "translate-x-1"
                                  }
                                `}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="
                      text-center
                      p-5
                      text-gray-500
                    "
                  >
                    No Users Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          PAGINATION
      ====================================================== */}

      <div
        className="
          flex
          justify-center
          items-center
          gap-3
          mt-5
        "
      >
        <button
          type="button"
          disabled={page <= 1}
          onClick={handlePreviousPage}
          className={`
            px-4
            py-2
            rounded
            cursor-pointer
            ${
              page <= 1
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }
          `}
        >
          Previous
        </button>

        <span
          className="
            px-4
            py-2
            font-semibold
          "
        >
          Page{" "}
          {pagination?.currentPage ||
            page}{" "}
          /{" "}
          {pagination?.totalPages || 1}
        </span>

        <button
          type="button"
          disabled={
            page >=
            (pagination?.totalPages || 1)
          }
          onClick={handleNextPage}
          className={`
            px-4
            py-2
            rounded
            cursor-pointer
            ${
              page >=
              (pagination?.totalPages || 1)
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }
          `}
        >
          Next
        </button>
      </div>
    </div>
  );
}