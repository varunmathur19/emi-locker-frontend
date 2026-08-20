"use client";

import Link from "next/link";

import {
  getRoleId,
  getOriginalRoleId,
  removeToken,
  restoreOriginalLogin,
} from "@/utils/token";

import { logoutStaff , getModules } from "@/services/api";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

import {
  RiDashboardLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiBuilding2Line,
  RiStore2Line,
  RiUserLocationLine,
  RiUser3Line,
  RiLogoutBoxLine,
  RiLoginBoxLine,
} from "react-icons/ri";

const iconMap = {
  RiDashboardLine,
  RiShieldUserLine,
  RiUserStarLine,
  RiBuilding2Line,
  RiStore2Line,
  RiUserLocationLine,
  RiUser3Line,
  RiLogoutBoxLine,
  RiLoginBoxLine,
};
export default function Sidebar({
  sidebarOpen,
}) {

  // =====================================================
  // CURRENT LOGGED-IN ROLE
  // =====================================================

  const [roleId, setRoleId] = useState(null);
  const [modules, setModules] = useState([]);

  // =====================================================
  // PATH
  // =====================================================

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const activeRole =
    searchParams.get("role") ||
    searchParams.get("role_id");

    useEffect(() => {
  const loadModules = async () => {
    try {
      const response = await getModules();

      console.log(
        "MODULE API RESPONSE:",
        response
      );

      if (
        response?.success &&
        Array.isArray(response?.modules)
      ) {
        setModules(response.modules);
      } else {
        setModules([]);
      }

    } catch (error) {
      console.error(
        "Get Modules Error:",
        error
      );

      setModules([]);
    }
  };

  loadModules();

}, []);

  // =====================================================
  // GET CURRENT ROLE
  // =====================================================

  useEffect(() => {

    const currentRole = getRoleId();

    const originalRole = getOriginalRoleId();

    console.log(
      "======================================"
    );

    console.log(
      "SIDEBAR ROLE"
    );

    console.log(
      "Current Role:",
      currentRole
    );

    console.log(
      "Original Role:",
      originalRole
    );

    console.log(
      "======================================"
    );

    // =================================================
    // IMPORTANT
    //
    // Sidebar current logged-in user ka role use karega.
    //
    // Example:
    //
    // Master Admin login:
    // currentRole = 0
    //
    // Master Admin -> Login As Admin:
    // currentRole = 1
    // originalRole = 0
    //
    // Is case me sidebar ADMIN ka show hoga.
    // =================================================

    if (
      currentRole !== null &&
      currentRole !== undefined
    ) {

      setRoleId(
        Number(currentRole)
      );

    }

  }, []);

  // =====================================================
  // MY LOGIN
  // =====================================================

  const myLogin = () => {

    console.log(
      "Restoring Original Login..."
    );

    const restored =
      restoreOriginalLogin();

    if (!restored) {

      alert(
        "Original login session not found"
      );

      return;
    }

    window.location.href =
      "/dashboard";

  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {

    console.log(
      "Logout button clicked"
    );

    try {

      await logoutStaff();

      removeToken();

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "original_token"
      );

      window.location.href = "/";

    } catch (error) {

      console.log(
        "Logout API error:",
        error
      );

      // API fail hone par bhi logout
      removeToken();

      localStorage.removeItem(
        "user"
      );

      localStorage.removeItem(
        "original_token"
      );

      window.location.href = "/";

    }

  };

  // =====================================================
  // ROLE NOT LOADED
  // =====================================================

  if (roleId === null) {

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
          ${
            sidebarOpen
              ? "w-64 p-5"
              : "w-0 p-0"
          }
        `}
      >

        <h2
          className="
            relative
            text-2xl
            font-bold
            mb-6
            after:content-['']
            after:absolute
            after:left-0
            after:-bottom-3
            after:w-full
            after:h-[1px]
            after:bg-gray-300
          "
        >
          Dashboard
        </h2>

      </aside>

    );

  }

  const roleMap = {
  cnf: {
    role: 2,
    label: "CNF",
    icon: (
      <RiUserStarLine
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  "super distributer": {
    role: 3,
    label: "Super Distributor",
    icon: (
      <RiBuilding2Line
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  "super distributor": {
    role: 3,
    label: "Super Distributor",
    icon: (
      <RiBuilding2Line
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  distributor: {
    role: 4,
    label: "Distributor",
    icon: (
      <RiStore2Line
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  fos: {
    role: 5,
    label: "FOS",
    icon: (
      <RiUserLocationLine
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  retailer: {
    role: 6,
    label: "Retailer",
    icon: (
      <RiStore2Line
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  "sub retailer": {
    role: 7,
    label: "Sub Retailer",
    icon: (
      <RiUser3Line
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  employee: {
    role: 8,
    label: "Employee",
    icon: (
      <RiUser3Line
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },

  staff: {
    role: 9,
    label: "Staff",
    icon: (
      <RiShieldUserLine
        size={18}
        className="text-[1.4rem]"
      />
    ),
  },
};

  // =====================================================
  // ROLE LINK COMPONENT
  // =====================================================

  const RoleLink = ({
    role,
    label,
    icon,
  }) => {

    return (

      <Link
        href={`/dashboard?role=${role}`}
        className={`
          flex
          items-center
          gap-3
          p-3
          rounded
          transition-all
          font-semibold
          ${
            activeRole === String(role)
              ? "bg-blue-400 text-black"
              : "hover:bg-gray-700"
          }
        `}
      >

        {icon}

        {label}

      </Link>

    );

  };
 const renderModuleLinks = () => {

  return modules.map((moduleName, index) => {

    const key = String(moduleName)
      .trim()
      .toLowerCase();

    const module = roleMap[key];

    // Existing role/module
    if (module) {

      return (
        <RoleLink
          key={`${key}-${index}`}
          role={module.role}
          label={module.label}
          icon={module.icon}
        />
      );

    }

    // New/custom module
    return (
      <Link
        key={`${key}-${index}`}
        href={`/dashboard?module=${encodeURIComponent(moduleName)}`}
        className="
          flex
          items-center
          gap-3
          p-3
          rounded
          transition-all
          font-semibold
          hover:bg-gray-700
        "
      >

        <RiBuilding2Line
          size={18}
          className="text-[1.4rem]"
        />

        {moduleName}

      </Link>
    );

  });

};

  // =====================================================
  // SIDEBAR
  // =====================================================

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
        ${
          sidebarOpen
            ? "w-64 p-5"
            : "w-0 p-0"
        }
      `}
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <h2
        className="
          relative
          text-2xl
          font-bold
          mb-6
          flex-shrink-0
          after:content-['']
          after:absolute
          after:left-0
          after:-bottom-3
          after:w-full
          after:h-[1px]
          after:bg-gray-300
        "
      >
        Dashboard
      </h2>


      {/* =================================================
          SCROLLABLE CONTENT
      ================================================= */}

      <div
        className="
          flex-1
          overflow-y-auto
          overflow-x-hidden
          space-y-2
          pb-5
          scrollbar-hide
        "
      >

        {/* =================================================
            DASHBOARD
        ================================================= */}

        <Link
          href="/dashboard"
          className={`
            flex
            items-center
            gap-3
            p-3
            rounded
            transition-all
            font-semibold
            ${
              pathname === "/dashboard" &&
              !activeRole
                ? "bg-blue-400 text-black"
                : "hover:bg-gray-700"
            }
          `}
        >

          <RiDashboardLine
            size={18}
            className="text-[1.4rem]"
          />

          Dashboard

        </Link>


        {/* =================================================
    MASTER ADMIN - ROLE 0
================================================= */}

{Number(roleId) === 0 && (

  <>

    {/* Admin */}
    <RoleLink
      role={1}
      label="Admin"
      icon={
        <RiShieldUserLine
          size={18}
          className="text-[1.4rem]"
        />
      }
    />

    {/* Module */}
    <Link
      href="/dashboard/modules"
      className={`
        flex
        items-center
        gap-3
        p-3
        rounded
        transition-all
        font-semibold
        ${
          pathname === "/modules"
            ? "bg-blue-400 text-black"
            : "hover:bg-gray-700"
        }
      `}
    >
      <RiBuilding2Line
        size={18}
        className="text-[1.4rem]"
      />

      Module
    </Link>

    {/* Sub Module */}
    <Link
      href="/dashboard/sub-modules"
      className={`
        flex
        items-center
        gap-3
        p-3
        rounded
        transition-all
        font-semibold
        ${
          pathname === "/sub-modules"
            ? "bg-blue-400 text-black"
            : "hover:bg-gray-700"
        }
      `}
    >
      <RiStore2Line
        size={18}
        className="text-[1.4rem]"
      />

      Sub Module
    </Link>

  </>

)}


        {/* =================================================
            ADMIN - ROLE 1
        =================================================

            Admin login hone ke baad:

            CNF
            Super Distributor
            Distributor
            FOS
            Retailer
            Sub Retailer
            Employee
            Staff

            show honge.
        ================================================= */}

        {Number(roleId) === 1 && (
  <>
    {/* API MODULES */}
    {renderModuleLinks()}
    {/* STATIC EMPLOYEE */}
    <RoleLink
      role={8}
      label="Employee"
      icon={
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      }
    />

    {/* STATIC STAFF */}
    <RoleLink
      role={9}
      label="Staff"
      icon={
        <RiShieldUserLine
          size={18}
          className="text-[1.4rem]"
        />
      }
    />
  </>
)}


        {/* =================================================
            CNF - ROLE 2
        ================================================= */}

  {Number(roleId) === 2 && (
  <>
   {renderModuleLinks()}

    {/* STATIC EMPLOYEE */}
    <RoleLink
      role={8}
      label="Employee"
      icon={
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      }
    />
  </>
)}

        {/* =================================================
            SUPER DISTRIBUTOR - ROLE 3
        ================================================= */}

     {Number(roleId) === 3 && (
  <>
    {renderModuleLinks()}

    {/* STATIC EMPLOYEE */}
    <RoleLink
      role={8}
      label="Employee"
      icon={
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      }
    />
  </>
)}


        {/* =================================================
            DISTRIBUTOR - ROLE 4
        ================================================= */}

     {Number(roleId) === 4 && (
  <>
    {renderModuleLinks()}

    {/* STATIC EMPLOYEE */}
    <RoleLink
      role={8}
      label="Employee"
      icon={
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      }
    />
  </>
)}

        {/* =================================================
            FOS - ROLE 5
        ================================================= */}

       {Number(roleId) === 5 && (
  <>
    {renderModuleLinks()}

    {/* STATIC EMPLOYEE */}
    <RoleLink
      role={8}
      label="Employee"
      icon={
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      }
    />
  </>
)}


        {/* =================================================
            RETAILER - ROLE 6
        ================================================= */}

      {Number(roleId) === 6 && (
  <>
   {renderModuleLinks()}

    {/* STATIC EMPLOYEE */}
    <RoleLink
      role={8}
      label="Employee"
      icon={
        <RiUser3Line
          size={18}
          className="text-[1.4rem]"
        />
      }
    />
  </>
)}

        {/* =================================================
            SUB RETAILER - ROLE 7
        ================================================= */}



        {/* =================================================
            EMPLOYEE - ROLE 8

            No child role
        ================================================= */}


        {/* =================================================
            MY LOGIN
        ================================================= */}

        <button
          type="button"
          onClick={myLogin}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-blue-500
            text-white
            px-4
            py-3
            rounded-md
            hover:bg-blue-600
            transition-all
            cursor-pointer
            font-semibold
            mt-4
          "
        >

          <RiLoginBoxLine
            size={20}
          />

          My Login

        </button>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <button
          type="button"
          onClick={logout}
          className="
            w-full
            flex
            items-center
            justify-center
            gap-2
            bg-red-500
            text-white
            px-4
            py-3
            rounded-md
            hover:bg-red-600
            transition-all
            cursor-pointer
            font-semibold
          "
        >

          <RiLogoutBoxLine
            size={20}
          />

          Logout

        </button>

      </div>

    </aside>

  );

}