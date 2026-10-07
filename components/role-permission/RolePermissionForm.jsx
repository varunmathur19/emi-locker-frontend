
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

const normalizePermissions = (permission) => {
  if (!permission) {
    return {};
  }

  if (typeof permission === "object") {
    return permission;
  }

  if (typeof permission === "string") {
    try {
      const parsed = JSON.parse(permission);

      return parsed && typeof parsed === "object"
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
};

const getPermissionKey = (moduleId, subModuleId) =>
  `${moduleId}.${subModuleId}`;

const getIcon = (iconName) => {
  if (!iconName) {
    return null;
  }

  return RiIcons[String(iconName).trim()] || null;
};

export default function RolePermissionForm() {
  const [profiles, setProfiles] = useState([]);
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);

  const [selectedProfile, setSelectedProfile] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] =
    useState(false);

  const [permissions, setPermissions] = useState({});
  const [hasPermissionChanges, setHasPermissionChanges] =
    useState(false);

  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingModules, setLoadingModules] = useState(false);
  const [loadingSubModules, setLoadingSubModules] =
    useState(false);
  const [loadingPermissions, setLoadingPermissions] =
    useState(false);

  const [saving, setSaving] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [manageRoleOpen, setManageRoleOpen] = useState(false);

  const [roleName, setRoleName] = useState("");
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  const [editingProfileId, setEditingProfileId] =
    useState(null);
  const [editingProfileName, setEditingProfileName] =
    useState("");

  const selectedProfileData = useMemo(
    () =>
      profiles.find(
        (profile) =>
          Number(profile.id) === Number(selectedProfile)
      ),
    [profiles, selectedProfile]
  );

  const activeProfiles = useMemo(
    () =>
      profiles.filter(
        (profile) => Number(profile.status ?? 1) === 1
      ),
    [profiles]
  );

  const activeModules = useMemo(
    () =>
      [...modules]
        .filter(
          (module) => Number(module.status ?? 1) === 1
        )
        .sort(
          (a, b) =>
            Number(a.sequence ?? a.id ?? 0) -
            Number(b.sequence ?? b.id ?? 0)
        ),
    [modules]
  );

  const activeSubModules = useMemo(
    () =>
      [...subModules]
        .filter(
          (subModule) =>
            Number(subModule.status ?? 1) === 1
        )
        .sort(
          (a, b) =>
            Number(a.sequence ?? a.id ?? 0) -
            Number(b.sequence ?? b.id ?? 0)
        ),
    [subModules]
  );

  const loadProfiles = async () => {
    try {
      setLoadingProfiles(true);

      const response = await getProfiles();

      if (!response?.success) {
        setProfiles([]);
        return;
      }

      const allProfiles = response.data || [];

      setProfiles(allProfiles);

      if (!selectedProfile) {
        const firstActiveProfile = allProfiles.find(
          (profile) => Number(profile.status ?? 1) === 1
        );

        if (firstActiveProfile) {
          setSelectedProfile(firstActiveProfile.id);
        }
      }
    } catch (error) {
      console.error("GET PROFILES ERROR:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load profiles"
      );

      setProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const loadModules = async () => {
    try {
      setLoadingModules(true);

      const response = await getModules();

      if (response?.success) {
        setModules(response.data || []);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("GET MODULES ERROR:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load modules"
      );

      setModules([]);
    } finally {
      setLoadingModules(false);
    }
  };

  const loadSubModules = async () => {
    try {
      setLoadingSubModules(true);

      const response = await getSubModules();

      if (response?.success) {
        setSubModules(response.data || []);
      } else {
        setSubModules([]);
      }
    } catch (error) {
      console.error("GET SUB MODULES ERROR:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load sub modules"
      );

      setSubModules([]);
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

    try {
      setLoadingPermissions(true);
      setHasPermissionChanges(false);

      const response = await getRolePermissions(profileId);

      if (!response?.success) {
        setPermissions({});
        return;
      }

      const permissionData = response?.data?.permission;

      const normalizedPermissions =
        normalizePermissions(permissionData);

      setPermissions(normalizedPermissions);
      setHasPermissionChanges(false);
    } catch (error) {
      console.error(
        "GET ROLE PERMISSIONS ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load permissions"
      );

      setPermissions({});
      setHasPermissionChanges(false);
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
    if (selectedProfile) {
      loadRolePermissions(selectedProfile);
    } else {
      setPermissions({});
      setHasPermissionChanges(false);
    }
  }, [selectedProfile]);

  const isPermissionEnabled = (
    moduleId,
    subModuleId
  ) => {
    const key = getPermissionKey(
      moduleId,
      subModuleId
    );

    return Number(permissions?.[key] ?? 0) === 1;
  };

  const handlePermissionToggle = (
    moduleId,
    subModuleId
  ) => {
    const key = getPermissionKey(
      moduleId,
      subModuleId
    );

    setPermissions((previous) => ({
      ...previous,
      [key]:
        Number(previous?.[key] ?? 0) === 1 ? 0 : 1,
    }));

    setHasPermissionChanges(true);
  };

  const getAllPermissions = () => {
    const result = {};

    activeModules.forEach((module) => {
      activeSubModules.forEach((subModule) => {
        const key = getPermissionKey(
          module.id,
          subModule.id
        );

        result[key] =
          Number(permissions?.[key] ?? 0) === 1
            ? 1
            : 0;
      });
    });

    return result;
  };

  const handleSavePermissions = async () => {
    if (!selectedProfile) {
      toast.error("Please select a profile");
      return;
    }

    if (!hasPermissionChanges) {
      return;
    }

    try {
      setSaving(true);

      const permissionData = getAllPermissions();

      const response = await saveRolePermissions({
        profile_id: Number(selectedProfile),
        permission: permissionData,
      });

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to save permissions"
        );
        return;
      }

      toast.success(
        response?.message ||
          "Permissions saved successfully"
      );

      setPermissions(permissionData);
      setHasPermissionChanges(false);
    } catch (error) {
      console.error(
        "SAVE ROLE PERMISSIONS ERROR:",
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

  const handleClearAll = () => {
    const clearedPermissions = {};

    activeModules.forEach((module) => {
      activeSubModules.forEach((subModule) => {
        const key = getPermissionKey(
          module.id,
          subModule.id
        );

        clearedPermissions[key] = 0;
      });
    });

    setPermissions(clearedPermissions);
    setHasPermissionChanges(true);
  };

  const handleCreateProfile = async (event) => {
    event.preventDefault();

    const trimmedName = roleName.trim();

    if (!trimmedName) {
      toast.error("Please enter profile name");
      return;
    }

    try {
      setRoleSubmitting(true);

      const response = await createProfile({
        name: trimmedName,
        status: 1,
      });

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to create profile"
        );
        return;
      }

      toast.success(
        response?.message ||
          "Profile created successfully"
      );

      setRoleName("");
      setRoleModalOpen(false);

      await loadProfiles();

      if (response?.data?.id) {
        setSelectedProfile(response.data.id);
      }
    } catch (error) {
      console.error(
        "CREATE PROFILE ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to create profile"
      );
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleUpdateProfileName = async (profile) => {
    const trimmedName = editingProfileName.trim();

    if (!trimmedName) {
      toast.error("Please enter profile name");
      return;
    }

    try {
      setSavingProfile(true);

      const response = await updateProfile(profile.id, {
        name: trimmedName,
      });

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to update profile"
        );
        return;
      }

      toast.success(
        response?.message ||
          "Profile updated successfully"
      );

      setEditingProfileId(null);
      setEditingProfileName("");

      await loadProfiles();
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const handleProfileStatus = async (profile) => {
    const currentStatus = Number(
      profile.status ?? 1
    );

    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      setSavingProfile(true);

      const response = await updateProfile(profile.id, {
        status: newStatus,
      });

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to update profile status"
        );
        return;
      }

      toast.success(
        newStatus === 1
          ? "Profile activated successfully"
          : "Profile deactivated successfully"
      );

      if (
        Number(selectedProfile) ===
          Number(profile.id) &&
        newStatus === 0
      ) {
        setSelectedProfile("");
        setPermissions({});
        setHasPermissionChanges(false);
      }

      await loadProfiles();
    } catch (error) {
      console.error(
        "UPDATE PROFILE STATUS ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update profile status"
      );
    } finally {
      setSavingProfile(false);
    }
  };

  const renderPermissionTable = () => {
    if (activeModules.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No active modules found
        </div>
      );
    }

    if (activeSubModules.length === 0) {
      return (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          No active permissions found
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="sticky left-0 z-10 w-[280px] bg-slate-50 px-5 py-4 text-left text-sm font-semibold text-slate-700">
                Module
              </th>

              {activeSubModules.map((subModule) => {
                const Icon = getIcon(subModule.icon);

                return (
                  <th
                    key={subModule.id}
                    className="min-w-[120px] px-4 py-4 text-center text-sm font-semibold text-slate-700"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {Icon && (
                        <Icon className="text-slate-500" />
                      )}

                      <span>{subModule.name}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {activeModules.map((module) => {
              const ModuleIcon = getIcon(module.icon);

              return (
                <tr
                  key={module.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="sticky left-0 z-10 bg-white px-5 py-4">
                    <div className="flex items-center gap-2">
                      {ModuleIcon && (
                        <ModuleIcon className="text-slate-500" />
                      )}

                      <span className="font-semibold text-slate-800">
                        {module.name}
                      </span>
                    </div>
                  </td>

                  {activeSubModules.map(
                    (subModule) => {
                      const enabled =
                        isPermissionEnabled(
                          module.id,
                          subModule.id
                        );

                      return (
                        <td
                          key={`${module.id}-${subModule.id}`}
                          className="px-4 py-4 text-center"
                        >
                          <label className="inline-flex cursor-pointer items-center justify-center">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() =>
                                handlePermissionToggle(
                                  module.id,
                                  subModule.id
                                )
                              }
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </label>
                        </td>
                      );
                    }
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Role & Permission
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Manage profile permissions and access.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setRoleModalOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RiIcons.RiAddLine className="text-lg" />
              Add Role
            </button>

            <button
              type="button"
              onClick={() => setManageRoleOpen(true)}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RiIcons.RiShieldUserLine className="text-lg" />
              Manage Role
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="relative w-full max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Profile
            </label>

            <button
              type="button"
              onClick={() =>
                setProfileDropdownOpen(
                  (previous) => !previous
                )
              }
              className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm text-slate-700"
            >
              <span>
                {selectedProfileData?.name ||
                  "Select Profile"}
              </span>

              <RiIcons.RiArrowDownSLine
                className={`text-xl transition-transform ${
                  profileDropdownOpen
                    ? "rotate-180"
                    : ""
                }`}
              />
            </button>

            {profileDropdownOpen && (
              <div className="absolute z-30 mt-2 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {loadingProfiles ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    Loading profiles...
                  </div>
                ) : activeProfiles.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    No active profiles found
                  </div>
                ) : (
                  activeProfiles.map((profile) => (
                    <button
                      key={profile.id}
                      type="button"
                      onClick={() => {
                        setSelectedProfile(profile.id);
                        setProfileDropdownOpen(false);
                      }}
                      className={`block w-full px-4 py-3 text-left text-sm transition ${
                        Number(selectedProfile) ===
                        Number(profile.id)
                          ? "bg-blue-50 font-semibold text-blue-600"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {profile.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex w-full justify-end gap-3 md:w-auto">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={
                saving || !selectedProfile
              }
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All
            </button>

            <button
              type="button"
              onClick={handleSavePermissions}
              disabled={
                saving ||
                loadingPermissions ||
                !selectedProfile ||
                !hasPermissionChanges
              }
              className="cursor-pointer rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        </div>
      </div>

      {selectedProfile && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <div className="mb-5">
            <h3 className="text-lg font-semibold text-slate-800">
              Module & Permission
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Select the permissions that this profile
              can access.
            </p>
          </div>

          {loadingModules ||
          loadingSubModules ||
          loadingPermissions ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
              Loading permissions...
            </div>
          ) : (
            renderPermissionTable()
          )}
        </div>
      )}

      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Add Role
              </h3>

              <button
                type="button"
                onClick={() => setRoleModalOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <RiIcons.RiCloseLine className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={handleCreateProfile}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Role Name
                </label>

                <input
                  type="text"
                  value={roleName}
                  onChange={(event) =>
                    setRoleName(event.target.value)
                  }
                  placeholder="Enter role name"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={roleSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {roleSubmitting
                  ? "Creating..."
                  : "Create Role"}
              </button>
            </form>
          </div>
        </div>
      )}

      {manageRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Manage Role
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Edit role name or change active status.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManageRoleOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <RiIcons.RiCloseLine className="text-xl" />
              </button>
            </div>

            <div className="space-y-3">
              {profiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                  No profiles found
                </div>
              ) : (
                profiles.map((profile) => {
                  const isEditing =
                    Number(editingProfileId) ===
                    Number(profile.id);

                  const isActive =
                    Number(profile.status ?? 1) === 1;

                  return (
                    <div
                      key={profile.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingProfileName}
                            onChange={(event) =>
                              setEditingProfileName(
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                          />
                        ) : (
                          <p
                            className={`font-semibold ${
                              isActive
                                ? "text-slate-800"
                                : "text-slate-400"
                            }`}
                          >
                            {profile.name}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateProfileName(
                                  profile
                                )
                              }
                              disabled={savingProfile}
                              className="cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              {savingProfile
                                ? "Saving..."
                                : "Save"}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingProfileId(null);
                                setEditingProfileName("");
                              }}
                              className="cursor-pointer rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProfileId(profile.id);
                              setEditingProfileName(
                                profile.name || ""
                              );
                            }}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                            title="Edit role"
                          >
                            <RiIcons.RiEditLine className="text-lg" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleProfileStatus(profile)
                          }
                          disabled={savingProfile}
                          className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition ${
                            isActive
                              ? "bg-green-500"
                              : "bg-slate-300"
                          } disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                              isActive
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>

                        <span
                          className={`min-w-[58px] rounded-full px-2.5 py-1 text-center text-xs font-semibold ${
                            isActive
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-500"
                          }`}
                        >
                          {isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

