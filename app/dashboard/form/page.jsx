"use client";

import {
    addStaff,
    getDropdownUsers,
    getProfiles,
    getStaffDataById,
    updateStaffData,
} from "@/services/api";

import { getUserFromToken } from "@/utils/token";

import {
    Country,
    State,
    City,
} from "country-state-city";

import {
    RiArrowDownSLine,
    RiEyeLine,
    RiEyeOffLine,
} from "react-icons/ri";

import Link from "next/link";
import {
    parsePhoneNumberFromString,
} from "libphonenumber-js";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useSearchParams,
} from "next/navigation";

import { toast } from "react-toastify";

const initialFormData = {
    organization_name: "",
    role_id: "",
    profile_id: "",
    name: "",
    email: "",
    phone: "",
    phone_country: "",
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

const isEqual = (a, b) => {
    try {
        return JSON.stringify(a) === JSON.stringify(b);
    } catch {
        return false;
    }
};

const getArrayFromResponse = (
    response,
    key
) => {
    if (Array.isArray(response)) {
        return response;
    }

    const values = [
        response?.data,
        response?.data?.data,
        response?.data?.[key],
        response?.[key],
        response?.data?.result,
        response?.result,
    ];

    return (
        values.find(Array.isArray) || []
    );
};

const getProfilesFromResponse = (
    response
) =>
    getArrayFromResponse(
        response,
        "profiles"
    );

const getUsersFromResponse = (
    response
) =>
    getArrayFromResponse(
        response,
        "users"
    );

const getSingleUserFromResponse = (
    response
) => {
    const values = [
        response?.data?.data,
        response?.data?.user,
        response?.data,
        response?.user,
        response,
    ];

    return (
        values.find(
            (item) =>
                item &&
                typeof item === "object" &&
                !Array.isArray(item) &&
                (
                    item.id ||
                    item.user_id ||
                    item.name ||
                    item.email
                )
        ) || null
    );
};

export default function Page() {
    const searchParams =
        useSearchParams();

    const editId =
        searchParams.get("id");

    const isEditMode =
        Boolean(editId);

    const selectedRoleFromUrl =
        Number(
            searchParams.get("role_id")
        );

    const loggedInUser =
        getUserFromToken();

    const loggedInRoleId =
        Number(
            loggedInUser?.role_id
        );

    const loggedInUserId =
        Number(
            loggedInUser?.id
        );

    const [formData, setFormData] =
        useState(initialFormData);

    const [
        originalFormData,
        setOriginalFormData,
    ] = useState(null);

    const [
        profiles,
        setProfiles,
    ] = useState([]);

    const [
        profileLoading,
        setProfileLoading,
    ] = useState(false);

    const [
        countries,
        setCountries,
    ] = useState([]);

    const [
        states,
        setStates,
    ] = useState([]);

    const [
        cities,
        setCities,
    ] = useState([]);

    const [
        countryLoading,
        setCountryLoading,
    ] = useState(false);

    const [
        stateLoading,
        setStateLoading,
    ] = useState(false);

    const [
        cityLoading,
        setCityLoading,
    ] = useState(false);

    const [
        parentUsers,
        setParentUsers,
    ] = useState({});

    const [
        selectedParents,
        setSelectedParents,
    ] = useState({});

    const [
        originalSelectedParents,
        setOriginalSelectedParents,
    ] = useState({});

    const [
        openDropdown,
        setOpenDropdown,
    ] = useState(null);

    const [
        parentSearch,
        setParentSearch,
    ] = useState({});

    const [
        searchLoading,
        setSearchLoading,
    ] = useState({});

    const [
        phoneCountryOpen,
        setPhoneCountryOpen,
    ] = useState(false);

    const [
        phoneCountrySearch,
        setPhoneCountrySearch,
    ] = useState("");

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        showConfirmPassword,
        setShowConfirmPassword,
    ] = useState(false);

    const [
        editLoading,
        setEditLoading,
    ] = useState(false);

    const [
        editUserLoaded,
        setEditUserLoaded,
    ] = useState(false);

    const [
        submitLoading,
        setSubmitLoading,
    ] = useState(false);

    // 🔑 FIX: prevent hydration mismatch
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const selectedRole =
        Number(formData.role_id) ||
        selectedRoleFromUrl;

    const getRoleName = (roleId) =>
        roleNames[
            Number(roleId)
        ] || "User";

    const selectedCountry =
        useMemo(() => {
            return countries.find(
                (country) =>
                    country.isoCode ===
                    formData.phone_country
            );
        }, [
            countries,
            formData.phone_country,
        ]);

    const selectedPhoneCountry =
        selectedCountry;

    const countryPhoneCode =
        selectedPhoneCountry?.phonecode
            ? `+${String(
                  selectedPhoneCountry.phonecode
              ).replace("+", "")}`
            : "";

    const visibleParentRoles =
        useMemo(() => {
            return (
                parentRoles[
                    selectedRole
                ] || []
            ).filter((roleId) => {
                const role =
                    Number(roleId);

                if (
                    role >=
                    Number(selectedRole)
                ) {
                    return false;
                }

                if (
                    loggedInRoleId === 0
                ) {
                    return true;
                }

                return (
                    role >
                        loggedInRoleId &&
                    role <
                        Number(selectedRole)
                );
            });
        }, [
            selectedRole,
            loggedInRoleId,
        ]);

    const hasChanges =
        useMemo(() => {
            if (
                !isEditMode ||
                !originalFormData
            ) {
                return true;
            }

            const currentForm = {
                ...formData,
                password:
                    formData.password ||
                    "",
                confirm_password:
                    formData.confirm_password ||
                    "",
            };

            const originalForm = {
                ...originalFormData,
                password: "",
                confirm_password: "",
            };

            return (
                !isEqual(
                    currentForm,
                    originalForm
                ) ||
                !isEqual(
                    selectedParents,
                    originalSelectedParents
                ) ||
                Boolean(
                    formData.password
                ) ||
                Boolean(
                    formData.confirm_password
                )
            );
        }, [
            isEditMode,
            formData,
            originalFormData,
            selectedParents,
            originalSelectedParents,
        ]);

    const loadProfiles = async () => {
        try {
            setProfileLoading(true);

            const response =
                await getProfiles();

            setProfiles(
                getProfilesFromResponse(
                    response
                )
            );
        } catch (error) {
            console.error(
                "GET PROFILES ERROR:",
                error
            );

            setProfiles([]);

            toast.error(
                error?.response?.data
                    ?.message ||
                    error?.message ||
                    "Failed to load profiles"
            );
        } finally {
            setProfileLoading(false);
        }
    };

    const loadCountries = async () => {
        try {
            setCountryLoading(true);

            const data =
                Country.getAllCountries();

            setCountries(
                Array.isArray(data)
                    ? data
                    : []
            );

            return data;
        } catch (error) {
            console.error(
                "GET COUNTRIES ERROR:",
                error
            );

            setCountries([]);

            toast.error(
                "Failed to load countries"
            );

            return [];
        } finally {
            setCountryLoading(false);
        }
    };

    const loadStates = async (
        countryCode
    ) => {
        if (!countryCode) {
            setStates([]);
            return [];
        }

        try {
            setStateLoading(true);

            const data =
                State.getStatesOfCountry(
                    countryCode
                );

            setStates(
                Array.isArray(data)
                    ? data
                    : []
            );

            return data;
        } catch (error) {
            console.error(
                "GET STATES ERROR:",
                error
            );

            setStates([]);

            return [];
        } finally {
            setStateLoading(false);
        }
    };

    const loadCities = async (
        countryCode,
        stateCode
    ) => {
        if (
            !countryCode ||
            !stateCode
        ) {
            setCities([]);
            return [];
        }

        try {
            setCityLoading(true);

            const data =
                City.getCitiesOfState(
                    countryCode,
                    stateCode
                );

            setCities(
                Array.isArray(data)
                    ? data
                    : []
            );

            return data;
        } catch (error) {
            console.error(
                "GET CITIES ERROR:",
                error
            );

            setCities([]);

            return [];
        } finally {
            setCityLoading(false);
        }
    };

    useEffect(() => {
        loadProfiles();
        loadCountries();
    }, []);

    useEffect(() => {
        if (
            !selectedRoleFromUrl ||
            isEditMode
        ) {
            return;
        }

        setFormData((prev) => ({
            ...prev,
            role_id:
                selectedRoleFromUrl,
            parent_id: null,
        }));

        setSelectedParents({});
        setParentUsers({});
        setParentSearch({});
        setOpenDropdown(null);
    }, [
        selectedRoleFromUrl,
        isEditMode,
    ]);

    const getParentValue = (
        user,
        roleId
    ) => {
        const roleFields = {
            1: [
                "parent_admin_id",
                "admin_id",
            ],
            2: [
                "parent_cnf_id",
                "cnf_id",
            ],
            3: [
                "parent_super_distributor_id",
                "parent_superdistributor_id",
                "super_distributor_id",
            ],
            4: [
                "parent_distributor_id",
                "distributor_id",
            ],
            5: [
                "parent_fos_id",
                "fos_id",
            ],
            6: [
                "parent_retailer_id",
                "retailer_id",
            ],
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

        const fields =
            roleFields[
                Number(roleId)
            ] || [];

        for (
            const field of fields
        ) {
            const value =
                user?.[field];

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

    const getParentChainFromUser = (
        user
    ) => {
        const result = {};

        const possibleChain =
            user?.parent_chain ??
            user?.parentChain ??
            user?.hierarchy ??
            user?.parents ??
            user?.parent_users ??
            user?.parentUsers;

        if (
            Array.isArray(
                possibleChain
            )
        ) {
            possibleChain.forEach(
                (item) => {
                    const roleId =
                        Number(
                            item?.role_id ??
                                item?.roleId ??
                                item?.current_role_id
                        );

                    const id =
                        Number(
                            item?.id ??
                                item?.user_id ??
                                item?.parent_id
                        );

                    if (
                        roleId > 0 &&
                        id > 0
                    ) {
                        result[
                            roleId
                        ] = id;
                    }
                }
            );
        }

        if (
            possibleChain &&
            typeof possibleChain ===
                "object" &&
            !Array.isArray(
                possibleChain
            )
        ) {
            Object.entries(
                possibleChain
            ).forEach(
                ([key, value]) => {
                    const roleId =
                        Number(key);

                    const id =
                        Number(
                            value?.id ??
                                value?.user_id ??
                                value?.parent_id ??
                                value
                        );

                    if (
                        roleId > 0 &&
                        id > 0
                    ) {
                        result[
                            roleId
                        ] = id;
                    }
                }
            );
        }

        Object.keys(
            roleNames
        ).forEach((roleId) => {
            const role =
                Number(roleId);

            if (!result[role]) {
                const value =
                    getParentValue(
                        user,
                        role
                    );

                if (value) {
                    result[role] =
                        value;
                }
            }
        });

        return result;
    };

    const loadEditUser = async () => {
        if (
            !isEditMode ||
            !editId
        ) {
            return;
        }

        try {
            setEditLoading(true);
            setEditUserLoaded(false);

            const response =
                await getStaffDataById(
                    editId
                );

            const user =
                getSingleUserFromResponse(
                    response
                );

            if (!user) {
                toast.error(
                    "User data not found"
                );
                return;
            }

            const roleId =
                Number(
                    user?.role_id ??
                        searchParams.get(
                            "role_id"
                        )
                );

            const countryName =
                String(
                    user?.country ||
                        ""
                ).trim();

            const stateName =
                String(
                    user?.state ||
                        ""
                ).trim();

            const cityName =
                String(
                    user?.city ||
                        ""
                ).trim();

            let phone =
                String(
                    user?.phone || ""
                ).trim();

            let phoneCountry =
                String(
                    user?.phone_country ||
                        user?.phoneCountry ||
                        ""
                )
                    .trim()
                    .toUpperCase();

            const parsedPhone =
                parsePhoneNumberFromString(
                    phone
                );

            if (parsedPhone) {
                phoneCountry =
                    parsedPhone.country ||
                    phoneCountry;

                phone =
                    parsedPhone.nationalNumber ||
                    "";
            }

            let selectedCountryData =
                countries.find(
                    (country) =>
                        String(
                            country.name
                        )
                            .trim()
                            .toLowerCase() ===
                        countryName
                            .toLowerCase()
                );

            if (
                !selectedCountryData &&
                phoneCountry
            ) {
                selectedCountryData =
                    countries.find(
                        (country) =>
                            country.isoCode ===
                            phoneCountry
                    );
            }

            let loadedStates = [];
            let loadedCities = [];

            if (
                selectedCountryData?.isoCode
            ) {
                loadedStates =
                    await loadStates(
                        selectedCountryData.isoCode
                    );
            } else {
                setStates([]);
            }

            const selectedStateData =
                loadedStates.find(
                    (state) =>
                        String(
                            state.name
                        )
                            .trim()
                            .toLowerCase() ===
                        stateName
                            .toLowerCase()
                );

            if (
                selectedCountryData?.isoCode &&
                selectedStateData?.isoCode
            ) {
                loadedCities =
                    await loadCities(
                        selectedCountryData.isoCode,
                        selectedStateData.isoCode
                    );
            } else {
                setCities([]);
            }

            const selectedCityData =
                loadedCities.find(
                    (city) =>
                        String(
                            city.name
                        )
                            .trim()
                            .toLowerCase() ===
                        cityName
                            .toLowerCase()
                );

            const editFormData = {
                ...initialFormData,
                organization_name:
                    user?.organization_name ||
                    "",
                role_id:
                    roleId || "",
                profile_id:
                    user?.profile_id ??
                    user?.profileId ??
                    user?.role_permission
                        ?.profile_id ??
                    "",
                name:
                    user?.name || "",
                email:
                    user?.email || "",
                phone,
                phone_country:
                    phoneCountry ||
                    selectedCountryData
                        ?.isoCode ||
                    "",
                company_address:
                    user?.company_address ||
                    "",
                country:
                    selectedCountryData
                        ?.name ||
                    countryName ||
                    "",
                state:
                    selectedStateData
                        ?.name ||
                    stateName ||
                    "",
                city:
                    selectedCityData
                        ?.name ||
                    cityName ||
                    "",
                parent_id:
                    user?.parent_id
                        ? Number(
                              user.parent_id
                          )
                        : null,
                new_device:
                    Number(
                        user?.new_device
                    ) === 1
                        ? 1
                        : 0,
                old_device:
                    Number(
                        user?.old_device
                    ) === 1
                        ? 1
                        : 0,
                supreme_device:
                    Number(
                        user?.supreme_device
                    ) === 1
                        ? 1
                        : 0,
                pro_star:
                    Number(
                        user?.pro_star
                    ) === 1
                        ? 1
                        : 0,
                lite:
                    Number(
                        user?.lite
                    ) === 1
                        ? 1
                        : 0,
                google_tv:
                    Number(
                        user?.google_tv
                    ) === 1
                        ? 1
                        : 0,
                supreme_lock:
                    Number(
                        user?.supreme_lock
                    ) === 1
                        ? 1
                        : 0,
            };

            setFormData(
                editFormData
            );

            const parentChain =
                getParentChainFromUser(
                    user
                );

            if (user?.parent_id) {
                const lastParentRole =
                    (
                        parentRoles[
                            roleId
                        ] || []
                    ).slice(-1)[0];

                if (lastParentRole) {
                    parentChain[
                        Number(
                            lastParentRole
                        )
                    ] = Number(
                        user.parent_id
                    );
                }
            }

            setSelectedParents(
                parentChain
            );

            setOriginalFormData(
                editFormData
            );

            setOriginalSelectedParents(
                parentChain
            );

            setEditUserLoaded(true);
        } catch (error) {
            console.error(
                "GET STAFF DATA ERROR:",
                error
            );

            toast.error(
                error?.response?.data
                    ?.message ||
                    error?.message ||
                    "Failed to load user data"
            );
        } finally {
            setEditLoading(false);
        }
    };

    useEffect(() => {
        if (
            countries.length > 0 &&
            isEditMode
        ) {
            loadEditUser();
        }
    }, [
        countries.length,
        editId,
        isEditMode,
    ]);

    useEffect(() => {
        if (
            !selectedRole ||
            selectedRole <= 1 ||
            !loggedInUserId
        ) {
            return;
        }

        if (
            isEditMode &&
            !editUserLoaded
        ) {
            return;
        }

        const parents =
            visibleParentRoles;

        if (!parents.length) {
            setParentUsers({});
            return;
        }

        let cancelled = false;

        const loadParents =
            async () => {
                try {
                    const updatedUsers =
                        {};

                    const updatedSelected =
                        {
                            ...selectedParents,
                        };

                    for (
                        let index = 0;
                        index <
                        parents.length;
                        index++
                    ) {
                        if (cancelled) {
                            return;
                        }

                        const currentRole =
                            Number(
                                parents[
                                    index
                                ]
                            );

                        let parentId =
                            null;

                        if (
                            index === 0
                        ) {
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
                                    parents[
                                        index -
                                            1
                                    ]
                                );

                            parentId =
                                updatedSelected[
                                    previousRole
                                ]
                                    ? Number(
                                          updatedSelected[
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

                        if (
                            currentRole === 5
                        ) {
                            users =
                                users.filter(
                                    (
                                        user
                                    ) =>
                                        Number(
                                            user?.role_id
                                        ) ===
                                            5 &&
                                        (
                                            parentId ===
                                                null ||
                                            Number(
                                                user?.parent_id
                                            ) ===
                                                Number(
                                                    parentId
                                                )
                                        )
                                );
                        }

                        const selectedId =
                            updatedSelected[
                                currentRole
                            ];

                        if (
                            selectedId &&
                            !users.some(
                                (
                                    user
                                ) =>
                                    Number(
                                        user?.id
                                    ) ===
                                    Number(
                                        selectedId
                                    )
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
                                    (
                                        user
                                    ) =>
                                        Number(
                                            user?.id
                                        ) ===
                                        Number(
                                            selectedId
                                        )
                                );

                            if (
                                selectedUser
                            ) {
                                users = [
                                    ...users,
                                    selectedUser,
                                ];
                            }
                        }

                        updatedUsers[
                            currentRole
                        ] = users;
                    }

                    if (cancelled) {
                        return;
                    }

                    setParentUsers(
                        updatedUsers
                    );

                    setSelectedParents(
                        updatedSelected
                    );

                    const lastRole =
                        parents[
                            parents.length -
                                1
                        ];

                    const lastParentId =
                        updatedSelected[
                            Number(
                                lastRole
                            )
                        ];

                    if (lastParentId) {
                        setFormData(
                            (prev) => ({
                                ...prev,
                                parent_id:
                                    Number(
                                        lastParentId
                                    ),
                            })
                        );
                    }
                } catch (error) {
                    if (!cancelled) {
                        console.error(
                            "LOAD PARENTS ERROR:",
                            error
                        );
                    }
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
        isEditMode,
        editUserLoaded,
    ]);

    const loadNextParentUsers =
        async (
            selectedParentId,
            nextRoleId
        ) => {
            if (
                !selectedParentId ||
                !nextRoleId
            ) {
                return;
            }

            const nextRole =
                Number(nextRoleId);

            try {
                setSearchLoading(
                    (prev) => ({
                        ...prev,
                        [nextRole]: true,
                    })
                );

                const response =
                    await getDropdownUsers(
                        nextRole,
                        Number(
                            selectedParentId
                        )
                    );

                let users =
                    getUsersFromResponse(
                        response
                    );

                if (nextRole === 5) {
                    users =
                        users.filter(
                            (user) =>
                                Number(
                                    user?.role_id
                                ) === 5 &&
                                Number(
                                    user?.parent_id
                                ) ===
                                    Number(
                                        selectedParentId
                                    )
                        );
                }

                setParentUsers(
                    (prev) => ({
                        ...prev,
                        [nextRole]:
                            users,
                    })
                );
            } catch (error) {
                console.error(
                    `LOAD ${getRoleName(
                        nextRole
                    )} ERROR:`,
                    error
                );

                setParentUsers(
                    (prev) => ({
                        ...prev,
                        [nextRole]: [],
                    })
                );
            } finally {
                setSearchLoading(
                    (prev) => ({
                        ...prev,
                        [nextRole]:
                            false,
                    })
                );
            }
        };

    const handleParentChange =
        async (
            parentRoleId,
            parentId
        ) => {
            const roleId =
                Number(parentRoleId);

            const selectedId =
                parentId
                    ? Number(parentId)
                    : null;

            const parents =
                visibleParentRoles;

            const currentIndex =
                parents.indexOf(
                    roleId
                );

            const updatedSelected = {
                ...selectedParents,
            };

            if (selectedId) {
                updatedSelected[
                    roleId
                ] = selectedId;
            } else {
                delete updatedSelected[
                    roleId
                ];
            }

            parents
                .slice(
                    currentIndex + 1
                )
                .forEach(
                    (childRoleId) => {
                        delete updatedSelected[
                            Number(
                                childRoleId
                            )
                        ];
                    }
                );

            setSelectedParents(
                updatedSelected
            );

            setFormData(
                (prev) => ({
                    ...prev,
                    parent_id:
                        selectedId,
                })
            );

            const updatedUsers = {
                ...parentUsers,
            };

            parents
                .slice(
                    currentIndex + 1
                )
                .forEach(
                    (childRoleId) => {
                        updatedUsers[
                            Number(
                                childRoleId
                            )
                        ] = [];
                    }
                );

            setParentUsers(
                updatedUsers
            );

            const updatedSearch = {
                ...parentSearch,
            };

            parents
                .slice(
                    currentIndex + 1
                )
                .forEach(
                    (childRoleId) => {
                        updatedSearch[
                            Number(
                                childRoleId
                            )
                        ] = "";
                    }
                );

            setParentSearch(
                updatedSearch
            );

            if (!selectedId) {
                return;
            }

            const nextRole =
                parents[
                    currentIndex + 1
                ];

            if (nextRole) {
                await loadNextParentUsers(
                    selectedId,
                    Number(nextRole)
                );
            }
        };

    useEffect(() => {
        if (
            openDropdown === null ||
            openDropdown ===
                undefined
        ) {
            return;
        }

        const roleId =
            Number(openDropdown);

        const search = (
            parentSearch[roleId] ||
            ""
        ).trim();

        const parents =
            parentRoles[
                selectedRole
            ] || [];

        const currentIndex =
            parents.indexOf(
                roleId
            );

        let parentId = null;

        if (
            currentIndex > 0
        ) {
            const previousRole =
                Number(
                    parents[
                        currentIndex -
                            1
                    ]
                );

            parentId =
                selectedParents[
                    previousRole
                ]
                    ? Number(
                          selectedParents[
                              previousRole
                          ]
                      )
                    : null;
        }

        if (
            currentIndex === 0 &&
            roleId ===
                Number(
                    loggedInRoleId
                )
        ) {
            parentId =
                loggedInUserId;
        }

        const timer =
            setTimeout(
                async () => {
                    try {
                        setSearchLoading(
                            (prev) => ({
                                ...prev,
                                [roleId]:
                                    true,
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

                        if (
                            roleId ===
                            5
                        ) {
                            users =
                                users.filter(
                                    (
                                        user
                                    ) =>
                                        Number(
                                            user?.role_id
                                        ) ===
                                            5 &&
                                        (
                                            parentId ===
                                                null ||
                                            Number(
                                                user?.parent_id
                                            ) ===
                                                Number(
                                                    parentId
                                                )
                                        )
                                );
                        }

                        setParentUsers(
                            (
                                prev
                            ) => ({
                                ...prev,
                                [roleId]:
                                    users,
                            })
                        );
                    } catch (error) {
                        console.error(
                            "DROPDOWN SEARCH ERROR:",
                            error
                        );

                        setParentUsers(
                            (
                                prev
                            ) => ({
                                ...prev,
                                [roleId]:
                                    [],
                            })
                        );
                    } finally {
                        setSearchLoading(
                            (
                                prev
                            ) => ({
                                ...prev,
                                [roleId]:
                                    false,
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

    const handleCountryChange =
        async (
            countryCode
        ) => {
            const selected =
                countries.find(
                    (country) =>
                        country.isoCode ===
                        countryCode
                );

            const countryName =
                selected?.name || "";

            setFormData(
                (prev) => ({
                    ...prev,
                    country:
                        countryName,
                    state: "",
                    city: "",
                    phone_country:
                        selected?.isoCode ||
                        prev.phone_country,
                    phone: "",
                })
            );

            setStates([]);
            setCities([]);

            if (
                selected?.isoCode
            ) {
                await loadStates(
                    selected.isoCode
                );
            }
        };

    const handleStateChange =
        async (
            stateCode
        ) => {
            const selectedState =
                states.find(
                    (state) =>
                        state.isoCode ===
                        stateCode
                );

            setFormData(
                (prev) => ({
                    ...prev,
                    state:
                        selectedState?.name ||
                        "",
                    city: "",
                })
            );

            setCities([]);

            const selectedCountry =
                countries.find(
                    (country) =>
                        country.name ===
                        formData.country
                );

            if (
                selectedCountry?.isoCode &&
                selectedState?.isoCode
            ) {
                await loadCities(
                    selectedCountry.isoCode,
                    selectedState.isoCode
                );
            }
        };

    const handleCityChange =
        (cityName) => {
            setFormData(
                (prev) => ({
                    ...prev,
                    city: cityName,
                })
            );
        };

    const handlePhoneCountryChange =
        (countryCode) => {
            const selected =
                countries.find(
                    (country) =>
                        country.isoCode ===
                        countryCode
                );

            setFormData(
                (prev) => ({
                    ...prev,
                    phone_country:
                        countryCode,
                    country:
                        selected?.name ||
                        prev.country,
                    state: "",
                    city: "",
                    phone: "",
                })
            );

            setStates([]);
            setCities([]);

            setPhoneCountrySearch("");
            setPhoneCountryOpen(
                false
            );

            if (
                selected?.isoCode
            ) {
                loadStates(
                    selected.isoCode
                );
            }
        };

    const handleChange = (e) => {
        const {
            name,
            value,
        } = e.target;

        if (
            name === "country"
        ) {
            handleCountryChange(
                value
            );
            return;
        }

        if (name === "state") {
            handleStateChange(
                value
            );
            return;
        }

        if (name === "city") {
            handleCityChange(
                value
            );
            return;
        }

        setFormData(
            (prev) => ({
                ...prev,
                [name]: value,
            })
        );
    };

    const handlePhoneChange =
        (e) => {
            let value =
                e.target.value;

            value =
                value.replace(
                    /[^\d+]/g,
                    ""
                );

            if (
                value.startsWith(
                    "+"
                )
            ) {
                value =
                    "+" +
                    value
                        .slice(1)
                        .replace(
                            /\+/g,
                            ""
                        );

                const parsed =
                    parsePhoneNumberFromString(
                        value
                    );

                if (
                    parsed?.country
                ) {
                    const selected =
                        countries.find(
                            (
                                country
                            ) =>
                                country.isoCode ===
                                parsed.country
                        );

                    setFormData(
                        (prev) => ({
                            ...prev,
                            phone_country:
                                parsed.country,
                            country:
                                selected?.name ||
                                prev.country,
                            phone:
                                parsed.nationalNumber ||
                                "",
                        })
                    );

                    if (
                        selected?.isoCode
                    ) {
                        loadStates(
                            selected.isoCode
                        );
                    }

                    return;
                }
            }

            setFormData(
                (prev) => ({
                    ...prev,
                    phone:
                        value.replace(
                            /\D/g,
                            ""
                        ),
                })
            );
        };

    const handleSubmit =
        async (e) => {
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

            if (
                roleId === 9 &&
                !formData.profile_id
            ) {
                toast.error(
                    "Please select a profile"
                );
                return;
            }

            if (
                !loggedInUser?.id
            ) {
                toast.error(
                    "Logged-in user not found"
                );
                return;
            }

            if (
                !formData.country
            ) {
                toast.error(
                    "Please select a country"
                );
                return;
            }

            if (!formData.phone) {
                toast.error(
                    "Phone number is required"
                );
                return;
            }

            if (
                !formData.phone_country
            ) {
                toast.error(
                    "Please select phone country"
                );
                return;
            }

            const phoneNumber =
                parsePhoneNumberFromString(
                    formData.phone,
                    formData.phone_country
                );

            if (
                !phoneNumber ||
                !phoneNumber.isValid()
            ) {
                toast.error(
                    `Please enter a valid ${
                        selectedPhoneCountry?.name ||
                        ""
                    } phone number`
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
                (
                    formData.password ||
                    formData.confirm_password
                ) &&
                formData.password !==
                    formData.confirm_password
            ) {
                toast.error(
                    "Password and Confirm Password do not match!"
                );
                return;
            }

            if (
                formData.password &&
                !/^[A-Z]/.test(
                    formData.password
                )
            ) {
                toast.error(
                    "Password must start with a capital letter"
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
                loggedInRoleId <
                    roleId
            ) {
                finalParentId =
                    loggedInUserId;
            }

            const payload = {
                ...formData,
                role_id: roleId,
                parent_id:
                    finalParentId,
                country:
                    String(
                        formData.country ||
                            ""
                    ).trim(),
                country_code:
                    String(
                        formData.phone_country ||
                            ""
                    )
                        .trim()
                        .toUpperCase(),
                state:
                    formData.state
                        ? String(
                              formData.state
                          ).trim()
                        : null,
                city:
                    formData.city
                        ? String(
                              formData.city
                          ).trim()
                        : null,
                phone:
                    phoneNumber.number,
            };

            delete payload.phone_country;

            if (roleId === 9) {
                payload.profile_id =
                    Number(
                        formData.profile_id
                    );

                delete payload.organization_name;
            } else {
                delete payload.profile_id;
            }

            if (isEditMode) {
                delete payload.confirm_password;

                if (!payload.password) {
                    delete payload.password;
                }
            }

            try {
                setSubmitLoading(
                    true
                );

                const response =
                    isEditMode
                        ? await updateStaffData(
                              editId,
                              payload
                          )
                        : await addStaff(
                              payload
                          );

                toast.success(
                    response?.message ||
                        (isEditMode
                            ? "Updated Successfully"
                            : "Registered Successfully")
                );

                if (!isEditMode) {
                    setFormData({
                        ...initialFormData,
                        role_id:
                            roleId,
                    });

                    setSelectedParents(
                        {}
                    );
                    setParentUsers({});
                    setParentSearch({});
                    setOpenDropdown(
                        null
                    );
                    setStates([]);
                    setCities([]);
                    setPhoneCountryOpen(
                        false
                    );
                    setPhoneCountrySearch(
                        ""
                    );
                    setShowPassword(
                        false
                    );
                    setShowConfirmPassword(
                        false
                    );
                } else {
                    const updatedOriginal =
                        {
                            ...formData,
                            password: "",
                            confirm_password:
                                "",
                        };

                    setOriginalFormData(
                        updatedOriginal
                    );

                    setOriginalSelectedParents(
                        {
                            ...selectedParents,
                        }
                    );

                    setFormData(
                        (prev) => ({
                            ...prev,
                            password:
                                "",
                            confirm_password:
                                "",
                        })
                    );
                }
            } catch (error) {
                console.error(
                    isEditMode
                        ? "UPDATE USER ERROR:"
                        : "REGISTER ERROR:",
                    error
                );

                toast.error(
                    error?.response
                        ?.data?.message ||
                        error?.response
                            ?.data?.error ||
                        error?.message ||
                        (isEditMode
                            ? "Failed to update user"
                            : "Something went wrong")
                );
            } finally {
                setSubmitLoading(
                    false
                );
            }
        };

    if (
        isEditMode &&
        editLoading
    ) {
        return (
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-10">
                    <div className="flex justify-center py-10">
                        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>

                    <p className="text-center text-slate-500">
                        Loading user data...
                    </p>
                </div>
            </div>
        );
    }

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

                {/* 🔑 Hydration-safe parent dropdowns */}
                {isMounted &&
                    selectedRole > 1 &&
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
                                                    className="w-full flex items-center justify-between border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-left bg-white text-slate-700"
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
                    onSubmit={
                        handleSubmit
                    }
                    className="pt-6"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Number(
                            formData.role_id
                        ) !== 9 && (
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
                        )}

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

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                Phone Number{" "}
                                <span className="text-red-500">
                                    *
                                </span>
                            </label>

                            <div className="flex">
                                <div className="relative shrink-0">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPhoneCountryOpen(
                                                (
                                                    prev
                                                ) =>
                                                    !prev
                                            )
                                        }
                                        className="h-full min-w-[125px] flex items-center justify-between gap-2 border border-r-0 border-slate-300 rounded-l-lg px-3 bg-slate-50 text-sm text-slate-700"
                                    >
                                        {selectedPhoneCountry ? (
                                            <span className="flex items-center gap-2">
                                                <span>
                                                    +
                                                    {
                                                        selectedPhoneCountry.phonecode
                                                    }
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-slate-400">
                                                Country
                                            </span>
                                        )}

                                        <RiArrowDownSLine
                                            size={
                                                18
                                            }
                                            className={`transition-transform ${
                                                phoneCountryOpen
                                                    ? "rotate-180"
                                                    : ""
                                            }`}
                                        />
                                    </button>

                                    {phoneCountryOpen && (
                                        <div className="absolute z-[100] left-0 top-full mt-1 w-[290px] bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
                                            <div className="p-2 border-b border-slate-200">
                                                <input
                                                    type="text"
                                                    value={
                                                        phoneCountrySearch
                                                    }
                                                    onChange={(
                                                        e
                                                    ) =>
                                                        setPhoneCountrySearch(
                                                            e
                                                                .target
                                                                .value
                                                        )
                                                    }
                                                    placeholder="Search country or code..."
                                                    autoFocus
                                                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>

                                            <div className="max-h-64 overflow-y-auto">
                                                {countries
                                                    .filter(
                                                        (
                                                            country
                                                        ) => {
                                                            const search =
                                                                phoneCountrySearch
                                                                    .trim()
                                                                    .toLowerCase()
                                                                    .replace(
                                                                        "+",
                                                                        ""
                                                                    );

                                                            if (
                                                                !search
                                                            ) {
                                                                return true;
                                                            }

                                                            return (
                                                                country.name
                                                                    ?.toLowerCase()
                                                                    .includes(
                                                                        search
                                                                    ) ||
                                                                country.isoCode
                                                                    ?.toLowerCase()
                                                                    .includes(
                                                                        search
                                                                    ) ||
                                                                String(
                                                                    country.phonecode ||
                                                                        ""
                                                                ).includes(
                                                                    search
                                                                )
                                                            );
                                                        }
                                                    )
                                                    .map(
                                                        (
                                                            country
                                                        ) => (
                                                            <button
                                                                key={
                                                                    country.isoCode
                                                                }
                                                                type="button"
                                                                onClick={() =>
                                                                    handlePhoneCountryChange(
                                                                        country.isoCode
                                                                    )
                                                                }
                                                                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm ${
                                                                    formData.phone_country ===
                                                                    country.isoCode
                                                                        ? "bg-blue-50 text-blue-700"
                                                                        : "text-slate-700 hover:bg-slate-50"
                                                                }`}
                                                            >
                                                                <span className="flex items-center gap-2 min-w-0">
                                                                    <span className="truncate">
                                                                        {
                                                                            country.name
                                                                        }
                                                                    </span>
                                                                </span>

                                                                <span className="shrink-0 font-medium text-slate-500">
                                                                    +
                                                                    {
                                                                        country.phonecode
                                                                    }
                                                                </span>
                                                            </button>
                                                        )
                                                    )}

                                                {countries.filter(
                                                    (
                                                        country
                                                    ) => {
                                                        const search =
                                                            phoneCountrySearch
                                                                .trim()
                                                                .toLowerCase()
                                                                .replace(
                                                                    "+",
                                                                    ""
                                                                );

                                                        if (
                                                            !search
                                                        ) {
                                                            return true;
                                                        }

                                                        return (
                                                            country.name
                                                                ?.toLowerCase()
                                                                .includes(
                                                                    search
                                                                ) ||
                                                            country.isoCode
                                                                ?.toLowerCase()
                                                                .includes(
                                                                    search
                                                                ) ||
                                                            String(
                                                                country.phonecode ||
                                                                    ""
                                                            ).includes(
                                                                search
                                                            )
                                                        );
                                                    }
                                                ).length ===
                                                    0 && (
                                                    <div className="px-4 py-5 text-center text-sm text-slate-400">
                                                        No country found
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="tel"
                                    value={
                                        formData.phone
                                    }
                                    onChange={
                                        handlePhoneChange
                                    }
                                    required
                                    placeholder={
                                        selectedPhoneCountry
                                            ? `Enter ${selectedPhoneCountry.name} number`
                                            : "Enter phone number"
                                    }
                                    className="w-full border border-slate-300 rounded-r-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {formData.phone && (
                                <p className="text-xs text-slate-500">
                                    {
                                        countryPhoneCode
                                    }{" "}
                                    {
                                        formData.phone
                                    }
                                </p>
                            )}
                        </div>

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
                                            (
                                                prev
                                            ) =>
                                                !prev
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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
                                            (
                                                prev
                                            ) =>
                                                !prev
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
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
                                        countries.find(
                                            (
                                                country
                                            ) =>
                                                country.name ===
                                                formData.country
                                        )
                                            ?.isoCode ||
                                        ""
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    required
                                    disabled={
                                        countryLoading
                                    }
                                    className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50"
                                >
                                    <option value="">
                                        {countryLoading
                                            ? "Loading countries..."
                                            : "Select Country"}
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
                                                {country.phonecode
                                                    ? ` (+${country.phonecode})`
                                                    : ""}
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

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-slate-700">
                                State
                            </label>

                            <div className="relative">
                                <select
                                    name="state"
                                    value={
                                        states.find(
                                            (
                                                state
                                            ) =>
                                                state.name ===
                                                formData.state
                                        )
                                            ?.isoCode ||
                                        ""
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        !formData.country ||
                                        stateLoading
                                    }
                                    className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50"
                                >
                                    <option value="">
                                        {stateLoading
                                            ? "Loading states..."
                                            : "Select State"}
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
                                    onChange={
                                        handleChange
                                    }
                                    disabled={
                                        !formData.state ||
                                        cityLoading
                                    }
                                    className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50"
                                >
                                    <option value="">
                                        {cityLoading
                                            ? "Loading cities..."
                                            : "Select City"}
                                    </option>

                                    {cities.map(
                                        (
                                            city
                                        ) => (
                                            <option
                                                key={
                                                    `${city.name}-${city.stateCode}`
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

                        {Number(
                            formData.role_id
                        ) === 9 && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">
                                    Assigned Role{" "}
                                    <span className="text-red-500">
                                        *
                                    </span>
                                </label>

                                <div className="relative">
                                    <select
                                        name="profile_id"
                                        value={
                                            formData.profile_id
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        required
                                        disabled={
                                            profileLoading
                                        }
                                        className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white cursor-pointer disabled:bg-slate-50"
                                    >
                                        <option value="">
                                            {profileLoading
                                                ? "Loading profiles..."
                                                : "Select Role"}
                                        </option>

                                        {profiles.map(
                                            (
                                                profile
                                            ) => (
                                                <option
                                                    key={
                                                        profile.id
                                                    }
                                                    value={
                                                        profile.id
                                                    }
                                                >
                                                    {
                                                        profile.name
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
                        )}

                        {Number(
                            formData.role_id
                        ) === 6 && (
                            <div className="md:col-span-3 space-y-4">
                                <h3 className="text-lg font-semibold text-slate-700">
                                    Device Permissions
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {devicePermissions.map(
                                        (
                                            item
                                        ) => (
                                            <label
                                                key={
                                                    item.name
                                                }
                                                className={`flex items-center justify-between px-4 py-3 rounded-lg border cursor-pointer ${
                                                    formData[
                                                        item.name
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
                                                            item.name
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

                    <div className="mt-8 flex justify-end">
                        <button
                            type="submit"
                            disabled={
                                submitLoading ||
                                (
                                    isEditMode &&
                                    !hasChanges
                                )
                            }
                            className="bg-blue-500 text-white font-medium px-8 py-3 rounded-lg shadow-md hover:bg-blue-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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