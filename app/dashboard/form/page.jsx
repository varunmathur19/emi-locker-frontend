
"use client";

import {
    addStaff,
    getDropdownUsers,
    getModules,
    getSubModules,
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
import { useEffect, useState } from "react";
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
    subModuleIcons[String(icon || "").trim()] ||
    FaEye;

const getPermissionObject = (subModules = {}) => ({
    manage: Number(subModules?.manage) === 1 ? 1 : 0,
    edit: Number(subModules?.edit) === 1 ? 1 : 0,
    view: Number(subModules?.view) === 1 ? 1 : 0,
    add: Number(subModules?.add) === 1 ? 1 : 0,
    delete: Number(subModules?.delete) === 1 ? 1 : 0,
});

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
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [subModuleLoading, setSubModuleLoading] = useState(false);

    const selectedRole = Number(searchParams.get("role_id"));

    const loggedInUser = getUserFromToken();
    const loggedInRoleId = Number(loggedInUser?.role_id);
    const loggedInUserId = Number(loggedInUser?.id);

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
                typeof item === "string"
                    ? item
                    : item?.name;

            const moduleSlug =
                typeof item === "object"
                    ? item?.slug
                    : "";

            const normalizedModuleName =
                normalizeName(moduleName);

            const normalizedModuleSlug =
                normalizeName(moduleSlug);

            if (role === 3) {
                return (
                    normalizedModuleName ===
                        "superdistributor" ||
                    normalizedModuleName ===
                        "superdistributer" ||
                    normalizedModuleSlug ===
                        "superdistributor" ||
                    normalizedModuleSlug ===
                        "superdistributer"
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

        return role > loggedRole && role < createRole;
    });

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

    useEffect(() => {
        const roleId = searchParams.get("role_id");

        if (!roleId) {
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
    }, [searchParams]);

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
                setSelectedSubModuleIds([]);
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
    }, [selectedModuleId]);

    useEffect(() => {
        if (!selectedRole || selectedRole <= 1) {
            return;
        }

        if (!loggedInUserId) {
            return;
        }

        const parents = visibleParentRoles;

        if (!parents.length) {
            return;
        }

        const firstParentRole = Number(parents[0]);

        const parentId =
            firstParentRole === loggedInRoleId
                ? loggedInUserId
                : null;

        const loadFirstParent = async () => {
            try {
                const response = await getDropdownUsers(
                    firstParentRole,
                    parentId
                );

                const users = getUsersFromResponse(response);

                setParentUsers((prev) => ({
                    ...prev,
                    [firstParentRole]: users,
                }));
            } catch (error) {
                console.error(
                    "INITIAL PARENT ERROR:",
                    error?.response?.data || error
                );

                setParentUsers((prev) => ({
                    ...prev,
                    [firstParentRole]: [],
                }));
            }
        };

        loadFirstParent();
    }, [
        selectedRole,
        loggedInRoleId,
        loggedInUserId,
        modules,
    ]);

    const loadNextParentUsers = async (
        currentRoleId,
        selectedParentId,
        nextRoleId
    ) => {
        if (!selectedParentId || !nextRoleId) {
            return;
        }

        const nextRole = Number(nextRoleId);

        try {
            setSearchLoading((prev) => ({
                ...prev,
                [nextRole]: true,
            }));

            const response = await getDropdownUsers(
                nextRole,
                Number(selectedParentId)
            );

            let users = getUsersFromResponse(response);

            if (nextRole === 5) {
                users = users.filter(
                    (user) =>
                        Number(user?.role_id) === 5 &&
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
                `LOAD ${getRoleName(nextRole)} ERROR:`,
                error?.response?.data || error
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
        const currentIndex = parents.indexOf(roleId);

        const updatedSelectedParents = {
            ...selectedParents,
        };

        if (selectedId) {
            updatedSelectedParents[roleId] = selectedId;
        } else {
            delete updatedSelectedParents[roleId];
        }

        parents
            .slice(currentIndex + 1)
            .forEach((childRoleId) => {
                delete updatedSelectedParents[
                    Number(childRoleId)
                ];
            });

        setSelectedParents(updatedSelectedParents);

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

        setParentUsers(updatedParentUsers);

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
            const previousRole = Number(
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

        const timer = setTimeout(async () => {
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

                let users =
                    getUsersFromResponse(response);

                if (roleId === 5) {
                    users = users.filter(
                        (user) =>
                            Number(
                                user?.role_id
                            ) === 5 &&
                            (parentId === null ||
                                Number(
                                    user?.parent_id
                                ) ===
                                    Number(
                                        parentId
                                    ))
                    );
                }

                setParentUsers((prev) => ({
                    ...prev,
                    [roleId]: users,
                }));
            } catch (error) {
                console.error(
                    "DROPDOWN SEARCH ERROR:",
                    error?.response?.data ||
                        error
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
        }, 400);

        return () => clearTimeout(timer);
    }, [
        openDropdown,
        parentSearch,
        selectedRole,
        selectedParents,
        loggedInRoleId,
        loggedInUserId,
    ]);

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

    const handleSubModuleToggle = (subModuleId) => {
        const id = Number(subModuleId);

        setSelectedSubModuleIds((prev) =>
            prev.includes(id)
                ? prev.filter((item) => item !== id)
                : [...prev, id]
        );
    };

    const handleSelectAllSubModules = () => {
        if (!subModules.length) {
            return;
        }

        const allIds = subModules
            .map((item) => getSubModuleId(item))
            .filter((id) => id !== null);

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

        selectedSubModuleIds.forEach((subModuleId) => {
            const subModule = subModules.find(
                (item) =>
                    getSubModuleId(item) ===
                    Number(subModuleId)
            );

            if (!subModule) {
                return;
            }

            const name = normalizeName(
                getSubModuleNameValue(subModule)
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
        });

        return {
            module_id: Number(selectedModuleId),
            sub_modules: subModulePermission,
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

        setRolePermissions((prev) => {
            const existingIndex = prev.findIndex(
                (item) =>
                    Number(item.module_id) ===
                    Number(newPermission.module_id)
            );

            if (existingIndex === -1) {
                return [...prev, newPermission];
            }

            const updated = [...prev];

            updated[existingIndex] = {
                ...updated[existingIndex],
                sub_modules: getPermissionObject(
                    newPermission.sub_modules
                ),
            };

            return updated;
        });

        setSelectedSubModuleIds([]);

        toast.success(
            `${getModuleName(
                selectedModuleId
            )} permissions added`
        );
    };

    const handleRemovePermission = (moduleId) => {
        setRolePermissions((prev) =>
            prev.filter(
                (item) =>
                    Number(item.module_id) !==
                    Number(moduleId)
            )
        );
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
                        permission?.sub_modules?.[key]
                    ) === 1
            )
            .map(
                (key) =>
                    key.charAt(0).toUpperCase() +
                    key.slice(1)
            );
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        const roleId = Number(formData.role_id);

        if (!roleId) {
            toast.error(
                "Role ID missing. Please select role again"
            );
            return;
        }

        const tokenUser = getUserFromToken();

        if (!tokenUser?.id) {
            toast.error(
                "Logged-in user not found"
            );
            return;
        }

        if (
            formData.password !==
            formData.confirm_password
        ) {
            toast.error(
                "Password and Confirm Password do not match!"
            );
            return;
        }

        const canAssignPermissions =
            (loggedInRoleId === 0 ||
                loggedInRoleId === 1) &&
            roleId > loggedInRoleId;

        const finalRolePermissions =
            rolePermissions.map((item) => ({
                module_id: Number(item.module_id),
                sub_modules: getPermissionObject(
                    item.sub_modules
                ),
            }));

        if (
            (canAssignPermissions ||
                roleId === 9) &&
            finalRolePermissions.length === 0
        ) {
            toast.error(
                "Please add at least one module"
            );
            return;
        }

        let finalParentId =
            formData.parent_id
                ? Number(formData.parent_id)
                : null;

        if (
            !finalParentId &&
            roleId > 1 &&
            loggedInRoleId > 0 &&
            loggedInRoleId < roleId
        ) {
            finalParentId = loggedInUserId;
        }

        const payload = {
            ...formData,
            role_id: roleId,
            parent_id: finalParentId,
            role_permission:
                canAssignPermissions ||
                roleId === 9
                    ? finalRolePermissions
                    : [],
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
                    visibleParentRoles.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                            {visibleParentRoles.map(
                                (parentRoleId) => {
                                    const role =
                                        Number(parentRoleId);

                                    const users =
                                        parentUsers[role] || [];

                                    const selectedUser =
                                        users.find(
                                            (user) =>
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
                                            key={role}
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
                                                                            [role]: e.target.value,
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
                                                                                        [role]: "",
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
                                onChange={handleChange}
                                required
                                placeholder="Enter organization name"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

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
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="Enter full name"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

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
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="staff@example.com"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

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
                                placeholder="+91 98765 43210"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

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
                                onChange={handleChange}
                                required
                                placeholder="Street, Building, Area"
                                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Password{" "}
                                <span className="text-red-500">
                                    *
                                </span>
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
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter password"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (prev) => !prev
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
                                <span className="text-red-500">
                                    *
                                </span>
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
                                    onChange={handleChange}
                                    required
                                    placeholder="Re-enter password"
                                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            (prev) => !prev
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

                                <RiArrowDownSLine
                                    size={22}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                />
                            </div>
                        </div>

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
                                    onChange={handleChange}
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

                                <RiArrowDownSLine
                                    size={22}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                />
                            </div>
                        </div>

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
                                    onChange={handleChange}
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

                                <RiArrowDownSLine
                                    size={22}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                />
                            </div>
                        </div>

                        {(Number(formData.role_id) === 9 ||
                            ((loggedInRoleId === 0 ||
                                loggedInRoleId === 1) &&
                                selectedRole >
                                    loggedInRoleId)) && (
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
                                                onChange={(e) =>
                                                    setSelectedModuleId(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">
                                                    Select Module
                                                </option>

                                                {modules.map(
                                                    (module) => (
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
                                                size={22}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                                            />
                                        </div>
                                    </div>

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

                                            {selectedSubModuleIds.length >
                                                0 && (
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
                                                        className="bg-blue-500 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-600 transition cursor-pointer"
                                                    >
                                                        Add Sub Modules
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

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
                                            className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer ${
                                                formData[
                                                    item.name
                                                ] === 1
                                                    ? "border-blue-500 bg-blue-50"
                                                    : "border-slate-300 bg-white"
                                            }`}
                                        >
                                            <span className="text-sm font-medium text-slate-700">
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
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            className="bg-blue-500 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:bg-blue-600 transition cursor-pointer"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
