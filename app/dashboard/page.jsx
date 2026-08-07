"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";



import { getAllStaffData } from "@/services/api";
import { getRoleId,getToken  } from "@/utils/token";
import UsersTable from "../../components/dashboard/UsersTable";



export default function Dashboard() {

    const handleRoleList = (role) => {
  router.push(`/dashboard?role=${role}`);
};
const router = useRouter();
useEffect(() => { const token = getToken();  if (!token) { router.replace("/"); } }, [router]);

const [allUsers,setAllUsers] = useState([]);
  const roleId = getRoleId() ?? 999;
  const allowedRoles = {

  0:[1,2,3,4,5,6,7,8],

  1:[2,3,4,5,6,7,8],

  2:[3,4,5,6,7,8],

  3:[4,5,6,7,8],

  4:[5,6,7,8],

  5:[6,7,8],

  6:[7,8],

  7:[8],

  8:[]

};

  const searchParams = useSearchParams();

  const urlRole = Number(searchParams.get("role"));


const selectedRole =
urlRole &&
allowedRoles[roleId]?.includes(urlRole)

? urlRole

: null;
  const isDashboardHome = !selectedRole;
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

const urlRole = Number(searchParams.get("role"));


if(
urlRole &&
urlRole !== roleId &&
!allowedRoles[roleId]?.includes(urlRole)
){

toast.error("You are not allowed to access this role");

router.replace(`/dashboard?role=${roleId}`);

}


},[searchParams,roleId]);
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





// 2. Dashboard home par sirf cards show honge
if(isDashboardHome){

  setUsers([]);

  setPagination({});

  return;

}





// 3. Sidebar se role select hua hai
let roleFilter = selectedRole;



// 4. Agar sidebar se role select nahi hua
if(!roleFilter){

  roleFilter = Number(roleId) + 1;

}




// 5. Table ke liye users fetch
const res = await getAllStaffData(
  page,
  10,
  roleFilter
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

<div className="  bg-gray-100">

<main className="pt-0 p-0 ">



<h1 className="md:text-3xl font-bold md:mb-6  mb-0 text-[20px]">
Welcome Dashboard
</h1>

{
isDashboardHome && (

<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">


{

cards

.filter((card)=>{


// Master Admin sab dekhega
if(roleId === 0){

return true;

}


// baki role apne niche wale dekhenge
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

)
}

{
!isDashboardHome && (

<UsersTable
  users={users}
  page={page}
  pagination={pagination}
  setPage={setPage}
  getRoleName={getRoleName}
  selectedRole={Number(selectedRole)}
  handleRoleList={handleRoleList}
/>

)
}
</main>


</div>





);


}