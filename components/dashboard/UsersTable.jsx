"use client";

import Link from "next/link";

import {
  RiFilterLine,
  RiEditLine,
  RiLoginBoxLine,
} from "react-icons/ri";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { toast } from "react-toastify";

import {
  loginAsUser,
} from "@/services/api";

import {
  saveToken,
} from "@/utils/token";

export default function UsersTable({
  users,
  page,
  pagination,
  setPage,
  getRoleName,
  selectedRole,
  handleRoleList,
}) {
  const [search, setSearch] = useState("");

  const [loginLoading, setLoginLoading] = useState(null);

  const router = useRouter();

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredUsers = users.filter((user) =>
    user.name
      ?.toLowerCase()
      .includes(search.toLowerCase())
  );

  // ==========================================
  // ROLE BUTTONS
  // ==========================================

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

  // ==========================================
  // LOGIN AS USER
  // ==========================================

  const handleLoginAsUser = async (userId) => {
    try {
      // Prevent multiple clicks
      if (loginLoading !== null) {
        return;
      }

      setLoginLoading(userId);

      console.log(
        "Login as user ID:",
        userId
      );

      // ========================================
      // CALL API
      // ========================================

      const data = await loginAsUser(userId);

      console.log(
        "Login As User Response:",
        data
      );

      // ========================================
      // CHECK RESPONSE
      // ========================================

      if (
        !data?.success ||
        !data?.token
      ) {
        toast.error(
          data?.message ||
            "Unable to login as user"
        );

        return;
      }

      // ========================================
      // SAVE NEW TOKEN
      // ========================================

      saveToken(data.token);

      // ========================================
      // SAVE TARGET USER
      // ========================================

      if (data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );
      }

      // ========================================
      // SUCCESS
      // ========================================

      toast.success(
        `Logged in as ${data.user?.name || "user"}`
      );

      // ========================================
      // REDIRECT
      // ========================================

      window.location.href =
        "/dashboard";
    } catch (error) {
      console.error(
        "Login as user error:",
        error
      );

      toast.error(
        error?.message ||
          "Unable to login as user"
      );
    } finally {
      setLoginLoading(null);
    }
  };

  return (
    <div className="md:mt-8 mt-5 bg-white rounded-xl shadow p-6 max-w-full overflow-hidden">

      {/* ==========================================
          TOP BUTTONS
      ========================================== */}

      <div className="flex justify-between items-center mb-4">

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

          {/* ROLE LIST */}

          <button
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
            {getRoleName(selectedRole)} List
          </button>

          {/* ADD USER */}

          <Link
            href={`/dashboard/form?role=${selectedRole}&role_id=${selectedRole}`}
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
            {roleButtons[selectedRole]}
          </Link>

        </div>

      </div>

      {/* ==========================================
          SEARCH
      ========================================== */}

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

        <h2 className="lg:text-xl md:text-[15px] font-bold">
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

          {/* FILTER */}

          <button
            type="button"
            className="
              flex
              items-center
              text-white
              cursor-pointer
              gap-2
              border
              bg-blue-400
              border-white
              px-4
              py-2
              rounded-md
              hover:bg-white
              hover:text-blue-400
              hover:border-blue-500
              transition-all
              duration-200
              ease-in-out
            "
          >
            <RiFilterLine size={18} />

            Filter
          </button>

          {/* SEARCH */}

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

      {/* ==========================================
          TABLE
      ========================================== */}

      <div
        className="
          w-full
          overflow-x-auto
          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden
        "
      >

        <div className="w-full min-w-[1000px] table-auto">

          <table className="w-full">

            {/* ======================================
                HEAD
            ====================================== */}

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

            {/* ======================================
                BODY
            ====================================== */}

            <tbody>

              {filteredUsers.length > 0 ? (

                filteredUsers.map(
                  (user, index) => (

                    <tr
                      key={user.id}
                      className="border-b"
                    >

                      {/* S.NO */}

                      <td className="p-3">
                        {((page - 1) * 10) +
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
                          {user.parent_company ||
                            "-"}
                        </div>

                      </td>

                      {/* USER */}

                      <td className="p-3 py-1">

                        <div className="font-semibold">
                          {user.name}
                        </div>

                        <div className="text-sm text-gray-500">
                          {user.organization_name ||
                            "-"}
                        </div>

                      </td>

                      {/* PHONE */}

                      <td className="p-3 py-1">
                        {user.phone}
                      </td>

                      {/* ROLE */}

                      <td className="p-3 py-1">
                        {getRoleName(
                          user.role_id
                        )}
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

                      {/* =================================
                          ACTIONS
                      ================================= */}

                      <td className="py-1 text-center">

                        <div className="flex items-center justify-center gap-2">

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/edit-staff/${user.id}`
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
                            title="Edit"
                          >
                            <RiEditLine
                              size={20}
                            />
                          </button>

                          {/* LOGIN */}

                        <button
  type="button"
  onClick={() =>
    handleLoginAsUser(user.id)
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
  "
  title="Login"
>
  <RiLoginBoxLine
    size={20}
  />
</button>

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="p-3 py-1">

                        <span className="text-green-600 font-semibold">
                          Active
                        </span>

                      </td>

                    </tr>

                  )
                )

              ) : (

                <tr>

                  <td
                    colSpan="8"
                    className="text-center p-5"
                  >
                    No Users Found
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ==========================================
          PAGINATION
      ========================================== */}

      <div className="flex justify-center items-center gap-3 mt-5">

        {/* PREVIOUS */}

        <button
          disabled={page <= 1}
          onClick={() =>
            setPage(page - 1)
          }
          className={`
            px-4
            py-2
            rounded
            cursor-pointer
            ${
              page <= 1
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }
          `}
        >
          Previous
        </button>

        {/* PAGE */}

        <span className="px-4 py-2 font-semibold">

          Page{" "}

          {pagination.currentPage ||
            page}

          /

          {pagination.totalPages ||
            1}

        </span>

        {/* NEXT */}

        <button
          disabled={
            page >=
            (pagination.totalPages || 1)
          }
          onClick={() =>
            setPage(page + 1)
          }
          className={`
            px-4
            py-2
            rounded
            cursor-pointer
            ${
              page >=
              (pagination.totalPages || 1)
                ? "bg-gray-200 cursor-not-allowed"
                : "bg-blue-500 text-white"
            }
          `}
        >
          Next
        </button>

      </div>

    </div>
  );
}