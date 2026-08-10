"use client";
import Link from "next/link";
import { RiFilterLine } from "react-icons/ri";
import { useState } from "react";

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

const filteredUsers = users.filter((user) =>
  user.name?.toLowerCase().includes(search.toLowerCase())
);

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



  return (
    <div className="md:mt-8 mt-5 bg-white rounded-xl shadow p-6 max-w-full overflow-hidden">


      <div className="flex justify-between items-center mb-4">

        <div className="flex gap-3">

          <button
            onClick={() => handleRoleList(selectedRole)}
            className="bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-800 cursor-pointer whitespace-nowrap"
          >
            {getRoleName(selectedRole)} List
          </button>

<Link
  href={`/dashboard/form?role=${selectedRole}&role_id=${selectedRole}`}
  className="bg-blue-400 text-white px-4 py-2 rounded-sm hover:bg-blue-500 cursor-pointer whitespace-nowrap inline-block"
>
  {roleButtons[selectedRole]}
</Link>


        </div>

      </div>



<div className="flex justify-between items-center mb-4 max-lg:flex-col max-lg:items-start max-lg:gap-3">

  <h2 className="lg:text-xl md:text-[15px] font-bold">
    Recent Users
  </h2>


  <div className="flex items-center gap-2 max-lg:w-full">

    <button
      className="flex items-center text-[#fff] cursor-pointer gap-2 border bg-blue-400 border-[#fff] px-4 py-2 rounded-md hover:bg-[#fff] hover:text-blue-400 hover:border-blue-500 transition-all duration-200 ease-in-out"
    >
      <RiFilterLine size={18} />
      Filter
    </button>


    <input
  type="text"
  placeholder="Search by name..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="border border-gray-300 rounded-md px-4 py-2 w-64 max-lg:flex-1 max-lg:w-auto max-lg:px-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
/>

  </div>


</div>



      {/* Horizontal Scroll */}
      <div className="w-full overflow-x-auto">

        <div className="min-w-[700px]">

          <table className="w-full">


            <thead>

              <tr className="border-b">

                <th className="text-left p-3">
                  S.No
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
                  Status
                </th>


              </tr>

            </thead>



          <tbody>
  {filteredUsers.length > 0 ? (
    filteredUsers.map((user, index) => (
      <tr key={user.id} className="border-b">
        <td className="p-3">
          {((page - 1) * 10) + index + 1}
        </td>

     <td className="p-3 py-1">
  <div className="font-semibold">
    {user.name}
  </div>

  <div className="text-sm text-gray-500 ">
    {user.organization_name || "-"}
  </div>
</td>

        <td className="p-3 py-1">{user.phone}</td>

        <td className="p-3 py-1">
          {getRoleName(user.role_id)}
        </td>

        <td className="p-3 py-1">
          {user.created_at
            ? new Date(user.created_at).toLocaleString("en-IN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "-"}
        </td>

        <td className="p-3 py-1">
          <span className="text-green-600 font-semibold">
            Active
          </span>
        </td>
      </tr>
    ))
  ) : (
    <tr>
      <td colSpan="6" className="text-center p-5">
        No Users Found
      </td>
    </tr>
  )}
</tbody>


          </table>

        </div>

      </div>



      {/* Pagination */}

      <div className="flex justify-center items-center gap-3 mt-5">


        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className={`px-4 py-2 rounded cursor-pointer ${
            page <= 1
            ? "bg-gray-200 cursor-not-allowed"
            : "bg-blue-500 text-white"
          }`}
        >
          Previous
        </button>



        <span className="px-4 py-2 font-semibold">
          Page {pagination.currentPage || page}
          /
          {pagination.totalPages || 1}
        </span>



        <button
          disabled={page >= (pagination.totalPages || 1)}
          onClick={() => setPage(page + 1)}
          className={`px-4 py-2 rounded cursor-pointer ${
            page >= (pagination.totalPages || 1)
            ? "bg-gray-200 cursor-not-allowed"
            : "bg-blue-500 text-white"
          }`}
        >
          Next
        </button>


      </div>


    </div>
  );
}