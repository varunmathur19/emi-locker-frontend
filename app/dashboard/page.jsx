"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

import { getAllStaffData } from "@/services/api";
import { getRoleId } from "@/utils/token";


export default function Dashboard() {

const [allUsers,setAllUsers] = useState([]);
  const roleId = getRoleId() ?? 999;

  const searchParams = useSearchParams();

  const selectedRole = searchParams.get("role");
const [page,setPage]=useState(1);
const [pagination,setPagination]=useState({});
  const [users, setUsers] = useState([]);


  const [counts, setCounts] = useState({

    admin: 0,
    cnf: 0,
    super: 0,
    distributor: 0,
    fos: 0,
    retailer: 0,
    employee: 0,
    staff: 0,

  });





  const getRoleName = (id)=>{

    const roles = {

      0:"Master Admin",
      1:"Admin",
      2:"CNF",
      3:"Super Distributor",
      4:"Distributor",
      5:"FOS",
      6:"Retailer",
      7:"Employee",
      8:"Staff"

    };


    return roles[id] || "Unknown";

  };




useEffect(()=>{

fetchUsers();

},[page,selectedRole]);





const fetchUsers = async()=>{

try{


// 1. Cards ke liye all users
const countRes = await getAllStaffData(
1,
10000,
""
);


const allData = countRes.data || [];

setAllUsers(allData);



const roleCounts = {

admin:0,
cnf:0,
super:0,
distributor:0,
fos:0,
retailer:0,
employee:0,
staff:0

};



allData.forEach((user)=>{


switch(Number(user.role_id)){


case 1:
roleCounts.admin++;
break;


case 2:
roleCounts.cnf++;
break;


case 3:
roleCounts.super++;
break;


case 4:
roleCounts.distributor++;
break;


case 5:
roleCounts.fos++;
break;


case 6:
roleCounts.retailer++;
break;


case 7:
roleCounts.employee++;
break;


case 8:
roleCounts.staff++;
break;


}


});


setCounts(roleCounts);





// 2. Table ke liye selected role data

const res = await getAllStaffData(
page,
10,
selectedRole || ""
);


setUsers(res.data);

setPagination(res.pagination);



}
catch(error){

console.log(error);

}


};





  const cards = [


    {
      title:"Admin",
      count:counts.admin,
      roleId:1
    },


    {
      title:"CNF",
      count:counts.cnf,
      roleId:2
    },


    {
      title:"Super Distributor",
      count:counts.super,
      roleId:3
    },


    {
      title:"Distributor",
      count:counts.distributor,
      roleId:4
    },


    {
      title:"FOS",
      count:counts.fos,
      roleId:5
    },


    {
      title:"Retailer",
      count:counts.retailer,
      roleId:6
    },


    {
      title:"Employee",
      count:counts.employee,
      roleId:7
    },


    {
      title:"Staff",
      count:counts.staff,
      roleId:8
    },


  ];






  return (

<div className="flex min-h-screen bg-gray-100">


<Sidebar/>



<div className="flex-1">


<Navbar/>



<main className="p-6">



<h1 className="text-3xl font-bold mb-6">
Welcome Dashboard
</h1>





<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">


{

cards

.filter((card)=>{


// Master Admin sab dekhega

if(roleId === 0){

return true;

}


// baaki role apne niche wale dekhenge

return card.roleId > roleId;


})


.map((card)=>(


<div
key={card.roleId}
className="bg-white p-5 rounded-xl shadow"
>


<h3 className="text-gray-500">
{card.title}
</h3>


<p className="text-3xl font-bold">
{card.count}
</p>


</div>


))


}


</div>








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


<td>
{user.phone}
</td>


<td>
{getRoleName(user.role_id)}
</td>


<td>
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

onClick={()=>setPage(page - 1)}

className={`px-4 py-2 rounded ${
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

disabled={
page >= (pagination.totalPages || 1)
}

onClick={()=>setPage(page + 1)}

className={`px-4 py-2 rounded ${
page >= (pagination.totalPages || 1)
? "bg-gray-200 cursor-not-allowed"
: "bg-blue-500 text-white"
}`}

>

Next

</button>



</div>


</div>





</main>


</div>


</div>


);


}