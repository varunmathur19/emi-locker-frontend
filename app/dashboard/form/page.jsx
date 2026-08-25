"use client";

import {
  addStaff,
  getDropdownUsers,
} from "@/services/api";

import {
  getUserFromToken,
} from "@/utils/token";

import {
  RiEyeLine,
  RiEyeOffLine,
  RiArrowDownSLine,
} from "react-icons/ri";

import Link from "next/link";

import {
  Country,
  State,
  City,
} from "country-state-city";

import {
  useState,
  useEffect,
  useRef
} from "react";

import {
  useSearchParams,
} from "next/navigation";

import {
  toast,
} from "react-toastify";


// =====================================================
// INITIAL FORM DATA
// =====================================================

const initialFormData = {

  organization_name: "",

  role_id: "",

  name: "",

  email: "",

  phone: "",

  password: "",

  confirm_password: "",

  company_address: "",

  country: "",

  state: "",

  city: "",


  // ===================================================
  // PARENT HIERARCHY
  // ===================================================

  parent_admin_id: null,

  parent_cnf_id: null,

  parent_super_distributor_id: null,

  parent_distributor_id: null,

  parent_fos_id: null,

  parent_retailer_id: null,
  parent_sub_retailer_id: null,

  parent_employee_id: null,

  parent_staff_id: null,


  // ===================================================
  // DEVICE PERMISSIONS
  // ===================================================

  new_device: 0,

  old_device: 0,

  supreme_device: 0,

  pro_star: 0,

  lite: 0,

  google_tv: 0,

  supreme_lock: 0,
};


// =====================================================
// ROLE -> PARENT FIELD
// =====================================================

const roleParentField = {
  1: "parent_admin_id",
  2: "parent_cnf_id",
  3: "parent_super_distributor_id",
  4: "parent_distributor_id",
  5: "parent_fos_id",
  6: "parent_retailer_id",
  7: "parent_sub_retailer_id",
  8: "parent_employee_id",
  9: "parent_staff_id",
};


// =====================================================
// CREATE ROLE -> IMMEDIATE PARENT FIELD
//
// IMPORTANT
//
// Ye parent_id decide karega.
// =====================================================

const immediateParentField = {
  1: null,
  2: "parent_admin_id",
  3: "parent_cnf_id",
  4: "parent_super_distributor_id",
  5: "parent_distributor_id",
  6: "parent_fos_id",
  7: "parent_retailer_id",
  8: "parent_sub_retailer_id",
  9: "parent_admin_id",
};


// =====================================================
// COMPONENT
// =====================================================

export default function Page() {

  const searchParams =
    useSearchParams();


  // ===================================================
  // FORM
  // ===================================================

  const [
    formData,
    setFormData,
  ] = useState(initialFormData);


  // ===================================================
  // PARENT USERS
  // ===================================================

  const [
    parentUsers,
    setParentUsers,
  ] = useState({});

  const [
  disabledParentRoles,
  setDisabledParentRoles,
] = useState({});

const [openDropdown, setOpenDropdown] = useState(null);

const [parentSearch, setParentSearch] = useState({});

const [searchLoading, setSearchLoading] = useState({});



  // ===================================================
  // CNF ADMIN
  // ===================================================

  const [
    cnfAdmin,
    setCnfAdmin,
  ] = useState(null);


  const [
    cnfAdmins,
    setCnfAdmins,
  ] = useState([]);


  // ===================================================
  // PASSWORD
  // ===================================================

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);


  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);


  // ===================================================
  // SELECTED ROLE
  // ===================================================

  const selectedRole =
    Number(
      searchParams.get("role_id")
    );


  // ===================================================
  // LOGGED USER
  // ===================================================

  const loggedInUser =
    getUserFromToken();


  const loggedInRoleId =
    Number(
      loggedInUser?.role_id
    );


  // ===================================================
  // ROLE BUTTONS
  // ===================================================

 const roleButtons = {

  1: "Add Admin",

  2: "Add CNF",

  3: "Add Super Distributor",

  4: "Add Distributor",

  5: "Add FOS",

  6: "Add Retailer",

  7: "Add Sub Retailer",

  8: "Add Employee",

  9: "Add Staff",

};


  // ===================================================
  // PARENT ROLES
  // ===================================================

  const parentRoles = {

  2: [1],

  3: [2],

  4: [2, 3],

  5: [2, 3, 4],

  6: [2, 3, 4, 5],

  7: [2, 3, 4, 5, 6],

  8: [2, 3, 4, 5, 6, 7],

  9: [1],

};
// const getFilteredParentUsers = (
//   role,
//   users
// ) => {

//   const search =
//     (
//       parentSearch[role] || ""
//     ).toLowerCase().trim();

//   if (!search) {
//     return users;
//   }

//   return users.filter((user) => {

//     const name =
//       String(
//         user.name || ""
//       ).toLowerCase();

//     const email =
//       String(
//         user.email || ""
//       ).toLowerCase();

//     const phone =
//       String(
//         user.phone || ""
//       ).toLowerCase();

//     return (
//       name.includes(search) ||
//       email.includes(search) ||
//       phone.includes(search)
//     );

//   });
// };

const handleParentDisable = (
  roleId,
  disabled
) => {

  const role =
    Number(roleId);

setDisabledParentRoles(
  (prev) => ({
    ...prev,
    [role]: disabled,
  })
);

  // =================================================
  // Disable karte hi selected value clear
  // =================================================

  if (disabled) {

    const field =
      roleParentField[role];

    if (field) {

      setFormData(
        (prev) => ({
          ...prev,
          [field]: null,
        })
      );

    }

  }

};


  // ===================================================
  // VISIBLE PARENT ROLES
  // ===================================================

const visibleParentRoles = (
  parentRoles[selectedRole] || []
).filter((roleId) => {

  const role =
    Number(roleId);

  const loggedRole =
    Number(loggedInRoleId);

  const createRole =
    Number(selectedRole);


  // =================================================
  // MASTER ADMIN
  // =================================================

  if (
    loggedRole === 0
  ) {

    return (
      role < createRole
    );

  }


  // =================================================
  // LOGGED-IN ROLE
  //
  // Apne aap ko dropdown mein mat dikhao
  // =================================================

  if (
    role === loggedRole
  ) {

    return false;

  }


  // =================================================
  // LOGGED-IN USER SE UPAR KE ROLES HIDE
  // =================================================

  if (
    role < loggedRole
  ) {

    return false;

  }


  // =================================================
  // SIRF BEECH KE PARENT ROLES
  // =================================================

  return (
    role > loggedRole &&
    role < createRole
  );

});


  // =====================================================
  // ROLE NAME
  // =====================================================

  const getRoleName = (roleId) => {

  const roles = {

    0: "Master Admin",

    1: "Admin",

    2: "CNF",

    3: "Super Distributor",

    4: "Distributor",

    5: "FOS",

    6: "Retailer",

    7: "Sub Retailer",

    8: "Employee",

    9: "Staff",

  };

  return roles[roleId] || "User";
};


  // =====================================================
  // LOAD PARENT USERS
  // =====================================================

 const loadParentUsers = async (
  roleId,
  parentId = null
) => {
  try {
    console.log("=================================");
    console.log("HIERARCHY DROPDOWN API");
    console.log("Role ID:", roleId);
    console.log("Parent ID:", parentId);

    const res = await getDropdownUsers(
      Number(roleId),
      parentId
        ? Number(parentId)
        : null
    );

    console.log("DROPDOWN RESPONSE:", res);

    const users =
      Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.data?.users)
        ? res.data.users
        : Array.isArray(res?.users)
        ? res.users
        : [];

    // Backend agar actual returned role bhej raha hai
   const returnedRoleId =
  Number(
    res?.current_role_id ||
    res?.data?.current_role_id ||
    0
  );

setParentUsers((prev) => ({
  ...prev,

  [Number(roleId)]: users,

  ...(returnedRoleId
    ? {
        [returnedRoleId]: users,
      }
    : {}),
}));

  } catch (error) {
    console.error(
      "Dropdown Error:",
      error?.response?.data ||
      error
    );
  }
};


  // =====================================================
  // LOAD INITIAL PARENT DATA
  // =====================================================

useEffect(() => {

  // ===================================================
  // INVALID ROLE
  // ===================================================

  if (
    !selectedRole ||
    selectedRole <= 1
  ) {

    return;

  }


  // ===================================================
  // LOGGED-IN USER
  // ===================================================

  const user =
    getUserFromToken();


  if (!user?.id) {

    console.log(
      "Logged-in user not found"
    );

    return;

  }


  const currentLoggedRole =
    Number(
      user.role_id
    );


  const currentSelectedRole =
    Number(
      selectedRole
    );


  const loggedUserId =
    Number(
      user.id
    );


  // ===================================================
  // EXISTING HIERARCHY
  // ===================================================

  setFormData(
    (prev) => ({

      ...prev,


      parent_admin_id:
        user.parent_admin_id
          ? Number(
              user.parent_admin_id
            )
          : null,


      parent_cnf_id:
        user.parent_cnf_id
          ? Number(
              user.parent_cnf_id
            )
          : null,


      parent_super_distributor_id:
        user.parent_super_distributor_id
          ? Number(
              user.parent_super_distributor_id
            )
          : null,


      parent_distributor_id:
        user.parent_distributor_id
          ? Number(
              user.parent_distributor_id
            )
          : null,


      parent_fos_id:
        user.parent_fos_id
          ? Number(
              user.parent_fos_id
            )
          : null,


      parent_retailer_id:
        user.parent_retailer_id
          ? Number(
              user.parent_retailer_id
            )
          : null,


      parent_sub_retailer_id:
        user.parent_sub_retailer_id
          ? Number(
              user.parent_sub_retailer_id
            )
          : null,


      parent_employee_id:
        user.parent_employee_id
          ? Number(
              user.parent_employee_id
            )
          : null,


      parent_staff_id:
        user.parent_staff_id
          ? Number(
              user.parent_staff_id
            )
          : null,


      // =================================================
      // LOGGED USER AS PARENT
      // =================================================

      ...(currentLoggedRole === 1 && {

        parent_admin_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 2 && {

        parent_cnf_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 3 && {

        parent_super_distributor_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 4 && {

        parent_distributor_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 5 && {

        parent_fos_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 6 && {

        parent_retailer_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 7 && {

        parent_sub_retailer_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 8 && {

        parent_employee_id:
          loggedUserId,

      }),


      ...(currentLoggedRole === 9 && {

        parent_staff_id:
          loggedUserId,

      }),

    })
  );


  // ===================================================
  // CNF CREATE
  //
  // CNF ke liye Admin parent chahiye
  // ===================================================

  if (
    currentSelectedRole === 2
  ) {

    const loadAdminForCNF =
      async () => {

        try {

          const res =
            await getDropdownUsers(
              1,
              null
            );


          console.log(
            "CNF ADMIN RESPONSE:",
            res
          );


          const admins =

            Array.isArray(
              res?.data
            )

              ? res.data

              : Array.isArray(
                  res?.data?.data
                )

              ? res.data.data

              : Array.isArray(
                  res?.data?.users
                )

              ? res.data.users

              : Array.isArray(
                  res?.users
                )

              ? res.users

              : [];


          console.log(
            "CNF ADMINS:",
            admins
          );


          setCnfAdmins(
            admins
          );


          setParentUsers(
            (prev) => ({

              ...prev,

              1:
                admins,

            })
          );


          // =================================================
          // ONLY ONE ADMIN
          // =================================================

          if (
            admins.length === 1
          ) {

            const admin =
              admins[0];


            setCnfAdmin(
              admin
            );


            setFormData(
              (prev) => ({

                ...prev,

                parent_admin_id:
                  Number(
                    admin.id
                  ),

              })
            );

          }


          // =================================================
          // MULTIPLE ADMINS
          // =================================================

          else {

            setCnfAdmin(
              null
            );


            setFormData(
              (prev) => ({

                ...prev,

                parent_admin_id:
                  null,

              })
            );

          }

        } catch (error) {

          console.error(
            "CNF ADMIN ERROR:",
            error?.response?.data ||
            error
          );

        }

      };


    loadAdminForCNF();


    return;

  }


  // ===================================================
  // OTHER ROLES
  // ===================================================

  const parents =
    visibleParentRoles;


  if (
    !parents.length
  ) {

    console.log(
      "No parent roles available"
    );

    return;

  }


  // ===================================================
  // FILTER PARENT ROLES
  //
  // Logged-in role se upar ke roles remove honge.
  //
  // Example:
  //
  // CNF Login (2)
  // Create Retailer (6)
  //
  // [3,4,5]
  //
  //
  // Super Distributor Login (3)
  // Create Retailer (6)
  //
  // [4,5]
  //
  //
  // Distributor Login (4)
  // Create Retailer (6)
  //
  // [5]
  // ===================================================

  const filteredParents =
    parents.filter(
      (roleId) => {

        const role =
          Number(
            roleId
          );


        return (
          role > currentLoggedRole &&
          role < currentSelectedRole
        );

      }
    );


  console.log(
    "================================="
  );

  console.log(
    "LOGGED USER ROLE:",
    currentLoggedRole
  );

  console.log(
    "LOGGED USER ID:",
    loggedUserId
  );

  console.log(
    "CREATE ROLE:",
    currentSelectedRole
  );

  console.log(
    "VISIBLE PARENT ROLES:",
    parents
  );

  console.log(
    "FILTERED PARENT ROLES:",
    filteredParents
  );


  // ===================================================
  // NO VALID PARENT
  // ===================================================

  if (
    !filteredParents.length
  ) {

    console.log(
      "No valid parent dropdown found"
    );

    return;

  }


  // ===================================================
  // FIRST PARENT ROLE
  // ===================================================

  const firstParentRole =
    filteredParents[0];


  console.log(
    "FIRST DROPDOWN ROLE:",
    firstParentRole
  );


  // ===================================================
  // LOAD FIRST DROPDOWN
  // ===================================================

  const loadFirstParent =
    async () => {

      try {

        // ------------------------------------------------
        // IMPORTANT
        //
        // Logged-in user's ID parent_id ke roop mein
        // bheja ja raha hai.
        //
        // Example:
        //
        // Distributor login:
        //
        // getDropdownUsers(
        //    5,
        //    distributorId
        // )
        //
        // Isse global FOS ki jagah
        // logged-in Distributor ke FOS milenge.
        // ------------------------------------------------

        const res =
          await getDropdownUsers(
            Number(
              firstParentRole
            ),
            loggedUserId
          );


        console.log(
          "FIRST PARENT API RESPONSE:",
          res
        );


        // =================================================
        // GET USERS
        // =================================================

        const users =

          Array.isArray(
            res?.data
          )

            ? res.data

            : Array.isArray(
                res?.data?.data
              )

            ? res.data.data

            : Array.isArray(
                res?.data?.users
              )

            ? res.data.users

            : Array.isArray(
                res?.users
              )

            ? res.users

            : [];


        console.log(
          "FIRST PARENT USERS:",
          users
        );


        // =================================================
        // SAVE DROPDOWN DATA
        // =================================================

        setParentUsers(
          (prev) => ({

            ...prev,

            [Number(
              firstParentRole
            )]:
              users,

          })
        );


      } catch (error) {

        console.error(
          "FIRST PARENT DROPDOWN ERROR:",
          error?.response?.data ||
          error
        );

      }

    };


  // ===================================================
  // CALL ASYNC FUNCTION
  // ===================================================

  loadFirstParent();


}, [
  selectedRole,
  loggedInRoleId,
]);

// =====================================================
// API SEARCH WITH DEBOUNCE
// =====================================================

useEffect(() => {

  if (
    openDropdown === null ||
    openDropdown === undefined
  ) {
    return;
  }

  const roleId =
    Number(openDropdown);

  const search =
    (
      parentSearch[roleId] || ""
    ).trim();

    const isPreviousRoleDisabled =
  (() => {

    const parents =
      parentRoles[selectedRole] || [];

    const currentIndex =
      parents.indexOf(roleId);

    if (currentIndex <= 0) {
      return false;
    }

    return parents
      .slice(0, currentIndex)
      .some(
        (role) =>
          disabledParentRoles[
            Number(role)
          ] === true
      );

  })();

  const parents =
    parentRoles[selectedRole] || [];

  const currentIndex =
    parents.indexOf(roleId);

  // ===================================================
  // FIND PARENT ID
  // ===================================================

let parentId = null;

if (currentIndex > 0) {

  for (
    let i = currentIndex - 1;
    i >= 0;
    i--
  ) {

    const previousRole =
      Number(parents[i]);

    // =============================================
    // IMPORTANT
    //
    // Agar previous role disabled hai,
    // toh uske upar ka parent use MAT karo.
    //
    // Next dropdown ko GLOBAL data chahiye.
    // =============================================

    if (
      disabledParentRoles[previousRole] === true
    ) {

      parentId = null;

      break;

    }

    const previousField =
      roleParentField[previousRole];

    if (
      previousField &&
      formData[previousField]
    ) {

      parentId =
        Number(
          formData[previousField]
        );

      break;

    }

  }

}

  // ===================================================
  // DEBOUNCE
  // ===================================================

  const timer =
    setTimeout(
      async () => {

        try {

          // =============================================
          // SHOW SEARCHING
          // =============================================

          setSearchLoading(
            (prev) => ({
              ...prev,
              [roleId]: true,
            })
          );

          console.log(
            "================================="
          );

          console.log(
            "API SEARCH STARTED"
          );

          console.log(
            "Role ID:",
            roleId
          );

          console.log(
            "Parent ID:",
            parentId
          );

          console.log(
            "Search:",
            search
          );

          // =============================================
          // API CALL
          // =============================================

          const response =
            await getDropdownUsers(
              roleId,
              parentId,
              search
            );

          // =============================================
          // RESPONSE
          // =============================================

          const users =
            getUsersFromResponse(
              response
            );

          // =============================================
          // SAVE USERS
          // =============================================

          setParentUsers(
            (prev) => ({
              ...prev,
              [roleId]: users,
            })
          );

          console.log(
            "API SEARCH SUCCESS:",
            {
              roleId,
              parentId,
              search,
              total: users.length,
              response,
            }
          );

        } catch (error) {

          console.error(
            "API SEARCH ERROR:",
            error?.response?.data ||
            error
          );

          setParentUsers(
            (prev) => ({
              ...prev,
              [roleId]: [],
            })
          );

        } finally {

          // =============================================
          // HIDE SEARCHING
          // =============================================

          setSearchLoading(
            (prev) => ({
              ...prev,
              [roleId]: false,
            })
          );

        }

      },
      400
    );

  return () =>
    clearTimeout(timer);

}, [
  openDropdown,
  parentSearch,
  selectedRole,
  formData,
  disabledParentRoles,
]);


  // =====================================================
  // ROLE ID FROM URL
  // =====================================================

  useEffect(() => {

    const roleId =
      searchParams.get(
        "role_id"
      );


    if (roleId) {

      setFormData(
        (prev) => ({

          ...prev,

          role_id:
            Number(roleId),

        })
      );

    }

  }, [searchParams]);


  // =====================================================
  // COUNTRY
  // =====================================================

  const countries =
    Country.getAllCountries();


  const states =
    formData.country

      ? State.getStatesOfCountry(
          formData.country
        )

      : [];


  const cities =

    formData.country &&
    formData.state

      ? City.getCitiesOfState(
          formData.country,
          formData.state
        )

      : [];


  // =====================================================
  // HANDLE CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value,
    } = e.target;


    setFormData(
      (prev) => {

        const updated = {

          ...prev,

          [name]: value,

        };


        if (
          name === "country"
        ) {

          updated.state = "";

          updated.city = "";

        }


        if (
          name === "state"
        ) {

          updated.city = "";

        }


        return updated;

      }
    );

  };


  // =====================================================
  // GET USERS FROM RESPONSE
  // =====================================================

  const getUsersFromResponse = (
    response
  ) => {

    if (
      Array.isArray(
        response?.data
      )
    ) {

      return response.data;

    }


    if (
      Array.isArray(
        response?.data?.data
      )
    ) {

      return response.data.data;

    }


    if (
      Array.isArray(
        response?.data?.users
      )
    ) {

      return response.data.users;

    }


    if (
      Array.isArray(
        response?.users
      )
    ) {

      return response.users;

    }


    return [];

  };


  // =====================================================
  // HANDLE PARENT CHANGE
  // =====================================================

  const handleParentChange = async (
    parentRoleId,
    parentId
  ) => {

    const currentRoleId =
      Number(parentRoleId);


    const selectedId =
      parentId
        ? Number(parentId)
        : null;


    const parents =
      visibleParentRoles;


    const currentIndex =
      parents.indexOf(
        currentRoleId
      );


    // ===================================================
    // SELECTED USER
    // ===================================================

    const selectedUser =
      (
        parentUsers[
          currentRoleId
        ] || []
      ).find(
        (user) =>
          Number(user.id) ===
          selectedId
      );


    // ===================================================
    // UPDATE FORM DATA
    // ===================================================

    setFormData(
      (prev) => {

        const updated = {
          ...prev,
        };


        // =================================================
        // ADMIN
        // =================================================

        if (
          currentRoleId === 1
        ) {

          updated.parent_admin_id =
            selectedId;

        }


        // =================================================
        // CNF
        // =================================================

        if (
          currentRoleId === 2
        ) {

          updated.parent_cnf_id =
            selectedId;


          if (
            selectedUser?.parent_admin_id
          ) {

            updated.parent_admin_id =
              Number(
                selectedUser.parent_admin_id
              );

          }

        }


        // =================================================
        // SUPER DISTRIBUTOR
        // =================================================

        if (
          currentRoleId === 3
        ) {

          updated.parent_super_distributor_id =
            selectedId;


          if (
            selectedUser?.parent_admin_id
          ) {

            updated.parent_admin_id =
              Number(
                selectedUser.parent_admin_id
              );

          }


          if (
            selectedUser?.parent_cnf_id
          ) {

            updated.parent_cnf_id =
              Number(
                selectedUser.parent_cnf_id
              );

          }

        }


        // =================================================
        // DISTRIBUTOR
        // =================================================

        if (
          currentRoleId === 4
        ) {

          updated.parent_distributor_id =
            selectedId;


          if (
            selectedUser?.parent_admin_id
          ) {

            updated.parent_admin_id =
              Number(
                selectedUser.parent_admin_id
              );

          }


          if (
            selectedUser?.parent_cnf_id
          ) {

            updated.parent_cnf_id =
              Number(
                selectedUser.parent_cnf_id
              );

          }


          if (
            selectedUser?.parent_super_distributor_id
          ) {

            updated.parent_super_distributor_id =
              Number(
                selectedUser.parent_super_distributor_id
              );

          }


          // Reset child
          updated.parent_fos_id =
            null;

          updated.parent_retailer_id =
            null;

        }


        // =================================================
        // FOS
        // =================================================

        if (
          currentRoleId === 5
        ) {

          updated.parent_fos_id =
            selectedId;


          if (
            selectedUser?.parent_admin_id
          ) {

            updated.parent_admin_id =
              Number(
                selectedUser.parent_admin_id
              );

          }


          if (
            selectedUser?.parent_cnf_id
          ) {

            updated.parent_cnf_id =
              Number(
                selectedUser.parent_cnf_id
              );

          }


          if (
            selectedUser?.parent_super_distributor_id
          ) {

            updated.parent_super_distributor_id =
              Number(
                selectedUser.parent_super_distributor_id
              );

          }


          if (
            selectedUser?.parent_distributor_id
          ) {

            updated.parent_distributor_id =
              Number(
                selectedUser.parent_distributor_id
              );

          }


          updated.parent_retailer_id =
            null;

        }


        // =================================================
// RETAILER
// =================================================

if (
  currentRoleId === 6
) {

  updated.parent_retailer_id =
    selectedId;


  if (
    selectedUser?.parent_admin_id
  ) {

    updated.parent_admin_id =
      Number(
        selectedUser.parent_admin_id
      );

  }


  if (
    selectedUser?.parent_cnf_id
  ) {

    updated.parent_cnf_id =
      Number(
        selectedUser.parent_cnf_id
      );

  }


  if (
    selectedUser?.parent_super_distributor_id
  ) {

    updated.parent_super_distributor_id =
      Number(
        selectedUser.parent_super_distributor_id
      );

  }


  if (
    selectedUser?.parent_distributor_id
  ) {

    updated.parent_distributor_id =
      Number(
        selectedUser.parent_distributor_id
      );

  }


  // =================================================
  // IMPORTANT
  //
  // Retailer agar FOS ke through aaya hai,
  // backend response mein parent_id = FOS ID hota hai.
  //
  // Isliye parent_fos_id ko parent_id se bhi set karo.
  // Existing selected FOS ko clear mat karo.
  // =================================================

  if (
    selectedUser?.parent_fos_id
  ) {

    updated.parent_fos_id =
      Number(
        selectedUser.parent_fos_id
      );

  } else if (
    selectedUser?.parent_id
  ) {

    // Retailer selected under FOS
    updated.parent_fos_id =
      Number(
        selectedUser.parent_id
      );

  }

  // =================================================
  // Direct Distributor -> Retailer
  //
  // Agar retailer direct Distributor ke under hai
  // aur FOS selected nahi hai, tab null rahega.
  // =================================================

  else if (
    !updated.parent_fos_id
  ) {

    updated.parent_fos_id =
      null;

  }

}


        // =================================================
        // EMPLOYEE
        // =================================================

       if (
  currentRoleId === 7
) {

  updated.parent_sub_retailer_id =
    selectedId;

  if (
    selectedUser?.parent_admin_id
  ) {
    updated.parent_admin_id =
      Number(
        selectedUser.parent_admin_id
      );
  }

  if (
    selectedUser?.parent_cnf_id
  ) {
    updated.parent_cnf_id =
      Number(
        selectedUser.parent_cnf_id
      );
  }

  if (
    selectedUser?.parent_super_distributor_id
  ) {
    updated.parent_super_distributor_id =
      Number(
        selectedUser.parent_super_distributor_id
      );
  }

  if (
    selectedUser?.parent_distributor_id
  ) {
    updated.parent_distributor_id =
      Number(
        selectedUser.parent_distributor_id
      );
  }

  if (
    selectedUser?.parent_fos_id
  ) {
    updated.parent_fos_id =
      Number(
        selectedUser.parent_fos_id
      );
  }

  if (
    selectedUser?.parent_retailer_id
  ) {
    updated.parent_retailer_id =
      Number(
        selectedUser.parent_retailer_id
      );
  }
}
// =================================================
// EMPLOYEE
// EMPLOYEE -> RETAILER
// =================================================


if (
  currentRoleId === 8
) {

  // Selected Retailer is Employee's parent
  updated.parent_retailer_id =
    selectedId;


  // =================================================
  // COMPLETE EXISTING HIERARCHY
  // =================================================

  if (
    selectedUser?.parent_admin_id
  ) {

    updated.parent_admin_id =
      Number(
        selectedUser.parent_admin_id
      );

  }


  if (
    selectedUser?.parent_cnf_id
  ) {

    updated.parent_cnf_id =
      Number(
        selectedUser.parent_cnf_id
      );

  }


  if (
    selectedUser?.parent_super_distributor_id
  ) {

    updated.parent_super_distributor_id =
      Number(
        selectedUser.parent_super_distributor_id
      );

  }


if (currentRoleId === 8) {

  updated.parent_employee_id = selectedId;

  if (selectedUser?.parent_admin_id) {
    updated.parent_admin_id =
      Number(selectedUser.parent_admin_id);
  }

  if (selectedUser?.parent_cnf_id) {
    updated.parent_cnf_id =
      Number(selectedUser.parent_cnf_id);
  }

  if (selectedUser?.parent_super_distributor_id) {
    updated.parent_super_distributor_id =
      Number(selectedUser.parent_super_distributor_id);
  }

  if (selectedUser?.parent_distributor_id) {
    updated.parent_distributor_id =
      Number(selectedUser.parent_distributor_id);
  }

  if (selectedUser?.parent_fos_id) {
    updated.parent_fos_id =
      Number(selectedUser.parent_fos_id);
  }

  if (selectedUser?.parent_retailer_id) {
    updated.parent_retailer_id =
      Number(selectedUser.parent_retailer_id);
  }

  if (selectedUser?.parent_sub_retailer_id) {
    updated.parent_sub_retailer_id =
      Number(selectedUser.parent_sub_retailer_id);
  }

}


  // =================================================
  // RETAILER
  //
  // Most important:
  // selected retailer itself = parent_retailer_id
  // =================================================

  updated.parent_retailer_id =
    selectedId;


  // =================================================
  // Sub Retailer
  //
  // Employee direct Retailer ke under hai,
  // isliye null rahega.
  // =================================================

  updated.parent_sub_retailer_id =
    null;

}


        return updated;

      }
    );


    // ===================================================
    // CLEAR NEXT DROPDOWNS
    // ===================================================

    const updatedParentUsers = {
      ...parentUsers,
    };


    if (
      currentIndex !== -1
    ) {

      parents
        .slice(
          currentIndex + 1
        )
        .forEach(
          (roleId) => {

            updatedParentUsers[
              roleId
            ] = [];

          }
        );

    }


    setParentUsers(
      updatedParentUsers
    );


    if (!selectedId) {

      return;

    }


    // ===================================================
    // DISTRIBUTOR SELECTED
    // ===================================================

    if (
      currentRoleId === 4
    ) {

      try {

        setParentUsers(
          (prev) => ({

            ...prev,

            5: [],

            6: [],

          })
        );


        const [
          fosResponse,
          retailerResponse,
        ] = await Promise.all([

          getDropdownUsers(
            5,
            selectedId
          ),

          getDropdownUsers(
            6,
            selectedId
          ),

        ]);


        const fosUsers =
          getUsersFromResponse(
            fosResponse
          );


        const directRetailerUsers =
          getUsersFromResponse(
            retailerResponse
          );


        // =================================================
        // FOS FOUND
        // =================================================

        if (
          fosUsers.length > 0
        ) {

          setParentUsers(
            (prev) => ({

              ...prev,

              5: fosUsers,

              6: [],

            })
          );


          return;

        }


        // =================================================
        // DIRECT RETAILER
        // =================================================

        setParentUsers(
          (prev) => ({

            ...prev,

            5: [],

            6:
              directRetailerUsers,

          })
        );


        return;

      } catch (error) {

        console.error(
          "DISTRIBUTOR ERROR:",
          error?.response?.data ||
          error
        );


        setParentUsers(
          (prev) => ({

            ...prev,

            5: [],

            6: [],

          })
        );


        toast.error(
          "FOS / Retailer dropdown load failed"
        );


        return;

      }

    }


    // ===================================================
    // FOS SELECTED
    // ===================================================

    if (
      currentRoleId === 5
    ) {

      try {

        setParentUsers(
          (prev) => ({

            ...prev,

            6: [],

          })
        );


        const retailerResponse =
          await getDropdownUsers(
            6,
            selectedId
          );


        const retailerUsers =
          getUsersFromResponse(
            retailerResponse
          );


        setParentUsers(
          (prev) => ({

            ...prev,

            6:
              retailerUsers,

          })
        );


        return;

      } catch (error) {

        console.error(
          "RETAILER ERROR:",
          error?.response?.data ||
          error
        );


        setParentUsers(
          (prev) => ({

            ...prev,

            6: [],

          })
        );


        toast.error(
          "Retailer dropdown load failed"
        );


        return;

      }

    }


   // ===================================================
// FIND NEXT ENABLED ROLE
// ===================================================

let nextRoleIndex =
  currentIndex + 1;

while (
  nextRoleIndex < parents.length &&
  disabledParentRoles[
    Number(parents[nextRoleIndex])
  ] === true
) {

  nextRoleIndex++;

}


const nextRoleId =
  parents[nextRoleIndex];


if (!nextRoleId) {
  return;
}


// ===================================================
// NEXT ROLE PARENT ID
// ===================================================

const nextParentId =
  disabledParentRoles[
    currentRoleId
  ] === true
    ? null
    : selectedId;


// ===================================================
// LOAD NEXT ROLE
// ===================================================

await loadParentUsers(
  Number(nextRoleId),
  nextParentId
);

  };


 // =====================================================
// DISABLE / ENABLE PARENT ROLE
// =====================================================

const handleParentCheckbox = async (
  roleId,
  checked
) => {

  const disabledRole =
    Number(roleId);

  // ===================================================
  // CURRENT PARENT ROLES
  // ===================================================

  const parents =
    parentRoles[selectedRole] || [];

  const disabledIndex =
    parents.indexOf(disabledRole);

  if (disabledIndex === -1) {
    return;
  }

  // ===================================================
  // IMPORTANT
  //
  // Local state immediately calculate karo.
  // React setState async hota hai.
  // ===================================================

  const updatedDisabledRoles = {
    ...disabledParentRoles,
    [disabledRole]: checked,
  };

  // ===================================================
  // SAVE DISABLED STATE
  // ===================================================

  setDisabledParentRoles(
    updatedDisabledRoles
  );

  // ===================================================
  // DISABLED ROLE FIELD CLEAR
  // ===================================================

  const disabledField =
    roleParentField[disabledRole];

  if (checked && disabledField) {

    setFormData((prev) => ({
      ...prev,
      [disabledField]: null,
    }));

  }

  // ===================================================
  // NEXT ENABLED ROLE FIND KARO
  // ===================================================

  let nextIndex =
    disabledIndex + 1;

  while (
    nextIndex < parents.length &&
    updatedDisabledRoles[
      Number(parents[nextIndex])
    ] === true
  ) {

    nextIndex++;

  }

  const nextRole =
    parents[nextIndex];

  // ===================================================
  // NO NEXT ROLE
  // ===================================================

  if (!nextRole) {

    setParentUsers((prev) => ({
      ...prev,
      [disabledRole]: [],
    }));

    return;
  }

  const nextRoleId =
    Number(nextRole);

  // ===================================================
  // DISABLE
  // ===================================================

  if (checked) {

    // -----------------------------------------------
    // Current disabled dropdown clear
    // Next dropdown bhi fresh karo
    // -----------------------------------------------

    setParentUsers((prev) => ({
      ...prev,
      [disabledRole]: [],
      [nextRoleId]: [],
    }));

    try {

      console.log(
        "CHECKBOX DISABLED"
      );

      console.log(
        "Disabled Role:",
        disabledRole
      );

      console.log(
        "Next Role:",
        nextRoleId
      );

      console.log(
        "API:",
        `getDropdownUsers(${nextRoleId}, null)`
      );

      // =============================================
      // IMPORTANT
      //
      // Disabled parent ke baad NEXT ROLE
      // GLOBAL DATA se load hoga.
      // =============================================

      const response =
        await getDropdownUsers(
          nextRoleId,
          null,
          ""
        );

      const users =
        getUsersFromResponse(
          response
        );

      console.log(
        "NEXT ROLE GLOBAL USERS:",
        users
      );

      // =============================================
      // SAVE NEXT ROLE DATA
      // =============================================

      setParentUsers((prev) => ({
        ...prev,
        [nextRoleId]: users,
      }));

      // =============================================
      // NEXT KE BAAD SAB CLEAR
      // =============================================

      setParentUsers((prev) => {

        const updated = {
          ...prev,
        };

        parents
          .slice(nextIndex + 1)
          .forEach((role) => {

            updated[
              Number(role)
            ] = [];

          });

        return updated;

      });

      // =============================================
      // OPEN NEXT DROPDOWN AUTOMATICALLY
      //
      // Agar checkbox click karte hi next dropdown
      // open karwana hai toh ye rakho.
      // =============================================

     setOpenDropdown(null);

setParentSearch(
  (prev) => ({
    ...prev,
    [nextRoleId]: "",
  })
);

    } catch (error) {

      console.error(
        "NEXT ROLE GLOBAL ERROR:",
        error?.response?.data ||
        error
      );

      setParentUsers((prev) => ({
        ...prev,
        [nextRoleId]: [],
      }));

      toast.error(
        `${getRoleName(nextRoleId)} dropdown load failed`
      );

    }

    return;
  }

  // ===================================================
  // ENABLE
  // ===================================================

  if (!checked) {

    // -----------------------------------------------
    // Enable hone par next dropdown clear
    // -----------------------------------------------

    setParentUsers((prev) => ({
      ...prev,
      [nextRoleId]: [],
    }));

    // -----------------------------------------------
    // Dropdown automatically open nahi karna
    // -----------------------------------------------

    setOpenDropdown(null);

    return;
  }

};

  // =====================================================
  // GET PARENT ID FOR REGISTER
  // =====================================================

 const getFinalParentId = (
  roleId,
  hierarchy,
  tokenUser
) => {

  // ===================================================
  // ADMIN
  // Master Admin -> Admin
  // ===================================================

  if (roleId === 1) {
    return null;
  }

  // ===================================================
  // CNF -> ADMIN
  // ===================================================

  if (roleId === 2) {
    return hierarchy.parent_admin_id || null;
  }

  // ===================================================
  // SUPER DISTRIBUTOR -> CNF
  // ===================================================

  if (roleId === 3) {
    return hierarchy.parent_cnf_id || null;
  }

  // ===================================================
  // DISTRIBUTOR -> SUPER DISTRIBUTOR
  // ===================================================

  if (roleId === 4) {
    return hierarchy.parent_super_distributor_id || null;
  }

  // ===================================================
  // FOS -> DISTRIBUTOR
  // ===================================================

  if (roleId === 5) {
    return hierarchy.parent_distributor_id || null;
  }

  // ===================================================
  // RETAILER -> FOS / DISTRIBUTOR
  // ===================================================

  if (roleId === 6) {
    return (
      hierarchy.parent_fos_id ||
      hierarchy.parent_distributor_id ||
      null
    );
  }

  // ===================================================
  // SUB RETAILER -> RETAILER
  // ===================================================

  if (roleId === 7) {
    return hierarchy.parent_retailer_id || null;
  }

  // ===================================================
  // EMPLOYEE -> SUB RETAILER / RETAILER
  // ===================================================

  if (roleId === 8) {
    return (
      hierarchy.parent_sub_retailer_id ||
      hierarchy.parent_retailer_id ||
      null
    );
  }

  // ===================================================
  // STAFF -> ADMIN
  // ===================================================

  if (roleId === 9) {
    return hierarchy.parent_admin_id || null;
  }

  return null;
};


  // =====================================================
  // SUBMIT
  // =====================================================

const handleSubmit = async (e) => {

  e.preventDefault();

  // ===================================================
  // ROLE ID
  // ===================================================

  const roleId =
    Number(
      formData.role_id
    );


  if (!roleId) {

    toast.error(
      "Role ID missing. Please select role again"
    );

    return;

  }


  // ===================================================
  // LOGGED-IN USER
  // ===================================================

  const tokenUser =
    getUserFromToken();


  if (!tokenUser?.id) {

    toast.error(
      "Logged-in user not found"
    );

    return;

  }


  const loggedUserId =
    Number(
      tokenUser.id
    );


  const loggedUserRoleId =
    Number(
      tokenUser.role_id
    );


  // ===================================================
  // COMPLETE HIERARCHY
  //
  // IMPORTANT:
  //
  // Hierarchy OPTIONAL hai.
  //
  // Agar user ne koi parent select nahi kiya
  // toh corresponding value null rahegi.
  // ===================================================

  const hierarchy = {

    // =================================================
    // ADMIN
    // =================================================

    parent_admin_id:

      formData.parent_admin_id
        ? Number(
            formData.parent_admin_id
          )

        : tokenUser.parent_admin_id
        ? Number(
            tokenUser.parent_admin_id
          )

        : null,


    // =================================================
    // CNF
    // =================================================

    parent_cnf_id:

      formData.parent_cnf_id
        ? Number(
            formData.parent_cnf_id
          )

        : tokenUser.parent_cnf_id
        ? Number(
            tokenUser.parent_cnf_id
          )

        : null,


    // =================================================
    // SUPER DISTRIBUTOR
    // =================================================

    parent_super_distributor_id:

      formData.parent_super_distributor_id
        ? Number(
            formData.parent_super_distributor_id
          )

        : tokenUser.parent_super_distributor_id
        ? Number(
            tokenUser.parent_super_distributor_id
          )

        : null,


    // =================================================
    // DISTRIBUTOR
    // =================================================

    parent_distributor_id:

      formData.parent_distributor_id
        ? Number(
            formData.parent_distributor_id
          )

        : tokenUser.parent_distributor_id
        ? Number(
            tokenUser.parent_distributor_id
          )

        : null,


    // =================================================
    // FOS
    // =================================================

    parent_fos_id:

      formData.parent_fos_id
        ? Number(
            formData.parent_fos_id
          )

        : tokenUser.parent_fos_id
        ? Number(
            tokenUser.parent_fos_id
          )

        : null,


    // =================================================
    // RETAILER
    // =================================================

    parent_retailer_id:

      formData.parent_retailer_id
        ? Number(
            formData.parent_retailer_id
          )

        : tokenUser.parent_retailer_id
        ? Number(
            tokenUser.parent_retailer_id
          )

        : null,


    // =================================================
    // SUB RETAILER
    // =================================================

    parent_sub_retailer_id:

      formData.parent_sub_retailer_id
        ? Number(
            formData.parent_sub_retailer_id
          )

        : tokenUser.parent_sub_retailer_id
        ? Number(
            tokenUser.parent_sub_retailer_id
          )

        : null,


    // =================================================
    // EMPLOYEE
    // =================================================

    parent_employee_id:

      formData.parent_employee_id
        ? Number(
            formData.parent_employee_id
          )

        : tokenUser.parent_employee_id
        ? Number(
            tokenUser.parent_employee_id
          )

        : null,


    // =================================================
    // STAFF
    // =================================================

    parent_staff_id:

      formData.parent_staff_id
        ? Number(
            formData.parent_staff_id
          )

        : tokenUser.parent_staff_id
        ? Number(
            tokenUser.parent_staff_id
          )

        : null,

  };


  // ===================================================
  // LOGGED-IN USER AS PARENT
  //
  // IMPORTANT:
  //
  // Logged-in user ko automatically parent banane
  // ki existing functionality rakhi gayi hai.
  //
  // Lekin agar parent hierarchy intentionally disable
  // ki gayi hai, toh usko automatically set nahi karenge.
  // ===================================================

  if (
    loggedUserRoleId === 1 &&
    disabledParentRoles[1] !== true
  ) {

    hierarchy.parent_admin_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 2 &&
    disabledParentRoles[2] !== true
  ) {

    hierarchy.parent_cnf_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 3 &&
    disabledParentRoles[3] !== true
  ) {

    hierarchy.parent_super_distributor_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 4 &&
    disabledParentRoles[4] !== true
  ) {

    hierarchy.parent_distributor_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 5 &&
    disabledParentRoles[5] !== true
  ) {

    hierarchy.parent_fos_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 6 &&
    disabledParentRoles[6] !== true
  ) {

    hierarchy.parent_retailer_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 7 &&
    disabledParentRoles[7] !== true
  ) {

    hierarchy.parent_sub_retailer_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 8 &&
    disabledParentRoles[8] !== true
  ) {

    hierarchy.parent_employee_id =
      loggedUserId;

  }


  if (
    loggedUserRoleId === 9 &&
    disabledParentRoles[9] !== true
  ) {

    hierarchy.parent_staff_id =
      loggedUserId;

  }


  // ===================================================
  // GET ACTUAL IMMEDIATE parent_id
  //
  // Hierarchy optional hone ki wajah se agar parent
  // nahi mila toh null jayega.
  // ===================================================

  const parent_id =
    getFinalParentId(
      roleId,
      hierarchy,
      tokenUser
    ) || null;


  // ===================================================
  // DEBUG
  // ===================================================

  console.log(
    "================================="
  );

  console.log(
    "LOGGED USER ROLE:",
    loggedUserRoleId
  );

  console.log(
    "LOGGED USER ID:",
    loggedUserId
  );

  console.log(
    "CREATING ROLE:",
    roleId
  );

  console.log(
    "FINAL HIERARCHY:",
    hierarchy
  );

  console.log(
    "FINAL parent_id:",
    parent_id
  );


  // ===================================================
  // NO PARENT VALIDATION
  //
  // IMPORTANT:
  //
  // Yahan pehle parent required validation thi.
  //
  // Ab koi bhi hierarchy select karna mandatory nahi hai.
  //
  // parent_id null bhi allowed hai.
  // ===================================================


  // ===================================================
  // PASSWORD
  // ===================================================

  if (
    formData.password !==
    formData.confirm_password
  ) {

    toast.error(
      "Password and Confirm Password do not match!"
    );

    return;

  }


  // ===================================================
  // FINAL PAYLOAD
  // ===================================================

  const payload = {

    ...formData,


    // =================================================
    // ROLE
    // =================================================

    role_id:
      roleId,


    // =================================================
    // HIERARCHY
    // =================================================

    parent_admin_id:
      hierarchy.parent_admin_id || null,


    parent_cnf_id:
      hierarchy.parent_cnf_id || null,


    parent_super_distributor_id:
      hierarchy.parent_super_distributor_id || null,


    parent_distributor_id:
      hierarchy.parent_distributor_id || null,


    parent_fos_id:
      hierarchy.parent_fos_id || null,


    parent_retailer_id:
      hierarchy.parent_retailer_id || null,


    parent_sub_retailer_id:
      hierarchy.parent_sub_retailer_id || null,


    parent_employee_id:
      hierarchy.parent_employee_id || null,


    parent_staff_id:
      hierarchy.parent_staff_id || null,


    // =================================================
    // IMMEDIATE PARENT
    //
    // No parent selected =
    // null
    // =================================================

    parent_id:
      parent_id || null,


    // =================================================
    // DISABLED HIERARCHY
    //
    // IMPORTANT:
    //
    // disabledParentRoles use karna hai.
    // disabledParents nahi.
    // =================================================

    parent_admin_disabled:
      disabledParentRoles[1]
        ? 1
        : 0,


    parent_cnf_disabled:
      disabledParentRoles[2]
        ? 1
        : 0,


    parent_super_distributor_disabled:
      disabledParentRoles[3]
        ? 1
        : 0,


    parent_distributor_disabled:
      disabledParentRoles[4]
        ? 1
        : 0,


    parent_fos_disabled:
      disabledParentRoles[5]
        ? 1
        : 0,


    parent_retailer_disabled:
      disabledParentRoles[6]
        ? 1
        : 0,


    parent_sub_retailer_disabled:
      disabledParentRoles[7]
        ? 1
        : 0,


    parent_employee_disabled:
      disabledParentRoles[8]
        ? 1
        : 0,


    parent_staff_disabled:
      disabledParentRoles[9]
        ? 1
        : 0,

  };


  // ===================================================
  // FINAL DEBUG
  // ===================================================

  console.log(
    "================================="
  );

  console.log(
    "FINAL REGISTER PAYLOAD"
  );

  console.log(
    payload
  );


  // ===================================================
  // API
  // ===================================================

  try {

    const res =
      await addStaff(
        payload
      );


    console.log(
      "REGISTER SUCCESS:",
      res
    );


    // =================================================
    // SUCCESS MESSAGE
    // =================================================

    toast.success(
      res?.message ||
      "Registered Successfully"
    );


    // =================================================
    // RESET FORM
    // =================================================

    setFormData({

      ...initialFormData,

      role_id:
        roleId,

    });


    // =================================================
    // RESET PARENT USERS
    // =================================================

    setParentUsers({});


    // =================================================
    // RESET DISABLED STATES
    // =================================================

    setDisabledParentRoles({});


    // =================================================
    // RESET PASSWORD VISIBILITY
    // =================================================

    setShowPassword(
      false
    );


    setShowConfirmPassword(
      false
    );


  } catch (error) {

    console.error(
      "REGISTER ERROR:",
      error?.response?.data ||
      error
    );


    toast.error(

      error?.response?.data?.message ||

      error?.response?.data?.error ||

      "Something went wrong"

    );

  }

};


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className="
        max-w-5xl
        mx-auto
      "
    >

      <div
        className="
          bg-white
          rounded-2xl
          shadow-xl
          border
          border-slate-100
          overflow-hidden
          p-6
        "
      >

        {/* =================================================
            TOP BUTTON
        ================================================= */}

        <div
          className="
            mb-0
          "
        >

          <div
            className="
              flex
              justify-between
              items-center
            "
          >

            <div
              className="
                flex
                gap-3
              "
            >

              <Link
                href={`/dashboard?role=${selectedRole}`}
                className="
                  bg-gray-700
                  text-white
                  px-4
                  py-2
                  rounded-sm
                  hover:bg-gray-800
                  whitespace-nowrap
                "
              >

                {getRoleName(
                  selectedRole
                )} List

              </Link>

            </div>

          </div>


          {/* =================================================
              PARENT DROPDOWNS
          ================================================= */}

          {selectedRole > 1 && (

            <div
              className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-4
                mt-5
              "
            >

              {/* =================================================
                  CNF
              ================================================= */}

       {Number(selectedRole) !== 2 && (

  /* =================================================
      OTHER ROLES
  ================================================= */

  visibleParentRoles.map((parentRoleId) => {

    const role =
      Number(parentRoleId);

    const users =
      parentUsers[role] || [];

    const isDisabled =
      disabledParentRoles[role] === true;

    const parentField =
      roleParentField[role];

    return (

      <div
        key={role}
        className="
          space-y-1.5
        "
      >

        {/* =================================================
            ROLE LABEL + CHECKBOX
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          {/* =================================================
              ROLE NAME
          ================================================= */}

          <label
            className="
              text-sm
              font-medium
              text-slate-700
            "
          >

            {getRoleName(role)}

          </label>


          {/* =================================================
              DISABLE CHECKBOX
          ================================================= */}

          <label
            className="
              flex
              items-center
              gap-2
              text-xs
              text-slate-500
              cursor-pointer
              select-none
            "
          >

            <input
              type="checkbox"

              checked={
                isDisabled
              }

              onChange={(e) =>
                handleParentCheckbox(
                  role,
                  e.target.checked
                )
              }

              className="
                h-4
                w-4
                accent-blue-600
                cursor-pointer
              "
            />

            Disable

          </label>

        </div>


        {/* =================================================
            DROPDOWN
        ================================================= */}

        <div className="relative">

  {/* =================================================
      SELECTED VALUE / DROPDOWN BUTTON
  ================================================= */}

  <button
    type="button"
    disabled={isDisabled}
    onClick={() => {

      if (isDisabled) {
        return;
      }

      setOpenDropdown(
        openDropdown === role
          ? null
          : role
      );

    }}
    className={`
      w-full
      flex
      items-center
      justify-between
      border
      rounded-lg
      px-4
      py-2.5
      text-sm
      text-left
      transition
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500

      ${
        isDisabled
          ? `
            bg-slate-100
            border-slate-200
            text-slate-400
            cursor-not-allowed
          `
          : `
            bg-white
            border-slate-300
            text-slate-700
            cursor-pointer
          `
      }
    `}
  >

    <span className="truncate">

      {isDisabled

        ? `${getRoleName(role)} Disabled`

        : formData[parentField]

        ? (
            users.find(
              (user) =>
                Number(user.id) ===
                Number(
                  formData[parentField]
                )
            )?.name ||
            `Selected ${getRoleName(role)}`
          )

        : `Select ${getRoleName(role)}`

      }

    </span>


    <RiArrowDownSLine
      size={22}
      className={`
        shrink-0
        transition-transform

        ${
          openDropdown === role
            ? "rotate-180"
            : ""
        }

        ${
          isDisabled
            ? "text-slate-300"
            : "text-slate-500"
        }
      `}
    />

  </button>


  {/* =================================================
      DROPDOWN
  ================================================= */}

  {openDropdown === role &&
    !isDisabled && (

      <div
        className="
          absolute
          z-50
          left-0
          right-0
          mt-1
          bg-white
          border
          border-slate-200
          rounded-lg
          shadow-xl
          overflow-hidden
        "
      >

        {/* =================================================
            SEARCH INPUT
        ================================================= */}

        <div
          className="
            p-2
            border-b
            border-slate-200
            bg-white
          "
        >

         <div className="relative">

  <input
    type="text"
    value={
      parentSearch[role] || ""
    }
    onChange={(e) =>
      setParentSearch(
        (prev) => ({
          ...prev,
          [role]:
            e.target.value,
        })
      )
    }
    onClick={(e) =>
      e.stopPropagation()
    }
    placeholder={`Search ${getRoleName(role)}...`}
    autoFocus
    className="
      w-full
      border
      border-slate-300
      rounded-md
      px-3
      py-2
      pr-10
      text-sm
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
    "
  />

  {searchLoading[role] && (

    <div
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
      "
    >

      <div
        className="
          h-4
          w-4
          border-2
          border-blue-500
          border-t-transparent
          rounded-full
          animate-spin
        "
      />

    </div>

  )}

</div>

        </div>


        {/* =================================================
            USER LIST
        ================================================= */}

       <div
  className="
    max-h-60
    overflow-y-auto
  "
>

  {/* =================================================
      DEFAULT / CLEAR OPTION
  ================================================= */}

  {!searchLoading[role] && (

    <button
      type="button"
      onClick={() => {

        handleParentChange(
          role,
          ""
        );

        setOpenDropdown(null);

        setParentSearch(
          (prev) => ({
            ...prev,
            [role]: "",
          })
        );

      }}
      className="
        w-full
        text-left
        px-4
        py-2.5
        text-sm
        text-slate-500
        hover:bg-slate-50
      "
    >

      Select {getRoleName(role)}

    </button>

  )}


  {/* =================================================
      SEARCHING
  ================================================= */}

  {searchLoading[role] && (

    <div
      className="
        flex
        items-center
        justify-center
        gap-2
        px-4
        py-4
        text-sm
        text-blue-600
      "
    >

      <div
        className="
          h-4
          w-4
          border-2
          border-blue-500
          border-t-transparent
          rounded-full
          animate-spin
        "
      />

      Searching {getRoleName(role)}...

    </div>

  )}


  {/* =================================================
      USERS
  ================================================= */}

  {!searchLoading[role] &&
    users.map((user) => (

      <button
        key={user.id}
        type="button"
        onClick={() => {

          handleParentChange(
            role,
            user.id
          );

          setOpenDropdown(null);

          setParentSearch(
            (prev) => ({
              ...prev,
              [role]: "",
            })
          );

        }}
        className={`
          w-full
          text-left
          px-4
          py-2.5
          text-sm
          transition

          ${
            Number(
              formData[parentField]
            ) === Number(user.id)

              ? `
                bg-blue-50
                text-blue-700
                font-medium
              `

              : `
                text-slate-700
                hover:bg-slate-50
              `
          }
        `}
      >

        <div>
          {user.name}
        </div>

      </button>

    ))
  }


  {/* =================================================
      NO RESULT
  ================================================= */}

  {!searchLoading[role] &&
    users.length === 0 && (

      <div
        className="
          px-4
          py-4
          text-center
          text-sm
          text-slate-400
        "
      >

        {parentSearch[role]?.trim()
          ? `No ${getRoleName(role)} found`
          : `No ${getRoleName(role)} available`
        }

      </div>

    )}

</div>

      </div>

    )}

</div>

      </div>

    );

  })

)}

            </div>

          )}

        </div>


        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={
            handleSubmit
          }
          className="
            pt-6
            md:pt-5
          "
        >

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-6
            "
          >

            {/* =================================================
                ORGANIZATION
            ================================================= */}

            <div
              className="
                space-y-1.5
              "
            >

              <label
                className="
                  text-sm
                  font-medium
                  text-slate-700
                "
              >

                Organization Name{" "}

                <span className="text-red-500">
                  *
                </span>

              </label>


              <input
                type="text"
                name="organization_name"
                placeholder="Enter organization name"
                value={
                  formData.organization_name
                }
                onChange={
                  handleChange
                }
                required
                className="
                  w-full
                  border
                  border-slate-300
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>


            {/* =================================================
                NAME
            ================================================= */}

            <div
              className="
                space-y-1.5
              "
            >

              <label
                className="
                  text-sm
                  font-medium
                  text-slate-700
                "
              >

                Full Name{" "}

                <span className="text-red-500">
                  *
                </span>

              </label>


              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={
                  formData.name
                }
                onChange={
                  handleChange
                }
                required
                className="
                  w-full
                  border
                  border-slate-300
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>


            {/* =================================================
                EMAIL
            ================================================= */}

            <div
              className="
                space-y-1.5
              "
            >

              <label
                className="
                  text-sm
                  font-medium
                  text-slate-700
                "
              >

                Email Address{" "}

                <span className="text-red-500">
                  *
                </span>

              </label>


              <input
                type="email"
                name="email"
                placeholder="staff@example.com"
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                required
                className="
                  w-full
                  border
                  border-slate-300
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>


            {/* =================================================
                PHONE
            ================================================= */}

            <div
              className="
                space-y-1.5
              "
            >

              <label
                className="
                  text-sm
                  font-medium
                  text-slate-700
                "
              >

                Phone Number{" "}

                <span className="text-red-500">
                  *
                </span>

              </label>


              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={
                  formData.phone
                }
                onChange={(e) =>
                  setFormData(
                    (prev) => ({

                      ...prev,

                      phone:
                        e.target.value.replace(
                          /[^\d+\s]/g,
                          ""
                        ),

                    })
                  )
                }
                required
                pattern="^(\+91\s?)?[6-9]\d{9}$"
                title="Enter a valid Indian mobile number"
                className="
                  w-full
                  border
                  border-slate-300
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>


            {/* =================================================
                ADDRESS
            ================================================= */}

            <div
              className="
                space-y-1.5
              "
            >

              <label
                className="
                  text-sm
                  font-medium
                  text-slate-700
                "
              >

                Company Address{" "}

                <span className="text-red-500">
                  *
                </span>

              </label>


              <input
                type="text"
                name="company_address"
                placeholder="Street, Building, Area"
                value={
                  formData.company_address
                }
                onChange={
                  handleChange
                }
                required
                className="
                  w-full
                  border
                  border-slate-300
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              />

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div
              className="
                space-y-1.5
              "
            >

              <label
                className="
                  text-sm
                  font-medium
                  text-slate-700
                "
              >

                Password{" "}

                <span className="text-red-500">
                  *
                </span>

              </label>


              <div
                className="
                  relative
                "
              >

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter password"
                  value={
                    formData.password
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-lg
                    px-4
                    py-2.5
                    pr-12
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                    cursor-pointer
                  "
                >

                  {showPassword ? (

                    <RiEyeOffLine
                      size={20}
                    />

                  ) : (

                    <RiEyeLine
                      size={20}
                    />

                  )}

                </button>

              </div>

            </div>


            {/* =================================================
                CONFIRM PASSWORD
            ================================================= */}

            <div
              className="
                space-y-1.5
              "
            >

              <label
                className="
                  text-sm
                  font-medium
                  text-slate-700
                "
              >

                Confirm Password{" "}

                <span className="text-red-500">
                  *
                </span>

              </label>


              <div
                className="
                  relative
                "
              >

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirm_password"
                  placeholder="Re-enter password"
                  value={
                    formData.confirm_password
                  }
                  onChange={
                    handleChange
                  }
                  required
                  className="
                    w-full
                    border
                    border-slate-300
                    rounded-lg
                    px-4
                    py-2.5
                    pr-12
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-blue-500
                  "
                />


                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    text-gray-500
                    cursor-pointer
                  "
                >

                  {showConfirmPassword ? (

                    <RiEyeOffLine
                      size={20}
                    />

                  ) : (

                    <RiEyeLine
                      size={20}
                    />

                  )}

                </button>

              </div>

            </div>


            {/* =================================================
                COUNTRY
            ================================================= */}

           <div
  className="
    space-y-1.5
  "
>
  <label
    className="
      text-sm
      font-medium
      text-slate-700
    "
  >
    Country{" "}
    <span className="text-red-500">
      *
    </span>
  </label>

  <div className="relative">

    <select
      name="country"
      value={formData.country}
      onChange={handleChange}
      required
      className="
        w-full
        appearance-none
        border
        border-slate-300
        rounded-lg
        px-4
        py-2.5
        pr-10
        text-sm
        bg-white
        cursor-pointer
      "
    >
      <option value="">
        Select Country
      </option>

      {countries.map(
        (country) => (
          <option
            key={country.isoCode}
            value={country.isoCode}
          >
            {country.name}
          </option>
        )
      )}
    </select>

    <RiArrowDownSLine
      size={22}
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-slate-500
        pointer-events-none
      "
    />

  </div>
</div>


            {/* =================================================
                STATE
            ================================================= */}
<div
  className="
    space-y-1.5
  "
>
  <label
    className="
      text-sm
      font-medium
      text-slate-700
    "
  >
    State{" "}
    <span className="text-red-500">
      *
    </span>
  </label>

  <div className="relative">

    <select
      name="state"
      value={formData.state}
      onChange={handleChange}
      required
      disabled={!formData.country}
      className="
        w-full
        appearance-none
        border
        border-slate-300
        rounded-lg
        px-4
        py-2.5
        pr-10
        text-sm
        bg-white
        cursor-pointer
        disabled:bg-slate-50
        disabled:cursor-not-allowed
      "
    >
      <option value="">
        Select State
      </option>

      {states.map(
        (state) => (
          <option
            key={state.isoCode}
            value={state.isoCode}
          >
            {state.name}
          </option>
        )
      )}
    </select>

    <RiArrowDownSLine
      size={22}
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-slate-500
        pointer-events-none
      "
    />

  </div>
</div>

            {/* =================================================
                CITY
            ================================================= */}

            <div
  className="
    space-y-1.5
  "
>
  <label
    className="
      text-sm
      font-medium
      text-slate-700
    "
  >
    City{" "}
    <span className="text-red-500">
      *
    </span>
  </label>

  <div className="relative">

    <select
      name="city"
      value={formData.city}
      onChange={handleChange}
      required
      disabled={!formData.state}
      className="
        w-full
        appearance-none
        border
        border-slate-300
        rounded-lg
        px-4
        py-2.5
        pr-10
        text-sm
        bg-white
        cursor-pointer
        disabled:bg-slate-50
        disabled:cursor-not-allowed
      "
    >
      <option value="">
        Select City
      </option>

      {cities.map(
        (city) => (
          <option
            key={city.name}
            value={city.name}
          >
            {city.name}
          </option>
        )
      )}
    </select>

    <RiArrowDownSLine
      size={22}
      className="
        absolute
        right-3
        top-1/2
        -translate-y-1/2
        text-slate-500
        pointer-events-none
      "
    />

  </div>
</div>


            {/* =================================================
                RETAILER DEVICES
            ================================================= */}

            {Number(
              formData.role_id
            ) === 6 && (

              <div
                className="
                  md:col-span-3
                  space-y-4
                "
              >

                <h3
                  className="
                    text-lg
                    font-semibold
                    text-slate-700
                  "
                >

                  Device Permissions

                </h3>


                <div
                  className="
                    grid
                    grid-cols-1
                    md:grid-cols-3
                    lg:grid-cols-4
                    gap-4
                  "
                >

                  {[

                    {
                      label:
                        "New Device",

                      name:
                        "new_device",
                    },

                    {
                      label:
                        "Old Device",

                      name:
                        "old_device",
                    },

                    {
                      label:
                        "Supreme Device",

                      name:
                        "supreme_device",
                    },

                    {
                      label:
                        "Pro Star",

                      name:
                        "pro_star",
                    },

                    {
                      label:
                        "Lite",

                      name:
                        "lite",
                    },

                    {
                      label:
                        "Google TV",

                      name:
                        "google_tv",
                    },

                    {
                      label:
                        "Supreme Lock",

                      name:
                        "supreme_lock",
                    },

                  ].map(
                    (item) => (

                      <label
                        key={
                          item.name
                        }
                        className={`
                          flex
                          items-center
                          justify-between
                          px-4
                          py-3
                          rounded-lg
                          border
                          transition
                          cursor-pointer
                          ${
                            formData[
                              item.name
                            ] === 1

                              ? "border-blue-500 bg-blue-50"

                              : "border-slate-300 bg-white hover:border-blue-400"
                          }
                        `}
                      >

                        <span
                          className="
                            text-sm
                            font-medium
                            text-slate-700
                          "
                        >

                          {item.label}

                        </span>


                        <input
                          type="checkbox"
                          checked={
                            formData[
                              item.name
                            ] === 1
                          }
                          onChange={(e) =>
                            setFormData(
                              (prev) => ({

                                ...prev,

                                [item.name]:
                                  e.target.checked
                                    ? 1
                                    : 0,

                              })
                            )
                          }
                          className="
                            h-5
                            w-5
                            accent-blue-600
                            cursor-pointer
                          "
                        />

                      </label>

                    )
                  )}

                </div>

              </div>

            )}

          </div>


          {/* =================================================
              SUBMIT
          ================================================= */}

          <div
            className="
              mt-8
              flex
              justify-end
            "
          >

            <button
              type="submit"
              className="
                bg-blue-400
                text-white
                font-medium
                px-8
                py-3
                rounded-lg
                shadow-md
                hover:shadow-lg
                transition-all
                cursor-pointer
              "
            >

              Create

            </button>

          </div>

        </form>

      </div>

    </div>

  );

}