
"use client";

import { useEffect, useMemo, useState } from "react";
import * as RiIcons from "react-icons/ri";
import { toast } from "react-toastify";

import {
  getProfiles,
  getModules,
  getSubModules,
  createProfile,
  updateProfile,
  getRolePermissions,
  saveRolePermissions,
} from "@/services/api";

const allowedRolesByRole = {
  0: [1],
  1: [2, 3, 4, 5, 6, 7, 8, 9],
  2: [3, 4, 5, 6, 7, 9],
  3: [4, 5, 6, 7, 9],
  4: [5, 6, 7, 9],
  5: [6, 7, 9],
  6: [7, 8],
  7: [8],
  8: [9],
  9: [],
};

const normalizePermissions = (permission) => {
  if (!permission) {
    return {};
  }

  let parsed = permission;

  if (typeof permission === "string") {
    try {
      parsed = JSON.parse(permission);
    } catch {
      return {};
    }
  }

  if (
    !parsed ||
    typeof parsed !== "object" ||
    Array.isArray(parsed)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(parsed)
      .filter(([, value]) => Number(value) === 1)
      .map(([key]) => [key, 1])
  );
};

const getPermissionKey = (moduleId, subModuleId) =>
  `${moduleId}.${subModuleId}`;

const getIcon = (iconName) => {
  if (!iconName) {
    return null;
  }

  return RiIcons[String(iconName).trim()] || null;
};

const isActive = (item) =>
  Number(item?.status ?? 1) === 1;

const getRoleName = (profile) =>
  profile?.name ||
  profile?.role_name ||
  profile?.title ||
  profile?.slug ||
  `Role ${profile?.id}`;

const getStoredUser = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  } catch {
    return null;
  }
};

export default function RolePermissionForm() {
  const [profiles, setProfiles] = useState([]);
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);

  const [currentUserId, setCurrentUserId] =
    useState(null);

  const [currentRoleId, setCurrentRoleId] =
    useState(null);

  const [selectedProfile, setSelectedProfile] =
    useState("");

  const [permissions, setPermissions] = useState({});
  const [hasPermissionChanges, setHasPermissionChanges] =
    useState(false);

  const [loadingProfiles, setLoadingProfiles] =
    useState(false);

  const [loadingModules, setLoadingModules] =
    useState(false);

  const [loadingSubModules, setLoadingSubModules] =
    useState(false);

  const [loadingPermissions, setLoadingPermissions] =
    useState(false);

  const [saving, setSaving] = useState(false);

  const [roleModalOpen, setRoleModalOpen] =
    useState(false);

  const [manageRoleOpen, setManageRoleOpen] =
    useState(false);

  const [roleName, setRoleName] = useState("");
  const [roleSubmitting, setRoleSubmitting] =
    useState(false);

  const [editingProfileId, setEditingProfileId] =
    useState(null);

  const [editingProfileName, setEditingProfileName] =
    useState("");

  const [profileDropdownOpen, setProfileDropdownOpen] =
    useState(false);

  useEffect(() => {
    const user = getStoredUser();

    if (!user) {
      setCurrentUserId(null);
      setCurrentRoleId(null);
      return;
    }

    const userId = Number(
      user?.id ??
        user?.user_id ??
        user?.userId
    );

    const roleId = Number(
      user?.role_id ??
        user?.roleId ??
        user?.role
    );

    setCurrentUserId(
      Number.isFinite(userId) ? userId : null
    );

    setCurrentRoleId(
      Number.isFinite(roleId) ? roleId : null
    );
  }, []);

  const allowedRoleIds = useMemo(() => {
    if (!Number.isFinite(currentRoleId)) {
      return [];
    }

    return (
      allowedRolesByRole[currentRoleId] || []
    );
  }, [currentRoleId]);

  const manageableProfiles = useMemo(() => {
    if (!Number.isFinite(currentUserId)) {
      return [];
    }

    return profiles.filter((profile) => {
      const profileId = Number(profile?.id);
      const createdBy = Number(profile?.created_by);

      if (!Number.isFinite(profileId)) {
        return false;
      }

      const createdByCurrentUser =
        Number.isFinite(createdBy) &&
        createdBy === currentUserId;

      return createdByCurrentUser;
    });
  }, [profiles, currentUserId]);

  const activeProfiles = useMemo(
    () => manageableProfiles.filter(isActive),
    [manageableProfiles]
  );

  const activeModules = useMemo(
    () => modules.filter(isActive),
    [modules]
  );

  const visibleModules = useMemo(() => {
    if (!Number.isFinite(currentRoleId)) {
      return [];
    }

    const allowedRoles =
      allowedRolesByRole[currentRoleId] || [];

    return activeModules.filter((module) => {
      const moduleRoleId = Number(
        module?.role_id
      );

      if (
        Number.isFinite(moduleRoleId) &&
        moduleRoleId >= 0 &&
        moduleRoleId <= 9
      ) {
        return allowedRoles.includes(
          moduleRoleId
        );
      }

      return (
        String(module?.name || "")
          .trim()
          .toLowerCase() !== "admin"
      );
    });
  }, [activeModules, currentRoleId]);

  const activeSubModules = useMemo(
    () => subModules.filter(isActive),
    [subModules]
  );

  const selectedProfileData = useMemo(
    () =>
      profiles.find(
        (profile) =>
          Number(profile?.id) ===
          Number(selectedProfile)
      ),
    [profiles, selectedProfile]
  );

  const getModuleSubModules = (moduleId) => {
    const numericModuleId = Number(moduleId);

    if (!Number.isFinite(numericModuleId)) {
      return [];
    }

    const hasModuleRelation = activeSubModules.some(
      (subModule) =>
        subModule?.module_id !== undefined ||
        subModule?.moduleId !== undefined
    );

    if (!hasModuleRelation) {
      return activeSubModules;
    }

    return activeSubModules.filter(
      (subModule) =>
        Number(
          subModule?.module_id ??
            subModule?.moduleId
        ) === numericModuleId
    );
  };

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);

      const response = await getProfiles();

      const profileData = Array.isArray(response)
        ? response
        : response?.data ||
          response?.profiles ||
          [];

      setProfiles(
        Array.isArray(profileData)
          ? profileData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load profiles:",
        error
      );

      setProfiles([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load profiles"
      );
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadModules = async () => {
    try {
      setLoadingModules(true);

      const response = await getModules();

      const moduleData = Array.isArray(response)
        ? response
        : response?.data ||
          response?.modules ||
          [];

      setModules(
        Array.isArray(moduleData)
          ? moduleData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load modules:",
        error
      );

      setModules([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load modules"
      );
    } finally {
      setLoadingModules(false);
    }
  };

  const loadSubModules = async () => {
    try {
      setLoadingSubModules(true);

      const response = await getSubModules();

      const subModuleData = Array.isArray(response)
        ? response
        : response?.data ||
          response?.subModules ||
          response?.submodules ||
          [];

      setSubModules(
        Array.isArray(subModuleData)
          ? subModuleData
          : []
      );
    } catch (error) {
      console.error(
        "Failed to load sub-modules:",
        error
      );

      setSubModules([]);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load sub-modules"
      );
    } finally {
      setLoadingSubModules(false);
    }
  };

  const loadRolePermissions = async (profileId) => {
    if (!profileId) {
      setPermissions({});
      setHasPermissionChanges(false);
      return;
    }

    const allowedProfile =
      manageableProfiles.some(
        (profile) =>
          Number(profile?.id) ===
          Number(profileId)
      );

    if (!allowedProfile) {
      setPermissions({});
      setHasPermissionChanges(false);
      return;
    }

    try {
      setLoadingPermissions(true);

      const response =
        await getRolePermissions(profileId);

      const permissionData =
        response?.data?.permission ??
        response?.data?.permissions ??
        response?.permission ??
        response?.permissions ??
        response?.data ??
        {};

      setPermissions(
        normalizePermissions(permissionData)
      );

      setHasPermissionChanges(false);
    } catch (error) {
      console.error(
        "Failed to load role permissions:",
        error
      );

      setPermissions({});
      setHasPermissionChanges(false);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load role permissions"
      );
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    loadProfiles();
    loadModules();
    loadSubModules();
  }, []);

  useEffect(() => {
    if (!activeProfiles.length) {
      setSelectedProfile("");
      setPermissions({});
      setHasPermissionChanges(false);
      return;
    }

    const selectedExists = activeProfiles.some(
      (profile) =>
        Number(profile?.id) ===
        Number(selectedProfile)
    );

    if (!selectedExists) {
      setSelectedProfile(
        activeProfiles[0].id
      );
    }
  }, [activeProfiles, selectedProfile]);

  useEffect(() => {
    if (!selectedProfile) {
      setPermissions({});
      setHasPermissionChanges(false);
      return;
    }

    const selectedIsAllowed =
      activeProfiles.some(
        (profile) =>
          Number(profile?.id) ===
          Number(selectedProfile)
      );

    if (!selectedIsAllowed) {
      setPermissions({});
      setHasPermissionChanges(false);
      return;
    }

    loadRolePermissions(selectedProfile);
  }, [selectedProfile, activeProfiles]);

  const handleProfileChange = (profileId) => {
    const allowedProfile = activeProfiles.some(
      (profile) =>
        Number(profile?.id) ===
        Number(profileId)
    );

    if (!allowedProfile) {
      return;
    }

    setSelectedProfile(profileId);
    setProfileDropdownOpen(false);
  };

  const isPermissionChecked = (
    moduleId,
    subModuleId
  ) => {
    const key = getPermissionKey(
      moduleId,
      subModuleId
    );

    return Number(permissions?.[key]) === 1;
  };

  const updatePermission = (
    moduleId,
    subModuleId,
    checked
  ) => {
    const key = getPermissionKey(
      moduleId,
      subModuleId
    );

    setPermissions((previous) => {
      const updated = { ...previous };

      if (checked) {
        updated[key] = 1;
      } else {
        delete updated[key];
      }

      return updated;
    });

    setHasPermissionChanges(true);
  };

  const isModuleFullyChecked = (moduleId) => {
    const moduleSubModules =
      getModuleSubModules(moduleId);

    if (!moduleSubModules.length) {
      return false;
    }

    return moduleSubModules.every((subModule) =>
      isPermissionChecked(
        moduleId,
        subModule.id
      )
    );
  };

  const toggleModulePermissions = (
    moduleId,
    checked
  ) => {
    const moduleSubModules =
      getModuleSubModules(moduleId);

    setPermissions((previous) => {
      const updated = { ...previous };

      moduleSubModules.forEach((subModule) => {
        const key = getPermissionKey(
          moduleId,
          subModule.id
        );

        if (checked) {
          updated[key] = 1;
        } else {
          delete updated[key];
        }
      });

      return updated;
    });

    setHasPermissionChanges(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedProfile) {
      toast.error("Please select a role");
      return;
    }

    const allowedProfile =
      manageableProfiles.some(
        (profile) =>
          Number(profile?.id) ===
          Number(selectedProfile)
      );

    if (!allowedProfile) {
      toast.error(
        "You do not have permission to manage this role"
      );
      return;
    }

    try {
      setSaving(true);

      await saveRolePermissions({
        profile_id: Number(selectedProfile),
        permission: permissions,
      });

      setHasPermissionChanges(false);

      toast.success(
        "Permissions updated successfully"
      );
    } catch (error) {
      console.error(
        "Failed to save permissions:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save permissions"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProfile = async (event) => {
    event.preventDefault();

    const name = roleName.trim();

    if (!name) {
      toast.error("Please enter role name");
      return;
    }

    if (!Number.isFinite(currentUserId)) {
      toast.error("User information not found");
      return;
    }

    try {
      setRoleSubmitting(true);

      await createProfile({
        name,
        status: 1,
        created_by: currentUserId,
      });

      toast.success("Role created successfully");

      setRoleName("");
      setRoleModalOpen(false);

      await loadProfiles();
    } catch (error) {
      console.error(
        "Failed to create role:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create role"
      );
    } finally {
      setRoleSubmitting(false);
    }
  };

  const openManageRole = (profile) => {
    if (!profile) {
      return;
    }

    const allowedProfile =
      manageableProfiles.some(
        (item) =>
          Number(item?.id) ===
          Number(profile?.id)
      );

    if (!allowedProfile) {
      toast.error(
        "You do not have permission to manage this role"
      );
      return;
    }

    setEditingProfileId(profile.id);
    setEditingProfileName(
      getRoleName(profile)
    );
  };

  const handleUpdateProfile = async (event) => {
    event.preventDefault();

    if (!editingProfileId) {
      return;
    }

    const profile = manageableProfiles.find(
      (item) =>
        Number(item?.id) ===
        Number(editingProfileId)
    );

    if (!profile) {
      toast.error(
        "You do not have permission to update this role"
      );
      return;
    }

    const name = editingProfileName.trim();

    if (!name) {
      toast.error("Please enter role name");
      return;
    }

    try {
      setRoleSubmitting(true);

      await updateProfile(editingProfileId, {
        name,
      });

      toast.success(
        "Role updated successfully"
      );

      setEditingProfileId(null);
      setEditingProfileName("");

      await loadProfiles();
    } catch (error) {
      console.error(
        "Failed to update role:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update role"
      );
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleProfileStatus = async (profile) => {
    if (!profile?.id) {
      return;
    }

    const allowedProfile =
      manageableProfiles.some(
        (item) =>
          Number(item?.id) ===
          Number(profile?.id)
      );

    if (!allowedProfile) {
      toast.error(
        "You do not have permission to manage this role"
      );
      return;
    }

    const currentStatus = Number(
      profile?.status ?? 1
    );

    const newStatus =
      currentStatus === 1 ? 0 : 1;

    try {
      await updateProfile(profile.id, {
        status: newStatus,
      });

      toast.success(
        newStatus === 1
          ? "Role activated successfully"
          : "Role deactivated successfully"
      );

      await loadProfiles();
    } catch (error) {
      console.error(
        "Failed to update role status:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update role status"
      );
    }
  };

  const pageLoading =
    loadingProfiles ||
    loadingModules ||
    loadingSubModules;

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            Role Permission
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage permissions for roles under your
            account.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              setRoleModalOpen(true)
            }
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Add Role
          </button>

          <button
            type="button"
            onClick={() =>
              setManageRoleOpen(true)
            }
            disabled={!manageableProfiles.length}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Manage Role
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="w-full md:max-w-md">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Role
            </label>

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setProfileDropdownOpen(
                    (previous) => !previous
                  )
                }
                disabled={
                  loadingProfiles ||
                  !activeProfiles.length
                }
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-left text-sm text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <span>
                  {loadingProfiles
                    ? "Loading roles..."
                    : selectedProfileData
                    ? getRoleName(
                        selectedProfileData
                      )
                    : "No role available"}
                </span>

                <RiIcons.RiArrowDownSLine
                  className={`text-lg transition ${
                    profileDropdownOpen
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </button>

              {profileDropdownOpen &&
                activeProfiles.length > 0 && (
                  <div className="absolute z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {activeProfiles.map(
                      (profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          onClick={() =>
                            handleProfileChange(
                              profile.id
                            )
                          }
                          className={`block w-full px-4 py-2.5 text-left text-sm transition hover:bg-gray-50 ${
                            Number(
                              profile.id
                            ) ===
                            Number(
                              selectedProfile
                            )
                              ? "bg-gray-50 font-medium text-blue-600"
                              : "text-gray-700"
                          }`}
                        >
                          {getRoleName(profile)}
                        </button>
                      )
                    )}
                  </div>
                )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSavePermissions}
            disabled={
              saving ||
              loadingPermissions ||
              !selectedProfile ||
              !hasPermissionChanges
            }
            className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : "Save Permissions"}
          </button>
        </div>
      </div>

      {pageLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          Loading...
        </div>
      ) : !manageableProfiles.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-gray-700">
            No roles available for your account.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            You can only manage roles created by
            your account.
          </p>
        </div>
      ) : !visibleModules.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          No modules available.
        </div>
      ) : !activeSubModules.length ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500 shadow-sm">
          No sub-modules available.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="grid grid-cols-[220px_1fr] items-center border-b border-gray-200 bg-gray-50 px-5 py-4">
                <div className="text-sm font-semibold text-gray-700">
                  Module
                </div>

                <div className="text-sm font-semibold text-gray-700">
                  Sub Modules
                </div>
              </div>

              {visibleModules.map((module) => {
                const moduleSubModules =
                  getModuleSubModules(
                    module.id
                  );

                const ModuleIcon = getIcon(
                  module.icon
                );

                return (
                  <div
                    key={module.id}
                    className="grid grid-cols-[220px_1fr] items-center border-b border-gray-200 px-5 py-4 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isModuleFullyChecked(
                          module.id
                        )}
                        onChange={(event) =>
                          toggleModulePermissions(
                            module.id,
                            event.target.checked
                          )
                        }
                        className="h-4 w-4 cursor-pointer rounded border-gray-300"
                      />

                      {ModuleIcon ? (
                        <ModuleIcon className="text-lg text-gray-600" />
                      ) : (
                        <RiIcons.RiFolderLine className="text-lg text-gray-600" />
                      )}

                      <span className="text-sm font-semibold text-gray-800">
                        {module.name}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {moduleSubModules.map(
                        (subModule) => {
                          const SubModuleIcon =
                            getIcon(
                              subModule.icon
                            );

                          return (
                            <label
                              key={`${module.id}-${subModule.id}`}
                              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 transition ${
                                isPermissionChecked(
                                  module.id,
                                  subModule.id
                                )
                                  ? "border-blue-200 bg-blue-50"
                                  : "border-gray-200 bg-white hover:bg-gray-50"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isPermissionChecked(
                                  module.id,
                                  subModule.id
                                )}
                                onChange={(event) =>
                                  updatePermission(
                                    module.id,
                                    subModule.id,
                                    event.target.checked
                                  )
                                }
                                className="h-4 w-4 cursor-pointer rounded border-gray-300"
                              />

                              {SubModuleIcon ? (
                                <SubModuleIcon className="text-base text-gray-500" />
                              ) : (
                                <RiIcons.RiFileListLine className="text-base text-gray-500" />
                              )}

                              <span className="whitespace-nowrap text-sm text-gray-700">
                                {subModule.name}
                              </span>
                            </label>
                          );
                        }
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Add Role
              </h2>

              <button
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  setRoleName("");
                }}
                className="text-xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleCreateProfile}
              className="p-5"
            >
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Role Name
              </label>

              <input
                type="text"
                value={roleName}
                onChange={(event) =>
                  setRoleName(event.target.value)
                }
                placeholder="Enter role name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500"
              />

              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRoleModalOpen(false);
                    setRoleName("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={roleSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {roleSubmitting
                    ? "Creating..."
                    : "Create Role"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {manageRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Manage Role
              </h2>

              <button
                type="button"
                onClick={() => {
                  setManageRoleOpen(false);
                  setEditingProfileId(null);
                  setEditingProfileName("");
                }}
                className="text-xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-5">
              {manageableProfiles.length > 0 ? (
                <div className="space-y-3">
                  {manageableProfiles.map(
                    (profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                      >
                        {Number(
                          editingProfileId
                        ) ===
                        Number(profile.id) ? (
                          <form
                            onSubmit={
                              handleUpdateProfile
                            }
                            className="flex w-full flex-col gap-3 md:flex-row md:items-center"
                          >
                            <input
                              type="text"
                              value={
                                editingProfileName
                              }
                              onChange={(event) =>
                                setEditingProfileName(
                                  event.target.value
                                )
                              }
                              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />

                            <div className="flex gap-2">
                              <button
                                type="submit"
                                disabled={
                                  roleSubmitting
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {roleSubmitting
                                  ? "Saving..."
                                  : "Save"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProfileId(
                                    null
                                  );
                                  setEditingProfileName(
                                    ""
                                  );
                                }}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">
                                {getRoleName(
                                  profile
                                )}
                              </p>

                              <p className="mt-1 text-xs text-gray-500">
                                Role ID: {profile.id}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openManageRole(
                                    profile
                                  )
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleProfileStatus(
                                    profile
                                  )
                                }
                                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                                  isActive(profile)
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                                }`}
                              >
                                {isActive(profile)
                                  ? "Disable"
                                  : "Enable"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="py-10 text-center text-sm text-gray-500">
                  No roles available for your
                  account.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
