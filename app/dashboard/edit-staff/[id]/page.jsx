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

  const [fosAvailable, setFosAvailable] =
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

    const module = modules.find((item) => {
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

    if (!module) {
      return true;
    }

    return Number(module?.status) === 1;
  };

  const getUsersFromResponse = (response) => {
    if (
      Array.isArray(response?.data)
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

  const checkFosForDistributor = async (
    distributorId
  ) => {
    const id = Number(distributorId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setFosAvailable(false);
      return false;
    }

    try {
      const response =
        await getDropdownUsers(
          5,
          id,
          ""
        );

      const users =
        getUsersFromResponse(
          response
        ).filter(
          (user) =>
            Number(user?.role_id) === 5 &&
            Number(user?.parent_id) === id
        );

      const exists =
        users.length > 0;

      setFosAvailable(exists);

      setParentUsers((prev) => ({
        ...prev,
        5: users,
      }));

      return exists;
    } catch (error) {
      console.error(
        "FOS CHECK ERROR:",
        error?.response?.data ||
          error
      );

      setFosAvailable(false);

      setParentUsers((prev) => ({
        ...prev,
        5: [],
      }));

      return false;
    }
  };

  const getAllowedRoles = () => {
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

        if (!isRoleActive(role)) {
          return false;
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
  };

  const visibleParentRoles = useMemo(() => {
    const rolesList =
      getAllowedRoles();

    const currentRole =
      Number(formData.role_id);

    if (
      currentRole <= 5
    ) {
      return rolesList;
    }

    return rolesList.filter(
      (role) => {
        if (
          Number(role) === 5
        ) {
          return fosAvailable;
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

  const getApiParentId = (
    roleId,
    index,
    rolesList = visibleParentRoles
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
      rolesList[index - 1];

    if (!previousRole) {
      return null;
    }

    return (
      selectedParents[
        Number(previousRole)
      ] || null
    );
  };

  const loadParentDropdown = async (
    roleId,
    parentId = null,
    search = "",
    selectedUser = null
  ) => {
    const role =
      Number(roleId);

    setParentLoading((prev) => ({
      ...prev,
      [role]: true,
    }));

    try {
      const response =
        await getDropdownUsers(
          role,
          parentId,
          search
        );

      let users =
        getUsersFromResponse(
          response
        );

      users = users.filter(
        (user) =>
          Number(user?.role_id) === role
      );

      if (
        parentId !== null &&
        parentId !== undefined
      ) {
        users = users.filter(
          (user) =>
            Number(user?.parent_id) ===
            Number(parentId)
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

      setParentUsers((prev) => ({
        ...prev,
        [role]: users,
      }));

      if (role === 5) {
        setFosAvailable(
          users.length > 0
        );
      }
    } catch (error) {
      console.error(
        `LOAD ${getRoleName(
          role
        )} ERROR:`,
        error?.response?.data ||
          error
      );

      setParentUsers((prev) => ({
        ...prev,
        [role]: selectedUser
          ? [selectedUser]
          : [],
      }));

      if (role === 5) {
        setFosAvailable(false);
      }
    } finally {
      setParentLoading((prev) => ({
        ...prev,
        [role]: false,
      }));
    }
  };

  const loadRetailerForParent = async (
    parentId
  ) => {
    const id = Number(parentId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      setParentUsers((prev) => ({
        ...prev,
        6: [],
      }));
      return;
    }

    await loadParentDropdown(
      6,
      id,
      ""
    );
  };

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
              chainMap.set(
                Number(
                  parent.role_id
                ),
                parent
              );
            }
          }
        );
      }

      const loggedRole =
        Number(loggedInRoleId);

      let editableParents =
        requiredParents.filter(
          (roleId) => {
            const role =
              Number(roleId);

            if (
              !isRoleActive(role)
            ) {
              return false;
            }

            if (
              loggedRole === 0
            ) {
              return role < currentRole;
            }

            return (
              role > loggedRole &&
              role < currentRole
            );
          }
        );

      const distributor =
        chainMap.get(4);

      const existingFos =
        chainMap.get(5);

      if (
        distributor?.id
      ) {
        const hasFos =
          await checkFosForDistributor(
            distributor.id
          );

        if (
          !hasFos &&
          !existingFos?.id
        ) {
          editableParents =
            editableParents.filter(
              (role) =>
                Number(role) !== 5
            );
        }
      } else {
        setFosAvailable(false);

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

      const selected = {};

      editableParents.forEach(
        (roleId) => {
          const parent =
            chainMap.get(
              Number(roleId)
            );

          if (
            parent?.id != null
          ) {
            selected[
              Number(roleId)
            ] = Number(
              parent.id
            );
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

        selected[
          Number(lastRole)
        ] = Number(
          formData.parent_id
        );
      }

      setSelectedParents(
        selected
      );

      const usersByRole = {};

      for (
        let index = 0;
        index <
        editableParents.length;
        index++
      ) {
        const role =
          Number(
            editableParents[index]
          );

        const selectedUser =
          chainMap.get(role) ||
          null;

        let apiParentId =
          null;

        if (index === 0) {
          if (
            role ===
            Number(loggedInRoleId)
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
              role,
              apiParentId,
              ""
            );

          let users =
            getUsersFromResponse(
              response
            );

          users = users.filter(
            (user) =>
              Number(
                user?.role_id
              ) === role
          );

          if (
            apiParentId !== null
          ) {
            users =
              users.filter(
                (user) =>
                  Number(
                    user?.parent_id
                  ) ===
                  Number(
                    apiParentId
                  )
              );
          }

          if (
            selectedUser?.id &&
            !users.some(
              (user) =>
                Number(
                  user.id
                ) ===
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

          usersByRole[role] =
            users;
        } catch (error) {
          console.error(
            `PARENT LOAD ERROR ${role}:`,
            error?.response?.data ||
              error
          );

          usersByRole[role] =
            selectedUser
              ? [selectedUser]
              : [];
        }
      }

      setParentUsers(
        usersByRole
      );
    };

  useEffect(() => {
    const user =
      getUserFromToken();

    if (
      user?.role_id != null
    ) {
      setLoggedInRoleId(
        Number(user.role_id)
      );
    }

    if (
      user?.id != null
    ) {
      setLoggedInUserId(
        Number(user.id)
      );
    }
  }, []);

  useEffect(() => {
    const loadModules =
      async () => {
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
          }
        } catch (error) {
          console.error(
            "MODULE ERROR:",
            error
          );
        }
      };

    loadModules();
  }, []);

  useEffect(() => {
    if (
      !userId ||
      loggedInRoleId === null ||
      loggedInUserId === null
    ) {
      return;
    }

    const fetchStaff =
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
            response.data;

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
                user.supreme_device || 0
              ),

            pro_star:
              Number(
                user.pro_star || 0
              ),

            lite:
              Number(
                user.lite || 0
              ),

            google_tv:
              Number(
                user.google_tv || 0
              ),

            supreme_lock:
              Number(
                user.supreme_lock || 0
              ),
          });

          await loadEditParentHierarchy(
            roleId,
            user.parent_chain || []
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

    fetchStaff();
  }, [
    userId,
    loggedInRoleId,
    loggedInUserId,
  ]);

  const clearNextParentDropdowns = (
    roleId
  ) => {
    const currentIndex =
      visibleParentRoles.indexOf(
        Number(roleId)
      );

    if (
      currentIndex === -1
    ) {
      return;
    }

    const nextRoles =
      visibleParentRoles.slice(
        currentIndex + 1
      );

    setSelectedParents((prev) => {
      const updated = {
        ...prev,
      };

      nextRoles.forEach(
        (role) => {
          delete updated[
            Number(role)
          ];
        }
      );

      return updated;
    });

    setParentUsers((prev) => {
      const updated = {
        ...prev,
      };

      nextRoles.forEach(
        (role) => {
          delete updated[
            Number(role)
          ];
        }
      );

      return updated;
    });

    setParentSearch((prev) => {
      const updated = {
        ...prev,
      };

      nextRoles.forEach(
        (role) => {
          delete updated[
            Number(role)
          ];
        }
      );

      return updated;
    });
  };

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

      setSelectedParents((prev) => {
        const updated = {
          ...prev,
        };

        if (selectedId) {
          updated[roleId] =
            selectedId;
        } else {
          delete updated[roleId];
        }

        return updated;
      });

      setParentSearch((prev) => ({
        ...prev,
        [roleId]: "",
      }));

      setFormData((prev) => ({
        ...prev,
        parent_id:
          selectedId,
      }));

      clearNextParentDropdowns(
        roleId
      );

      if (!selectedId) {
        if (roleId === 4) {
          setFosAvailable(false);
        }

        setOpenDropdown(null);
        return;
      }

      if (roleId === 4) {
        const hasFos =
          await checkFosForDistributor(
            selectedId
          );

        if (hasFos) {
          await loadParentDropdown(
            5,
            selectedId,
            ""
          );

          const retailerRoleExists =
            visibleParentRoles.includes(
              6
            );

          if (
            retailerRoleExists
          ) {
            await loadRetailerForParent(
              selectedId
            );
          }
        } else {
          setParentUsers(
            (prev) => ({
              ...prev,
              5: [],
            })
          );

          await loadRetailerForParent(
            selectedId
          );
        }

        setOpenDropdown(null);
        return;
      }

      if (roleId === 5) {
        setFosAvailable(true);

        await loadRetailerForParent(
          selectedId
        );

        setOpenDropdown(null);
        return;
      }

      const nextRole =
        visibleParentRoles[
          currentIndex + 1
        ];

      if (!nextRole) {
        setOpenDropdown(null);
        return;
      }

      const nextParentId =
        selectedId;

      await loadParentDropdown(
        Number(nextRole),
        nextParentId,
        ""
      );

      setOpenDropdown(null);
    };

  const handleParentSearch = (
    parentRoleId,
    value
  ) => {
    const roleId =
      Number(parentRoleId);

    setParentSearch((prev) => ({
      ...prev,
      [roleId]: value,
    }));

    if (
      searchTimers.current[roleId]
    ) {
      clearTimeout(
        searchTimers.current[roleId]
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

    if (roleId === 6) {
      const fosId =
        selectedParents[5];

      if (fosId) {
        parentId = fosId;
      } else {
        parentId =
          selectedParents[4] ||
          null;
      }
    }

    searchTimers.current[roleId] =
      setTimeout(
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

  const handleDropdownOpen =
    async (
      roleId,
      index
    ) => {
      const role =
        Number(roleId);

      const alreadyOpen =
        openDropdown === role;

      setOpenDropdown(
        alreadyOpen
          ? null
          : role
      );

      if (alreadyOpen) {
        return;
      }

      const selectedId =
        selectedParents[role];

      const selectedUser =
        (
          parentUsers[role] ||
          []
        ).find(
          (user) =>
            Number(user.id) ===
            Number(selectedId)
        );

      if (role === 5) {
        const distributorId =
          selectedParents[4];

        if (!distributorId) {
          setParentUsers(
            (prev) => ({
              ...prev,
              5: [],
            })
          );

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

      if (role === 6) {
        const fosId =
          selectedParents[5];

        const distributorId =
          selectedParents[4];

        const parentId =
          fosId ||
          distributorId ||
          null;

        await loadParentDropdown(
          6,
          parentId,
          "",
          selectedUser
        );

        return;
      }

      const apiParentId =
        getApiParentId(
          role,
          index
        );

      await loadParentDropdown(
        role,
        apiParentId,
        "",
        selectedUser
      );
    };

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
                item.role_id > 0 &&
                Number.isInteger(
                  item.user_id
                ) &&
                item.user_id > 0
            );

        let finalParentId = null;

        if (
          parentHierarchy.length
        ) {
          finalParentId =
            parentHierarchy[
              parentHierarchy.length - 1
            ].user_id;
        } else if (
          formData.parent_id
        ) {
          finalParentId =
            Number(
              formData.parent_id
            );
        }

        const payload = {
          ...formData,

          id: Number(userId),

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
              formData.supreme_device || 0
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
              formData.supreme_lock || 0
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
          error?.response?.data ||
            error
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

        {/* Top Right List Button */}
        <div className="flex justify-start mb-6">
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
        </div>

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
                  parentUsers[role] ||
                  [];

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

                let previousSelectedId =
                  previousRoleId
                    ? selectedParents[
                        Number(
                          previousRoleId
                        )
                      ]
                    : null;

                if (role === 6) {
                  previousSelectedId =
                    selectedParents[5] ||
                    selectedParents[4] ||
                    null;
                }

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

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

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

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Full Name
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
                Email Address
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
                Phone Number
              </label>

              <input
                type="tel"
                name="phone"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    phone:
                      e.target.value.replace(
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
                                e.target
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

          <div className="flex justify-end gap-3 pt-2">
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