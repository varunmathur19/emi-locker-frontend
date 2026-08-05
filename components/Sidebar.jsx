"use client";

import Link from "next/link";
import { getRoleId } from "@/utils/token";
import { usePathname, useSearchParams } from "next/navigation";

import {
  RiDashboardLine,
  RiUserAddLine,
  RiTeamLine,
  RiSettingsLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiBuilding2Line,
  RiStore2Line,
  RiUserLocationLine,
  RiUser3Line,
    RiLogoutBoxLine,
} from "react-icons/ri";

export default function Sidebar({sidebarOpen}) {
  const roleId = getRoleId();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeRole = searchParams.get("role");

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  return (
<aside
  className={`
    fixed
    top-0
    left-0
    h-screen
    bg-gray-900
    text-white
    flex
    flex-col
    overflow-hidden
    transition-all
    duration-300
    ease-in-out
    z-40
    ${sidebarOpen ? "w-64 p-5" : "w-0 p-0"}
  `}
>

      {/* <h2 className="text-2xl font-bold mb-4 ">
        Dashboard
      </h2> */}
      <h2 className="relative text-2xl font-bold mb-6 after:content-[''] after:absolute after:left-0 after:-bottom-3 after:w-full after:h-[1px] after:bg-gray-300">
  Dashboard
</h2>
     

      <div className="space-y-2 flex-1 overflow-y-auto pb-24 scrollbar-hide">

       <Link
 href="/dashboard"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   pathname === "/dashboard" && !activeRole
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
 <RiDashboardLine 
  size={18}
  className="text-[1.4rem]"
/>
  Dashboard
</Link>



       

        {/* Master Admin */}
        {/* {roleId === 0 && (
          <Link
            href="/master-admin"
            className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
          >
            <RiShieldUserLine />
            Master Admin
          </Link>
        )} */}

        {/* Admin */}
        {roleId < 1 && (
         <Link
 href="/dashboard?role=1"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   activeRole === "1"
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
<RiShieldUserLine  size={18}
  className="text-[1.4rem]" />
Admin
</Link>
        )}

        {/* CNF */}
        {roleId < 2 && (
         <Link
 href="/dashboard?role=2"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   activeRole === "2"
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
<RiUserStarLine  size={18}
  className="text-[1.4rem]"/>
CNF
</Link>
        )}

        {/* Super Distributor */}
        {roleId < 3 && (
          <Link
 href="/dashboard?role=3"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   activeRole === "3"
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
<RiBuilding2Line  size={18}
  className="text-[1.4rem]" />
Super Distributor
</Link>
        )}

        {/* Distributor */}
        {roleId < 4 && (
         <Link
 href="/dashboard?role=4"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   activeRole === "4"
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
<RiStore2Line  size={18}
  className="text-[1.4rem]" />
Distributor
</Link>
        )}

        {/* FOS */}
        {roleId < 5 && (
          <Link
 href="/dashboard?role=5"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   activeRole === "5"
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
<RiUserLocationLine  size={18}
  className="text-[1.4rem]" />
FOS
</Link>
        )}

        {/* Retailer */}
        {roleId < 6 && (
         <Link
 href="/dashboard?role=6"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   activeRole === "6"
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
<RiStore2Line  size={18}
  className="text-[1.4rem]" />
Retailer
</Link>
        )}

        {/* Employee */}
        {roleId < 7 && (
         <Link
 href="/dashboard?role=7"
 className={`flex items-center gap-3 p-3 rounded transition-all font-semibold ${
   activeRole === "7"
   ? "bg-blue-400 text-black"
   : "hover:bg-gray-700"
 }`}
>
<RiUser3Line  size={18}
  className="text-[1.4rem]" />
Employee
</Link>
        )}

        {/* <Link
          href="/settings"
          className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
        >
          <RiSettingsLine />
          Settings
        </Link> */}
       <button
  onClick={logout}
  className={`fixed bottom-5 left-5 w-[216px] flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-3 rounded-md hover:bg-red-600 transition-all cursor-pointer ${
    sidebarOpen 
    ? "opacity-100 translate-x-0" 
    : "opacity-0 -translate-x-10 pointer-events-none"
  }`}
>
  <RiLogoutBoxLine />
  Logout
</button>

      </div>
    </aside>
  );
}