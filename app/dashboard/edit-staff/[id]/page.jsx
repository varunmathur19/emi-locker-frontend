"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import {
  RiArrowDownSLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";

import {
  updateStaffData,
  getStaffDataById,
  getDropdownUsers,
  getModules,
} from "@/services/api";

import { getUserFromToken } from "@/utils/token";
import { toast } from "react-toastify";

import {
  Country,
  State,
  City,
} from "country-state-city";

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
  parent_id: null,

  new_device: 0,
  old_device: 0,
  supreme_device: 0,
  pro_star: 0,
  lite: 0,
  google_tv: 0,
  supreme_lock: 0,
};

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

const devicePermissions = [
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
];

export default function EditStaffPage() {
  const params = useParams();
  const userId = params?.id;

  const [formData, setFormData] =
    useState(initialFormData);

  const [loggedInRoleId, setLoggedInRoleId] =
    useState(null);

  const [loggedInUserId, setLoggedInUserId] =
    useState(null);

  const [modules, setModules] =
    useState([]);

  const [parentUsers, setParentUsers] =
    useState({});

  const [selectedParents, setSelectedParents] =
    useState({});

  const [parentSearch, setParentSearch] =
    useState({});

  const [parentLoading, setParentLoading] =
    useState({});

  const [openDropdown, setOpenDropdown] =
    useState(null);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  /*
   * IMPORTANT
   *
   * Ye state current selected hierarchy ke according
   * FOS available hai ya nahi wo store karegi.
   *
   * Example:
   *
   * Distributor 10 ke under FOS hai
   * => fosAvailable = true
   *
   * Distributor 20 ke under FOS nahi hai
   * => fosAvailable = false
   */
  const [fosAvailable, setFosAvailable] =
    useState(false);

  const [fosChecking, setFosChecking] =
    useState(false);

  const searchTimers = useRef({});

  const countries = useMemo(
    () => Country.getAllCountries(),
    []
  );

  const states = useMemo(() => {
    if (!formData.country) {
      return [];
    }

    return State.getStatesOfCountry(
      formData.country
    );
  }, [formData.country]);

  const cities = useMemo(() => {
    if (
      !formData.country ||
      !formData.state
    ) {
      return [];
    }

    return City.getCitiesOfState(
      formData.country,
      formData.state
    );
  }, [
    formData.country,
    formData.state,
  ]);

  const getRoleName = (roleId) => {
    return (
      roles[Number(roleId)] ||
      "User"
    );
  };

  const normalizeRoleName = (name) => {
    return String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "");
  };

  const isRoleActive = (roleId) => {
    const role = Number(roleId);

    const roleName =
      normalizeRoleName(
        getRoleName(role)
      );

    const module =
      modules.find((item) => {
        const moduleName =
          typeof item === "string"
            ? item
            : item?.name;

        const normalizedModuleName =
          normalizeRoleName(
            moduleName
          );

        if (
          role === 3 &&
          [
            "superdistributor",
            "superdistributer",
          ].includes(
            normalizedModuleName
          )
        ) {
          return true;
        }

        return (
          normalizedModuleName ===
          roleName
        );
      });

    /*
     * Agar module hi nahi mila to role ko active
     * maana jayega.
     */
    if (!module) {
      return true;
    }

    return Number(module?.status) === 1;
  };

  /*
   * ============================================================
   * GET USERS FROM API RESPONSE
   * ============================================================
   */
  const getUsersFromResponse = (response) => {
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

  /*
   * ============================================================
   * CHECK FOS FOR SELECTED DISTRIBUTOR
   * ============================================================
   *
   * role_id = 5 => FOS
   *
   * parent_id = selected Distributor id
   *
   * Agar API se FOS milta hai:
   *    fosAvailable = true
   *
   * Agar API se FOS nahi milta:
   *    fosAvailable = false
   *
   * IMPORTANT:
   * Ye current edited user's hierarchy par depend nahi karta.
   * Ye selected Distributor ke actual data par depend karta hai.
   */
  const checkFosForDistributor = async (
    distributorId,
    keepSelectedFos = false
  ) => {
    const id = Number(distributorId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setFosAvailable(false);

      /*
       * FOS selected value clear
       */
      if (!keepSelectedFos) {
        setSelectedParents(
          (prev) => {
            const updated = {
              ...prev,
            };

            delete updated[5];

            return updated;
          }
        );
      }

      return false;
    }

    setFosChecking(true);

    try {
      /*
       * FOS role = 5
       * parent_id = Distributor ID
       */
      const response =
        await getDropdownUsers(
          5,
          id,
          ""
        );

      let users =
        getUsersFromResponse(
          response
        );

      /*
       * Sirf FOS check karo jo isi Distributor ke
       * direct parent hain.
       */
      users = users.filter(
        (user) =>
          Number(user?.role_id) === 5 &&
          Number(user?.parent_id) === id
      );

      const exists =
        users.length > 0;

      setFosAvailable(exists);

      /*
       * Agar FOS nahi hai to selected FOS bhi clear.
       *
       * Lekin edit ke initial load me selected FOS ko
       * preserve kar sakte hain.
       */
      if (!exists && !keepSelectedFos) {
        setSelectedParents(
          (prev) => {
            const updated = {
              ...prev,
            };

            delete updated[5];

            return updated;
          }
        );

        setParentUsers(
          (prev) => {
            const updated = {
              ...prev,
            };

            delete updated[5];

            return updated;
          }
        );
      } else if (exists) {
        /*
         * FOS users already mil gaye hain.
         * Dropdown open hone se pehle hi store kar do.
         */
        setParentUsers(
          (prev) => ({
            ...prev,
            5: users,
          })
        );
      }

      return exists;
    } catch (error) {
      console.error(
        "CHECK FOS ERROR:",
        error?.response?.data ||
          error
      );

      setFosAvailable(false);

      if (!keepSelectedFos) {
        setSelectedParents(
          (prev) => {
            const updated = {
              ...prev,
            };

            delete updated[5];

            return updated;
          }
        );
      }

      return false;
    } finally {
      setFosChecking(false);
    }
  };

  /*
   * ============================================================
   * VISIBLE PARENT ROLES
   * ============================================================
   *
   * FOS (5) special case hai.
   *
   * Agar selected Distributor ke under FOS hai:
   *    FOS dropdown show
   *
   * Agar selected Distributor ke under FOS nahi hai:
   *    FOS dropdown hide
   */
  const visibleParentRoles = useMemo(() => {
    const currentRole =
      Number(formData.role_id);

    const loggedRole =
      Number(loggedInRoleId);

    if (
      !currentRole ||
      currentRole <= 1
    ) {
      return [];
    }

    const requiredParents =
      parentRoles[currentRole] || [];

    return requiredParents.filter(
      (roleId) => {
        const role =
          Number(roleId);

        /*
         * Module inactive role hide.
         */
        if (!isRoleActive(role)) {
          return false;
        }

        /*
         * ======================================================
         * FOS SPECIAL LOGIC
         * ======================================================
         *
         * Current role 6/7/8 etc. me FOS parent required ho
         * sakta hai.
         *
         * Lekin FOS tabhi show hoga jab selected Distributor
         * ke under FOS actually exist kare.
         */
        if (role === 5) {
          /*
           * Agar current role FOS khud hai to FOS ko parent
           * nahi banana hai.
           */
          if (currentRole <= 5) {
            return false;
          }

          return fosAvailable;
        }

        /*
         * Master Admin ke liye saare previous hierarchy roles.
         */
        if (loggedRole === 0) {
          return role < currentRole;
        }

        /*
         * Logged-in role se upar/neeche hierarchy restriction.
         */
        if (
          role <= loggedRole ||
          role >= currentRole
        ) {
          return false;
        }

        return true;
      }
    );
  }, [
    formData.role_id,
    loggedInRoleId,
    modules,
    fosAvailable,
  ]);

  /*
   * ============================================================
   * LOGIN USER
   * ============================================================
   */
  useEffect(() => {
    const user =
      getUserFromToken();

    if (user?.role_id != null) {
      setLoggedInRoleId(
        Number(user.role_id)
      );
    }

    if (user?.id != null) {
      setLoggedInUserId(
        Number(user.id)
      );
    }
  }, []);

  /*
   * ============================================================
   * LOAD MODULES
   * ============================================================
   */
  useEffect(() => {
    const loadModules = async () => {
      try {
        const response =
          await getModules();

        if (
          response?.success &&
          Array.isArray(
            response?.modules
          )
        ) {
          setModules(
            response.modules
          );
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

  /*
   * ============================================================
   * FORM CHANGE
   * ============================================================
   */
  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => {
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
    });
  };

  /*
   * ============================================================
   * GET API PARENT ID
   * ============================================================
   */
  const getApiParentId = (
    roleId,
    index
  ) => {
    const role =
      Number(roleId);

    if (index === 0) {
      if (
        role ===
        Number(loggedInRoleId)
      ) {
        return (
          loggedInUserId ||
          null
        );
      }

      return null;
    }

    const previousRole =
      visibleParentRoles[
        index - 1
      ];

    if (!previousRole) {
      return null;
    }

    return (
      selectedParents[
        Number(previousRole)
      ] || null
    );
  };

  /*
   * ============================================================
   * LOAD PARENT DROPDOWN
   * ============================================================
   */
  const loadParentDropdown = async (
    parentRoleId,
    parentId = null,
    search = "",
    selectedUser = null
  ) => {
    const roleId =
      Number(parentRoleId);

    setParentLoading(
      (prev) => ({
        ...prev,
        [roleId]: true,
      })
    );

    try {
      const response =
        await getDropdownUsers(
          roleId,
          parentId,
          search
        );

      let users =
        getUsersFromResponse(
          response
        );

      /*
       * FOS ko hamesha direct Distributor ke
       * according filter karo.
       */
      if (roleId === 5) {
        users = users.filter(
          (user) => {
            const sameRole =
              Number(
                user?.role_id
              ) === 5;

            const sameParent =
              parentId === null ||
              Number(
                user?.parent_id
              ) ===
                Number(parentId);

            return (
              sameRole &&
              sameParent
            );
          }
        );

        /*
         * FOS availability update.
         */
        setFosAvailable(
          users.length > 0
        );
      }

      /*
       * Selected user API response me nahi hai
       * to manually add it.
       */
      if (
        selectedUser?.id &&
        !users.some(
          (user) =>
            Number(user.id) ===
            Number(
              selectedUser.id
            )
        )
      ) {
        users = [
          selectedUser,
          ...users,
        ];
      }

      const existingSelectedId =
        selectedParents[
          roleId
        ];

      if (
        existingSelectedId &&
        !users.some(
          (user) =>
            Number(user.id) ===
            Number(
              existingSelectedId
            )
        )
      ) {
        const existingUsers =
          parentUsers[
            roleId
          ] || [];

        const existingSelectedUser =
          existingUsers.find(
            (user) =>
              Number(user.id) ===
              Number(
                existingSelectedId
              )
          );

        if (
          existingSelectedUser
        ) {
          users = [
            existingSelectedUser,
            ...users,
          ];
        }
      }

      setParentUsers(
        (prev) => ({
          ...prev,
          [roleId]: users,
        })
      );
    } catch (error) {
      console.error(
        `LOAD ${getRoleName(
          roleId
        )} ERROR:`,
        error?.response
          ?.data || error
      );

      if (roleId === 5) {
        setFosAvailable(false);
      }

      setParentUsers(
        (prev) => ({
          ...prev,
          [roleId]:
            selectedUser
              ? [
                  selectedUser,
                  ...(prev[
                    roleId
                  ] || []).filter(
                    (user) =>
                      Number(
                        user.id
                      ) !==
                      Number(
                        selectedUser.id
                      )
                  ),
                ]
              : prev[
                  roleId
                ] || [],
        })
      );
    } finally {
      setParentLoading(
        (prev) => ({
          ...prev,
          [roleId]: false,
        })
      );
    }
  };

  /*
   * ============================================================
   * LOAD EDIT HIERARCHY
   * ============================================================
   */
  const loadEditParentHierarchy =
    async (
      roleId,
      parentChain = []
    ) => {
      const currentRole =
        Number(roleId);

      const requiredParents =
        parentRoles[
          currentRole
        ] || [];

      /*
       * Parent chain ko map me convert.
       */
      const chainMap =
        new Map();

      if (
        Array.isArray(
          parentChain
        )
      ) {
        parentChain.forEach(
          (parent) => {
            if (
              parent?.role_id != null
            ) {
              const role =
                Number(
                  parent.role_id
                );

              if (
                Number.isInteger(
                  role
                )
              ) {
                chainMap.set(
                  role,
                  parent
                );
              }
            }
          }
        );
      }

      const loggedRole =
        Number(loggedInRoleId);

      /*
       * Pehle basic editable parents nikalo.
       *
       * FOS ko yahan special-case nahi karenge.
       * FOS availability selected Distributor ke baad
       * dynamically check hogi.
       */
      let editableParents =
        requiredParents.filter(
          (parentRoleId) => {
            const role =
              Number(
                parentRoleId
              );

            if (
              !isRoleActive(role)
            ) {
              return false;
            }

            if (
              role === 5
            ) {
              /*
               * FOS baad me selected Distributor ke
               * according decide hoga.
               */
              return true;
            }

            if (
              loggedRole === 0
            ) {
              return role < currentRole;
            }

            if (
              role <= loggedRole ||
              role >= currentRole
            ) {
              return false;
            }

            return true;
          }
        );

      /*
       * ========================================================
       * INITIAL FOS CHECK
       * ========================================================
       *
       * Existing edit user ki parent chain me Distributor
       * hai to us Distributor ke actual FOS check karo.
       */
      const existingDistributor =
        chainMap.get(4);

      const existingDistributorId =
        existingDistributor?.id
          ? Number(
              existingDistributor.id
            )
          : null;

      const existingFos =
        chainMap.get(5);

      if (
        existingDistributorId
      ) {
        await checkFosForDistributor(
          existingDistributorId,
          Boolean(existingFos?.id)
        );
      } else {
        setFosAvailable(false);
      }

      /*
       * Agar current selected distributor ke under FOS
       * nahi hai to FOS ko editableParents se hatao.
       *
       * Existing FOS ho to preserve karenge.
       */
      const fosExistsForExistingDistributor =
        existingDistributorId
          ? await checkFosForDistributor(
              existingDistributorId,
              Boolean(existingFos?.id)
            )
          : false;

      if (
        !fosExistsForExistingDistributor
      ) {
        editableParents =
          editableParents.filter(
            (role) =>
              Number(role) !== 5
          );
      }

      if (
        editableParents.length ===
        0
      ) {
        setSelectedParents({});
        setParentUsers({});
        return;
      }

      /*
       * ========================================================
       * SELECTED PARENTS
       * ========================================================
       */
      const selected = {};

      editableParents.forEach(
        (parentRoleId) => {
          const role =
            Number(
              parentRoleId
            );

          const parent =
            chainMap.get(role);

          if (
            parent?.id != null
          ) {
            selected[role] =
              Number(parent.id);
          }
        }
      );

      if (
        Object.keys(selected)
          .length === 0 &&
        formData.parent_id
      ) {
        const lastRole =
          editableParents[
            editableParents.length - 1
          ];

        if (lastRole) {
          selected[
            Number(lastRole)
          ] = Number(
            formData.parent_id
          );
        }
      }

      setSelectedParents(
        selected
      );

      /*
       * ========================================================
       * LOAD EACH PARENT DROPDOWN
       * ========================================================
       */
      const usersByRole = {};

      for (
        let index = 0;
        index <
        editableParents.length;
        index++
      ) {
        const parentRoleId =
          Number(
            editableParents[index]
          );

        const selectedUser =
          chainMap.get(
            parentRoleId
          ) || null;

        let apiParentId = null;

        if (index === 0) {
          if (
            parentRoleId ===
            Number(
              loggedInRoleId
            )
          ) {
            apiParentId =
              loggedInUserId ||
              null;
          }
        } else {
          const previousRole =
            editableParents[
              index - 1
            ];

          apiParentId =
            selected[
              Number(
                previousRole
              )
            ] || null;
        }

        try {
          const response =
            await getDropdownUsers(
              parentRoleId,
              apiParentId,
              ""
            );

          let users =
            getUsersFromResponse(
              response
            );

          /*
           * FOS filter
           */
          if (
            parentRoleId === 5
          ) {
            users =
              users.filter(
                (user) =>
                  Number(
                    user?.role_id
                  ) === 5 &&
                  (
                    apiParentId ===
                      null ||
                    Number(
                      user?.parent_id
                    ) ===
                      Number(
                        apiParentId
                      )
                  )
              );
          }

          if (
            selectedUser?.id &&
            !users.some(
              (user) =>
                Number(user.id) ===
                Number(
                  selectedUser.id
                )
            )
          ) {
            users = [
              selectedUser,
              ...users,
            ];
          }

          usersByRole[
            parentRoleId
          ] = users;
        } catch (error) {
          console.error(
            `EDIT PARENT LOAD ERROR - ROLE ${parentRoleId}:`,
            error?.response
              ?.data || error
          );

          usersByRole[
            parentRoleId
          ] = selectedUser
            ? [selectedUser]
            : [];
        }
      }

      setParentUsers(
        usersByRole
      );
    };

  /*
   * ============================================================
   * LOAD STAFF
   * ============================================================
   */
  useEffect(() => {
    if (!userId) {
      return;
    }

    if (
      loggedInRoleId === null
    ) {
      return;
    }

    if (
      loggedInUserId === null
    ) {
      return;
    }

    const fetchStaffData =
      async () => {
        try {
          const id =
            Number(userId);

          if (
            !Number.isInteger(id) ||
            id <= 0
          ) {
            toast.error(
              "Invalid user ID"
            );
            return;
          }

          const response =
            await getStaffDataById(
              id
            );

          if (
            !response?.success
          ) {
            toast.error(
              response?.message ||
                "Failed to load staff data"
            );
            return;
          }

          const user =
            response?.data;

          if (!user) {
            toast.error(
              "Staff data not found"
            );
            return;
          }

          const roleId =
            user.role_id != null
              ? Number(
                  user.role_id
                )
              : "";

          const parentId =
            user.parent_id != null
              ? Number(
                  user.parent_id
                )
              : null;

          setFormData({
            organization_name:
              user.organization_name ||
              "",

            role_id:
              roleId,

            name:
              user.name || "",

            email:
              user.email || "",

            phone:
              user.phone || "",

            password: "",

            confirm_password: "",

            company_address:
              user.company_address ||
              "",

            country:
              user.country || "",

            state:
              user.state || "",

            city:
              user.city || "",

            parent_id:
              parentId,

            new_device:
              Number(
                user.new_device || 0
              ),

            old_device:
              Number(
                user.old_device || 0
              ),

            supreme_device:
              Number(
                user.supreme_device ||
                  0
              ),

            pro_star:
              Number(
                user.pro_star ||
                  0
              ),

            lite:
              Number(
                user.lite ||
                  0
              ),

            google_tv:
              Number(
                user.google_tv ||
                  0
              ),

            supreme_lock:
              Number(
                user.supreme_lock ||
                  0
              ),
          });

          const parentChain =
            Array.isArray(
              user.parent_chain
            )
              ? user.parent_chain
              : [];

          await loadEditParentHierarchy(
            roleId,
            parentChain
          );
        } catch (error) {
          console.error(
            "GET STAFF ERROR:",
            error
          );

          toast.error(
            error?.response?.data
              ?.message ||
              error?.message ||
              "Failed to load staff data"
          );
        }
      };

    fetchStaffData();
  }, [
    userId,
    loggedInRoleId,
    loggedInUserId,
  ]);

  /*
   * ============================================================
   * CLEAR NEXT DROPDOWNS
   * ============================================================
   */
  const clearNextParentDropdowns =
    (parentRoleId) => {
      const roleId =
        Number(parentRoleId);

      const index =
        visibleParentRoles.indexOf(
          roleId
        );

      if (index === -1) {
        return;
      }

      const nextRoles =
        visibleParentRoles.slice(
          index + 1
        );

      setSelectedParents(
        (prev) => {
          const updated = {
            ...prev,
          };

          nextRoles.forEach(
            (nextRole) => {
              delete updated[
                Number(nextRole)
              ];
            }
          );

          return updated;
        }
      );

      setParentUsers(
        (prev) => {
          const updated = {
            ...prev,
          };

          nextRoles.forEach(
            (nextRole) => {
              delete updated[
                Number(nextRole)
              ];
            }
          );

          return updated;
        }
      );

      setParentSearch(
        (prev) => {
          const updated = {
            ...prev,
          };

          nextRoles.forEach(
            (nextRole) => {
              delete updated[
                Number(nextRole)
              ];
            }
          );

          return updated;
        }
      );
    };

  /*
   * ============================================================
   * PARENT CHANGE
   * ============================================================
   */
  const handleParentChange =
    async (
      parentRoleId,
      value
    ) => {
      const roleId =
        Number(parentRoleId);

      const selectedId =
        value
          ? Number(value)
          : null;

      const currentIndex =
        visibleParentRoles.indexOf(
          roleId
        );

      if (
        currentIndex === -1
      ) {
        return;
      }

      const oldSelectedId =
        selectedParents[
          roleId
        ] || null;

      if (
        Number(oldSelectedId) ===
        Number(selectedId)
      ) {
        setOpenDropdown(null);
        return;
      }

      /*
       * ========================================================
       * DISTRIBUTOR SELECTED
       * ========================================================
       *
       * Distributor role = 4
       *
       * Ab selected Distributor ke under FOS check hoga.
       */
      if (roleId === 4) {
        /*
         * Pehle old FOS aur uske baad wale dropdown clear.
         */
        setSelectedParents(
          (prev) => {
            const updated = {
              ...prev,
            };

            if (selectedId) {
              updated[4] =
                selectedId;
            } else {
              delete updated[4];
            }

            /*
             * Old FOS remove.
             */
            delete updated[5];

            /*
             * Uske neeche ke parents bhi remove.
             */
            [6, 7, 8, 9].forEach(
              (role) => {
                delete updated[role];
              }
            );

            return updated;
          }
        );

        setParentUsers(
          (prev) => {
            const updated = {
              ...prev,
            };

            delete updated[5];
            delete updated[6];
            delete updated[7];
            delete updated[8];
            delete updated[9];

            return updated;
          }
        );

        setFormData(
          (prev) => ({
            ...prev,
            parent_id:
              selectedId,
          })
        );

        setParentSearch(
          (prev) => ({
            ...prev,
            4: "",
            5: "",
          })
        );

        if (!selectedId) {
          setFosAvailable(false);
          setOpenDropdown(null);
          return;
        }

        /*
         * IMPORTANT:
         * Selected Distributor ke actual FOS check karo.
         */
        const hasFos =
          await checkFosForDistributor(
            selectedId
          );

        /*
         * FOS available hai to FOS dropdown ke users
         * already load ho jayenge.
         */
        if (hasFos) {
          /*
           * Kuch nahi karna.
           * visibleParentRoles automatically FOS show karega.
           */
        }

        /*
         * FOS nahi hai to next available parent role
         * direct Distributor hoga.
         *
         * Example:
         *
         * CNF -> Super -> Distributor -> Retailer
         */
        const nextRole =
          hasFos
            ? 5
            : visibleParentRoles[
                currentIndex + 2
              ];

        if (
          nextRole &&
          nextRole !== 5
        ) {
          await loadParentDropdown(
            Number(nextRole),
            selectedId,
            ""
          );
        }

        setOpenDropdown(null);
        return;
      }

      /*
       * ========================================================
       * NORMAL PARENT CHANGE
       * ========================================================
       */
      setSelectedParents(
        (prev) => {
          const updated = {
            ...prev,
          };

          if (selectedId) {
            updated[roleId] =
              selectedId;
          } else {
            delete updated[
              roleId
            ];
          }

          return updated;
        }
      );

      setFormData(
        (prev) => ({
          ...prev,
          parent_id:
            selectedId,
        })
      );

      setParentSearch(
        (prev) => ({
          ...prev,
          [roleId]: "",
        })
      );

      clearNextParentDropdowns(
        roleId
      );

      /*
       * Agar FOS select kiya.
       */
      if (roleId === 5) {
        /*
         * FOS selected hai to next child parent
         * FOS hoga.
         */
        setFosAvailable(true);
      }

      if (!selectedId) {
        setOpenDropdown(null);
        return;
      }

      /*
       * ========================================================
       * FIND NEXT ROLE
       * ========================================================
       *
       * visibleParentRoles already FOS ko hide/show kar
       * chuka hai.
       */
      const nextRole =
        visibleParentRoles[
          currentIndex + 1
        ];

      if (!nextRole) {
        setOpenDropdown(null);
        return;
      }

      /*
       * Agar next role FOS hai to selected Distributor
       * parentId hona chahiye.
       */
      if (
        Number(nextRole) === 5
      ) {
        await loadParentDropdown(
          5,
          selectedId,
          ""
        );

        setOpenDropdown(null);
        return;
      }

      await loadParentDropdown(
        Number(nextRole),
        selectedId,
        ""
      );

      setOpenDropdown(null);
    };

  /*
   * ============================================================
   * SEARCH PARENT
   * ============================================================
   */
  const handleParentSearch = (
    parentRoleId,
    value
  ) => {
    const roleId =
      Number(parentRoleId);

    setParentSearch(
      (prev) => ({
        ...prev,
        [roleId]: value,
      })
    );

    if (
      searchTimers.current[
        roleId
      ]
    ) {
      clearTimeout(
        searchTimers.current[
          roleId
        ]
      );
    }

    const index =
      visibleParentRoles.indexOf(
        roleId
      );

    if (index === -1) {
      return;
    }

    let parentId = null;

    if (index === 0) {
      if (
        roleId ===
        Number(loggedInRoleId)
      ) {
        parentId =
          loggedInUserId ||
          null;
      }
    } else {
      const previousRole =
        visibleParentRoles[
          index - 1
        ];

      parentId =
        selectedParents[
          Number(previousRole)
        ] || null;
    }

    searchTimers.current[
      roleId
    ] = setTimeout(
      () => {
        loadParentDropdown(
          roleId,
          parentId,
          value.trim()
        );
      },
      value.trim()
        ? 400
        : 200
    );
  };

  /*
   * ============================================================
   * OPEN DROPDOWN
   * ============================================================
   */
  const handleDropdownOpen =
    async (
      roleId,
      index
    ) => {
      const role =
        Number(roleId);

      setOpenDropdown(
        (prev) =>
          prev === role
            ? null
            : role
      );

      if (
        openDropdown === role &&
        parentUsers[role]?.length
      ) {
        return;
      }

      const apiParentId =
        getApiParentId(
          role,
          index
        );

      const selectedId =
        selectedParents[
          role
        ];

      const selectedUser =
        (
          parentUsers[
            role
          ] || []
        ).find(
          (user) =>
            Number(user.id) ===
            Number(selectedId)
        );

      /*
       * FOS dropdown open karte waqt bhi actual
       * selected Distributor ke FOS load honge.
       */
      if (role === 5) {
        const distributorId =
          selectedParents[4];

        if (!distributorId) {
          setFosAvailable(false);
          return;
        }

        await loadParentDropdown(
          5,
          Number(distributorId),
          "",
          selectedUser
        );

        return;
      }

      await loadParentDropdown(
        role,
        apiParentId,
        "",
        selectedUser
      );
    };

  /*
   * ============================================================
   * CLEAN TIMERS
   * ============================================================
   */
  useEffect(() => {
    return () => {
      Object.values(
        searchTimers.current
      ).forEach(
        (timer) =>
          clearTimeout(timer)
      );
    };
  }, []);

  /*
   * ============================================================
   * OUTSIDE CLICK
   * ============================================================
   */
  useEffect(() => {
    const handleOutsideClick =
      (event) => {
        if (
          !event.target.closest(
            "[data-parent-dropdown]"
          )
        ) {
          setOpenDropdown(null);
        }
      };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  /*
   * ============================================================
   * SUBMIT
   * ============================================================
   */
  const handleSubmit =
    async (e) => {
      e.preventDefault();

      if (!userId) {
        toast.error(
          "User ID not found"
        );
        return;
      }

      const currentRoleId =
        Number(
          formData.role_id
        );

      if (!currentRoleId) {
        toast.error(
          "Role ID missing"
        );
        return;
      }

      if (
        formData.password &&
        formData.password !==
          formData.confirm_password
      ) {
        toast.error(
          "Password and Confirm Password do not match!"
        );
        return;
      }

      try {
        /*
         * Visible hierarchy ke according payload banao.
         *
         * IMPORTANT:
         * Agar FOS hidden hai to FOS payload me nahi jayega.
         *
         * Example:
         *
         * CNF -> Super -> Distributor -> Retailer
         *
         * FOS hidden hai to:
         * [
         *   CNF,
         *   Super,
         *   Distributor
         * ]
         */
        const parentHierarchy =
          visibleParentRoles
            .map(
              (roleId) => ({
                role_id:
                  Number(roleId),

                user_id:
                  selectedParents[
                    Number(roleId)
                  ]
                    ? Number(
                        selectedParents[
                          Number(roleId)
                        ]
                      )
                    : null,
              })
            )
            .filter(
              (item) =>
                Number.isInteger(
                  item.role_id
                ) &&
                item.role_id > 0 &&
                Number.isInteger(
                  item.user_id
                ) &&
                item.user_id > 0
            );

        let finalParentId = null;

        if (
          parentHierarchy.length >
          0
        ) {
          const lastParent =
            parentHierarchy[
              parentHierarchy.length - 1
            ];

          finalParentId =
            Number(
              lastParent.user_id
            );
        }

        if (
          parentHierarchy.length ===
            0 &&
          formData.parent_id
        ) {
          finalParentId =
            Number(
              formData.parent_id
            );
        }

        const payload = {
          ...formData,

          id:
            Number(userId),

          role_id:
            currentRoleId,

          parent_id:
            finalParentId,

          parent_hierarchy:
            parentHierarchy,

          new_device:
            Number(
              formData.new_device || 0
            ),

          old_device:
            Number(
              formData.old_device || 0
            ),

          supreme_device:
            Number(
              formData.supreme_device ||
                0
            ),

          pro_star:
            Number(
              formData.pro_star || 0
            ),

          lite:
            Number(
              formData.lite || 0
            ),

          google_tv:
            Number(
              formData.google_tv || 0
            ),

          supreme_lock:
            Number(
              formData.supreme_lock ||
                0
            ),
        };

        if (!payload.password) {
          delete payload.password;
          delete payload.confirm_password;
        }

        console.log(
          "UPDATE PAYLOAD:",
          payload
        );

        const response =
          await updateStaffData(
            Number(userId),
            payload
          );

        if (
          !response?.success
        ) {
          toast.error(
            response?.message ||
              "Failed to update staff data"
          );
          return;
        }

        toast.success(
          response?.message ||
            "Staff updated successfully"
        );
      } catch (error) {
        console.error(
          "UPDATE STAFF ERROR:",
          error?.response
            ?.data || error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to update staff data"
        );
      }
    };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6">

        {/* =====================================================
            PARENT HIERARCHY
        ====================================================== */}

        {visibleParentRoles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

            {visibleParentRoles.map(
              (
                parentRoleId,
                index
              ) => {
                const role =
                  Number(
                    parentRoleId
                  );

                const users =
                  parentUsers[
                    role
                  ] || [];

                const searchValue =
                  parentSearch[
                    role
                  ] || "";

                const isLoading =
                  parentLoading[
                    role
                  ] || false;

                const previousRoleId =
                  visibleParentRoles[
                    index - 1
                  ];

                const previousSelectedId =
                  previousRoleId
                    ? selectedParents[
                        Number(
                          previousRoleId
                        )
                      ]
                    : null;

                const isDisabled =
                  index > 0 &&
                  !previousSelectedId;

                const selectedId =
                  selectedParents[
                    role
                  ];

                const selectedUser =
                  users.find(
                    (user) =>
                      Number(
                        user.id
                      ) ===
                      Number(
                        selectedId
                      )
                  );

                return (
                  <div
                    key={role}
                    data-parent-dropdown
                    className="space-y-1.5"
                  >
                    <label className="text-sm font-medium text-slate-700">
                      {getRoleName(
                        role
                      )}
                    </label>

                    <div className="relative">

                      <button
                        type="button"
                        disabled={
                          isDisabled
                        }
                        onClick={() =>
                          handleDropdownOpen(
                            role,
                            index
                          )
                        }
                        className={`w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isDisabled
                            ? "bg-slate-50 text-slate-400 cursor-not-allowed"
                            : "text-slate-700 cursor-pointer"
                        }`}
                      >
                        <span className="truncate">

                          {selectedUser?.name ||
                            `Select ${getRoleName(
                              role
                            )}`}

                        </span>

                        <RiArrowDownSLine
                          size={22}
                          className={`shrink-0 transition-transform text-slate-500 ${
                            openDropdown ===
                            role
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </button>

                      {openDropdown ===
                        role && (
                        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">

                          {/* SEARCH */}

                          <div className="p-2 border-b border-slate-200">

                            <div className="relative">

                              <input
                                type="text"
                                value={
                                  searchValue
                                }
                                onChange={(
                                  e
                                ) =>
                                  handleParentSearch(
                                    role,
                                    e.target
                                      .value
                                  )
                                }
                                onClick={(
                                  e
                                ) =>
                                  e.stopPropagation()
                                }
                                placeholder={`Search ${getRoleName(
                                  role
                                )}...`}
                                autoFocus
                                className="w-full border border-slate-300 rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />

                              {isLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}

                            </div>

                          </div>

                          {/* USERS */}

                          <div className="max-h-60 overflow-y-auto">

                            {!isLoading && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleParentChange(
                                    role,
                                    null
                                  )
                                }
                                className="w-full text-left px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
                              >
                                Select{" "}
                                {getRoleName(
                                  role
                                )}
                              </button>
                            )}

                            {isLoading && (
                              <div className="flex items-center justify-center gap-2 px-4 py-4 text-sm text-blue-600">

                                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />

                                Searching{" "}
                                {getRoleName(
                                  role
                                )}
                                ...

                              </div>
                            )}

                            {!isLoading &&
                              users.map(
                                (
                                  user
                                ) => (
                                  <button
                                    key={
                                      user.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      handleParentChange(
                                        role,
                                        user.id
                                      )
                                    }
                                    className={`w-full text-left px-4 py-2.5 text-sm transition ${
                                      Number(
                                        selectedId
                                      ) ===
                                      Number(
                                        user.id
                                      )
                                        ? "bg-blue-50 text-blue-700 font-medium"
                                        : "text-slate-700 hover:bg-slate-50"
                                    }`}
                                  >

                                    <div>
                                      {
                                        user.name
                                      }
                                    </div>

                                    {user.email && (
                                      <div className="text-xs text-slate-400 mt-0.5">
                                        {
                                          user.email
                                        }
                                      </div>
                                    )}

                                    {user.phone && (
                                      <div className="text-xs text-slate-400 mt-0.5">
                                        {
                                          user.phone
                                        }
                                      </div>
                                    )}

                                  </button>
                                )
                              )}

                            {!isLoading &&
                              users.length ===
                                0 && (
                                <div className="px-4 py-4 text-center text-sm text-slate-400">
                                  {searchValue.trim()
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

        {/* =====================================================
            MAIN FORM
        ====================================================== */}

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* ORGANIZATION */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Organization Name
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

            {/* NAME */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Full Name
              </label>

              <input
                type="text"
                name="name"
                placeholder="Enter full name"
                value={
                  formData.name
                }
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* EMAIL */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                name="email"
                placeholder="staff@example.com"
                value={
                  formData.email
                }
                onChange={handleChange}
                required
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* PHONE */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Phone Number
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
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

            </div>

            {/* ADDRESS */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Company Address
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

            {/* PASSWORD */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Leave empty to keep old password"
                  value={
                    formData.password
                  }
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) =>
                        !prev
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 cursor-pointer"
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

            {/* CONFIRM PASSWORD */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Confirm Password
              </label>

              <div className="relative">

                <input
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  name="confirm_password"
                  placeholder="Confirm password"
                  value={
                    formData.confirm_password
                  }
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (prev) =>
                        !prev
                    )
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600 cursor-pointer"
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

            {/* COUNTRY */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                Country
              </label>

              <div className="relative">

                <select
                  name="country"
                  value={
                    formData.country
                  }
                  onChange={handleChange}
                  required
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        {
                          country.name
                        }
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

            {/* STATE */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                State
              </label>

              <div className="relative">

                <select
                  name="state"
                  value={
                    formData.state
                  }
                  onChange={handleChange}
                  required
                  disabled={
                    !formData.country
                  }
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
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
                        {
                          state.name
                        }
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

            {/* CITY */}

            <div className="space-y-1.5">

              <label className="text-sm font-medium text-slate-700">
                City
              </label>

              <div className="relative">

                <select
                  name="city"
                  value={
                    formData.city
                  }
                  onChange={handleChange}
                  required
                  disabled={
                    !formData.state
                  }
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
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
                        {
                          city.name
                        }
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

          </div>

          {/* =================================================
              DEVICE PERMISSIONS
          ================================================== */}

          {Number(
            formData.role_id
          ) === 6 && (
            <div>

              <h2 className="text-base font-semibold text-slate-700 mb-3">
                Retailer Device Permissions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">

                {devicePermissions.map(
                  (item) => (
                    <label
                      key={
                        item.name
                      }
                      className={`flex items-center justify-between px-4 py-3 rounded-lg border transition cursor-pointer ${
                        formData[
                          item.name
                        ] === 1
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-300 bg-white hover:border-blue-400"
                      }`}
                    >

                      <span className="text-sm font-medium text-slate-700">
                        {
                          item.label
                        }
                      </span>

                      <input
                        type="checkbox"
                        checked={
                          formData[
                            item.name
                          ] === 1
                        }
                        onChange={(
                          e
                        ) =>
                          setFormData(
                            (
                              prev
                            ) => ({
                              ...prev,
                              [item.name]:
                                e
                                  .target
                                  .checked
                                  ? 1
                                  : 0,
                            })
                          )
                        }
                        className="h-5 w-5 accent-blue-600 cursor-pointer"
                      />

                    </label>
                  )
                )}

              </div>

            </div>
          )}

          {/* =================================================
              BUTTONS
          ================================================== */}

          <div className="flex justify-end gap-3 pt-2">

            {formData.role_id && (
              <Link
                href={`/dashboard?role=${Number(
                  formData.role_id
                )}`}
                className="bg-gray-700 text-white px-4 py-2.5 rounded-lg hover:bg-gray-800 transition"
              >
                {getRoleName(
                  formData.role_id
                )}{" "}
                List
              </Link>
            )}

            <button
              type="submit"
              className="bg-blue-500 text-white font-medium px-8 py-2.5 rounded-lg shadow-md hover:bg-blue-600 hover:shadow-lg transition cursor-pointer"
            >
              Update
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}