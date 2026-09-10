
"use client";

import {
    addStaff,
    getDropdownUsers,
    getModules,
    getSubModules,
    getStaffDataById,
    updateStaffData,
} from "@/services/api";
import { getUserFromToken } from "@/utils/token";
import {
    RiEyeLine,
    RiEyeOffLine,
    RiArrowDownSLine,
    RiDeleteBinLine,
} from "react-icons/ri";
import { MdManageAccounts } from "react-icons/md";
import { IoIosPersonAdd } from "react-icons/io";
import { SlPeople } from "react-icons/sl";
import { FaEye } from "react-icons/fa";
import Link from "next/link";
import { Country, State, City } from "country-state-city";
import { useEffect, useState, useMemo } from "react";
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
    parent_id: null,
    new_device: 0,
    old_device: 0,
    supreme_device: 0,
    pro_star: 0,
    lite: 0,
    google_tv: 0,
    supreme_lock: 0,
};

const roleNames = {
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

const subModuleIcons = {
    MdManageAccounts,
    IoIosPersonAdd,
    IoIosPersonAd: IoIosPersonAdd,
    RiFileListLine: FaEye,
    RiExchangeFundsLine: SlPeople,
    SlPeople,
    FaEye,
    RiEyeLine,
    RiDeleteBinLine,
};

const subModuleKeys = [
    "manage",
    "edit",
    "view",
    "add",
    "delete",
];

const getNumber = (value) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
};

const getSubModuleId = (item) =>
    getNumber(
        item?.id ??
            item?.sub_module_id ??
            item?.subModuleId
    );

const getSubModuleNameValue = (item) =>
    item?.name ??
    item?.title ??
    item?.sub_module_name ??
    item?.subModuleName ??
    "";

const getSubModuleStatus = (item) =>
    getNumber(
        item?.status ??
            item?.is_active ??
            item?.isActive ??
            1
    );

const getSubModuleIcon = (icon) =>
    subModuleIcons[String(icon || "").trim()] || FaEye;

const getPermissionObject = (subModules = {}) => ({
    manage: Number(subModules?.manage) === 1 ? 1 : 0,
    edit: Number(subModules?.edit) === 1 ? 1 : 0,
    view: Number(subModules?.view) === 1 ? 1 : 0,
    add: Number(subModules?.add) === 1 ? 1 : 0,
    delete: Number(subModules?.delete) === 1 ? 1 : 0,
});

const getPermissionSubModuleIds = (
    permission,
    subModules = []
) => {
    if (!permission || !Array.isArray(subModules)) {
        return [];
    }

    const selectedIds = [];

    subModules.forEach((subModule) => {
        const id = getSubModuleId(subModule);

        if (id === null) return;

        const name = String(
            getSubModuleNameValue(subModule)
        )
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, "");

        if (
            name === "manage" &&
            Number(permission?.sub_modules?.manage) === 1
        ) {
            selectedIds.push(id);
        }

        if (
            name === "edit" &&
            Number(permission?.sub_modules?.edit) === 1
        ) {
            selectedIds.push(id);
        }

        if (
            name === "view" &&
            Number(permission?.sub_modules?.view) === 1
        ) {
            selectedIds.push(id);
        }

        if (
            name === "add" &&
            Number(permission?.sub_modules?.add) === 1
        ) {
            selectedIds.push(id);
        }

        if (
            name === "delete" &&
            Number(permission?.sub_modules?.delete) === 1
        ) {
            selectedIds.push(id);
        }
    });

    return selectedIds;
};

const isEqual = (a, b) => {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
};

export default function Page() {
    const searchParams = useSearchParams();

    const [formData, setFormData] = useState(initialFormData);

    const [parentUsers, setParentUsers] = useState({});
    const [selectedParents, setSelectedParents] = useState({});
    const [openDropdown, setOpenDropdown] = useState(null);
    const [parentSearch, setParentSearch] = useState({});
    const [searchLoading, setSearchLoading] = useState({});

    const [modules, setModules] = useState([]);
    const [subModules, setSubModules] = useState([]);

    const [selectedModuleId, setSelectedModuleId] = useState("");
    const [selectedSubModuleIds, setSelectedSubModuleIds] = useState([]);

    const [rolePermissions, setRolePermissions] = useState([]);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState(false);

    const [subModuleLoading, setSubModuleLoading] =
        useState(false);

    const [editLoading, setEditLoading] = useState(false);
    const [editUserLoaded, setEditUserLoaded] = useState(false);
    const [submitLoading, setSubmitLoading] = useState(false);

    const [originalFormData, setOriginalFormData] =
        useState(null);

    const [originalRolePermissions, setOriginalRolePermissions] =
        useState([]);

    const [originalSelectedParents, setOriginalSelectedParents] =
        useState({});

    const editId = searchParams.get("id");
    const isEditMode = Boolean(editId);

    const selectedRoleFromUrl = Number(
        searchParams.get("role_id")
    );

    const selectedRole =
        Number(formData.role_id) || selectedRoleFromUrl;

    const loggedInUser = getUserFromToken();
    const loggedInRoleId = Number(loggedInUser?.role_id);
    const loggedInUserId = Number(loggedInUser?.id);

    // Module Access is visible for everyone except Employee.
    const canShowModuleAccess = loggedInRoleId !== 8;

    const getRoleName = (roleId) =>
        roleNames[Number(roleId)] || "User";

    const normalizeName = (value) =>
        String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, "");

    const getUsersFromResponse = (response) => {
        const possibleData = [
            response,
            response?.data,
            response?.data?.data,
            response?.data?.users,
            response?.users,
        ];

        for (const item of possibleData) {
            if (Array.isArray(item)) {
                return item;
            }
        }

        return [];
    };

    const getSingleUserFromResponse = (response) => {
        const possibleData = [
            response?.data?.data,
            response?.data?.user,
            response?.data,
            response?.user,
            response,
        ];

        for (const item of possibleData) {
            if (
                item &&
                typeof item === "object" &&
                !Array.isArray(item) &&
                (item.id ||
                    item.user_id ||
                    item.name ||
                    item.email)
            ) {
                return item;
            }
        }

        return null;
    };

    const getModulesFromResponse = (response) => {
        const possibleData = [
            response,
            response?.data,
            response?.data?.data,
            response?.data?.modules,
            response?.modules,
        ];

        for (const item of possibleData) {
            if (Array.isArray(item)) {
                return item;
            }
        }

        return [];
    };

    const getSubModulesFromResponse = (response) => {
        if (Array.isArray(response?.data)) {
            return response.data;
        }

        if (Array.isArray(response)) {
            return response;
        }

        if (Array.isArray(response?.data?.data)) {
            return response.data.data;
        }

        if (Array.isArray(response?.subModules)) {
            return response.subModules;
        }

        if (Array.isArray(response?.sub_modules)) {
            return response.sub_modules;
        }

        if (Array.isArray(response?.data?.subModules)) {
            return response.data.subModules;
        }

        if (Array.isArray(response?.data?.sub_modules)) {
            return response.data.sub_modules;
        }

        return [];
    };

    const isRoleActive = (roleId) => {
        const role = Number(roleId);
        const roleName = normalizeName(getRoleName(role));

        const module = modules.find((item) => {
            const moduleName =
                typeof item === "string" ? item : item?.name;

            const moduleSlug =
                typeof item === "object" ? item?.slug : "";

            const normalizedModuleName =
                normalizeName(moduleName);

            const normalizedModuleSlug =
                normalizeName(moduleSlug);

            if (role === 3) {
                return (
                    normalizedModuleName === "superdistributor" ||
                    normalizedModuleName === "superdistributer" ||
                    normalizedModuleSlug === "superdistributor" ||
                    normalizedModuleSlug === "superdistributer"
                );
            }

            return (
                normalizedModuleName === roleName ||
                normalizedModuleSlug === roleName
            );
        });

        return Number(module?.status ?? 1) === 1;
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

        return (
            role > loggedRole &&
            role < createRole
        );
    });

    /*
     * =========================================================
     * MODULE / SUB MODULE CHANGE DETECTION
     * =========================================================
     */

    const selectedModulePermission = useMemo(() => {
        if (!selectedModuleId) {
            return null;
        }

        return (
            rolePermissions.find(
                (permission) =>
                    Number(permission.module_id) ===
                    Number(selectedModuleId)
            ) || null
        );
    }, [selectedModuleId, rolePermissions]);

    const existingSubModuleIds = useMemo(() => {
        if (!selectedModulePermission) {
            return [];
        }

        return getPermissionSubModuleIds(
            selectedModulePermission,
            subModules
        ).sort((a, b) => a - b);
    }, [selectedModulePermission, subModules]);

    const currentSubModuleIds = useMemo(() => {
        return [...selectedSubModuleIds].sort(
            (a, b) => a - b
        );
    }, [selectedSubModuleIds]);

    /*
     * Edit mode:
     *
     * Existing permission:
     *   Same sub modules   => disabled
     *   Changed sub module => enabled
     *
     * New module:
     *   No selection       => disabled
     *   Selection exists    => enabled
     *
     * Add mode:
     *   At least one sub module => enabled
     */
    const isSubModuleChanged = useMemo(() => {
        if (!selectedModuleId) {
            return false;
        }

        // New module permission
        if (!selectedModulePermission) {
            return selectedSubModuleIds.length > 0;
        }

        // Existing module permission
        return !isEqual(
            currentSubModuleIds,
            existingSubModuleIds
        );
    }, [
        selectedModuleId,
        selectedModulePermission,
        selectedSubModuleIds,
        currentSubModuleIds,
        existingSubModuleIds,
    ]);

    const hasChanges = useMemo(() => {
        if (!isEditMode || !originalFormData) {
            return true;
        }

        const currentComparable = {
            ...formData,
            password: formData.password || "",
            confirm_password:
                formData.confirm_password || "",
        };

        const originalComparable = {
            ...originalFormData,
            password: "",
            confirm_password: "",
        };

        const passwordChanged =
            Boolean(formData.password) ||
            Boolean(formData.confirm_password);

        const formChanged = !isEqual(
            currentComparable,
            originalComparable
        );

        const permissionsChanged = !isEqual(
            rolePermissions,
            originalRolePermissions
        );

        const parentsChanged = !isEqual(
            selectedParents,
            originalSelectedParents
        );

        return (
            formChanged ||
            permissionsChanged ||
            parentsChanged ||
            passwordChanged
        );
    }, [
        isEditMode,
        formData,
        rolePermissions,
        selectedParents,
        originalFormData,
        originalRolePermissions,
        originalSelectedParents,
    ]);

    /*
     * =========================================================
     * LOAD MODULES
     * =========================================================
     */

    useEffect(() => {
        const loadModules = async () => {
            try {
                const response = await getModules();
                const data = getModulesFromResponse(response);

                const activeModules = data
                    .filter(
                        (item) =>
                            Number(item?.status ?? 1) === 1
                    )
                    .sort(
                        (a, b) =>
                            Number(a?.sequence ?? 0) -
                            Number(b?.sequence ?? 0)
                    );

                setModules(activeModules);
            } catch (error) {
                console.error(
                    "GET MODULES ERROR:",
                    error?.response?.data || error
                );

                setModules([]);
            }
        };

        loadModules();
    }, []);

    /*
     * =========================================================
     * EDIT MODE RESET
     * =========================================================
     */

    useEffect(() => {
        if (!isEditMode || !editId) {
            setEditUserLoaded(false);
            setOriginalFormData(null);
            setOriginalRolePermissions([]);
            setOriginalSelectedParents({});
            return;
        }

        setEditUserLoaded(false);
    }, [editId, isEditMode]);

    /*
     * =========================================================
     * ROLE FROM URL
     * =========================================================
     */

    useEffect(() => {
        const roleId = searchParams.get("role_id");

        if (!roleId || isEditMode) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            role_id: Number(roleId),
            parent_id: null,
        }));

        setSelectedParents({});
        setParentUsers({});
        setParentSearch({});
        setOpenDropdown(null);

        setSelectedModuleId("");
        setSelectedSubModuleIds([]);
        setRolePermissions([]);
        setSubModules([]);
    }, [searchParams, isEditMode]);

    /*
     * =========================================================
     * LOAD SUB MODULES
     * =========================================================
     */

    useEffect(() => {
        if (!selectedModuleId) {
            setSubModules([]);
            setSelectedSubModuleIds([]);
            return;
        }

        let cancelled = false;

        const loadSubModules = async () => {
            setSubModuleLoading(true);

            try {
                const response = await getSubModules();
                const data = getSubModulesFromResponse(response);

                const activeSubModules = data
                    .filter(
                        (item) =>
                            getSubModuleId(item) !== null &&
                            getSubModuleStatus(item) === 1
                    )
                    .sort(
                        (a, b) =>
                            Number(
                                getSubModuleId(a) || 0
                            ) -
                            Number(
                                getSubModuleId(b) || 0
                            )
                    );

                if (cancelled) {
                    return;
                }

                setSubModules(activeSubModules);

                /*
                 * IMPORTANT:
                 * When module changes, load its existing
                 * permission into checkbox state.
                 */
                const existingPermission =
                    rolePermissions.find(
                        (permission) =>
                            Number(permission.module_id) ===
                            Number(selectedModuleId)
                    );

                if (existingPermission) {
                    setSelectedSubModuleIds(
                        getPermissionSubModuleIds(
                            existingPermission,
                            activeSubModules
                        )
                    );
                } else {
                    setSelectedSubModuleIds([]);
                }
            } catch (error) {
                console.error(
                    "GET SUB MODULES ERROR:",
                    error?.response?.data ||
                        error?.message ||
                        error
                );

                if (cancelled) {
                    return;
                }

                setSubModules([]);
                setSelectedSubModuleIds([]);
            } finally {
                if (!cancelled) {
                    setSubModuleLoading(false);
                }
            }
        };

        loadSubModules();

        return () => {
            cancelled = true;
        };
    }, [
        selectedModuleId,
        isEditMode,
        rolePermissions,
    ]);

    /*
     * =========================================================
     * PARENT HELPERS
     * =========================================================
     */

    const getParentValue = (user, roleId) => {
        const role = Number(roleId);

        const roleFields = {
            1: ["parent_admin_id", "admin_id"],
            2: ["parent_cnf_id", "cnf_id"],
            3: [
                "parent_super_distributor_id",
                "parent_superdistributor_id",
                "super_distributor_id",
            ],
            4: [
                "parent_distributor_id",
                "distributor_id",
            ],
            5: ["parent_fos_id", "fos_id"],
            6: ["parent_retailer_id", "retailer_id"],
            7: [
                "parent_sub_retailer_id",
                "parent_subretailer_id",
                "sub_retailer_id",
            ],
            8: [
                "parent_employee_id",
                "employee_id",
            ],
            9: [
                "parent_staff_id",
                "staff_id",
            ],
        };

        const fields = roleFields[role] || [];

        for (const field of fields) {
            const value = user?.[field];

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {
                return Number(value);
            }
        }

        return null;
    };

    const getParentChainFromUser = (user) => {
        const result = {};

        const possibleChain =
            user?.parent_chain ??
            user?.parentChain ??
            user?.hierarchy ??
            user?.parents ??
            user?.parent_users ??
            user?.parentUsers;

        if (Array.isArray(possibleChain)) {
            possibleChain.forEach((item) => {
                const roleId = Number(
                    item?.role_id ??
                        item?.roleId ??
                        item?.current_role_id
                );

                const id = Number(
                    item?.id ??
                        item?.user_id ??
                        item?.parent_id
                );

                if (
                    Number.isFinite(roleId) &&
                    roleId > 0 &&
                    Number.isFinite(id) &&
                    id > 0
                ) {
                    result[roleId] = id;
                }
            });
        }

        if (
            possibleChain &&
            typeof possibleChain === "object" &&
            !Array.isArray(possibleChain)
        ) {
            Object.entries(possibleChain).forEach(
                ([key, value]) => {
                    const roleId = Number(key);

                    const id = Number(
                        value?.id ??
                            value?.user_id ??
                            value?.parent_id ??
                            value
                    );

                    if (
                        Number.isFinite(roleId) &&
                        roleId > 0 &&
                        Number.isFinite(id) &&
                        id > 0
                    ) {
                        result[roleId] = id;
                    }
                }
            );
        }

        Object.keys(roleNames).forEach((roleId) => {
            const role = Number(roleId);

            if (!result[role]) {
                const value = getParentValue(
                    user,
                    role
                );

                if (value) {
                    result[role] = value;
                }
            }
        });

        return result;
    };

    /*
     * =========================================================
     * LOAD EDIT USER
     * =========================================================
     */

    const loadEditUser = async () => {
        if (!isEditMode || !editId) {
            return;
        }

        try {
            setEditLoading(true);
            setEditUserLoaded(false);

            const response =
                await getStaffDataById(editId);

            const user =
                getSingleUserFromResponse(response);

            if (!user) {
                toast.error("User data not found");
                return;
            }

            const roleId = Number(
                user?.role_id ??
                    searchParams.get("role_id")
            );

            const country = user?.country || "";
            const state = user?.state || "";
            const city = user?.city || "";

            const editFormData = {
                ...initialFormData,
                organization_name:
                    user?.organization_name || "",
                role_id: roleId || "",
                name: user?.name || "",
                email: user?.email || "",
                phone: user?.phone || "",
                password: "",
                confirm_password: "",
                company_address:
                    user?.company_address || "",
                country,
                state,
                city,
                parent_id: user?.parent_id
                    ? Number(user.parent_id)
                    : null,

                new_device:
                    Number(user?.new_device) === 1
                        ? 1
                        : 0,

                old_device:
                    Number(user?.old_device) === 1
                        ? 1
                        : 0,

                supreme_device:
                    Number(user?.supreme_device) === 1
                        ? 1
                        : 0,

                pro_star:
                    Number(user?.pro_star) === 1
                        ? 1
                        : 0,

                lite:
                    Number(user?.lite) === 1
                        ? 1
                        : 0,

                google_tv:
                    Number(user?.google_tv) === 1
                        ? 1
                        : 0,

                supreme_lock:
                    Number(user?.supreme_lock) === 1
                        ? 1
                        : 0,
            };

            setFormData(editFormData);

            const parentChain =
                getParentChainFromUser(user);

            if (user?.parent_id) {
                const lastParentRole =
                    (
                        parentRoles[roleId] || []
                    ).slice(-1)[0];

                if (lastParentRole) {
                    parentChain[
                        Number(lastParentRole)
                    ] = Number(user.parent_id);
                }
            }

            setSelectedParents(parentChain);

            const permissions =
                user?.role_permission ??
                user?.role_permissions ??
                user?.permissions ??
                [];

            let normalizedPermissions = [];

            if (Array.isArray(permissions)) {
                normalizedPermissions =
                    permissions
                        .map((permission) => ({
                            module_id: Number(
                                permission?.module_id ??
                                    permission?.moduleId ??
                                    permission?.id
                            ),

                            sub_modules:
                                getPermissionObject(
                                    permission?.sub_modules ??
                                        permission?.subModules ??
                                        permission?.permissions ??
                                        {}
                                ),
                        }))
                        .filter(
                            (permission) =>
                                Number.isFinite(
                                    permission.module_id
                                ) &&
                                permission.module_id > 0
                        );
            } else if (
                permissions &&
                typeof permissions === "object"
            ) {
                normalizedPermissions =
                    Object.entries(permissions)
                        .map(
                            ([
                                moduleId,
                                permission,
                            ]) => ({
                                module_id:
                                    Number(moduleId),

                                sub_modules:
                                    getPermissionObject(
                                        permission?.sub_modules ??
                                            permission
                                    ),
                            })
                        )
                        .filter(
                            (permission) =>
                                Number.isFinite(
                                    permission.module_id
                                ) &&
                                permission.module_id > 0
                        );
            }

            setRolePermissions(
                normalizedPermissions
            );

            setOriginalFormData({
                ...editFormData,
            });

            setOriginalRolePermissions(
                JSON.parse(
                    JSON.stringify(
                        normalizedPermissions
                    )
                )
            );

            setOriginalSelectedParents({
                ...parentChain,
            });

            if (normalizedPermissions.length > 0) {
                setSelectedModuleId(
                    String(
                        normalizedPermissions[0]
                            .module_id
                    )
                );
            } else {
                setSelectedModuleId("");
                setSelectedSubModuleIds([]);
            }

            setEditUserLoaded(true);
        } catch (error) {
            console.error(
                "GET STAFF DATA ERROR:",
                error?.response?.data ||
                    error?.message ||
                    error
            );

            toast.error(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to load user data"
            );
        } finally {
            setEditLoading(false);
        }
    };

    useEffect(() => {
        if (!isEditMode || !editId) {
            return;
        }

        loadEditUser();
    }, [editId, isEditMode]);

    /*
     * =========================================================
     * LOAD PARENTS
     * =========================================================
     */

    useEffect(() => {
        if (!selectedRole || selectedRole <= 1) {
            return;
        }

        if (!loggedInUserId) {
            return;
        }

        if (
            isEditMode &&
            !editUserLoaded
        ) {
            return;
        }

        const parents = visibleParentRoles;

        if (!parents.length) {
            setParentUsers({});
            return;
        }

        let cancelled = false;

        const loadParents = async () => {
            try {
                const updatedParentUsers = {};
                const updatedSelectedParents = {
                    ...selectedParents,
                };

                for (
                    let index = 0;
                    index < parents.length;
                    index++
                ) {
                    if (cancelled) {
                        return;
                    }

                    const currentRole =
                        Number(parents[index]);

                    let parentId = null;

                    if (index === 0) {
                        if (
                            currentRole ===
                            loggedInRoleId
                        ) {
                            parentId =
                                loggedInUserId;
                        }
                    } else {
                        const previousRole =
                            Number(
                                parents[index - 1]
                            );

                        parentId =
                            updatedSelectedParents[
                                previousRole
                            ]
                                ? Number(
                                      updatedSelectedParents[
                                          previousRole
                                      ]
                                  )
                                : null;
                    }

                    const response =
                        await getDropdownUsers(
                            currentRole,
                            parentId
                        );

                    let users =
                        getUsersFromResponse(
                            response
                        );

                    if (currentRole === 5) {
                        users = users.filter(
                            (user) =>
                                Number(
                                    user?.role_id
                                ) === 5 &&
                                (parentId ===
                                    null ||
                                    Number(
                                        user?.parent_id
                                    ) ===
                                        Number(
                                            parentId
                                        ))
                        );
                    }

                    const selectedId =
                        updatedSelectedParents[
                            currentRole
                        ];

                    if (
                        selectedId &&
                        !users.some(
                            (user) =>
                                Number(
                                    user?.id
                                ) ===
                                Number(selectedId)
                        )
                    ) {
                        const responseById =
                            await getDropdownUsers(
                                currentRole,
                                parentId,
                                ""
                            );

                        const allUsers =
                            getUsersFromResponse(
                                responseById
                            );

                        const selectedUser =
                            allUsers.find(
                                (user) =>
                                    Number(
                                        user?.id
                                    ) ===
                                    Number(
                                        selectedId
                                    )
                            );

                        if (selectedUser) {
                            users = [
                                ...users,
                                selectedUser,
                            ];
                        }
                    }

                    updatedParentUsers[
                        currentRole
                    ] = users;
                }

                if (cancelled) {
                    return;
                }

                setParentUsers(
                    updatedParentUsers
                );

                setSelectedParents(
                    updatedSelectedParents
                );

                const lastRole =
                    parents[parents.length - 1];

                const lastParentId =
                    updatedSelectedParents[
                        Number(lastRole)
                    ];

                if (lastParentId) {
                    setFormData((prev) => ({
                        ...prev,
                        parent_id:
                            Number(lastParentId),
                    }));
                }
            } catch (error) {
                if (cancelled) {
                    return;
                }

                console.error(
                    "LOAD PARENTS ERROR:",
                    error?.response?.data ||
                        error?.message ||
                        error
                );
            }
        };

        loadParents();

        return () => {
            cancelled = true;
        };
    }, [
        selectedRole,
        loggedInRoleId,
        loggedInUserId,
        modules,
        isEditMode,
        editUserLoaded,
    ]);

    const loadNextParentUsers = async (
        currentRoleId,
        selectedParentId,
        nextRoleId
    ) => {
        if (
            !selectedParentId ||
            !nextRoleId
        ) {
            return;
        }

        const nextRole = Number(nextRoleId);

        try {
            setSearchLoading((prev) => ({
                ...prev,
                [nextRole]: true,
            }));

            const response =
                await getDropdownUsers(
                    nextRole,
                    Number(selectedParentId)
                );

            let users =
                getUsersFromResponse(response);

            if (nextRole === 5) {
                users = users.filter(
                    (user) =>
                        Number(user?.role_id) ===
                            5 &&
                        Number(user?.parent_id) ===
                            Number(selectedParentId)
                );
            }

            setParentUsers((prev) => ({
                ...prev,
                [nextRole]: users,
            }));
        } catch (error) {
            console.error(
                `LOAD ${getRoleName(
                    nextRole
                )} ERROR:`,
                error?.response?.data ||
                    error
            );

            setParentUsers((prev) => ({
                ...prev,
                [nextRole]: [],
            }));
        } finally {
            setSearchLoading((prev) => ({
                ...prev,
                [nextRole]: false,
            }));
        }
    };

    const handleParentChange = async (
        parentRoleId,
        parentId
    ) => {
        const roleId = Number(parentRoleId);

        const selectedId = parentId
            ? Number(parentId)
            : null;

        const parents = visibleParentRoles;

        const currentIndex =
            parents.indexOf(roleId);

        const updatedSelectedParents = {
            ...selectedParents,
        };

        if (selectedId) {
            updatedSelectedParents[roleId] =
                selectedId;
        } else {
            delete updatedSelectedParents[
                roleId
            ];
        }

        parents
            .slice(currentIndex + 1)
            .forEach((childRoleId) => {
                delete updatedSelectedParents[
                    Number(childRoleId)
                ];
            });

        setSelectedParents(
            updatedSelectedParents
        );

        setFormData((prev) => ({
            ...prev,
            parent_id: selectedId,
        }));

        const updatedParentUsers = {
            ...parentUsers,
        };

        parents
            .slice(currentIndex + 1)
            .forEach((childRoleId) => {
                updatedParentUsers[
                    Number(childRoleId)
                ] = [];
            });

        setParentUsers(
            updatedParentUsers
        );

        const updatedSearch = {
            ...parentSearch,
        };

        parents
            .slice(currentIndex + 1)
            .forEach((childRoleId) => {
                updatedSearch[
                    Number(childRoleId)
                ] = "";
            });

        setParentSearch(updatedSearch);

        if (!selectedId) {
            return;
        }

        const nextRole =
            parents[currentIndex + 1];

        if (!nextRole) {
            return;
        }

        await loadNextParentUsers(
            roleId,
            selectedId,
            Number(nextRole)
        );
    };

    /*
     * =========================================================
     * PARENT SEARCH
     * =========================================================
     */

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
            const previousRole =
                Number(
                    parents[currentIndex - 1]
                );

            parentId = selectedParents[
                previousRole
            ]
                ? Number(
                      selectedParents[
                          previousRole
                      ]
                  )
                : null;
        }

        if (currentIndex === 0) {
            if (
                Number(roleId) ===
                Number(loggedInRoleId)
            ) {
                parentId = loggedInUserId;
            }
        }

        const timer = setTimeout(
            async () => {
                try {
                    setSearchLoading(
                        (prev) => ({
                            ...prev,
                            [roleId]: true,
                        })
                    );

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

                    if (roleId === 5) {
                        users = users.filter(
                            (user) =>
                                Number(
                                    user?.role_id
                                ) === 5 &&
                                (parentId ===
                                    null ||
                                    Number(
                                        user?.parent_id
                                    ) ===
                                        Number(
                                            parentId
                                        ))
                        );
                    }

                    setParentUsers(
                        (prev) => ({
                            ...prev,
                            [roleId]: users,
                        })
                    );
                } catch (error) {
                    console.error(
                        "DROPDOWN SEARCH ERROR:",
                        error?.response
                            ?.data ||
                            error
                    );

                    setParentUsers(
                        (prev) => ({
                            ...prev,
                            [roleId]: [],
                        })
                    );
                } finally {
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
        selectedParents,
        loggedInRoleId,
        loggedInUserId,
    ]);

    /*
     * =========================================================
     * FORM HANDLERS
     * =========================================================
     */

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

    /*
     * =========================================================
     * SUB MODULE HANDLERS
     * =========================================================
     */

    const handleSubModuleToggle = (
        subModuleId
    ) => {
        const id = Number(subModuleId);

        setSelectedSubModuleIds((prev) =>
            prev.includes(id)
                ? prev.filter(
                      (item) => item !== id
                  )
                : [...prev, id]
        );
    };

    const handleSelectAllSubModules = () => {
        if (!subModules.length) {
            return;
        }

        const allIds = subModules
            .map((item) =>
                getSubModuleId(item)
            )
            .filter(
                (id) => id !== null
            );

        setSelectedSubModuleIds((prev) =>
            prev.length === allIds.length
                ? []
                : allIds
        );
    };

    const createModulePermission = () => {
        if (!selectedModuleId) {
            return null;
        }

        const subModulePermission = {
            manage: 0,
            edit: 0,
            view: 0,
            add: 0,
            delete: 0,
        };

        selectedSubModuleIds.forEach(
            (subModuleId) => {
                const subModule =
                    subModules.find(
                        (item) =>
                            getSubModuleId(
                                item
                            ) ===
                            Number(
                                subModuleId
                            )
                    );

                if (!subModule) {
                    return;
                }

                const name =
                    normalizeName(
                        getSubModuleNameValue(
                            subModule
                        )
                    );

                if (name === "manage") {
                    subModulePermission.manage = 1;
                }

                if (name === "edit") {
                    subModulePermission.edit = 1;
                }

                if (name === "view") {
                    subModulePermission.view = 1;
                }

                if (name === "add") {
                    subModulePermission.add = 1;
                }

                if (name === "delete") {
                    subModulePermission.delete = 1;
                }
            }
        );

        return {
            module_id:
                Number(selectedModuleId),
            sub_modules:
                subModulePermission,
        };
    };

    const handleAddPermission = () => {
        if (!selectedModuleId) {
            toast.error("Please select a module");
            return;
        }

        if (!selectedSubModuleIds.length) {
            toast.error(
                "Please select at least one sub module"
            );
            return;
        }

        const newPermission =
            createModulePermission();

        if (!newPermission) {
            return;
        }

        const alreadyExists =
            rolePermissions.some(
                (item) =>
                    Number(
                        item.module_id
                    ) ===
                    Number(
                        newPermission.module_id
                    )
            );

        setRolePermissions((prev) => {
            const existingIndex =
                prev.findIndex(
                    (item) =>
                        Number(
                            item.module_id
                        ) ===
                        Number(
                            newPermission.module_id
                        )
                );

            if (existingIndex === -1) {
                return [
                    ...prev,
                    newPermission,
                ];
            }

            const updated = [...prev];

            updated[existingIndex] = {
                ...updated[existingIndex],
                sub_modules:
                    getPermissionObject(
                        newPermission.sub_modules
                    ),
            };

            return updated;
        });

        toast.success(
            alreadyExists
                ? `${getModuleName(
                      selectedModuleId
                  )} permissions updated`
                : `${getModuleName(
                      selectedModuleId
                  )} permissions added`
        );
    };

    const handleRemovePermission = (
        moduleId
    ) => {
        setRolePermissions((prev) =>
            prev.filter(
                (item) =>
                    Number(
                        item.module_id
                    ) !==
                    Number(moduleId)
            )
        );

        if (
            Number(selectedModuleId) ===
            Number(moduleId)
        ) {
            setSelectedSubModuleIds([]);
        }
    };

    const getModuleName = (moduleId) =>
        modules.find(
            (item) =>
                Number(item?.id) ===
                Number(moduleId)
        )?.name || "Module";

    const getSelectedSubModuleNames = (
        permission
    ) => {
        return subModuleKeys
            .filter(
                (key) =>
                    Number(
                        permission
                            ?.sub_modules?.[key]
                    ) === 1
            )
            .map(
                (key) =>
                    key
                        .charAt(0)
                        .toUpperCase() +
                    key.slice(1)
            );
    };

    /*
     * =========================================================
     * LOCATION DATA
     * =========================================================
     */

    const countries =
        Country.getAllCountries();

    const states = formData.country
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

    /*
     * =========================================================
     * SUBMIT
     * =========================================================
     */

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (
            isEditMode &&
            !hasChanges
        ) {
            toast.info(
                "No changes to update"
            );
            return;
        }

        const roleId = Number(
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

        if (
            !isEditMode &&
            formData.password !==
                formData.confirm_password
        ) {
            toast.error(
                "Password and Confirm Password do not match!"
            );
            return;
        }

        if (
            isEditMode &&
            (formData.password ||
                formData.confirm_password) &&
            formData.password !==
                formData.confirm_password
        ) {
            toast.error(
                "Password and Confirm Password do not match!"
            );
            return;
        }

        const canAssignPermissions =
            canShowModuleAccess;

        const finalRolePermissions =
            rolePermissions.map(
                (item) => ({
                    module_id: Number(
                        item.module_id
                    ),
                    sub_modules:
                        getPermissionObject(
                            item.sub_modules
                        ),
                })
            );

        if (
            !isEditMode &&
            canAssignPermissions &&
            finalRolePermissions.length === 0
        ) {
            toast.error(
                "Please add at least one module"
            );
            return;
        }

        let finalParentId =
            formData.parent_id
                ? Number(
                      formData.parent_id
                  )
                : null;

        if (
            !finalParentId &&
            roleId > 1 &&
            loggedInRoleId > 0 &&
            loggedInRoleId < roleId
        ) {
            finalParentId =
                loggedInUserId;
        }

        const payload = {
            ...formData,
            role_id: roleId,
            parent_id: finalParentId,
            role_permission:
                canAssignPermissions
                    ? finalRolePermissions
                    : [],
        };

        if (isEditMode) {
            delete payload.confirm_password;

            if (!payload.password) {
                delete payload.password;
            }
        }

        try {
            setSubmitLoading(true);

            let response;

            if (isEditMode) {
                response =
                    await updateStaffData(
                        editId,
                        payload
                    );
            } else {
                response =
                    await addStaff(payload);
            }

            toast.success(
                response?.message ||
                    (isEditMode
                        ? "Updated Successfully"
                        : "Registered Successfully")
            );

            if (!isEditMode) {
                setFormData({
                    ...initialFormData,
                    role_id: roleId,
                });

                setSelectedParents({});
                setParentUsers({});
                setParentSearch({});
                setOpenDropdown(null);

                setSelectedModuleId("");
                setSelectedSubModuleIds([]);
                setRolePermissions([]);
                setSubModules([]);

                setShowPassword(false);
                setShowConfirmPassword(false);
            } else {
                setOriginalFormData({
                    ...formData,
                    password: "",
                    confirm_password: "",
                });

                setOriginalRolePermissions(
                    JSON.parse(
                        JSON.stringify(
                            rolePermissions
                        )
                    )
                );

                setOriginalSelectedParents({
                    ...selectedParents,
                });

                setFormData((prev) => ({
                    ...prev,
                    password: "",
                    confirm_password: "",
                }));
            }
        } catch (error) {
            console.error(
                isEditMode
                    ? "UPDATE USER ERROR:"
                    : "REGISTER ERROR:",
                error?.response?.data ||
                    error
            );

            toast.error(
                error?.response?.data
                    ?.message ||
                    error?.response?.data
                        ?.error ||
                    (isEditMode
                        ? "Failed to update user"
                        : "Something went wrong")
            );
        } finally {
            setSubmitLoading(false);
        }
    };

    /*
     * =========================================================
     * LOADING
     * =========================================================
     */

    if (
        isEditMode &&
        editLoading
    ) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10">
                    <div className="flex justify-center items-center py-10">
                        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>

                    <p className="text-center text-slate-500">
                        Loading user data...
                    </p>
                </div>
            </div>
        );
    }

    /*
     * =========================================================
     * UI
     * =========================================================
     */

    return (
        <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden p-6">

                <div className="flex justify-between items-center">
                    <Link
                        href={`/dashboard?role=${selectedRole}`}
                        className="bg-gray-700 text-white px-4 py-2 rounded-sm hover:bg-gray-800 whitespace-nowrap"
                    >
                        {getRoleName(
                            selectedRole
                        )}{" "}
                        List
                    </Link>
                </div>

                {selectedRole > 1 &&
                    visibleParentRoles.length >
                        0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                            {visibleParentRoles.map(
                                (
                                    parentRoleId
                                ) => {
                                    const role =
                                        Number(
                                            parentRoleId
                                        );

                                    const users =
                                        parentUsers[
                                            role
                                        ] || [];

                                    const selectedUser =
                                        users.find(
                                            (
                                                user
                                            ) =>
                                                Number(
                                                    user?.id
                                                ) ===
                                                Number(
                                                    selectedParents[
                                                        role
                                                    ]
                                                )
                                        );

                                    return (
                                        <div
                                            key={
                                                role
                                            }
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
                                                    onClick={() =>
                                                        setOpenDropdown(
                                                            openDropdown ===
                                                                role
                                                                ? null
                                                                : role
                                                        )
                                                    }
                                                    className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-left bg-white text-slate-700 cursor-pointer"
                                                >
                                                    <span className="truncate">
                                                        {selectedUser?.name ||
                                                            `Select ${getRoleName(
                                                                role
                                                            )}`}
                                                    </span>

                                                    <RiArrowDownSLine
                                                        size={
                                                            22
                                                        }
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
                                                            <input
                                                                type="text"
                                                                value={
                                                                    parentSearch[
                                                                        role
                                                                    ] ||
                                                                    ""
                                                                }
                                                                onChange={(
                                                                    e
                                                                ) =>
                                                                    setParentSearch(
                                                                        (
                                                                            prev
                                                                        ) => ({
                                                                            ...prev,
                                                                            [role]:
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                        })
                                                                    )
                                                                }
                                                                placeholder={`Search ${getRoleName(
                                                                    role
                                                                )}...`}
                                                                autoFocus
                                                                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        </div>

                                                        <div className="max-h-60 overflow-y-auto">
                                                            {searchLoading[
                                                                role
                                                            ] ? (
                                                                <div className="px-4 py-4 text-center text-sm text-slate-400">
                                                                    Loading...
                                                                </div>
                                                            ) : users.length >
                                                              0 ? (
                                                                users.map(
                                                                    (
                                                                        user
                                                                    ) => (
                                                                        <button
                                                                            key={
                                                                                user.id
                                                                            }
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
                                                                                    (
                                                                                        prev
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        [role]:
                                                                                            "",
                                                                                    })
                                                                                );
                                                                            }}
                                                                            className={`w-full text-left px-4 py-2.5 text-sm ${
                                                                                Number(
                                                                                    selectedParents[
                                                                                        role
                                                                                    ]
                                                                                ) ===
                                                                                Number(
                                                                                    user.id
                                                                                )
                                                                                    ? "bg-blue-50 text-blue-700 font-medium"
                                                                                    : "text-slate-700 hover:bg-slate-50"
                                                                            }`}
                                                                        >
                                                                            {
                                                                                user.name
                                                                            }
                                                                        </button>
                                                                    )
                                                                )
                                                            ) : (
                                                                <div className="px-4 py-4 text-center text-sm text-slate-400">
                                                                    No{" "}
                                                                    {getRoleName(
                                                                        role
                                                                    )}{" "}
                                                                    found
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

                        {/* ORGANIZATION */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Organization Name{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                name="organization_name"
                                value={
                                    formData.organization_name
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                placeholder="Enter organization name"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* NAME */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Full Name{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                name="name"
                                value={
                                    formData.name
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                placeholder="Enter full name"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* EMAIL */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Email Address{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                type="email"
                                name="email"
                                value={
                                    formData.email
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                placeholder="staff@example.com"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* PHONE */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Phone Number{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                type="tel"
                                name="phone"
                                value={
                                    formData.phone
                                }
                                onChange={(e) =>
                                    setFormData(
                                        (prev) => ({
                                            ...prev,
                                            phone: e.target.value.replace(
                                                /[^\d+\s]/g,
                                                ""
                                            ),
                                        })
                                    )
                                }
                                required
                                pattern="^(\+91\s?)?[6-9]\d{9}$"
                                placeholder="+91 98765 43210"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* ADDRESS */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Company Address{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <input
                                type="text"
                                name="company_address"
                                value={
                                    formData.company_address
                                }
                                onChange={
                                    handleChange
                                }
                                required
                                placeholder="Street, Building, Area"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Password{" "}
                                {!isEditMode && (
                                    <span className="text-red-500">
                                        *
                                    </span>
                                )}
                            </label>

                            <div className="relative">
                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="password"
                                    value={
                                        formData.password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required={
                                        !isEditMode
                                    }
                                    placeholder={
                                        isEditMode
                                            ? "Leave blank to keep current password"
                                            : "Enter password"
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (prev) =>
                                                !prev
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                                >
                                    {showPassword ? (
                                        <RiEyeOffLine
                                            size={
                                                20
                                            }
                                        />
                                    ) : (
                                        <RiEyeLine
                                            size={
                                                20
                                            }
                                        />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* CONFIRM PASSWORD */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Confirm Password{" "}
                                {!isEditMode && (
                                    <span className="text-red-500">
                                        *
                                    </span>
                                )}
                            </label>

                            <div className="relative">
                                <input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    name="confirm_password"
                                    value={
                                        formData.confirm_password
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required={
                                        !isEditMode
                                    }
                                    placeholder={
                                        isEditMode
                                            ? "Leave blank to keep current password"
                                            : "Re-enter password"
                                    }
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            (prev) =>
                                                !prev
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 cursor-pointer"
                                >
                                    {showConfirmPassword ? (
                                        <RiEyeOffLine
                                            size={
                                                20
                                            }
                                        />
                                    ) : (
                                        <RiEyeLine
                                            size={
                                                20
                                            }
                                        />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* COUNTRY */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Country{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <div className="relative">
                                <select
                                    name="country"
                                    value={
                                        formData.country
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer"
                                >
                                    <option value="">
                                        Select Country
                                    </option>

                                    {countries.map(
                                        (
                                            country
                                        ) => (
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
                                    size={
                                        22
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* STATE */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                State{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <div className="relative">
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
                                    className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50"
                                >
                                    <option value="">
                                        Select State
                                    </option>

                                    {states.map(
                                        (
                                            state
                                        ) => (
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
                                    size={
                                        22
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* CITY */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                City{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <div className="relative">
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
                                    className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50"
                                >
                                    <option value="">
                                        Select City
                                    </option>

                                    {cities.map(
                                        (
                                            city
                                        ) => (
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
                                    size={
                                        22
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* =================================================
                            MODULE ACCESS
                           ================================================= */}

                        {canShowModuleAccess && (
                            <div className="md:col-span-3">
                                <div className="border-t border-slate-200 pt-6 mt-2">
                                    <h3 className="text-lg font-semibold text-slate-800">
                                        Module Access
                                    </h3>

                                    <p className="text-sm text-slate-500 mt-1">
                                        Select a module and assign sub modules.
                                    </p>
                                </div>

                                <div className="mt-5 border border-slate-200 rounded-xl p-5 bg-slate-50">

                                    {/* MODULE SELECT */}
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-medium text-slate-700">
                                            Module{" "}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <div className="relative">
                                            <select
                                                value={
                                                    selectedModuleId
                                                }
                                                onChange={(
                                                    e
                                                ) => {
                                                    const moduleId =
                                                        e
                                                            .target
                                                            .value;

                                                    setSelectedModuleId(
                                                        moduleId
                                                    );

                                                    if (
                                                        !moduleId
                                                    ) {
                                                        setSelectedSubModuleIds(
                                                            []
                                                        );
                                                        return;
                                                    }

                                                    /*
                                                     * Load existing permission
                                                     * for selected module.
                                                     */
                                                    const existingPermission =
                                                        rolePermissions.find(
                                                            (
                                                                permission
                                                            ) =>
                                                                Number(
                                                                    permission.module_id
                                                                ) ===
                                                                Number(
                                                                    moduleId
                                                                )
                                                        );

                                                    if (
                                                        existingPermission
                                                    ) {
                                                        /*
                                                         * subModules may belong
                                                         * to previous module.
                                                         * useEffect will reload
                                                         * active sub modules.
                                                         */
                                                        setSelectedSubModuleIds(
                                                            []
                                                        );
                                                    } else {
                                                        setSelectedSubModuleIds(
                                                            []
                                                        );
                                                    }
                                                }}
                                                className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">
                                                    Select Module
                                                </option>

                                                {modules.map(
                                                    (
                                                        module
                                                    ) => (
                                                        <option
                                                            key={
                                                                module.id
                                                            }
                                                            value={
                                                                module.id
                                                            }
                                                        >
                                                            {
                                                                module.name
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>

                                            <RiArrowDownSLine
                                                size={
                                                    22
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                            />
                                        </div>
                                    </div>

                                    {/* SUB MODULES */}
                                    {selectedModuleId && (
                                        <div className="mt-5">

                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-medium text-slate-700">
                                                    Sub Modules{" "}
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </label>

                                                {!subModuleLoading &&
                                                    subModules.length >
                                                        0 && (
                                                        <button
                                                            type="button"
                                                            onClick={
                                                                handleSelectAllSubModules
                                                            }
                                                            className="text-sm font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
                                                        >
                                                            {selectedSubModuleIds.length ===
                                                            subModules.length
                                                                ? "Unselect All"
                                                                : "Select All"}
                                                        </button>
                                                    )}
                                            </div>

                                            <div className="border border-slate-300 rounded-lg bg-white overflow-hidden">

                                                {subModuleLoading ? (
                                                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                                                        Loading Sub Modules...
                                                    </div>
                                                ) : subModules.length ===
                                                  0 ? (
                                                    <div className="px-4 py-6 text-center text-sm text-slate-400">
                                                        No Active Sub Module
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                                                        {subModules.map(
                                                            (
                                                                subModule
                                                            ) => {
                                                                const subModuleId =
                                                                    getSubModuleId(
                                                                        subModule
                                                                    );

                                                                const checked =
                                                                    selectedSubModuleIds.includes(
                                                                        subModuleId
                                                                    );

                                                                const Icon =
                                                                    getSubModuleIcon(
                                                                        subModule?.icon
                                                                    );

                                                                return (
                                                                    <label
                                                                        key={
                                                                            subModuleId
                                                                        }
                                                                        className={`flex items-center justify-between gap-3 border rounded-lg px-4 py-3 cursor-pointer transition ${
                                                                            checked
                                                                                ? "border-blue-500 bg-blue-50"
                                                                                : "border-slate-300 bg-white hover:border-blue-400"
                                                                        }`}
                                                                    >
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                            <div
                                                                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                                                                                    checked
                                                                                        ? "bg-blue-100 text-blue-600"
                                                                                        : "bg-slate-100 text-slate-500"
                                                                                }`}
                                                                            >
                                                                                <Icon
                                                                                    size={
                                                                                        20
                                                                                    }
                                                                                />
                                                                            </div>

                                                                            <div className="min-w-0">
                                                                                <p className="text-sm font-medium text-slate-700 truncate">
                                                                                    {getSubModuleNameValue(
                                                                                        subModule
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <input
                                                                            type="checkbox"
                                                                            checked={
                                                                                checked
                                                                            }
                                                                            onChange={() =>
                                                                                handleSubModuleToggle(
                                                                                    subModuleId
                                                                                )
                                                                            }
                                                                            className="h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
                                                                        />
                                                                    </label>
                                                                );
                                                            }
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* =================================================
                                                ADD / UPDATE SUB MODULE BUTTON
                                               ================================================= */}

                                            <div className="mt-5 flex items-center justify-between gap-3">

                                                <span className="text-sm text-slate-500">
                                                    {
                                                        selectedSubModuleIds.length
                                                    }{" "}
                                                    sub module
                                                    {selectedSubModuleIds.length >
                                                    1
                                                        ? "s"
                                                        : ""}{" "}
                                                    selected
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleAddPermission
                                                    }
                                                    disabled={
                                                        !isSubModuleChanged ||
                                                        subModuleLoading
                                                    }
                                                    className="bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
                                                >
                                                    {rolePermissions.some(
                                                        (
                                                            item
                                                        ) =>
                                                            Number(
                                                                item.module_id
                                                            ) ===
                                                            Number(
                                                                selectedModuleId
                                                            )
                                                    )
                                                        ? "Update Sub Modules"
                                                        : "Add Sub Modules"}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* SELECTED MODULES */}
                                    {rolePermissions.length >
                                        0 && (
                                        <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">

                                            <div className="bg-slate-50 px-5 py-4 border-b border-slate-200">
                                                <h4 className="font-semibold text-slate-700">
                                                    Selected Modules
                                                </h4>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead className="bg-white border-b border-slate-200">
                                                        <tr>
                                                            <th className="text-left px-5 py-3 font-semibold text-slate-600">
                                                                Module
                                                            </th>

                                                            <th className="text-left px-5 py-3 font-semibold text-slate-600">
                                                                Sub Modules
                                                            </th>

                                                            <th className="text-center px-5 py-3 font-semibold text-slate-600">
                                                                Action
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {rolePermissions.map(
                                                            (
                                                                permission
                                                            ) => {
                                                                const selectedNames =
                                                                    getSelectedSubModuleNames(
                                                                        permission
                                                                    );

                                                                return (
                                                                    <tr
                                                                        key={
                                                                            permission.module_id
                                                                        }
                                                                        className="border-b border-slate-100 last:border-0"
                                                                    >
                                                                        <td className="px-5 py-4 text-slate-700 font-medium capitalize">
                                                                            {getModuleName(
                                                                                permission.module_id
                                                                            )}
                                                                        </td>

                                                                        <td className="px-5 py-4">
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {selectedNames.map(
                                                                                    (
                                                                                        name
                                                                                    ) => (
                                                                                        <span
                                                                                            key={
                                                                                                name
                                                                                            }
                                                                                            className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium"
                                                                                        >
                                                                                            {
                                                                                                name
                                                                                            }
                                                                                        </span>
                                                                                    )
                                                                                )}
                                                                            </div>
                                                                        </td>

                                                                        <td className="px-5 py-4 text-center">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    handleRemovePermission(
                                                                                        permission.module_id
                                                                                    )
                                                                                }
                                                                                className="inline-flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                                                            >
                                                                                <RiDeleteBinLine
                                                                                    size={
                                                                                        19
                                                                                    }
                                                                                />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            }
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* DEVICE PERMISSIONS */}
                        {Number(
                            formData.role_id
                        ) === 6 && (
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
                                    ].map(
                                        (
                                            item
                                        ) => (
                                            <label
                                                key={
                                                    item.name
                                                }
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer ${
                                                    formData[
                                                        item
                                                            .name
                                                    ] ===
                                                    1
                                                        ? "border-blue-500 bg-blue-50"
                                                        : "border-slate-300 bg-white"
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
                                                            item
                                                                .name
                                                        ] ===
                                                        1
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
                    </div>

                    {/* MAIN UPDATE / CREATE BUTTON */}
                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={
                                submitLoading ||
                                (isEditMode &&
                                    !hasChanges)
                            }
                            className="bg-blue-500 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:bg-blue-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-500"
                        >
                            {submitLoading
                                ? isEditMode
                                    ? "Updating..."
                                    : "Creating..."
                                : isEditMode
                                ? "Update"
                                : "Create"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
