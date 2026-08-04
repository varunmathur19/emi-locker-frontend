"use client";


import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";


export default function Dashboard(){


return(

<div className="flex min-h-screen bg-gray-100">


{/* Sidebar */}

<Sidebar/>



<div className="flex-1">


{/* Navbar */}

<Navbar/>




<main className="p-6">


<h1 className="text-3xl font-bold mb-6">
Welcome Dashboard
</h1>



<div className="grid grid-cols-1 md:grid-cols-4 gap-5">


<div className="bg-white p-5 rounded-xl shadow">

<h3 className="text-gray-500">
Total Users
</h3>

<p className="text-3xl font-bold">
100
</p>

</div>




<div className="bg-white p-5 rounded-xl shadow">

<h3 className="text-gray-500">
CNF
</h3>

<p className="text-3xl font-bold">
20
</p>

</div>




<div className="bg-white p-5 rounded-xl shadow">

<h3 className="text-gray-500">
Distributor
</h3>

<p className="text-3xl font-bold">
40
</p>

</div>





<div className="bg-white p-5 rounded-xl shadow">

<h3 className="text-gray-500">
Retailer
</h3>

<p className="text-3xl font-bold">
40
</p>

</div>



</div>




<div className="mt-8 bg-white rounded-xl shadow p-6">


<h2 className="text-xl font-bold mb-4">
Recent Users
</h2>



<table className="w-full">


<thead>

<tr className="border-b">

<th className="text-left p-3">
Name
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


<tr className="border-b">

<td className="p-3">
Rahul
</td>

<td>
Distributor
</td>

<td>
Active
</td>


</tr>



</tbody>


</table>


</div>




</main>



</div>
</div>


)

}