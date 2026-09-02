
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  RiFilterLine,
  RiEditLine,
  RiLoginBoxLine,
  RiArrowDownSLine,
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
}) {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [loginLoading, setLoginLoading] = useState(null);
  const [statusLoading, setStatusLoading] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    role: "",
    country: "",
    state: "",
    city: "",
    status: "",
  });

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

  const roleFilterPlaceholder =
    `${selectedRoleName} / Organization Name`;

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

  const clearFilters = () => {
    setFilters({
      role: "",
      country: "",
      state: "",
      city: "",
      status: "",
    });
  };

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

  const normalizedSearch = search
    .trim()
    .toLowerCase();

  const normalizedRoleFilter = filters.role
    .trim()
    .toLowerCase();

  const filteredUsers = users.filter((user) => {
    const userName = String(
      user?.name || ""
    )
      .trim()
      .toLowerCase();

    const matchesSearch =
      !normalizedSearch ||
      userName.includes(normalizedSearch);

    const actualRoleName = getUserRoleName(
      user?.role_id
    )
      .trim()
      .toLowerCase();

    const organizationName = String(
      user?.organization_name || ""
    )
      .trim()
      .toLowerCase();

    const matchesRole =
      !normalizedRoleFilter ||
      actualRoleName.includes(
        normalizedRoleFilter
      ) ||
      organizationName.includes(
        normalizedRoleFilter
      );

    const userCountry = String(
      user?.country || ""
    )
      .trim()
      .toLowerCase();

    const selectedCountryName = String(
      selectedCountry?.name || ""
    )
      .trim()
      .toLowerCase();

    const matchesCountry =
      !filters.country ||
      userCountry === selectedCountryName;

    const userState = String(
      user?.state || ""
    )
      .trim()
      .toLowerCase();

    const selectedStateName = String(
      selectedState?.name || ""
    )
      .trim()
      .toLowerCase();

    const matchesState =
      !filters.state ||
      userState === selectedStateName;

    const userCity = String(
      user?.city || ""
    )
      .trim()
      .toLowerCase();

    const selectedCityName = String(
      filters.city || ""
    )
      .trim()
      .toLowerCase();

    const matchesCity =
      !filters.city ||
      userCity === selectedCityName;

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
      matchesRole &&
      matchesCountry &&
      matchesState &&
      matchesCity &&
      matchesStatus
    );
  });

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

      window.location.href = "/dashboard";
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
          "
        >
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

          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="
              border
              border-gray-300
              rounded-md
              px-4
              py-2
              w-64
              max-lg:flex-1
              max-lg:w-auto
              max-lg:px-2
              focus:outline-none
              focus:ring-2
              focus:ring-blue-400
            "
          />
        </div>
      </div>

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
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-5
              gap-4
            "
          >
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
                Role / Organization
              </label>

              <input
                type="text"
                value={filters.role}
                onChange={(e) =>
                  handleFilterChange(
                    "role",
                    e.target.value
                  )
                }
                placeholder={
                  roleFilterPlaceholder
                }
                className="
                  w-full
                  border
                  border-gray-300
                  rounded-md
                  px-3
                  py-2
                  bg-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-400
                "
              />
            </div>

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

          <div
            className="
              flex
              justify-end
              mt-4
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
