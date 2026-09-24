"use client";

import { useEffect, useMemo, useState } from "react";
import * as RiIcons from "react-icons/ri";
import { toast } from "react-toastify";

import {
  getProfiles,
  getRoles,
  getModules,
  getSubModules,
  createProfile,
  updateProfile,
  getRolePermissions,
  saveRolePermissions,
} from "@/services/api";

import { getRoleId } from "@/utils/token";

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

const permissionOrder = {
  view: 1,
  add: 2,
  edit: 3,
  delete: 4,
  // status: 4,
  manage: 5,
};

const normalizeSlug = (value) => {
  if (!value) {
    return "";
  }

  return String(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const getRoleSlug = (role) => {
  return normalizeSlug(
    role?.slug ||
      role?.role_slug ||
      role?.name ||
      roleNames[Number(role?.role_id ?? role?.id)]
  );
};

const getModuleSlug = (module) => {
  return normalizeSlug(module?.slug || module?.name);
};

const getSubModuleSlug = (subModule) => {
  return normalizeSlug(
    subModule?.slug ||
      subModule?.sub_module_slug ||
      subModule?.name
  );
};

const getPermissionKey = (permission, slug) => {
  return `${slug}.${permission}`;
};

const getPermissionIcon = (iconName) => {
  if (!iconName) {
    return null;
  }

  const icon = RiIcons[iconName];

  if (icon) {
    return icon;
  }

  const normalizedIcon = String(iconName).trim();

  return RiIcons[normalizedIcon] || null;
};

export default function RolePermissionForm() {
  const [profiles, setProfiles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);

  const [selectedProfile, setSelectedProfile] = useState("");
  const [profileDropdownOpen, setProfileDropdownOpen] =
    useState(false);

  const [permissions, setPermissions] = useState({});
  const [hasPermissionChanges, setHasPermissionChanges] =
    useState(false);

  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
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

  const [editingProfileId, setEditingProfileId] = useState(null);
  const [editingProfileName, setEditingProfileName] =
    useState("");

  const loggedInRoleId = Number(getRoleId() || 0);

  const selectedProfileData = useMemo(() => {
    return profiles.find(
      (profile) =>
        Number(profile.id) === Number(selectedProfile)
    );
  }, [profiles, selectedProfile]);

  const activeModules = useMemo(() => {
    return [...modules]
      .filter(
        (module) =>
          Number(module.status ?? 1) === 1
      )
      .sort(
        (a, b) =>
          Number(a.sequence ?? 0) -
          Number(b.sequence ?? 0)
      );
  }, [modules]);

  const activeSubModules = useMemo(() => {
    return [...subModules]
      .filter(
        (subModule) =>
          Number(subModule.status ?? 1) === 1
      )
      .sort(
        (a, b) =>
          Number(a.sequence ?? 0) -
          Number(b.sequence ?? 0)
      );
  }, [subModules]);

  const permissionTypes = useMemo(() => {
    const uniquePermissions = new Map();

    activeSubModules.forEach((subModule) => {
      const key = getSubModuleSlug(subModule);

      if (!key) {
        return;
      }

      if (!uniquePermissions.has(key)) {
        uniquePermissions.set(key, {
          key,
          label: subModule?.name || "",
          icon: getPermissionIcon(
            subModule?.icon
          ),
          sequence: Number(
            subModule?.sequence ?? 999
          ),
        });
      }
    });

    return Array.from(
      uniquePermissions.values()
    ).sort((a, b) => {
      const orderA =
        permissionOrder[a.key] ?? 999;

      const orderB =
        permissionOrder[b.key] ?? 999;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return a.sequence - b.sequence;
    });
  }, [activeSubModules]);

  const activeProfiles = useMemo(() => {
    return profiles.filter(
      (profile) =>
        Number(profile.status ?? 1) === 1
    );
  }, [profiles]);

  const getSubModulesForModule = (moduleId) => {
    return activeSubModules.filter(
      (subModule) =>
        Number(subModule.module_id) ===
        Number(moduleId)
    );
  };

  /*
   * Load Profiles
   */
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
        const firstActiveProfile =
          allProfiles.find(
            (profile) =>
              Number(profile.status ?? 1) === 1
          );

        if (firstActiveProfile) {
          setSelectedProfile(
            firstActiveProfile.id
          );
        }
      }

      if (selectedProfile) {
        const selectedProfileExists =
          allProfiles.find(
            (profile) =>
              Number(profile.id) ===
              Number(selectedProfile)
          );

        if (
          selectedProfileExists &&
          Number(
            selectedProfileExists.status ?? 1
          ) === 0
        ) {
          setSelectedProfile("");
          setPermissions({});
          setHasPermissionChanges(false);
        }
      }
    } catch (error) {
      console.error(
        "GET PROFILES ERROR:",
        error
      );

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

  /*
   * Load Roles
   */
  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const response = await getRoles();

      if (response?.success) {
        setRoles(response.data || []);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error(
        "GET ROLES ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load roles"
      );

      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  /*
   * Load Modules
   */
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
      console.error(
        "GET MODULES ERROR:",
        error
      );

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

  /*
   * Load Sub Modules
   */
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
      console.error(
        "GET SUB MODULES ERROR:",
        error
      );

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

  /*
   * Load Role Permissions
   */
  const loadRolePermissions = async (
    profileId
  ) => {
    if (!profileId) {
      setPermissions({});
      setHasPermissionChanges(false);
      return;
    }

    try {
      setLoadingPermissions(true);
      setHasPermissionChanges(false);

      const response =
        await getRolePermissions(profileId);

      if (!response?.success) {
        setPermissions({});
        setHasPermissionChanges(false);
        return;
      }

      const permissionData =
        response?.data?.permission || {};

      setPermissions(
        permissionData || {}
      );

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

  /*
   * Initial API calls
   */
  useEffect(() => {
    loadProfiles();
    loadRoles();
    loadModules();
    loadSubModules();
  }, []);

  /*
   * Load permissions when profile changes
   */
  useEffect(() => {
    if (selectedProfile) {
      loadRolePermissions(selectedProfile);
    } else {
      setPermissions({});
      setHasPermissionChanges(false);
    }
  }, [selectedProfile]);

  /*
   * Get permission value
   */
  const getPermissionValue = (key) => {
    return Boolean(permissions?.[key]);
  };

  /*
   * Get all permission keys for one resource.
   *
   * Example:
   * wallet.view
   * wallet.add
   * wallet.edit
   * wallet.delete
   * wallet.manage
   */
  const getResourcePermissionKeys = (
    slug
  ) => {
    if (!slug) {
      return [];
    }

    return permissionTypes.map(
      (permission) =>
        getPermissionKey(
          permission.key,
          slug
        )
    );
  };

  /*
   * Check whether all normal permissions
   * are enabled for a resource.
   *
   * Manage itself is not included here.
   */
  const areAllAccessPermissionsEnabled = (
    slug,
    permissionState
  ) => {
    const normalPermissionTypes =
      permissionTypes.filter(
        (permission) =>
          permission.key !== "manage"
      );

    if (
      normalPermissionTypes.length === 0
    ) {
      return false;
    }

    return normalPermissionTypes.every(
      (permission) => {
        const key =
          getPermissionKey(
            permission.key,
            slug
          );

        return Boolean(
          permissionState?.[key]
        );
      }
    );
  };

 
  const handlePermissionToggle = (
    key
  ) => {
    const [slug, permissionName] =
      String(key).split(".");

    if (!slug || !permissionName) {
      return;
    }

    setPermissions((prev) => {
      const updated = {
        ...prev,
      };

      /*
       * MANAGE CHECKBOX
       */
      if (permissionName === "manage") {
        const shouldEnableManage =
          !Boolean(prev?.[key]);

        const resourceKeys =
          getResourcePermissionKeys(
            slug
          );

        resourceKeys.forEach(
          (resourceKey) => {
            updated[resourceKey] =
              shouldEnableManage;
          }
        );

        return updated;
      }

      /*
       * NORMAL PERMISSION
       */
      updated[key] =
        !Boolean(prev?.[key]);

      /*
       * If ANY individual permission is OFF,
       * Manage must be OFF.
       *
       * If ALL individual permissions are ON,
       * Manage becomes ON automatically.
       */
      const manageKey =
        getPermissionKey(
          "manage",
          slug
        );

      const allAccessEnabled =
        areAllAccessPermissionsEnabled(
          slug,
          updated
        );

      updated[manageKey] =
        allAccessEnabled;

      return updated;
    });

    setHasPermissionChanges(true);
  };

  /*
   * Get all permissions
   */
  const getAllPermissions = () => {
    const result = {};

    /*
     * Role permissions
     */
    roles
      .filter((role) => {
        const roleId = Number(
          role?.role_id ?? role?.id
        );

        return (
          roleId !== 9 &&
          roleId > loggedInRoleId
        );
      })
      .forEach((role) => {
        const roleSlug =
          getRoleSlug(role);

        if (!roleSlug) {
          return;
        }

        permissionTypes.forEach(
          (permission) => {
            const key =
              getPermissionKey(
                permission.key,
                roleSlug
              );

            result[key] = Boolean(
              permissions?.[key]
            );
          }
        );
      });

    /*
     * Module permissions
     */
    activeModules.forEach((module) => {
      const moduleSlug =
        getModuleSlug(module);

      if (!moduleSlug) {
        return;
      }

      permissionTypes.forEach(
        (permission) => {
          const key =
            getPermissionKey(
              permission.key,
              moduleSlug
            );

          result[key] = Boolean(
            permissions?.[key]
          );
        }
      );

      /*
       * Sub module permissions
       */
      const moduleSubModules =
        getSubModulesForModule(
          module.id
        );

      moduleSubModules.forEach(
        (subModule) => {
          const subModuleSlug =
            getSubModuleSlug(
              subModule
            );

          if (!subModuleSlug) {
            return;
          }

          permissionTypes.forEach(
            (permission) => {
              const key =
                getPermissionKey(
                  permission.key,
                  subModuleSlug
                );

              result[key] = Boolean(
                permissions?.[key]
              );
            }
          );
        }
      );
    });

    return result;
  };

  /*
   * Save Permissions
   */
  const handleSavePermissions =
    async () => {
      if (!selectedProfile) {
        toast.error(
          "Please select a profile"
        );
        return;
      }

      if (!hasPermissionChanges) {
        return;
      }

      try {
        setSaving(true);

        const response =
          await saveRolePermissions({
            profile_id:
              Number(selectedProfile),
            permission:
              getAllPermissions(),
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

        setHasPermissionChanges(
          false
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

  /*
   * Clear all permissions
   */
  const handleClearAll = () => {
    setPermissions({});
    setHasPermissionChanges(true);
  };

  /*
   * Create Profile
   */
  const handleCreateProfile = async (
    event
  ) => {
    event.preventDefault();

    const trimmedName =
      roleName.trim();

    if (!trimmedName) {
      toast.error(
        "Please enter profile name"
      );
      return;
    }

    try {
      setRoleSubmitting(true);

      const response =
        await createProfile({
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
        setSelectedProfile(
          response.data.id
        );
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

  /*
   * Update Profile Name
   */
  const handleUpdateProfileName =
    async (profile) => {
      const trimmedName =
        editingProfileName.trim();

      if (!trimmedName) {
        toast.error(
          "Please enter profile name"
        );
        return;
      }

      try {
        setSavingProfile(true);

        const response =
          await updateProfile(
            profile.id,
            {
              name: trimmedName,
            }
          );

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
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to update profile"
        );
      } finally {
        setSavingProfile(false);
      }
    };

  /*
   * Toggle Profile Status
   */
  const handleProfileStatus =
    async (profile) => {
      const currentStatus =
        Number(
          profile.status ?? 1
        );

      const newStatus =
        currentStatus === 1 ? 0 : 1;

      try {
        setSavingProfile(true);

        const response =
          await updateProfile(
            profile.id,
            {
              status: newStatus,
            }
          );

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
          setHasPermissionChanges(
            false
          );
        }

        await loadProfiles();
      } catch (error) {
        console.error(
          "UPDATE PROFILE STATUS ERROR:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to update profile status"
        );
      } finally {
        setSavingProfile(false);
      }
    };

  /*
   * Visible Roles
   */
  const visibleRoles =
    roles.filter((role) => {
      const roleId = Number(
        role?.role_id ?? role?.id
      );

      return (
        roleId !== 9 &&
        roleId > loggedInRoleId
      );
    });

  /*
   * Permission Checkbox
   */
  const renderPermissionCheckbox = (
    slug,
    permission
  ) => {
    const key =
      getPermissionKey(
        permission.key,
        slug
      );

    const checked =
      getPermissionValue(key);

    return (
      <label
        key={key}
        className="flex cursor-pointer items-center justify-center gap-2"
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() =>
            handlePermissionToggle(
              key
            )
          }
          className="h-4 w-4 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />

        <span className="text-xs font-semibold uppercase text-slate-500">
          {permission.label}
        </span>
      </label>
    );
  };

  /*
   * Permission Header
   */
  const renderPermissionHeader = (
    permission
  ) => {
    const Icon =
      permission.icon;

    return (
      <div
        key={permission.key}
        className="flex w-[110px] shrink-0 items-center justify-center gap-1 text-center text-xs font-semibold uppercase text-slate-500"
      >
        {Icon && (
          <Icon size={15} />
        )}

        <span>
          {permission.label}
        </span>
      </div>
    );
  };

  /*
   * Role Permission Table
   */
  const renderRolePermissionTable =
    () => {
      if (visibleRoles.length === 0) {
        return (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No roles available
          </div>
        );
      }

      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-max">
            <div className="flex border-b border-slate-200 bg-slate-50">
              <div className="flex w-[220px] shrink-0 items-center px-5 py-4 text-sm font-semibold text-slate-700">
                Role
              </div>

              {permissionTypes.map(
                renderPermissionHeader
              )}
            </div>

            {visibleRoles.map(
              (role) => {
                const roleId =
                  Number(
                    role?.role_id ??
                      role?.id
                  );

                const roleSlug =
                  getRoleSlug(role);

                const roleLabel =
                  role?.name ||
                  roleNames[roleId] ||
                  "Unknown Role";

                return (
                  <div
                    key={`role-${roleId}`}
                    className="flex border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex w-[220px] shrink-0 items-center px-5 py-4">
                      <span className="font-medium text-slate-700">
                        {roleLabel}
                      </span>
                    </div>

                    {permissionTypes.map(
                      (permission) => (
                        <div
                          key={`${roleSlug}-${permission.key}`}
                          className="flex w-[110px] shrink-0 items-center justify-center px-2 py-3"
                        >
                          {renderPermissionCheckbox(
                            roleSlug,
                            permission
                          )}
                        </div>
                      )
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      );
    };

  /*
   * Module Permission Table
   */
  const renderModulePermissionTable =
    () => {
      if (activeModules.length === 0) {
        return (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            No active modules found
          </div>
        );
      }

      return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-max">
            <div className="flex border-b border-slate-200 bg-slate-50">
              <div className="flex w-[280px] shrink-0 items-center px-5 py-4 text-sm font-semibold text-slate-700">
                Module / Sub Module
              </div>

              {permissionTypes.map(
                renderPermissionHeader
              )}
            </div>

            {activeModules.map(
              (module) => {
                const moduleSlug =
                  getModuleSlug(module);

                const moduleSubModules =
                  getSubModulesForModule(
                    module.id
                  );

                return (
                  <div
                    key={module.id}
                  >
                    {/* Module */}
                    <div className="flex border-b border-slate-100 bg-white">
                      <div className="flex w-[280px] shrink-0 items-center px-5 py-4">
                        <span className="font-semibold text-slate-800">
                          {module.name}
                        </span>
                      </div>

                      {permissionTypes.map(
                        (permission) => (
                          <div
                            key={`${moduleSlug}-${permission.key}`}
                            className="flex w-[110px] shrink-0 items-center justify-center px-2 py-3"
                          >
                            {renderPermissionCheckbox(
                              moduleSlug,
                              permission
                            )}
                          </div>
                        )
                      )}
                    </div>

                    {/* Sub Modules */}
                    {moduleSubModules.map(
                      (subModule) => {
                        const subModuleSlug =
                          getSubModuleSlug(
                            subModule
                          );

                        return (
                          <div
                            key={`sub-module-${subModule.id}`}
                            className="flex border-b border-slate-100 bg-slate-50/70"
                          >
                            <div className="flex w-[280px] shrink-0 items-center px-5 py-3">
                              <div className="flex items-center gap-3 pl-6">
                                <span className="h-2 w-2 rounded-full bg-blue-500" />

                                <span className="text-sm font-medium text-slate-600">
                                  {
                                    subModule.name
                                  }
                                </span>
                              </div>
                            </div>

                            {permissionTypes.map(
                              (permission) => (
                                <div
                                  key={`${subModuleSlug}-${permission.key}`}
                                  className="flex w-[110px] shrink-0 items-center justify-center px-2 py-3"
                                >
                                  {renderPermissionCheckbox(
                                    subModuleSlug,
                                    permission
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      );
    };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">

      {/* Header */}
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
              onClick={() =>
                setRoleModalOpen(true)
              }
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <RiIcons.RiAddLine className="text-lg" />
              Add Role
            </button>

            <button
              type="button"
              onClick={() =>
                setManageRoleOpen(true)
              }
              className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RiIcons.RiShieldUserLine className="text-lg" />
              Manage Role
            </button>
          </div>
        </div>

        {/* Profile + Actions */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

          {/* Select Profile */}
          <div className="relative w-full max-w-md">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Select Profile
            </label>

            <button
              type="button"
              onClick={() =>
                setProfileDropdownOpen(
                  (prev) => !prev
                )
              }
              className="flex cursor-pointer w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-sm text-slate-700"
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
                ) : activeProfiles.length ===
                  0 ? (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    No active profiles found
                  </div>
                ) : (
                  activeProfiles.map(
                    (profile) => (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => {
                          setSelectedProfile(
                            profile.id
                          );

                          setProfileDropdownOpen(
                            false
                          );
                        }}
                        className={`block w-full px-4 py-3 text-left text-sm transition ${
                          Number(
                            selectedProfile
                          ) ===
                          Number(profile.id)
                            ? "bg-blue-50 font-semibold text-blue-600"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {profile.name}
                      </button>
                    )
                  )
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex w-full justify-end gap-3 md:w-auto">
            <button
              type="button"
              onClick={handleClearAll}
              disabled={
                saving ||
                !selectedProfile
              }
              className="rounded-lg border cursor-pointer border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear All
            </button>

            <button
              type="button"
              onClick={
                handleSavePermissions
              }
              disabled={
                saving ||
                loadingPermissions ||
                !selectedProfile ||
                !hasPermissionChanges
              }
              className="rounded-lg cursor-pointer bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : "Save Permissions"}
            </button>
          </div>
        </div>
      </div>

      {/* Permission Tables */}
      {selectedProfile && (
        <>
          {/* Role Permissions */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Role Permissions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Configure role permissions.
              </p>
            </div>

            {loadingRoles ||
            loadingSubModules ||
            loadingPermissions ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Loading permissions...
              </div>
            ) : (
              renderRolePermissionTable()
            )}
          </div>

          {/* Module Permissions */}
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
            <div className="mb-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Module & Sub Module Permissions
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Permission labels and icons are loaded
                from the sub modules API.
              </p>
            </div>

            {loadingModules ||
            loadingSubModules ||
            loadingPermissions ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                Loading modules...
              </div>
            ) : (
              renderModulePermissionTable()
            )}
          </div>
        </>
      )}

      {/* Add Role Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800 ">
                Add Role
              </h3>

              <button
                type="button"
                onClick={() =>
                  setRoleModalOpen(false)
                }
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <RiIcons.RiCloseLine className="text-xl" />
              </button>
            </div>

            <form
              onSubmit={
                handleCreateProfile
              }
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
                    setRoleName(
                      event.target.value
                    )
                  }
                  placeholder="Enter role name"
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={
                  roleSubmitting
                }
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

      {/* Manage Role Modal */}
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
                onClick={() =>
                  setManageRoleOpen(false)
                }
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
                profiles.map(
                  (profile) => {
                    const isEditing =
                      Number(
                        editingProfileId
                      ) ===
                      Number(
                        profile.id
                      );

                    const isActive =
                      Number(
                        profile.status ??
                          1
                      ) === 1;

                    return (
                      <div
                        key={profile.id}
                        className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        {/* Role Name */}
                        <div className="min-w-0 flex-1">
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
                                  event
                                    .target
                                    .value
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
                              {
                                profile.name
                              }
                            </p>
                          )}
                        </div>

                        {/* Actions */}
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
                                disabled={
                                  savingProfile
                                }
                                className="rounded-lg cursor-pointer bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                {savingProfile
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
                                className="rounded-lg cursor-pointer border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingProfileId(
                                  profile.id
                                );

                                setEditingProfileName(
                                  profile.name ||
                                    ""
                                );
                              }}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                              title="Edit role"
                            >
                              <RiIcons.RiEditLine className="text-lg" />
                            </button>
                          )}

                          {/* Status Toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              handleProfileStatus(
                                profile
                              )
                            }
                            disabled={
                              savingProfile
                            }
                            className={`relative inline-flex cursor-pointer h-6 w-11 items-center rounded-full transition ${
                              isActive
                                ? "bg-green-500"
                                : "bg-slate-300"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                            title={
                              isActive
                                ? "Deactivate role"
                                : "Activate role"
                            }
                          >
                            <span
                              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                                isActive
                                  ? "translate-x-5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>

                          {/* Status Label */}
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
                  }
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}