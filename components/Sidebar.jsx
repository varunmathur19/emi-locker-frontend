"use client";

import Link from "next/link";
import { getRoleId } from "@/utils/token";

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
} from "react-icons/ri";

export default function Sidebar() {
  const roleId = getRoleId();

  return (
    <aside className="w-64 min-h-screen bg-gray-900 text-white p-5">

      <h2 className="text-2xl font-bold mb-8">
        Dashboard
      </h2>

      <div className="space-y-2">

        {/* <Link
          href="/dashboard"
          className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
        >
          <RiDashboardLine />
          Dashboard
        </Link> */}



       

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
 className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
>
<RiShieldUserLine />
Admin
</Link>
        )}

        {/* CNF */}
        {roleId < 2 && (
         <Link
 href="/dashboard?role=2"
 className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
>
<RiUserStarLine />
CNF
</Link>
        )}

        {/* Super Distributor */}
        {roleId < 3 && (
          <Link
 href="/dashboard?role=3"
 className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
>
<RiBuilding2Line />
Super Distributor
</Link>
        )}

        {/* Distributor */}
        {roleId < 4 && (
          <Link
 href="/dashboard?role=4"
 className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
>
<RiStore2Line />
Distributor
</Link>
        )}

        {/* FOS */}
        {roleId < 5 && (
          <Link
 href="/dashboard?role=5"
 className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
>
<RiUserLocationLine />
FOS
</Link>
        )}

        {/* Retailer */}
        {roleId < 6 && (
         <Link
 href="/dashboard?role=6"
 className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
>
<RiStore2Line />
Retailer
</Link>
        )}

        {/* Employee */}
        {roleId < 7 && (
          <Link
 href="/dashboard?role=7"
 className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
>
<RiUser3Line />
Employee
</Link>
        )}

        <Link
          href="/settings"
          className="flex items-center gap-3 p-3 rounded hover:bg-gray-700"
        >
          <RiSettingsLine />
          Settings
        </Link>

      </div>
    </aside>
  );
}