"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  RiShieldUserLine,
  RiEyeLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckboxCircleLine,
  RiArrowDownSLine,
  RiSaveLine,
} from "react-icons/ri";

import {
  getProfiles,
  getRoles,
  getRolePermissions,
  saveRolePermissions,
} from "@/services/api";

const permissionTypes = [
  {
    key: "view",
    label: "View",
    icon: RiEyeLine,
  },
  {
    key: "add",
    label: "Add",
    icon: RiAddLine,
  },
  {
    key: "edit",
    label: "Edit",
    icon: RiEditLine,
  },
  {
    key: "delete",
    label: "Delete",
    icon: RiDeleteBinLine,
  },
  {
    key: "manage",
    label: "Manage",
    icon: RiShieldUserLine,
  },
];

export default function RolePermissionForm() {
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);

  const [selectedProfile, setSelectedProfile] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] =
    useState(false);

  const [loadingProfiles, setLoadingProfiles] =
    useState(true);

  const [loadingRoles, setLoadingRoles] =
    useState(true);

  const [loadingPermissions, setLoadingPermissions] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [permissions, setPermissions] = useState({});

  /* =====================================================
     GET PROFILES
  ===================================================== */

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);

      const response = await getProfiles();

      const activeProfiles = Array.isArray(
        response?.data
      )
        ? response.data.filter(
            (profile) =>
              Number(profile?.status) === 1
          )
        : [];

      setProfiles(activeProfiles);

      if (activeProfiles.length > 0) {
        setSelectedProfile((current) => {
          const exists = activeProfiles.some(
            (profile) =>
              String(profile.id) ===
              String(current)
          );

          return exists
            ? current
            : String(activeProfiles[0].id);
        });
      } else {
        setSelectedProfile("");
        setPermissions({});
      }
    } catch (error) {
      console.error(
        "GET PROFILES ERROR:",
        error
      );

      setProfiles([]);
      setSelectedProfile("");
      setPermissions({});

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to get profiles"
      );
    } finally {
      setLoadingProfiles(false);
    }
  };

  /* =====================================================
     GET ROLES
  ===================================================== */

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const response = await getRoles();

      const activeRoles = Array.isArray(
        response?.data
      )
        ? response.data.filter(
            (role) =>
              Number(role?.status) === 1
          )
        : [];

      setRoles(activeRoles);
    } catch (error) {
      console.error(
        "GET ROLES ERROR:",
        error
      );

      setRoles([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to get roles"
      );
    } finally {
      setLoadingRoles(false);
    }
  };

  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {
    loadProfiles();
    loadRoles();
  }, []);

  /* =====================================================
     SELECTED PROFILE DATA
  ===================================================== */

  const selectedProfileData = profiles.find(
    (profile) =>
      String(profile.id) ===
      String(selectedProfile)
  );

  /* =====================================================
     ROLE SLUG
  ===================================================== */

  const getRoleSlug = (role) => {
    return String(
      role?.slug ||
        role?.role_slug ||
        role?.name ||
        ""
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  /* =====================================================
     PERMISSION STATE KEY
  ===================================================== */

  const getPermissionKey = (
    profileId,
    roleId,
    permission
  ) => {
    return `${profileId}_${roleId}_${permission}`;
  };

  /* =====================================================
     CHECK PERMISSION
  ===================================================== */

  const isChecked = (
    roleId,
    permission
  ) => {
    if (!selectedProfile) {
      return false;
    }

    const key = getPermissionKey(
      selectedProfile,
      roleId,
      permission
    );

    return Boolean(permissions[key]);
  };

  /* =====================================================
     GET SAVED ROLE PERMISSIONS
  ===================================================== */

  const loadRolePermissions = async (
    profileId
  ) => {
    if (!profileId) {
      setPermissions({});
      return;
    }

    if (roles.length === 0) {
      setPermissions({});
      return;
    }

    try {
      setLoadingPermissions(true);

      // Clear old profile permissions first
      setPermissions({});

      const response =
        await getRolePermissions(profileId);

      console.log(
        "GET ROLE PERMISSIONS RESPONSE:",
        response
      );

      const savedPermissions =
        response?.data?.permission || {};

      const formattedPermissions = {};

      /*
        Convert DB JSON:

        {
          "admin.view": 1,
          "admin.add": 1,
          "admin.manage": 1,
          "cnf.view": 1
        }

        into frontend checkbox state:

        {
          "1_1_view": true,
          "1_1_add": true,
          "1_1_manage": true,
          "1_2_view": true
        }
      */

      roles.forEach((role) => {
        const roleSlug = getRoleSlug(role);

        permissionTypes.forEach(
          (permissionType) => {
            const permissionName =
              `${roleSlug}.${permissionType.key}`;

            const stateKey =
              getPermissionKey(
                profileId,
                role.id,
                permissionType.key
              );

            formattedPermissions[stateKey] =
              Number(
                savedPermissions[
                  permissionName
                ]
              ) === 1;
          }
        );
      });

      console.log(
        "FORMATTED PERMISSIONS:",
        formattedPermissions
      );

      setPermissions(
        formattedPermissions
      );
    } catch (error) {
      console.error(
        "GET ROLE PERMISSIONS ERROR:",
        error
      );

      setPermissions({});

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to get permissions"
      );
    } finally {
      setLoadingPermissions(false);
    }
  };

  /* =====================================================
     LOAD PERMISSIONS WHEN PROFILE / ROLES READY
  ===================================================== */

  useEffect(() => {
    if (
      selectedProfile &&
      roles.length > 0
    ) {
      loadRolePermissions(
        selectedProfile
      );
    }
  }, [selectedProfile, roles]);

  /* =====================================================
     PROFILE CHANGE
  ===================================================== */

  const handleProfileChange = (profileId) => {
    const newProfileId =
      String(profileId);

    setSelectedProfile(newProfileId);
    setProfileDropdownOpen(false);

    // Immediately clear old profile permissions
    setPermissions({});
  };

  /* =====================================================
     CHANGE SINGLE PERMISSION
  ===================================================== */

  const handlePermissionChange = (
    roleId,
    permission
  ) => {
    if (!selectedProfile) {
      toast.error(
        "Please select a profile"
      );
      return;
    }

    const key = getPermissionKey(
      selectedProfile,
      roleId,
      permission
    );

    setPermissions((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  /* =====================================================
     ROLE SELECT ALL
  ===================================================== */

  const handleRoleToggle = (roleId) => {
    if (!selectedProfile) {
      toast.error(
        "Please select a profile"
      );
      return;
    }

    const allSelected =
      permissionTypes.every(
        (permission) =>
          isChecked(
            roleId,
            permission.key
          )
      );

    setPermissions((previous) => {
      const updated = {
        ...previous,
      };

      permissionTypes.forEach(
        (permission) => {
          const key =
            getPermissionKey(
              selectedProfile,
              roleId,
              permission.key
            );

          updated[key] = !allSelected;
        }
      );

      return updated;
    });
  };

  /* =====================================================
     SELECT ALL
  ===================================================== */

  const handleSelectAll = () => {
    if (!selectedProfile) {
      toast.error(
        "Please select a profile"
      );
      return;
    }

    setPermissions((previous) => {
      const updated = {
        ...previous,
      };

      roles.forEach((role) => {
        permissionTypes.forEach(
          (permission) => {
            const key =
              getPermissionKey(
                selectedProfile,
                role.id,
                permission.key
              );

            updated[key] = true;
          }
        );
      });

      return updated;
    });
  };

  /* =====================================================
     CLEAR ALL
  ===================================================== */

  const handleClearAll = () => {
    if (!selectedProfile) {
      toast.error(
        "Please select a profile"
      );
      return;
    }

    setPermissions((previous) => {
      const updated = {
        ...previous,
      };

      roles.forEach((role) => {
        permissionTypes.forEach(
          (permission) => {
            const key =
              getPermissionKey(
                selectedProfile,
                role.id,
                permission.key
              );

            updated[key] = false;
          }
        );
      });

      return updated;
    });
  };

  /* =====================================================
     BUILD ACTIVE PERMISSIONS
  ===================================================== */

  const getAllPermissions = () => {
    const permission = {};

    roles.forEach((role) => {
      const roleSlug =
        getRoleSlug(role);

      permissionTypes.forEach(
        (permissionType) => {
          const key =
            getPermissionKey(
              selectedProfile,
              role.id,
              permissionType.key
            );

          if (permissions[key]) {
            permission[
              `${roleSlug}.${permissionType.key}`
            ] = 1;
          }
        }
      );
    });

    return permission;
  };

  /* =====================================================
     SAVE PERMISSIONS
  ===================================================== */

  const handleSavePermissions =
    async () => {
      if (!selectedProfile) {
        toast.error(
          "Please select a profile"
        );
        return;
      }

      if (roles.length === 0) {
        toast.error(
          "No roles available"
        );
        return;
      }

      try {
        setSaving(true);

        const permission =
          getAllPermissions();

        const payload = {
          profile_id:
            Number(selectedProfile),
          permission,
        };

        console.log(
          "SAVE ROLE PERMISSION PAYLOAD:",
          payload
        );

        const response =
          await saveRolePermissions(
            payload
          );

        if (!response?.success) {
          throw new Error(
            response?.message ||
              "Failed to save permissions"
          );
        }

        toast.success(
          "Permissions saved successfully"
        );

        // Reload saved permissions
        await loadRolePermissions(
          selectedProfile
        );
      } catch (error) {
        console.error(
          "SAVE ROLE PERMISSIONS ERROR:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to save permissions"
        );
      } finally {
        setSaving(false);
      }
    };

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

        {/* HEADER */}

        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <RiShieldUserLine
                size={24}
              />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-slate-800">
                Role & Permission
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Manage permissions according to role
              </p>
            </div>

          </div>
        </div>

        <div className="p-6">

          {/* PROFILE */}

          <div className="mb-6 w-full max-w-sm">

            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Role
            </label>

            <div className="relative">

              <button
                type="button"
                disabled={
                  loadingProfiles ||
                  loadingPermissions
                }
                onClick={() =>
                  setProfileDropdownOpen(
                    (previous) =>
                      !previous
                  )
                }
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm outline-none transition hover:border-blue-300 focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
              >

                <span
                  className={
                    selectedProfileData
                      ? "font-medium text-slate-700"
                      : "text-slate-400"
                  }
                >
                  {loadingProfiles
                    ? "Loading profiles..."
                    : selectedProfileData?.name ||
                      "Select Profile"}
                </span>

                <RiArrowDownSLine
                  size={20}
                  className={`text-slate-400 transition-transform ${
                    profileDropdownOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />

              </button>

              {profileDropdownOpen &&
                !loadingProfiles && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">

                    {profiles.length ===
                    0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        No active profiles found
                      </div>
                    ) : (
                      profiles.map(
                        (profile) => {
                          const isActive =
                            String(
                              profile.id
                            ) ===
                            String(
                              selectedProfile
                            );

                          return (
                            <button
                              key={
                                profile.id
                              }
                              type="button"
                              onClick={() =>
                                handleProfileChange(
                                  profile.id
                                )
                              }
                              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${
                                isActive
                                  ? "bg-blue-50 font-semibold text-blue-600"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >

                              <span>
                                {
                                  profile.name
                                }
                              </span>

                              {isActive && (
                                <RiCheckboxCircleLine
                                  size={
                                    18
                                  }
                                  className="text-blue-600"
                                />
                              )}

                            </button>
                          );
                        }
                      )
                    )}

                  </div>
                )}

            </div>
          </div>

          {/* PERMISSIONS */}

          {selectedProfile ? (
            <>

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {
                      selectedProfileData?.name
                    }{" "}
                    Permissions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Configure role permissions for this role
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <button
                    type="button"
                    onClick={
                      handleClearAll
                    }
                    disabled={
                      loadingRoles ||
                      loadingPermissions ||
                      saving
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSelectAll
                    }
                    disabled={
                      loadingRoles ||
                      loadingPermissions ||
                      saving
                    }
                    className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={
                      handleSavePermissions
                    }
                    disabled={
                      loadingRoles ||
                      loadingPermissions ||
                      saving
                    }
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >

                    <RiSaveLine
                      size={18}
                    />

                    {saving
                      ? "Saving..."
                      : "Save Permissions"}

                  </button>

                </div>
              </div>

              {/* LOADING PERMISSIONS */}

              {loadingPermissions ? (
                <div className="rounded-xl border border-slate-200 p-12 text-center">

                  <div className="text-sm text-slate-500">
                    Loading saved permissions...
                  </div>

                </div>
              ) : (
                /* TABLE */
                <div className="overflow-x-auto rounded-xl border border-slate-200">

                  <div className="min-w-[900px]">

                    {/* TABLE HEADER */}

                    <div className="grid grid-cols-[minmax(240px,1fr)_repeat(5,110px)] items-center border-b border-slate-200 bg-slate-50 px-4 py-3">

                      <div className="text-sm font-semibold text-slate-600">
                        Role
                      </div>

                      {permissionTypes.map(
                        (permission) => {
                          const Icon =
                            permission.icon;

                          return (
                            <div
                              key={
                                permission.key
                              }
                              className="flex w-[110px] items-center justify-center gap-1 text-xs font-semibold uppercase text-slate-500"
                            >

                              <Icon
                                size={15}
                              />

                              {
                                permission.label
                              }

                            </div>
                          );
                        }
                      )}

                    </div>

                    {/* ROLES */}

                    {loadingRoles ? (
                      <div className="px-6 py-12 text-center text-sm text-slate-500">
                        Loading roles...
                      </div>
                    ) : roles.length ===
                      0 ? (
                      <div className="px-6 py-12 text-center text-sm text-slate-500">
                        No active roles found
                      </div>
                    ) : (
                      roles.map(
                        (role, index) => {

                          const allChecked =
                            permissionTypes.every(
                              (
                                permission
                              ) =>
                                isChecked(
                                  role.id,
                                  permission.key
                                )
                            );

                          return (
                            <div
                              key={
                                role.id
                              }
                              className={`grid grid-cols-[minmax(240px,1fr)_repeat(5,110px)] items-center px-4 py-3 ${
                                index !==
                                roles.length -
                                  1
                                  ? "border-b border-slate-200"
                                  : ""
                              }`}
                            >

                              {/* ROLE */}

                              <div className="flex items-center justify-between pr-4">

                                <div>
                                  <span className="text-sm font-semibold text-slate-700">
                                    {
                                      role.name
                                    }
                                  </span>

                                  {(role.slug ||
                                    role.role_slug) && (
                                    <span className="ml-2 text-xs text-slate-400">
                                      {role.slug ||
                                        role.role_slug}
                                    </span>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRoleToggle(
                                      role.id
                                    )
                                  }
                                  disabled={
                                    saving ||
                                    loadingPermissions
                                  }
                                  className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                                    allChecked
                                      ? "bg-blue-50 text-blue-600"
                                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                  }`}
                                >
                                  {allChecked
                                    ? "All"
                                    : "Select All"}
                                </button>

                              </div>

                              {/* CHECKBOXES */}

                              {permissionTypes.map(
                                (
                                  permission
                                ) => {
                                  const checked =
                                    isChecked(
                                      role.id,
                                      permission.key
                                    );

                                  return (
                                    <label
                                      key={
                                        permission.key
                                      }
                                      className="flex h-8 w-[110px] cursor-pointer items-center justify-center"
                                    >

                                      <input
                                        type="checkbox"
                                        checked={
                                          checked
                                        }
                                        onChange={() =>
                                          handlePermissionChange(
                                            role.id,
                                            permission.key
                                          )
                                        }
                                        disabled={
                                          saving ||
                                          loadingPermissions
                                        }
                                        className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                                      />

                                    </label>
                                  );
                                }
                              )}

                            </div>
                          );
                        }
                      )
                    )}

                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
              {loadingProfiles
                ? "Loading profiles..."
                : "Please select a profile to manage permissions."}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}