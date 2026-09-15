"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  RiShieldUserLine,
  RiEyeLine,
  RiAddLine,
  RiEditLine,
  RiCheckboxCircleLine,
  RiArrowDownSLine,
  RiSaveLine,
  RiCloseLine,
  RiUserSettingsLine,
  RiLayoutGridLine,
} from "react-icons/ri";

import {
  getProfiles,
  getRoles,
  getModules,
  createProfile,
  updateProfile,
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
    key: "status",
    label: "Status",
    icon: RiCheckboxCircleLine,
  },
  {
    key: "manage",
    label: "Manage",
    icon: RiShieldUserLine,
  },
];

export default function RolePermissionForm() {
  /* -------------------------------------------------------------------------- */
  /* STATE                                                                      */
  /* -------------------------------------------------------------------------- */

  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] =
    useState(false);

  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);

  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingModules, setLoadingModules] = useState(true);
  const [loadingPermissions, setLoadingPermissions] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState({});

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [manageRoleOpen, setManageRoleOpen] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const [editingProfileId, setEditingProfileId] =
    useState(null);
  const [editingProfileName, setEditingProfileName] =
    useState("");
  const [editingProfileSaving, setEditingProfileSaving] =
    useState(false);

  /* -------------------------------------------------------------------------- */
  /* PROFILE                                                                     */
  /* -------------------------------------------------------------------------- */

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);

      const response = await getProfiles();

      const profileData = Array.isArray(response?.data)
        ? response.data
        : [];

      setProfiles(profileData);

      const activeProfiles = profileData.filter(
        (profile) => Number(profile?.status) === 1
      );

      if (activeProfiles.length > 0) {
        setSelectedProfile((current) => {
          const exists = activeProfiles.some(
            (profile) =>
              String(profile.id) === String(current)
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

  /* -------------------------------------------------------------------------- */
  /* ROLES                                                                       */
  /* -------------------------------------------------------------------------- */

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const response = await getRoles();

      const roleData = Array.isArray(response?.data)
        ? response.data
        : [];

      const activeRoles = roleData.filter((role) => {
        const isActive = Number(role?.status) === 1;

        const roleName = String(
          role?.name ||
            role?.slug ||
            role?.role_slug ||
            ""
        )
          .trim()
          .toLowerCase()
          .replace(/[\s_-]+/g, "");

        const isStaff = roleName === "staff";

        return isActive && !isStaff;
      });

      setRoles(activeRoles);
    } catch (error) {
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

  /* -------------------------------------------------------------------------- */
  /* MODULES                                                                     */
  /* -------------------------------------------------------------------------- */

  const loadModules = async () => {
    try {
      setLoadingModules(true);

      const response = await getModules();

      const moduleData = Array.isArray(response?.data)
        ? response.data
        : [];

      const activeModules = moduleData
        .filter(
          (module) => Number(module?.status) === 1
        )
        .sort(
          (a, b) =>
            Number(a?.sequence || 0) -
            Number(b?.sequence || 0)
        );

      setModules(activeModules);
    } catch (error) {
      setModules([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to get modules"
      );
    } finally {
      setLoadingModules(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* INITIAL LOAD                                                                */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    loadProfiles();
    loadRoles();
    loadModules();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* HELPERS                                                                     */
  /* -------------------------------------------------------------------------- */

  const selectedProfileData = profiles.find(
    (profile) =>
      String(profile.id) === String(selectedProfile)
  );

  const normalizeSlug = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[\s_-]+/g, "-");

  const getRoleSlug = (role) =>
    normalizeSlug(
      role?.slug ||
        role?.role_slug ||
        role?.name
    );

  const getModuleSlug = (module) =>
    normalizeSlug(
      module?.slug ||
        module?.name
    );

  const getPermissionKey = (
    type,
    itemId,
    permission
  ) =>
    `${type}_${itemId}_${permission}`;

  /* -------------------------------------------------------------------------- */
  /* CHECK PERMISSION                                                            */
  /* -------------------------------------------------------------------------- */

  const isChecked = (
    type,
    itemId,
    permission
  ) => {
    if (!selectedProfile) {
      return false;
    }

    const key = getPermissionKey(
      type,
      itemId,
      permission
    );

    return Boolean(permissions[key]);
  };

  /* -------------------------------------------------------------------------- */
  /* LOAD SAVED PERMISSIONS                                                     */
  /* -------------------------------------------------------------------------- */

  const loadRolePermissions = async (profileId) => {
    if (
      !profileId ||
      (roles.length === 0 &&
        modules.length === 0)
    ) {
      setPermissions({});
      return;
    }

    try {
      setLoadingPermissions(true);
      setPermissions({});

      const response =
        await getRolePermissions(profileId);

      const savedPermissions =
        response?.data?.permission || {};

      const formattedPermissions = {};

      /* ------------------------------- ROLES ------------------------------- */

      roles.forEach((role) => {
        const roleSlug = getRoleSlug(role);

        permissionTypes.forEach(
          (permissionType) => {
            const permissionName =
              `${roleSlug}.${permissionType.key}`;

            const stateKey =
              getPermissionKey(
                "role",
                role.id,
                permissionType.key
              );

            formattedPermissions[stateKey] =
              Number(
                savedPermissions[permissionName]
              ) === 1;
          }
        );
      });

      /* ------------------------------ MODULES ------------------------------ */

      modules.forEach((module) => {
        const moduleSlug =
          getModuleSlug(module);

        permissionTypes.forEach(
          (permissionType) => {
            const permissionName =
              `${moduleSlug}.${permissionType.key}`;

            const stateKey =
              getPermissionKey(
                "module",
                module.id,
                permissionType.key
              );

            formattedPermissions[stateKey] =
              Number(
                savedPermissions[permissionName]
              ) === 1;
          }
        );
      });

      setPermissions(formattedPermissions);
    } catch (error) {
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

  useEffect(() => {
    if (
      selectedProfile &&
      (roles.length > 0 ||
        modules.length > 0)
    ) {
      loadRolePermissions(selectedProfile);
    }
  }, [
    selectedProfile,
    roles,
    modules,
  ]);

  /* -------------------------------------------------------------------------- */
  /* PROFILE CHANGE                                                              */
  /* -------------------------------------------------------------------------- */

  const handleProfileChange = (profileId) => {
    setSelectedProfile(String(profileId));
    setProfileDropdownOpen(false);
    setPermissions({});
  };

  /* -------------------------------------------------------------------------- */
  /* SINGLE PERMISSION CHANGE                                                    */
  /* -------------------------------------------------------------------------- */

  const handlePermissionChange = (
    type,
    itemId,
    permission
  ) => {
    if (!selectedProfile) {
      toast.error("Please select a profile");
      return;
    }

    const key = getPermissionKey(
      type,
      itemId,
      permission
    );

    setPermissions((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  /* -------------------------------------------------------------------------- */
  /* TOGGLE COMPLETE ROLE/MODULE                                                 */
  /* -------------------------------------------------------------------------- */

  const handleItemToggle = (
    type,
    itemId
  ) => {
    if (!selectedProfile) {
      toast.error("Please select a profile");
      return;
    }

    const allSelected =
      permissionTypes.every((permission) =>
        isChecked(
          type,
          itemId,
          permission.key
        )
      );

    setPermissions((previous) => {
      const updated = {
        ...previous,
      };

      permissionTypes.forEach(
        (permission) => {
          const key = getPermissionKey(
            type,
            itemId,
            permission.key
          );

          updated[key] = !allSelected;
        }
      );

      return updated;
    });
  };

  /* -------------------------------------------------------------------------- */
  /* SELECT ALL                                                                  */
  /* -------------------------------------------------------------------------- */

  const handleSelectAll = () => {
    if (!selectedProfile) {
      toast.error("Please select a profile");
      return;
    }

    setPermissions((previous) => {
      const updated = {
        ...previous,
      };

      roles.forEach((role) => {
        permissionTypes.forEach(
          (permission) => {
            const key = getPermissionKey(
              "role",
              role.id,
              permission.key
            );

            updated[key] = true;
          }
        );
      });

      modules.forEach((module) => {
        permissionTypes.forEach(
          (permission) => {
            const key = getPermissionKey(
              "module",
              module.id,
              permission.key
            );

            updated[key] = true;
          }
        );
      });

      return updated;
    });
  };

  /* -------------------------------------------------------------------------- */
  /* CLEAR ALL                                                                   */
  /* -------------------------------------------------------------------------- */

  const handleClearAll = () => {
    if (!selectedProfile) {
      toast.error("Please select a profile");
      return;
    }

    setPermissions((previous) => {
      const updated = {
        ...previous,
      };

      roles.forEach((role) => {
        permissionTypes.forEach(
          (permission) => {
            const key = getPermissionKey(
              "role",
              role.id,
              permission.key
            );

            updated[key] = false;
          }
        );
      });

      modules.forEach((module) => {
        permissionTypes.forEach(
          (permission) => {
            const key = getPermissionKey(
              "module",
              module.id,
              permission.key
            );

            updated[key] = false;
          }
        );
      });

      return updated;
    });
  };

  /* -------------------------------------------------------------------------- */
  /* GET ALL PERMISSIONS                                                         */
  /* -------------------------------------------------------------------------- */

  const getAllPermissions = () => {
    const permission = {};

    /* -------------------------------- ROLES -------------------------------- */

    roles.forEach((role) => {
      const roleSlug = getRoleSlug(role);

      permissionTypes.forEach(
        (permissionType) => {
          const key = getPermissionKey(
            "role",
            role.id,
            permissionType.key
          );

          if (permissions[key]) {
            permission[
              `${roleSlug}.${permissionType.key}`
            ] = 1;
          } else {
            permission[
              `${roleSlug}.${permissionType.key}`
            ] = 0;
          }
        }
      );
    });

    /* ------------------------------- MODULES ------------------------------- */

    modules.forEach((module) => {
      const moduleSlug =
        getModuleSlug(module);

      permissionTypes.forEach(
        (permissionType) => {
          const key = getPermissionKey(
            "module",
            module.id,
            permissionType.key
          );

          if (permissions[key]) {
            permission[
              `${moduleSlug}.${permissionType.key}`
            ] = 1;
          } else {
            permission[
              `${moduleSlug}.${permissionType.key}`
            ] = 0;
          }
        }
      );
    });

    return permission;
  };

  /* -------------------------------------------------------------------------- */
  /* SAVE PERMISSIONS                                                            */
  /* -------------------------------------------------------------------------- */

  const handleSavePermissions = async () => {
    if (!selectedProfile) {
      toast.error("Please select a profile");
      return;
    }

    if (
      roles.length === 0 &&
      modules.length === 0
    ) {
      toast.error(
        "No roles or modules available"
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        profile_id: Number(selectedProfile),
        permission: getAllPermissions(),
      };

      const response =
        await saveRolePermissions(payload);

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to save permissions"
        );
      }

      toast.success(
        response?.message ||
          "Permissions saved successfully"
      );

      await loadRolePermissions(
        selectedProfile
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save permissions"
      );
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ADD ROLE                                                                    */
  /* -------------------------------------------------------------------------- */

  const openAddRole = () => {
    setRoleName("");
    setRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    if (roleSubmitting) {
      return;
    }

    setRoleModalOpen(false);
    setRoleName("");
  };

  const handleRoleSubmit = async (event) => {
    event.preventDefault();

    const name = roleName.trim();

    if (!name) {
      toast.error("Role name is required");
      return;
    }

    try {
      setRoleSubmitting(true);

      const response = await createProfile({
        name,
        status: 1,
      });

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to create role"
        );
      }

      toast.success(
        response?.message ||
          "Role created successfully"
      );

      closeRoleModal();

      await loadProfiles();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create role"
      );
    } finally {
      setRoleSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* EDIT ROLE                                                                   */
  /* -------------------------------------------------------------------------- */

  const openEditRole = (profile) => {
    setEditingProfileId(profile.id);
    setEditingProfileName(
      profile.name || ""
    );
  };

  const cancelEditRole = () => {
    setEditingProfileId(null);
    setEditingProfileName("");
  };

  const handleInlineEditRole = async (
    profile
  ) => {
    const name =
      editingProfileName.trim();

    if (!name) {
      toast.error("Role name is required");
      return;
    }

    try {
      setEditingProfileSaving(true);

      const response = await updateProfile(
        profile.id,
        {
          name,
          status: Number(profile.status),
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update role"
        );
      }

      toast.success(
        response?.message ||
          "Role updated successfully"
      );

      cancelEditRole();

      await loadProfiles();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update role"
      );
    } finally {
      setEditingProfileSaving(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* TOGGLE PROFILE STATUS                                                       */
  /* -------------------------------------------------------------------------- */

  const handleToggleProfileStatus = async (
    profile
  ) => {
    const newStatus =
      Number(profile.status) === 1
        ? 0
        : 1;

    try {
      const response = await updateProfile(
        profile.id,
        {
          name: profile.name,
          status: newStatus,
        }
      );

      if (!response?.success) {
        throw new Error(
          response?.message ||
            "Failed to update profile status"
        );
      }

      toast.success(
        newStatus === 1
          ? "Profile activated successfully"
          : "Profile deactivated successfully"
      );

      if (
        editingProfileId === profile.id
      ) {
        cancelEditRole();
      }

      await loadProfiles();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile status"
      );
    }
  };

  /* -------------------------------------------------------------------------- */
  /* PERMISSION TABLE                                                            */
  /* -------------------------------------------------------------------------- */

  const renderPermissionTable = (
    type,
    items,
    emptyMessage
  ) => {
    if (items.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <div className="min-w-[900px]">
          {/* TABLE HEADER */}
          <div className="grid grid-cols-[minmax(240px,1fr)_repeat(5,110px)] items-center border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-sm font-semibold text-slate-600">
              {type === "role"
                ? "Role"
                : "Module"}
            </div>

            {permissionTypes.map(
              (permission) => {
                const Icon =
                  permission.icon;

                return (
                  <div
                    key={permission.key}
                    className="flex w-[110px] items-center justify-center gap-1 text-xs font-semibold uppercase text-slate-500"
                  >
                    <Icon size={15} />
                    {permission.label}
                  </div>
                );
              }
            )}
          </div>

          {/* TABLE BODY */}
          {items.map((item, index) => {
            const allChecked =
              permissionTypes.every(
                (permission) =>
                  isChecked(
                    type,
                    item.id,
                    permission.key
                  )
              );

            return (
              <div
                key={item.id}
                className={`grid grid-cols-[minmax(240px,1fr)_repeat(5,110px)] items-center px-4 py-3 ${
                  index !== items.length - 1
                    ? "border-b border-slate-200"
                    : ""
                }`}
              >
                {/* NAME */}
                <div className="flex items-center justify-between pr-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {type === "role" ? (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <RiShieldUserLine
                          size={18}
                        />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        <RiLayoutGridLine
                          size={18}
                        />
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-700">
                        {item.name}
                      </div>

                      {type === "module" &&
                        item.slug && (
                          <div className="truncate text-xs text-slate-400">
                            {item.slug}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* SELECT ALL */}
                  <button
                    type="button"
                    onClick={() =>
                      handleItemToggle(
                        type,
                        item.id
                      )
                    }
                    disabled={
                      saving ||
                      loadingPermissions
                    }
                    className={`ml-3 shrink-0 rounded-md px-2 py-1 text-xs font-medium transition ${
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

                {/* PERMISSIONS */}
                {permissionTypes.map(
                  (permission) => {
                    const checked =
                      isChecked(
                        type,
                        item.id,
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
                          checked={checked}
                          onChange={() =>
                            handlePermissionChange(
                              type,
                              item.id,
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
          })}
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------------------- */
  /* UI                                                                          */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
        {/* HEADER */}
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <RiShieldUserLine size={24} />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-slate-800">
                  Role & Permission
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Manage roles, modules and
                  permissions
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={openAddRole}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <RiAddLine size={18} />
                Add Role
              </button>

              <button
                type="button"
                onClick={() =>
                  setManageRoleOpen(true)
                }
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                <RiUserSettingsLine
                  size={18}
                />
                Manage Role
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          {/* PROFILE DROPDOWN */}
          <div className="mb-6 w-full max-w-sm">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Profile
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
                    {profiles.filter(
                      (profile) =>
                        Number(
                          profile.status
                        ) === 1
                    ).length === 0 ? (
                      <div className="px-4 py-3 text-sm text-slate-500">
                        No active profiles
                        found
                      </div>
                    ) : (
                      profiles
                        .filter(
                          (profile) =>
                            Number(
                              profile.status
                            ) === 1
                        )
                        .map((profile) => {
                          const isSelected =
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
                                isSelected
                                  ? "bg-blue-50 font-semibold text-blue-600"
                                  : "text-slate-600 hover:bg-slate-50"
                              }`}
                            >
                              <span>
                                {
                                  profile.name
                                }
                              </span>

                              {isSelected && (
                                <RiCheckboxCircleLine
                                  size={18}
                                  className="text-blue-600"
                                />
                              )}
                            </button>
                          );
                        })
                    )}
                  </div>
                )}
            </div>
          </div>

          {/* PERMISSIONS */}
          {selectedProfile ? (
            <>
              {/* TITLE + ACTIONS */}
              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {
                      selectedProfileData?.name
                    }{" "}
                    Permissions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Configure role and module
                    permissions for this
                    profile
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleClearAll}
                    disabled={
                      loadingRoles ||
                      loadingModules ||
                      loadingPermissions ||
                      saving
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Clear All
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectAll}
                    disabled={
                      loadingRoles ||
                      loadingModules ||
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
                      loadingModules ||
                      loadingPermissions ||
                      saving
                    }
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RiSaveLine size={18} />

                    {saving
                      ? "Saving..."
                      : "Save Permissions"}
                  </button>
                </div>
              </div>

              {loadingPermissions ? (
                <div className="rounded-xl border border-slate-200 p-12 text-center">
                  <div className="text-sm text-slate-500">
                    Loading saved
                    permissions...
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* ROLE PERMISSIONS */}
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                        <RiShieldUserLine
                          size={17}
                        />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-slate-800">
                          Role Permissions
                        </h3>

                        <p className="text-xs text-slate-500">
                          Manage permissions
                          for each role
                        </p>
                      </div>
                    </div>

                    {loadingRoles ? (
                      <div className="rounded-xl border border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                        Loading roles...
                      </div>
                    ) : (
                      renderPermissionTable(
                        "role",
                        roles,
                        "No active roles found"
                      )
                    )}
                  </section>

                  {/* MODULE PERMISSIONS */}
                  <section>
                    

                    {loadingModules ? (
                      <div className="rounded-xl border border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                        Loading modules...
                      </div>
                    ) : (
                      renderPermissionTable(
                        "module",
                        modules,
                        "No active modules found"
                      )
                    )}
                  </section>
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

      {/* -------------------------------------------------------------------- */}
      {/* ADD ROLE MODAL                                                        */}
      {/* -------------------------------------------------------------------- */}

      {roleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Add Role
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Create a new role
                </p>
              </div>

              <button
                type="button"
                onClick={closeRoleModal}
                disabled={roleSubmitting}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            <form
              onSubmit={handleRoleSubmit}
              className="space-y-5 p-6"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role Name
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <input
                  type="text"
                  name="name"
                  value={roleName}
                  onChange={(event) =>
                    setRoleName(
                      event.target.value
                    )
                  }
                  placeholder="Enter role name"
                  disabled={roleSubmitting}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRoleModal}
                  disabled={roleSubmitting}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={roleSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RiSaveLine size={17} />

                  {roleSubmitting
                    ? "Saving..."
                    : "Add Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MANAGE ROLE MODAL                                                    */}
      {/* -------------------------------------------------------------------- */}

      {manageRoleOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Manage Roles
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Manage role status and details
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  cancelEditRole();
                  setManageRoleOpen(false);
                }}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-6">
              {loadingProfiles ? (
                <div className="py-10 text-center text-sm text-slate-500">
                  Loading profiles...
                </div>
              ) : profiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
                  No profiles found
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="grid grid-cols-[80px_1fr_180px_120px] border-b border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="text-xs font-semibold uppercase text-slate-500">
                      ID
                    </div>

                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Role Name
                    </div>

                    <div className="text-xs font-semibold uppercase text-slate-500">
                      Status
                    </div>

                    <div className="text-center text-xs font-semibold uppercase text-slate-500">
                      Action
                    </div>
                  </div>

                  {profiles.map(
                    (profile, index) => {
                      const isActive =
                        Number(
                          profile.status
                        ) === 1;

                      const isEditing =
                        editingProfileId ===
                        profile.id;

                      return (
                        <div
                          key={profile.id}
                          className={`grid grid-cols-[80px_1fr_180px_120px] items-center px-4 py-3 ${
                            index !==
                            profiles.length - 1
                              ? "border-b border-slate-200"
                              : ""
                          }`}
                        >
                          <div className="text-sm font-medium text-slate-600">
                            {profile.id}
                          </div>

                          <div className="pr-4">
                            {isEditing ? (
                              <input
                                type="text"
                                value={
                                  editingProfileName
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditingProfileName(
                                    event.target
                                      .value
                                  )
                                }
                                autoFocus
                                disabled={
                                  editingProfileSaving
                                }
                                className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            ) : (
                              <div className="text-sm font-semibold text-slate-700">
                                {
                                  profile.name
                                }
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleProfileStatus(
                                  profile
                                )
                              }
                              disabled={
                                editingProfileSaving
                              }
                              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                isActive
                                  ? "bg-green-500"
                                  : "bg-slate-300"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                  isActive
                                    ? "translate-x-6"
                                    : "translate-x-1"
                                }`}
                              />
                            </button>

                            <span
                              className={`text-sm font-medium ${
                                isActive
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {isActive
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <div className="flex items-center justify-center gap-2">
                            {isActive &&
                              isEditing && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleInlineEditRole(
                                        profile
                                      )
                                    }
                                    disabled={
                                      editingProfileSaving
                                    }
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    {editingProfileSaving
                                      ? "Saving..."
                                      : "Save"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={
                                      cancelEditRole
                                    }
                                    disabled={
                                      editingProfileSaving
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}

                            {isActive &&
                              !isEditing && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditRole(
                                      profile
                                    )
                                  }
                                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                                  title="Edit"
                                >
                                  <RiEditLine
                                    size={18}
                                  />
                                </button>
                              )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  cancelEditRole();
                  setManageRoleOpen(false);
                }}
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}