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
    // Staff
  9: [],
  };


  // ===================================================
  // VISIBLE PARENT ROLES
  // ===================================================

 const visibleParentRoles = (
  parentRoles[selectedRole] || []
).filter((roleId) => {

  // =====================================================
  // CNF CREATE
  // Admin hide
  // =====================================================

  if (
    Number(selectedRole) === 2 &&
    roleId === 1
  ) {
    return false;
  }


  // =====================================================
  // EMPLOYEE CREATE
  //
  // Employee ke liye logged-in user ke role se lekar
  // Sub Retailer tak parents show honge.
  //
  // Example:
  //
  // CNF login (2)
  // => 2,3,4,5,6,7
  //
  // Super Distributor login (3)
  // => 3,4,5,6,7
  //
  // Distributor login (4)
  // => 4,5,6,7
  // =====================================================

  if (
    Number(selectedRole) === 8 &&
    roleId >= loggedInRoleId &&
    roleId <= 7
  ) {
    return true;
  }


  // =====================================================
  // SAME ROLE HIDE
  // =====================================================

  if (
    roleId === loggedInRoleId
  ) {
    return false;
  }


  // =====================================================
  // ABOVE LOGGED-IN ROLE HIDE
  // =====================================================

  if (
    roleId < loggedInRoleId
  ) {
    return false;
  }


  return true;

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

    if (
      !selectedRole ||
      selectedRole <= 1
    ) {

      return;

    }


    const user =
      getUserFromToken();


    if (!user?.id) {

      console.log(
        "Logged-in user not found"
      );

      return;

    }


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

        ...(Number(user.role_id) === 1 && {

          parent_admin_id:
            Number(user.id),

        }),


        ...(Number(user.role_id) === 2 && {

          parent_cnf_id:
            Number(user.id),

        }),


        ...(Number(user.role_id) === 3 && {

          parent_super_distributor_id:
            Number(user.id),

        }),


        ...(Number(user.role_id) === 4 && {

          parent_distributor_id:
            Number(user.id),

        }),


        ...(Number(user.role_id) === 5 && {

          parent_fos_id:
            Number(user.id),

        }),


        ...(Number(user.role_id) === 6 && {

          parent_retailer_id:
            Number(user.id),

        }),


        ...(Number(user.role_id) === 7 && {
  parent_sub_retailer_id:
    Number(user.id),
}),

...(Number(user.role_id) === 8 && {
  parent_employee_id:
    Number(user.id),
}),

...(Number(user.role_id) === 9 && {
  parent_staff_id:
    Number(user.id),
}),

      })
    );


    // ===================================================
    // CNF CREATE
    // ===================================================

    if (
      Number(selectedRole) === 2
    ) {

      const loadAdminForCNF =
        async () => {

          try {

            const res =
              await getDropdownUsers(
                1,
                null
              );


            const admins =

              Array.isArray(res?.data)

                ? res.data

                : Array.isArray(
                    res?.data?.data
                  )

                ? res.data.data

                : Array.isArray(
                    res?.data?.users
                  )

                ? res.data.users

                : [];


            setCnfAdmins(admins);


            setParentUsers(
              (prev) => ({

                ...prev,

                1: admins,

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

              setCnfAdmin(null);

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


    if (!parents.length) {

      return;

    }


    const firstParentRole =
      parents[0];


    loadParentUsers(
  parents[0],
  null
);

  }, [
    selectedRole,
    loggedInRoleId,
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


          // Direct Distributor -> Retailer
          if (
            selectedUser?.parent_fos_id
          ) {

            updated.parent_fos_id =
              Number(
                selectedUser.parent_fos_id
              );

          } else {

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
if (
  currentRoleId === 8
) {

  updated.parent_employee_id =
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

  if (
    selectedUser?.parent_sub_retailer_id
  ) {
    updated.parent_sub_retailer_id =
      Number(
        selectedUser.parent_sub_retailer_id
      );
  }
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
    // NORMAL NEXT DROPDOWN
    // ===================================================

    const nextRoleId =
      parents[
        currentIndex + 1
      ];


    if (!nextRoleId) {

      return;

    }


    await loadParentUsers(
      nextRoleId,
      selectedId
    );

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
    // CNF
    // CNF -> ADMIN
    // ===================================================

    if (
      roleId === 2
    ) {

      return (
        hierarchy.parent_admin_id ||
        null
      );

    }


    // ===================================================
    // SUPER DISTRIBUTOR
    // SUPER -> CNF
    // ===================================================

    if (
      roleId === 3
    ) {

      return (
        hierarchy.parent_cnf_id ||
        null
      );

    }


    // ===================================================
    // DISTRIBUTOR
    // DISTRIBUTOR -> SUPER DISTRIBUTOR
    // ===================================================

    if (
      roleId === 4
    ) {

      return (
        hierarchy.parent_super_distributor_id ||
        null
      );

    }


    // ===================================================
    // FOS
    // FOS -> DISTRIBUTOR
    // ===================================================

    if (
      roleId === 5
    ) {

      return (
        hierarchy.parent_distributor_id ||
        null
      );

    }


    // ===================================================
    // RETAILER
    //
    // Priority:
    // FOS
    // otherwise Distributor
    // ===================================================

    if (
      roleId === 6
    ) {

      return (
        hierarchy.parent_fos_id ||
        hierarchy.parent_distributor_id ||
        null
      );

    }


    // ===================================================
    // EMPLOYEE
    // EMPLOYEE -> RETAILER
    // ===================================================

   if (
  roleId === 7
) {
  return (
    hierarchy.parent_retailer_id ||
    null
  );
}


    // ===================================================
    // STAFF
    // STAFF -> ADMIN
    // ===================================================

   if (
  roleId === 8
) {
  return (
    hierarchy.parent_sub_retailer_id ||
    null
  );
}

if (
  roleId === 9
) {
  return (
    hierarchy.parent_admin_id ||
    null
  );
}


    // ===================================================
    // ADMIN
    // ADMIN -> MASTER ADMIN
    //
    // Agar backend master admin ka parent_id use karta hai
    // to yahan token user id jayega.
    // ===================================================

    if (
      roleId === 1
    ) {

      return (
        tokenUser?.id
          ? Number(tokenUser.id)
          : null
      );

    }


    return null;

  };


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e
  ) => {

    e.preventDefault();


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
    // COMPLETE HIERARCHY FROM TOKEN
    // ===================================================

    const hierarchy = {

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
    // ===================================================

    const ownParentField =
      roleParentField[
        loggedUserRoleId
      ];


    if (
      ownParentField
    ) {

      hierarchy[
        ownParentField
      ] = loggedUserId;

    }


    // ===================================================
    // GET ACTUAL parent_id
    //
    // IMPORTANT
    // ===================================================

    const parent_id =
      getFinalParentId(
        roleId,
        hierarchy,
        tokenUser
      );


    console.log(
      "================================="
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
    // REQUIRED PARENT VALIDATION
    // ===================================================

    if (
      roleId > 1
    ) {

      // -------------------------------------------------
      // CNF
      // -------------------------------------------------

      if (
        roleId === 2 &&
        !hierarchy.parent_admin_id
      ) {

        toast.error(
          "Admin parent is required"
        );

        return;

      }


      // -------------------------------------------------
      // SUPER DISTRIBUTOR
      // -------------------------------------------------

      if (
        roleId === 3 &&
        (
          !hierarchy.parent_admin_id ||
          !hierarchy.parent_cnf_id
        )
      ) {

        toast.error(
          "Admin and CNF parent are required"
        );

        return;

      }


      // -------------------------------------------------
      // DISTRIBUTOR
      // -------------------------------------------------

      if (
        roleId === 4 &&
        (
          !hierarchy.parent_admin_id ||
          !hierarchy.parent_cnf_id ||
          !hierarchy.parent_super_distributor_id
        )
      ) {

        toast.error(
          "Admin, CNF and Super Distributor parents are required"
        );

        return;

      }


      // -------------------------------------------------
      // FOS
      // -------------------------------------------------

      if (
        roleId === 5 &&
        (
          !hierarchy.parent_admin_id ||
          !hierarchy.parent_cnf_id ||
          !hierarchy.parent_super_distributor_id ||
          !hierarchy.parent_distributor_id
        )
      ) {

        toast.error(
          "Please select the required parent details."
        );

        return;

      }


      // -------------------------------------------------
      // RETAILER
      // -------------------------------------------------

      if (
        roleId === 6 &&
        (
          !hierarchy.parent_admin_id ||
          !hierarchy.parent_cnf_id ||
          !hierarchy.parent_super_distributor_id ||
          !hierarchy.parent_distributor_id
        )
      ) {

        toast.error(
          "Admin, CNF, Super Distributor and Distributor parents are required"
        );

        return;

      }


      // -------------------------------------------------
      // EMPLOYEE
      // -------------------------------------------------

      if (
  roleId === 8 &&
  (
    !hierarchy.parent_admin_id ||
    !hierarchy.parent_cnf_id ||
    !hierarchy.parent_super_distributor_id ||
    !hierarchy.parent_distributor_id ||
    !hierarchy.parent_fos_id ||
    !hierarchy.parent_retailer_id ||
    !hierarchy.parent_sub_retailer_id
  )
) {
  toast.error(
    "Please select the required parent details."
  );

  return;
}

if (
  roleId === 9 &&
  !hierarchy.parent_admin_id
) {
  toast.error(
    "Admin parent is required for Staff"
  );

  return;
}


      // -------------------------------------------------
      // parent_id MUST EXIST
      // -------------------------------------------------

      if (!parent_id) {

        toast.error(
          "Parent ID is required"
        );

        return;

      }

    }


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


      role_id:
        roleId,


      // =================================================
      // COMPLETE HIERARCHY
      // =================================================

      parent_admin_id:
        hierarchy.parent_admin_id,


      parent_cnf_id:
        hierarchy.parent_cnf_id,


      parent_super_distributor_id:
        hierarchy.parent_super_distributor_id,


      parent_distributor_id:
        hierarchy.parent_distributor_id,


      parent_fos_id:
        hierarchy.parent_fos_id,


      parent_retailer_id:
        hierarchy.parent_retailer_id,

parent_sub_retailer_id:
  hierarchy.parent_sub_retailer_id,

      parent_employee_id:
        hierarchy.parent_employee_id,


      parent_staff_id:
        hierarchy.parent_staff_id,


      // =================================================
      // IMPORTANT
      //
      // Actual immediate parent
      // =================================================

      parent_id:
        parent_id,

    };


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


      toast.success(
        res?.message ||
        "Registered Successfully"
      );


      // =================================================
      // RESET
      // =================================================

      setFormData({

        ...initialFormData,

        role_id:
          roleId,

      });


      setParentUsers({});


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

              {Number(selectedRole) === 2 ? (

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
                    Admin
                  </label>


                  {cnfAdmins.length <= 1 ? (

                    <div
                      className="
                        w-full
                        border
                        border-slate-300
                        rounded-lg
                        px-4
                        py-2.5
                        text-sm
                        bg-slate-50
                      "
                    >

                      {cnfAdmin?.name ||
                        "Loading Admin..."}

                    </div>

                  ) : (

                    <div
                      className="
                        relative
                      "
                    >

                      <select
                        value={
                          formData.parent_admin_id ||
                          ""
                        }
                        onChange={(e) =>
                          handleParentChange(
                            1,
                            e.target.value
                          )
                        }
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
                          Select Admin
                        </option>


                        {cnfAdmins.map(
                          (admin) => (

                            <option
                              key={
                                admin.id
                              }
                              value={
                                admin.id
                              }
                            >

                              {admin.name}

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

                  )}

                </div>

              ) : (

                /* =================================================
                    OTHER ROLES
                ================================================= */

                visibleParentRoles.map(
                  (parentRoleId) => {

                    const users =
                      parentUsers[
                        parentRoleId
                      ] || [];


                    return (

                      <div
                        key={
                          parentRoleId
                        }
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

                          {getRoleName(
                            parentRoleId
                          )}

                        </label>


                        <div
                          className="
                            relative
                          "
                        >

                          <select
                            value={

                              formData[
                                roleParentField[
                                  parentRoleId
                                ]
                              ] || ""

                            }
                            onChange={(e) =>
                              handleParentChange(
                                parentRoleId,
                                e.target.value
                              )
                            }
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

                              Select{" "}

                              {getRoleName(
                                parentRoleId
                              )}

                            </option>


                            {users.map(
                              (user) => (

                                <option
                                  key={
                                    user.id
                                  }
                                  value={
                                    user.id
                                  }
                                >

                                  {user.name}

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

                    );

                  }
                )

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


              <select
                name="country"
                value={
                  formData.country
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
                  bg-white
                "
              >

                <option value="">
                  Select Country
                </option>


                {countries.map(
                  (country) => (

                    <option
                      key={
                        country.isoCode
                      }
                      value={
                        country.isoCode
                      }
                    >

                      {country.name}

                    </option>

                  )
                )}

              </select>

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


              <select
                name="state"
                value={
                  formData.state
                }
                onChange={
                  handleChange
                }
                required
                disabled={
                  !formData.country
                }
                className="
                  w-full
                  border
                  border-slate-300
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  bg-white
                  disabled:bg-slate-50
                "
              >

                <option value="">
                  Select State
                </option>


                {states.map(
                  (state) => (

                    <option
                      key={
                        state.isoCode
                      }
                      value={
                        state.isoCode
                      }
                    >

                      {state.name}

                    </option>

                  )
                )}

              </select>

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


              <select
                name="city"
                value={
                  formData.city
                }
                onChange={
                  handleChange
                }
                required
                disabled={
                  !formData.state
                }
                className="
                  w-full
                  border
                  border-slate-300
                  rounded-lg
                  px-4
                  py-2.5
                  text-sm
                  bg-white
                  disabled:bg-slate-50
                "
              >

                <option value="">
                  Select City
                </option>


                {cities.map(
                  (city) => (

                    <option
                      key={
                        city.name
                      }
                      value={
                        city.name
                      }
                    >

                      {city.name}

                    </option>

                  )
                )}

              </select>

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