  "use client";

  import { useRouter } from "next/navigation";
  import { RiLogoutBoxLine, } from "react-icons/ri";
  import { getRoleId } from "@/utils/token";
  import {
    RiUserLine,
    RiMenuLine,
  } from "react-icons/ri";

  export default function Navbar({ sidebarOpen,
  setSidebarOpen,}) {
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

    const roleId = getRoleId();

    const roleNames = {
      0: "Master Admin",
      1: "Admin",
      2: "CNF",
      3: "Super Distributor",
      4: "Distributor",
      5: "FOS",
      6: "Retailer",
      7: "Employee",
    };

    const roleName = roleNames[roleId] || "User";

    return (
      // <nav className="h-16  bg-white shadow flex items-center justify-between px-6">
     <nav
  className={`fixed top-0 right-0 z-50 h-16 bg-white shadow flex items-center justify-between px-6 transition-all duration-300 ${
    sidebarOpen ? "left-64" : "left-0"
  }`}
>

        {/* Left */}
       {/* Left */}
<div className="flex items-center md:gap-4 gap-1">

 <button
  onClick={() => setSidebarOpen(!sidebarOpen)}
  className="text-3xl cursor-pointer"
>
  <RiMenuLine />
</button>

  <div>
    <h1 className="md:text-2xl font-bold text-blue-500 text-[20px]">
      RechargeKit
    </h1>

    {/* <p className="text-sm text-gray-500">
      Welcome, <span className="font-semibold md:text-[18px]">{roleName}</span>
    </p> */}
  </div>

</div>

        {/* Right */}
        <div className="flex items-center gap-5">

          <div className="flex items-center md:gap-2 gap-1">
            <RiUserLine size={22} />

            <div>
              <p className="font-semibold md:text-2xl text-[15px]">
                {user.name || roleName}
              </p>
              {/* <span className="text-sm text-gray-500">
                {roleName}
              </span> */}
            </div>
          </div>
           

        

        </div>
      </nav>
    );
  }