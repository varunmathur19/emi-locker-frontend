"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
} from "react-icons/ri";
import { toast } from "react-toastify";
import {
  addModule,
  getModules,
  deleteModule,
  updateModule,
} from "@/services/api";

const formatModules = (modules = []) => {
  return modules
    .map((item, index) => ({
      id: item?.id ?? index + 1,
      name: item?.name || "",
      slug: item?.slug || "",
      icon: item?.icon || "",
      sequence: Number(item?.sequence ?? index + 1),
      status: Number(item?.status ?? 1),
    }))
    .sort((a, b) => a.sequence - b.sequence);
};

export default function ModulePage() {
  const router = useRouter();

  const [moduleName, setModuleName] = useState("");
  const [moduleSlug, setModuleSlug] = useState("");
  const [moduleIcon, setModuleIcon] = useState("");
  const [moduleSequence, setModuleSequence] = useState("");
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    moduleId: null,
    moduleName: "",
  });

  const generateSlug = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const loadModules = async () => {
    try {
      setLoading(true);

      const response = await getModules();

      if (response?.success && Array.isArray(response?.data)) {
        setModules(formatModules(response.data));
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
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const handleAddModule = async (e) => {
    e.preventDefault();

    const name = moduleName.trim();
    const slug = moduleSlug.trim();
    const icon = moduleIcon.trim();
    const sequence = Number(moduleSequence);

    if (!name) {
      toast.error("Please enter module name");
      return;
    }

    if (!slug) {
      toast.error("Please enter module slug");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      toast.error(
        "Slug can contain only lowercase letters, numbers and hyphens"
      );
      return;
    }

    if (!icon) {
      toast.error("Please enter module icon");
      return;
    }

    if (
      moduleSequence === "" ||
      !Number.isInteger(sequence) ||
      sequence < 1
    ) {
      toast.error("Please enter valid sequence number");
      return;
    }

    const alreadyExists = modules.some(
      (item) =>
        String(item?.name || "")
          .trim()
          .toLowerCase() === name.toLowerCase() ||
        String(item?.slug || "")
          .trim()
          .toLowerCase() === slug.toLowerCase()
    );

    if (alreadyExists) {
      toast.error("Module name or slug already exists");
      return;
    }

    const sequenceExists = modules.some(
      (item) => Number(item?.sequence) === sequence
    );

    if (sequenceExists) {
      toast.error(`Sequence ${sequence} is already used`);
      return;
    }

    try {
      setAdding(true);

      const response = await addModule({
        name,
        slug,
        icon,
        sequence,
      });

      if (response?.success === true) {
        if (response?.data) {
          setModules((prev) =>
            formatModules([...prev, response.data])
          );
        } else {
          await loadModules();
        }

        setModuleName("");
        setModuleSlug("");
        setModuleIcon("");
        setModuleSequence("");

        toast.success(
          response?.message ||
            `Module added successfully at sequence ${sequence}`
        );
      } else {
        toast.error(
          response?.message || "Failed to add module"
        );
      }
    } catch (error) {
      console.error("ADD MODULE ERROR:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to add module"
      );
    } finally {
      setAdding(false);
    }
  };

  const handleToggleStatus = async (moduleItem) => {
    if (!moduleItem?.id || updatingStatus !== null) {
      return;
    }

    const currentStatus = Number(moduleItem?.status ?? 1);
    const newStatus = currentStatus === 1 ? 0 : 1;

    try {
      setUpdatingStatus(moduleItem.id);

      const response = await updateModule({
        id: moduleItem.id,
        name: moduleItem.name,
        slug: moduleItem.slug,
        icon: moduleItem.icon,
        sequence: moduleItem.sequence,
        status: newStatus,
      });

      if (response?.success === true) {
        setModules((prev) =>
          prev.map((item) =>
            item.id === moduleItem.id
              ? {
                  ...item,
                  status: newStatus,
                }
              : item
          )
        );

        toast.success(
          newStatus === 1
            ? "Module activated successfully"
            : "Module deactivated successfully"
        );
      } else {
        toast.error(
          response?.message || "Failed to update module status"
        );
      }
    } catch (error) {
      console.error("UPDATE MODULE STATUS ERROR:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update module status"
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDeleteModule = (module) => {
    setDeleteModal({
      open: true,
      moduleId: module.id,
      moduleName: module.name,
    });
  };

  const closeDeleteModal = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteModal({
      open: false,
      moduleId: null,
      moduleName: "",
    });
  };

  const confirmDeleteModule = async () => {
    const { moduleId } = deleteModal;

    if (!moduleId) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await deleteModule(moduleId);

      if (response?.success === true) {
        setModules((prev) =>
          prev.filter((item) => item.id !== moduleId)
        );

        setDeleteModal({
          open: false,
          moduleId: null,
          moduleName: "",
        });

        toast.success(
          response?.message || "Module deleted successfully"
        );
      } else {
        toast.error(
          response?.message || "Failed to delete module"
        );
      }
    } catch (error) {
      console.error("DELETE MODULE ERROR:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to delete module"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-3 text-xl font-bold text-slate-800">
              Are you sure?
            </h2>

            <p className="text-sm leading-6 text-slate-600">
              Are you sure you want to delete this module?
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {deleteModal.moduleName}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="cursor-pointer rounded-lg border border-slate-300 px-5 py-2.5 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDeleteModule}
                disabled={deleteLoading}
                className="cursor-pointer rounded-lg bg-red-500 px-5 py-2.5 font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
          <form
            onSubmit={handleAddModule}
            className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-5"
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-700">
              Add Module
            </h2>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="Enter module name e.g. Customer Finance"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                value={moduleSlug}
                onChange={(e) =>
                  setModuleSlug(generateSlug(e.target.value))
                }
                placeholder="Enter slug e.g. cnf"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="text"
                value={moduleIcon}
                onChange={(e) => setModuleIcon(e.target.value)}
                placeholder="Enter icon e.g. RiUserLine"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                type="number"
                min="1"
                value={moduleSequence}
                onChange={(e) => setModuleSequence(e.target.value)}
                placeholder="Sequence"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={adding}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-500 px-5 py-2.5 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RiAddLine size={20} />
                  {adding ? "Adding..." : "Add Module"}
                </button>
              </div>
            </div>
          </form>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-700">
              Module List
            </h2>

            {loading ? (
              <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                Loading modules...
              </div>
            ) : modules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                No modules found
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map((module, index) => {
                  const isActive =
                    Number(module?.status ?? 1) === 1;

                  const isUpdating =
                    updatingStatus === module.id;

                  return (
                    <div
                      key={module.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                          <span className="text-sm font-semibold text-slate-600">
                            {module.sequence || index + 1}
                          </span>
                        </div>

                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-blue-50">
                          <span className="text-sm font-bold text-blue-600">
                            {module.icon || "M"}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">
                            {module.name}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            Slug: {module.slug}
                          </p>

                          <p className="text-xs text-slate-500">
                            Icon: {module.icon}
                          </p>

                          <p className="text-xs text-slate-500">
                            Sequence: {module.sequence}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(module)
                            }
                            disabled={isUpdating}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              isActive
                                ? "bg-green-500"
                                : "bg-slate-300"
                            } ${
                              isUpdating
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer"
                            }`}
                            title={
                              isActive
                                ? "Deactivate Module"
                                : "Activate Module"
                            }
                          >
                            <span
                              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                                isActive
                                  ? "translate-x-5"
                                  : "translate-x-0.5"
                              }`}
                            />
                          </button>

                          <span
                            className={`min-w-[58px] text-xs font-semibold ${
                              isActive
                                ? "text-green-600"
                                : "text-red-500"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/dashboard/modules/edit?module=${encodeURIComponent(
                                module.slug
                              )}`
                            )
                          }
                          className="cursor-pointer rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                          title="Edit Module"
                        >
                          <RiEditLine size={20} />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteModule(module)
                          }
                          className="cursor-pointer rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                          title="Delete Module"
                        >
                          <RiDeleteBinLine size={20} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}