"use client";

export default function UsersTable({
  users,
  page,
  pagination,
  setPage,
  getRoleName
}) {


return (

<div className="mt-8 bg-white rounded-xl shadow p-6">

  <h2 className="text-xl font-bold mb-4">
    Recent Users
  </h2>


  <table className="w-full">

    <thead>

      <tr className="border-b">

        <th className="text-left p-3">
          S.No
        </th>

        <th className="text-left p-3">
          Name
        </th>

        <th className="text-left p-3">
          Phone
        </th>

        <th className="text-left p-3">
          Role
        </th>

        <th className="text-left p-3">
          Status
        </th>

      </tr>

    </thead>


    <tbody>


    {
    users.length > 0 ?

    users.map((user,index)=>(

    <tr
    key={user.id}
    className="border-b"
    >


    <td className="p-3">
    {((page - 1) * 10) + index + 1}
    </td>


    <td className="p-3">
    {user.name}
    </td>


    <td className="p-3">
    {user.phone}
    </td>


    <td className="p-3">
    {getRoleName(user.role_id)}
    </td>


    <td className="p-3">

    <span className="text-green-600 font-semibold">
    Active
    </span>

    </td>


    </tr>


    ))

    :

    <tr>

    <td
    colSpan="5"
    className="text-center p-5"
    >
    No Users Found
    </td>

    </tr>

    }


    </tbody>


  </table>



<div className="flex justify-center items-center gap-3 mt-5">


<button

disabled={page <= 1}

onClick={()=>setPage(page-1)}

className={`px-4 py-2 rounded ${
page <=1
?
"bg-gray-200 cursor-not-allowed"
:
"bg-blue-500 text-white"
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

disabled={
page >= (pagination.totalPages || 1)
}

onClick={()=>setPage(page+1)}

className={`px-4 py-2 rounded ${
page >= (pagination.totalPages || 1)
?
"bg-gray-200 cursor-not-allowed"
:
"bg-blue-500 text-white"
}`}

>

Next

</button>


</div>


</div>

);


}