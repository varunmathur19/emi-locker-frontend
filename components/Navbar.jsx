"use client";

import { useRouter } from "next/navigation";
import { RiLogoutBoxLine, RiUserLine } from "react-icons/ri";

export default function Navbar() {

  const router = useRouter();

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");

  };


  const user = 
    typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};


  return (

    <nav className="h-16 bg-white shadow flex items-center justify-between px-6">


      {/* Logo */}

      <div className="text-2xl font-bold text-blue-600">
        RechargeKit
      </div>



      {/* Right Side */}

      <div className="flex items-center gap-5">


        <div className="flex items-center gap-2">

          <RiUserLine size={22}/>

          <div>

            <p className="font-semibold">
              {user.name || "User"}
            </p>

            <span className="text-sm text-gray-500">
              Role ID : {user.role_id}
            </span>

          </div>


        </div>



        <button
        onClick={logout}
        className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md"
        >

        <RiLogoutBoxLine/>

        Logout

        </button>


      </div>



    </nav>

  );
}