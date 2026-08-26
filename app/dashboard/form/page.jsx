"use client";

import {
  addStaff,
  getDropdownUsers,
  getModules,
} from "@/services/api";

import { getUserFromToken } from "@/utils/token";

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

import { useSearchParams } from "next/navigation";

import { toast } from "react-toastify";

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

  parent_admin_id: null,
  parent_cnf_id: null,
  parent_super_distributor_id: null,
  parent_distributor_id: null,
  parent_fos_id: null,
  parent_retailer_id: null,
  parent_sub_retailer_id: null,
  parent_employee_id: null,
  parent_staff_id: null,

  new_device: 0,
  old_device: 0,
  supreme_device: 0,
  pro_star: 0,
  lite: 0,
  google_tv: 0,
  supreme_lock: 0,
};

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

export default function Page() {
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState(initialFormData);
  const [parentUsers, setParentUsers] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [parentSearch, setParentSearch] = useState({});
  const [searchLoading, setSearchLoading] = useState({});
  const [cnfAdmin, setCnfAdmin] = useState(null);
  const [cnfAdmins, setCnfAdmins] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [modules, setModules] = useState([]);

  const selectedRole = Number(searchParams.get("role_id"));

  const loggedInUser = getUserFromToken();
  const loggedInRoleId = Number(loggedInUser?.role_id);

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

    return roles[Number(roleId)] || "User";
  };

  const normalizeRoleName = (name) => {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  };

  const isRoleActive = (roleId) => {
    const role = Number(roleId);

    const roleName = normalizeRoleName(
      getRoleName(role)
    );

    const module = modules.find((item) => {
      const moduleName =
        typeof item === "string"
          ? item
          : item?.name;

      const normalizedModuleName =
        normalizeRoleName(moduleName);

      if (
        role === 3 &&
        (
          normalizedModuleName === "superdistributor" ||
          normalizedModuleName === "superdistributer"
        )
      ) {
        return true;
      }

      return normalizedModuleName === roleName;
    });

    if (!module) {
      return false;
    }

    return Number(module?.status) === 1;
  };

  const visibleParentRoles = (
    parentRoles[selectedRole] || []
  ).filter((roleId) => {
    const role = Number(roleId);
    const loggedRole = Number(loggedInRoleId);
    const createRole = Number(selectedRole);

    if (!isRoleActive(role)) {
      return false;
    }

    if (loggedRole === 0) {
      return role < createRole;
    }

    if (role === loggedRole) {
      return false;
    }

    if (role < loggedRole) {
      return false;
    }

    return (
      role > loggedRole &&
      role < createRole
    );
  });

  const getUsersFromResponse = (response) => {
    if (Array.isArray(response?.data)) {
      return response.data;
    }

    if (Array.isArray(response?.data?.data)) {
      return response.data.data;
    }

    if (Array.isArray(response?.data?.users)) {
      return response.data.users;
    }

    if (Array.isArray(response?.users)) {
      return response.users;
    }

    return [];
  };

  const loadParentUsers = async (
    roleId,
    parentId = null
  ) => {
    try {
      const response = await getDropdownUsers(
        Number(roleId),
        parentId ? Number(parentId) : null
      );

      const users = getUsersFromResponse(response);

      const returnedRoleId = Number(
        response?.current_role_id ||
          response?.data?.current_role_id ||
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
        error?.response?.data || error
      );
    }
  };

  useEffect(() => {
    const loadModules = async () => {
      try {
        const response = await getModules();

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
          "GET MODULES ERROR:",
          error
        );

        setModules([]);
      }
    };

    loadModules();
  }, []);

  useEffect(() => {
    if (!selectedRole || selectedRole <= 1) {
      return;
    }

    const user = getUserFromToken();

    if (!user?.id) {
      return;
    }

    const currentLoggedRole = Number(user.role_id);
    const currentSelectedRole = Number(selectedRole);
    const loggedUserId = Number(user.id);

    setFormData((prev) => ({
      ...prev,

      parent_admin_id: user.parent_admin_id
        ? Number(user.parent_admin_id)
        : null,

      parent_cnf_id: user.parent_cnf_id
        ? Number(user.parent_cnf_id)
        : null,

      parent_super_distributor_id:
        user.parent_super_distributor_id
          ? Number(user.parent_super_distributor_id)
          : null,

      parent_distributor_id:
        user.parent_distributor_id
          ? Number(user.parent_distributor_id)
          : null,

      parent_fos_id: user.parent_fos_id
        ? Number(user.parent_fos_id)
        : null,

      parent_retailer_id: user.parent_retailer_id
        ? Number(user.parent_retailer_id)
        : null,

      parent_sub_retailer_id:
        user.parent_sub_retailer_id
          ? Number(user.parent_sub_retailer_id)
          : null,

      parent_employee_id:
        user.parent_employee_id
          ? Number(user.parent_employee_id)
          : null,

      parent_staff_id: user.parent_staff_id
        ? Number(user.parent_staff_id)
        : null,

      ...(currentLoggedRole === 1 && {
        parent_admin_id: loggedUserId,
      }),

      ...(currentLoggedRole === 2 && {
        parent_cnf_id: loggedUserId,
      }),

      ...(currentLoggedRole === 3 && {
        parent_super_distributor_id: loggedUserId,
      }),

      ...(currentLoggedRole === 4 && {
        parent_distributor_id: loggedUserId,
      }),

      ...(currentLoggedRole === 5 && {
        parent_fos_id: loggedUserId,
      }),

      ...(currentLoggedRole === 6 && {
        parent_retailer_id: loggedUserId,
      }),

      ...(currentLoggedRole === 7 && {
        parent_sub_retailer_id: loggedUserId,
      }),

      ...(currentLoggedRole === 8 && {
        parent_employee_id: loggedUserId,
      }),

      ...(currentLoggedRole === 9 && {
        parent_staff_id: loggedUserId,
      }),
    }));

    if (currentSelectedRole === 2) {
      const loadAdminForCNF = async () => {
        try {
          const response =
            await getDropdownUsers(1, null);

          const admins =
            getUsersFromResponse(response);

          setCnfAdmins(admins);

          setParentUsers((prev) => ({
            ...prev,
            1: admins,
          }));

          if (admins.length === 1) {
            const admin = admins[0];

            setCnfAdmin(admin);

            setFormData((prev) => ({
              ...prev,
              parent_admin_id: Number(admin.id),
            }));
          } else {
            setCnfAdmin(null);

            setFormData((prev) => ({
              ...prev,
              parent_admin_id: null,
            }));
          }
        } catch (error) {
          console.error(
            "CNF ADMIN ERROR:",
            error?.response?.data || error
          );
        }
      };

      loadAdminForCNF();
      return;
    }

    const parents = visibleParentRoles;

    if (!parents.length) {
      return;
    }

    const filteredParents = parents.filter(
      (roleId) => {
        const role = Number(roleId);

        return (
          role > currentLoggedRole &&
          role < currentSelectedRole
        );
      }
    );

    if (!filteredParents.length) {
      return;
    }

    const firstParentRole =
      filteredParents[0];

    const loadFirstParent = async () => {
      try {
        const response =
          await getDropdownUsers(
            Number(firstParentRole),
            loggedUserId
          );

        const users =
          getUsersFromResponse(response);

        setParentUsers((prev) => ({
          ...prev,
          [Number(firstParentRole)]: users,
        }));
      } catch (error) {
        console.error(
          "FIRST PARENT DROPDOWN ERROR:",
          error?.response?.data || error
        );
      }
    };

    loadFirstParent();
  }, [
    selectedRole,
    loggedInRoleId,
    modules,
  ]);

  useEffect(() => {
    if (
      openDropdown === null ||
      openDropdown === undefined
    ) {
      return;
    }

    const roleId = Number(openDropdown);

    const search = (
      parentSearch[roleId] || ""
    ).trim();

    const parents =
      parentRoles[selectedRole] || [];

    const currentIndex =
      parents.indexOf(roleId);

    let parentId = null;

    if (currentIndex > 0) {
      for (
        let i = currentIndex - 1;
        i >= 0;
        i--
      ) {
        const previousRole =
          Number(parents[i]);

        const previousField =
          roleParentField[previousRole];

        if (
          previousField &&
          formData[previousField]
        ) {
          parentId = Number(
            formData[previousField]
          );
          break;
        }
      }
    }

    const timer = setTimeout(
      async () => {
        try {
          setSearchLoading((prev) => ({
            ...prev,
            [roleId]: true,
          }));

          const response =
            await getDropdownUsers(
              roleId,
              parentId,
              search
            );

          const users =
            getUsersFromResponse(response);

          setParentUsers((prev) => ({
            ...prev,
            [roleId]: users,
          }));
        } catch (error) {
          console.error(
            "API SEARCH ERROR:",
            error?.response?.data || error
          );

          setParentUsers((prev) => ({
            ...prev,
            [roleId]: [],
          }));
        } finally {
          setSearchLoading((prev) => ({
            ...prev,
            [roleId]: false,
          }));
        }
      },
      400
    );

    return () => clearTimeout(timer);
  }, [
    openDropdown,
    parentSearch,
    selectedRole,
    formData,
  ]);

  useEffect(() => {
    const roleId =
      searchParams.get("role_id");

    if (roleId) {
      setFormData((prev) => ({
        ...prev,
        role_id: Number(roleId),
      }));
    }
  }, [searchParams]);

  const countries =
    Country.getAllCountries();

  const states = formData.country
    ? State.getStatesOfCountry(
        formData.country
      )
    : [];

  const cities =
    formData.country && formData.state
      ? City.getCitiesOfState(
          formData.country,
          formData.state
        )
      : [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: value,
      };

      if (name === "country") {
        updated.state = "";
        updated.city = "";
      }

      if (name === "state") {
        updated.city = "";
      }

      return updated;
    });
  };

  const handleParentChange = async (
    parentRoleId,
    parentId
  ) => {
    const currentRoleId =
      Number(parentRoleId);

    const selectedId = parentId
      ? Number(parentId)
      : null;

    const parents =
      visibleParentRoles;

    const currentIndex =
      parents.indexOf(currentRoleId);

    const selectedUser = (
      parentUsers[currentRoleId] || []
    ).find(
      (user) =>
        Number(user.id) === selectedId
    );

    setFormData((prev) => {
      const updated = { ...prev };

      if (currentRoleId === 1) {
        updated.parent_admin_id =
          selectedId;
      }

      if (currentRoleId === 2) {
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

      if (currentRoleId === 3) {
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

      if (currentRoleId === 4) {
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

        updated.parent_fos_id = null;
        updated.parent_retailer_id = null;
      }

      if (currentRoleId === 5) {
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

        updated.parent_retailer_id = null;
      }

      if (currentRoleId === 6) {
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
          updated.parent_fos_id =
            Number(
              selectedUser.parent_id
            );
        } else if (
          !updated.parent_fos_id
        ) {
          updated.parent_fos_id = null;
        }
      }

      if (currentRoleId === 7) {
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

      if (currentRoleId === 8) {
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

        updated.parent_retailer_id =
          selectedId;

        updated.parent_sub_retailer_id =
          null;
      }

      return updated;
    });

    const updatedParentUsers = {
      ...parentUsers,
    };

    if (currentIndex !== -1) {
      parents
        .slice(currentIndex + 1)
        .forEach((roleId) => {
          updatedParentUsers[roleId] = [];
        });
    }

    setParentUsers(updatedParentUsers);

    if (!selectedId) {
      return;
    }

    if (currentRoleId === 4) {
      try {
        setParentUsers((prev) => ({
          ...prev,
          5: [],
          6: [],
        }));

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

        if (fosUsers.length > 0) {
          setParentUsers((prev) => ({
            ...prev,
            5: fosUsers,
            6: [],
          }));

          return;
        }

        setParentUsers((prev) => ({
          ...prev,
          5: [],
          6: directRetailerUsers,
        }));

        return;
      } catch (error) {
        console.error(
          "DISTRIBUTOR ERROR:",
          error?.response?.data || error
        );

        setParentUsers((prev) => ({
          ...prev,
          5: [],
          6: [],
        }));

        toast.error(
          "FOS / Retailer dropdown load failed"
        );

        return;
      }
    }

    if (currentRoleId === 5) {
      try {
        setParentUsers((prev) => ({
          ...prev,
          6: [],
        }));

        const response =
          await getDropdownUsers(
            6,
            selectedId
          );

        const retailerUsers =
          getUsersFromResponse(response);

        setParentUsers((prev) => ({
          ...prev,
          6: retailerUsers,
        }));

        return;
      } catch (error) {
        console.error(
          "RETAILER ERROR:",
          error?.response?.data || error
        );

        setParentUsers((prev) => ({
          ...prev,
          6: [],
        }));

        toast.error(
          "Retailer dropdown load failed"
        );

        return;
      }
    }

    const nextRoleIndex =
      currentIndex + 1;

    const nextRole =
      parents[nextRoleIndex];

    if (!nextRole) {
      return;
    }

    await loadParentUsers(
      Number(nextRole),
      selectedId
    );
  };

  const getFinalParentId = (
    roleId,
    hierarchy
  ) => {
    const role = Number(roleId);

    if (role === 1) {
      return null;
    }

    const hierarchyOrder = {
      2: [
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],

      3: [
        {
          role: 2,
          field: "parent_cnf_id",
        },
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],

      4: [
        {
          role: 3,
          field: "parent_super_distributor_id",
        },
        {
          role: 2,
          field: "parent_cnf_id",
        },
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],

      5: [
        {
          role: 4,
          field: "parent_distributor_id",
        },
        {
          role: 3,
          field: "parent_super_distributor_id",
        },
        {
          role: 2,
          field: "parent_cnf_id",
        },
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],

      6: [
        {
          role: 5,
          field: "parent_fos_id",
        },
        {
          role: 4,
          field: "parent_distributor_id",
        },
        {
          role: 3,
          field: "parent_super_distributor_id",
        },
        {
          role: 2,
          field: "parent_cnf_id",
        },
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],

      7: [
        {
          role: 6,
          field: "parent_retailer_id",
        },
        {
          role: 5,
          field: "parent_fos_id",
        },
        {
          role: 4,
          field: "parent_distributor_id",
        },
        {
          role: 3,
          field: "parent_super_distributor_id",
        },
        {
          role: 2,
          field: "parent_cnf_id",
        },
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],

      8: [
        {
          role: 7,
          field: "parent_sub_retailer_id",
        },
        {
          role: 6,
          field: "parent_retailer_id",
        },
        {
          role: 5,
          field: "parent_fos_id",
        },
        {
          role: 4,
          field: "parent_distributor_id",
        },
        {
          role: 3,
          field: "parent_super_distributor_id",
        },
        {
          role: 2,
          field: "parent_cnf_id",
        },
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],

      9: [
        {
          role: 1,
          field: "parent_admin_id",
        },
      ],
    };

    const possibleParents =
      hierarchyOrder[role] || [];

    for (const parent of possibleParents) {
      const parentId =
        hierarchy[parent.field];

      if (parentId) {
        return Number(parentId);
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const roleId =
      Number(formData.role_id);

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
      Number(tokenUser.id);

    const loggedUserRoleId =
      Number(tokenUser.role_id);

    const hierarchy = {
      parent_admin_id:
        formData.parent_admin_id
          ? Number(formData.parent_admin_id)
          : tokenUser.parent_admin_id
          ? Number(tokenUser.parent_admin_id)
          : null,

      parent_cnf_id:
        formData.parent_cnf_id
          ? Number(formData.parent_cnf_id)
          : tokenUser.parent_cnf_id
          ? Number(tokenUser.parent_cnf_id)
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
          ? Number(formData.parent_fos_id)
          : tokenUser.parent_fos_id
          ? Number(tokenUser.parent_fos_id)
          : null,

      parent_retailer_id:
        formData.parent_retailer_id
          ? Number(formData.parent_retailer_id)
          : tokenUser.parent_retailer_id
          ? Number(tokenUser.parent_retailer_id)
          : null,

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

      parent_employee_id:
        formData.parent_employee_id
          ? Number(formData.parent_employee_id)
          : tokenUser.parent_employee_id
          ? Number(tokenUser.parent_employee_id)
          : null,

      parent_staff_id:
        formData.parent_staff_id
          ? Number(formData.parent_staff_id)
          : tokenUser.parent_staff_id
          ? Number(tokenUser.parent_staff_id)
          : null,
    };

    if (loggedUserRoleId === 1) {
      hierarchy.parent_admin_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 2) {
      hierarchy.parent_cnf_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 3) {
      hierarchy.parent_super_distributor_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 4) {
      hierarchy.parent_distributor_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 5) {
      hierarchy.parent_fos_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 6) {
      hierarchy.parent_retailer_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 7) {
      hierarchy.parent_sub_retailer_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 8) {
      hierarchy.parent_employee_id =
        loggedUserId;
    }

    if (loggedUserRoleId === 9) {
      hierarchy.parent_staff_id =
        loggedUserId;
    }

    const parent_id =
      getFinalParentId(
        roleId,
        hierarchy
      ) || null;

    if (
      formData.password !==
      formData.confirm_password
    ) {
      toast.error(
        "Password and Confirm Password do not match!"
      );
      return;
    }

    const payload = {
      ...formData,

      role_id: roleId,

      parent_admin_id:
        hierarchy.parent_admin_id || null,

      parent_cnf_id:
        hierarchy.parent_cnf_id || null,

      parent_super_distributor_id:
        hierarchy.parent_super_distributor_id ||
        null,

      parent_distributor_id:
        hierarchy.parent_distributor_id ||
        null,

      parent_fos_id:
        hierarchy.parent_fos_id || null,

      parent_retailer_id:
        hierarchy.parent_retailer_id || null,

      parent_sub_retailer_id:
        hierarchy.parent_sub_retailer_id ||
        null,

      parent_employee_id:
        hierarchy.parent_employee_id || null,

      parent_staff_id:
        hierarchy.parent_staff_id || null,

      parent_id,
    };

    try {
      const response =
        await addStaff(payload);

      toast.success(
        response?.message ||
          "Registered Successfully"
      );

      setFormData({
        ...initialFormData,
        role_id: roleId,
      });

      setParentUsers({});
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      console.error(
        "REGISTER ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Something went wrong"
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6">
        <div className="flex justify-between items-center">
          <Link
            href={`/dashboard?role=${selectedRole}`}
            className="bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-800 whitespace-nowrap"
          >
            {getRoleName(selectedRole)} List
          </Link>
        </div>

        {selectedRole > 1 &&
          selectedRole !== 2 &&
          visibleParentRoles.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
              {visibleParentRoles.map(
                (parentRoleId) => {
                  const role =
                    Number(parentRoleId);

                  const users =
                    parentUsers[role] || [];

                  const parentField =
                    roleParentField[role];

                  return (
                    <div
                      key={role}
                      className="space-y-1.5"
                    >
                      <label className="text-sm font-medium text-slate-700">
                        {getRoleName(role)}
                      </label>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenDropdown(
                              openDropdown === role
                                ? null
                                : role
                            )
                          }
                          className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-left transition focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700 cursor-pointer"
                        >
                          <span className="truncate">
                            {formData[parentField]
                              ? users.find(
                                  (user) =>
                                    Number(
                                      user.id
                                    ) ===
                                    Number(
                                      formData[
                                        parentField
                                      ]
                                    )
                                )?.name ||
                                `Selected ${getRoleName(
                                  role
                                )}`
                              : `Select ${getRoleName(
                                  role
                                )}`}
                          </span>

                          <RiArrowDownSLine
                            size={22}
                            className={`shrink-0 transition-transform text-slate-500 ${
                              openDropdown === role
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>

                        {openDropdown === role && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                            <div className="p-2 border-b border-slate-200">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={
                                    parentSearch[
                                      role
                                    ] || ""
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
                                  placeholder={`Search ${getRoleName(
                                    role
                                  )}...`}
                                  autoFocus
                                  className="w-full border border-slate-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                {searchLoading[
                                  role
                                ] && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                    <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="max-h-60 overflow-y-auto">
                              {!searchLoading[
                                role
                              ] && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleParentChange(
                                      role,
                                      ""
                                    );

                                    setOpenDropdown(
                                      null
                                    );

                                    setParentSearch(
                                      (prev) => ({
                                        ...prev,
                                        [role]: "",
                                      })
                                    );
                                  }}
                                  className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
                                >
                                  Select{" "}
                                  {getRoleName(
                                    role
                                  )}
                                </button>
                              )}

                              {searchLoading[
                                role
                              ] && (
                                <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-blue-600">
                                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                  Searching{" "}
                                  {getRoleName(
                                    role
                                  )}
                                  ...
                                </div>
                              )}

                              {!searchLoading[
                                role
                              ] &&
                                users.map(
                                  (user) => (
                                    <button
                                      key={user.id}
                                      type="button"
                                      onClick={() => {
                                        handleParentChange(
                                          role,
                                          user.id
                                        );

                                        setOpenDropdown(
                                          null
                                        );

                                        setParentSearch(
                                          (prev) => ({
                                            ...prev,
                                            [role]: "",
                                          })
                                        );
                                      }}
                                      className={`w-full text-left px-4 py-2.5 text-sm transition ${
                                        Number(
                                          formData[
                                            parentField
                                          ]
                                        ) ===
                                        Number(user.id)
                                          ? "bg-blue-50 text-blue-700 font-medium"
                                          : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      {user.name}
                                    </button>
                                  )
                                )}

                              {!searchLoading[
                                role
                              ] &&
                                users.length ===
                                  0 && (
                                  <div className="px-4 py-4 text-center text-sm text-slate-400">
                                    {parentSearch[
                                      role
                                    ]?.trim()
                                      ? `No ${getRoleName(
                                          role
                                        )} found`
                                      : `No ${getRoleName(
                                          role
                                        )} available`}
                                  </div>
                                )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

        <form
          onSubmit={handleSubmit}
          className="pt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Organization Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="organization_name"
                placeholder="Enter organization name"
                value={
                  formData.organization_name
                }
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Full Name{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email Address{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="email"
                name="email"
                placeholder="staff@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Phone Number{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone: e.target.value.replace(
                      /[^\d+\s]/g,
                      ""
                    ),
                  }))
                }
                required
                pattern="^(\+91\s?)?[6-9]\d{9}$"
                title="Enter a valid Indian mobile number"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Company Address{" "}
                <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                name="company_address"
                placeholder="Street, Building, Area"
                value={
                  formData.company_address
                }
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Password{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showPassword ? (
                    <RiEyeOffLine size={20} />
                  ) : (
                    <RiEyeLine size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Confirm Password{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
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
                  onChange={handleChange}
                  required
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      !showConfirmPassword
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <RiEyeOffLine size={20} />
                  ) : (
                    <RiEyeLine size={20} />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Country{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                State{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  disabled={!formData.country}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    Select State
                  </option>

                  {states.map((state) => (
                    <option
                      key={state.isoCode}
                      value={state.isoCode}
                    >
                      {state.name}
                    </option>
                  ))}
                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                City{" "}
                <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  disabled={!formData.state}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    Select City
                  </option>

                  {cities.map((city) => (
                    <option
                      key={city.name}
                      value={city.name}
                    >
                      {city.name}
                    </option>
                  ))}
                </select>

                <RiArrowDownSLine
                  size={22}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            {Number(formData.role_id) === 6 && (
              <div className="md:col-span-3 space-y-4">
                <h3 className="text-lg font-semibold text-slate-700">
                  Device Permissions
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: "New Device",
                      name: "new_device",
                    },
                    {
                      label: "Old Device",
                      name: "old_device",
                    },
                    {
                      label: "Supreme Device",
                      name: "supreme_device",
                    },
                    {
                      label: "Pro Star",
                      name: "pro_star",
                    },
                    {
                      label: "Lite",
                      name: "lite",
                    },
                    {
                      label: "Google TV",
                      name: "google_tv",
                    },
                    {
                      label: "Supreme Lock",
                      name: "supreme_lock",
                    },
                  ].map((item) => (
                    <label
                      key={item.name}
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border transition cursor-pointer ${
                        formData[item.name] === 1
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-300 bg-white hover:border-blue-400"
                      }`}
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {item.label}
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          formData[item.name] === 1
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            [item.name]:
                              e.target.checked
                                ? 1
                                : 0,
                          }))
                        }
                        className="h-5 w-5 accent-blue-600 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="bg-blue-400 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}