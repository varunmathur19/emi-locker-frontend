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

const getIconUrl = (icon) => {
  if (!icon) return "";

  if (
    icon.startsWith("http://") ||
    icon.startsWith("https://")
  ) {
    return icon;
  }

  const baseURL =
    process.env.NEXT_PUBLIC_API_URL?.replace(
      /\/api\/?$/,
      ""
    );

  return `${baseURL}/${icon.replace(/^\/+/, "")}`;
};

const formatModules = (modules = []) => {
  return modules
    .map((item, index) => ({
      id: item?.id ?? index + 1,
      name: item?.name || "",
      icon: item?.icon || "",
      sequence: Number(
        item?.sequence ?? index + 1
      ),
      status: Number(
        item?.status ?? 1
      ),
    }))
    .sort(
      (a, b) =>
        a.sequence - b.sequence
    );
};

export default function ModulePage() {
  const router = useRouter();

  const [moduleName, setModuleName] =
    useState("");
  const [moduleIcon, setModuleIcon] =
    useState(null);
  const [moduleSequence, setModuleSequence] =
    useState("");
  const [modules, setModules] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [adding, setAdding] =
    useState(false);
  const [updatingStatus, setUpdatingStatus] =
    useState(null);
  const [deleteModal, setDeleteModal] =
    useState({
      open: false,
      moduleName: "",
    });

  useEffect(() => {
    const loadModules = async () => {
      try {
        setLoading(true);

        const response =
          await getModules();

        if (
          response?.success &&
          Array.isArray(response?.modules)
        ) {
          setModules(
            formatModules(
              response.modules
            )
          );
        } else {
          setModules([]);
        }
      } catch (error) {
        console.error(
          "Get Modules Error:",
          error
        );

        toast.error(
          "Failed to load modules"
        );

        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    loadModules();
  }, []);

  const handleAddModule = async (e) => {
    e.preventDefault();

    const name =
      moduleName.trim();

    if (!name) {
      toast.error(
        "Please enter module name"
      );
      return;
    }

    const sequence =
      Number(moduleSequence);

    if (
      moduleSequence === "" ||
      !Number.isInteger(sequence) ||
      sequence < 1
    ) {
      toast.error(
        "Please enter valid sequence number"
      );
      return;
    }

    if (!moduleIcon) {
      toast.error(
        "Please select module icon"
      );
      return;
    }

    if (
      moduleIcon.type !==
      "image/png"
    ) {
      toast.error(
        "Only PNG images are allowed"
      );
      return;
    }

    if (
      moduleIcon.size >
      20 * 1024
    ) {
      toast.error(
        "PNG icon size must not exceed 20 KB"
      );
      return;
    }

    const alreadyExists =
      modules.some(
        (item) =>
          String(
            item?.name || ""
          )
            .trim()
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (alreadyExists) {
      toast.error(
        `Module "${name}" already exists`
      );
      return;
    }

    const sequenceExists =
      modules.some(
        (item) =>
          Number(
            item?.sequence
          ) === sequence
      );

    if (sequenceExists) {
      toast.error(
        `Sequence ${sequence} is already used`
      );
      return;
    }

    try {
      setAdding(true);

      const response =
        await addModule(
          name,
          sequence,
          moduleIcon
        );

      if (
        response?.success === true
      ) {
        if (
          Array.isArray(
            response?.modules
          )
        ) {
          setModules(
            formatModules(
              response.modules
            )
          );
        } else {
          setModules((prev) =>
            [
              ...prev,
              {
                id: Date.now(),
                name,
                icon:
                  response?.icon ||
                  "",
                sequence,
                status: Number(
                  response?.status ?? 1
                ),
              },
            ].sort(
              (a, b) =>
                a.sequence -
                b.sequence
            )
          );
        }

        setModuleName("");
        setModuleSequence("");
        setModuleIcon(null);

        const fileInput =
          document.querySelector(
            'input[type="file"]'
          );

        if (fileInput) {
          fileInput.value = "";
        }

        toast.success(
          `Module added successfully at sequence ${sequence}`
        );
      } else {
        toast.error(
          response?.message ||
            "Failed to add module"
        );
      }
    } catch (error) {
      console.error(
        "ADD MODULE ERROR:",
        error
      );

      const status =
        error?.response?.status;

      if (status === 409) {
        toast.error(
          error?.response?.data
            ?.message ||
            `Module "${name}" already exists`
        );
      } else if (
        status === 422
      ) {
        toast.error(
          error?.response?.data
            ?.message ||
            `Sequence ${sequence} is already used`
        );
      } else {
        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to add module"
        );
      }
    } finally {
      setAdding(false);
    }
  };

  const handleModuleIconChange = (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      setModuleIcon(null);
      return;
    }

    if (
      file.type !==
      "image/png"
    ) {
      toast.error(
        "Only PNG images are allowed"
      );

      e.target.value = "";
      setModuleIcon(null);
      return;
    }

    if (
      file.size >
      20 * 1024
    ) {
      toast.error(
        "PNG icon size must not exceed 20 KB"
      );

      e.target.value = "";
      setModuleIcon(null);
      return;
    }

    setModuleIcon(file);
  };

  const handleToggleStatus =
    async (moduleItem) => {
      if (
        !moduleItem?.name ||
        updatingStatus !== null
      ) {
        return;
      }

      const currentStatus =
        Number(
          moduleItem?.status ?? 1
        );

      const newStatus =
        currentStatus === 1
          ? 0
          : 1;

      try {
        setUpdatingStatus(
          moduleItem.id
        );

        const response =
          await updateModule(
            moduleItem.name,
            "",
            "",
            null,
            newStatus
          );

        if (
          response?.success === true
        ) {
          setModules((prev) =>
            prev.map((item) =>
              String(
                item.name
              )
                .trim()
                .toLowerCase() ===
              String(
                moduleItem.name
              )
                .trim()
                .toLowerCase()
                ? {
                    ...item,
                    status:
                      newStatus,
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
            response?.message ||
              "Failed to update module status"
          );
        }
      } catch (error) {
        console.error(
          "UPDATE MODULE STATUS ERROR:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to update module status"
        );
      } finally {
        setUpdatingStatus(
          null
        );
      }
    };

  const handleDeleteModule = (
    moduleName
  ) => {
    setDeleteModal({
      open: true,
      moduleName,
    });
  };

  const confirmDeleteModule =
    async () => {
      const moduleName =
        deleteModal.moduleName;

      if (!moduleName) {
        return;
      }

      try {
        const response =
          await deleteModule(
            moduleName
          );

        if (
          response?.success === true
        ) {
          if (
            Array.isArray(
              response?.modules
            )
          ) {
            setModules(
              formatModules(
                response.modules
              )
            );
          } else {
            setModules((prev) =>
              prev.filter(
                (item) =>
                  String(
                    item?.name || ""
                  )
                    .trim()
                    .toLowerCase() !==
                  moduleName
                    .trim()
                    .toLowerCase()
              )
            );
          }

          setDeleteModal({
            open: false,
            moduleName: "",
          });

          toast.success(
            response?.message ||
              "Module deleted successfully"
          );

          return;
        }

        toast.error(
          response?.message ||
            "Failed to delete module"
        );
      } catch (error) {
        console.error(
          "DELETE MODULE ERROR:",
          error
        );

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "Failed to delete module"
        );
      }
    };

  return (
    <>
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3">
              Are you sure?
            </h2>

            <p className="text-sm text-slate-600 leading-6">
              Are you sure you want to delete this module?
            </p>

            <p className="mt-2 font-semibold text-slate-800">
              {deleteModal.moduleName}
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() =>
                  setDeleteModal({
                    open: false,
                    moduleName: "",
                  })
                }
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  confirmDeleteModule
                }
                className="px-5 py-2.5 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
          <form
            onSubmit={
              handleAddModule
            }
            className="border border-slate-200 rounded-xl p-5 bg-slate-50 mb-6"
          >
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              Add Module
            </h2>

            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={moduleName}
                onChange={(e) =>
                  setModuleName(
                    e.target.value
                  )
                }
                placeholder="Enter module name e.g. Devices"
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="w-full md:w-32">
                <input
                  type="number"
                  min="1"
                  value={
                    moduleSequence
                  }
                  onChange={(e) =>
                    setModuleSequence(
                      e.target.value
                    )
                  }
                  placeholder="Sequence"
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs text-slate-500 mt-1">
                  Show order
                </p>
              </div>

              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png"
                  onChange={
                    handleModuleIconChange
                  }
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

                <p className="text-xs text-slate-500 mt-1">
                  PNG only, maximum 20 KB
                </p>
              </div>

              <button
                type="submit"
                disabled={adding}
                className="flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-blue-600 transition font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RiAddLine
                  size={20}
                />
                {adding
                  ? "Adding..."
                  : "Add Module"}
              </button>
            </div>
          </form>

          <div>
            <h2 className="text-lg font-semibold text-slate-700 mb-4">
              Module List
            </h2>

            {loading ? (
              <div className="border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                Loading modules...
              </div>
            ) : modules.length ===
              0 ? (
              <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
                No modules found
              </div>
            ) : (
              <div className="space-y-3">
                {modules.map(
                  (
                    module,
                    index
                  ) => {
                    const isActive =
                      Number(
                        module?.status ?? 1
                      ) === 1;

                    const isUpdating =
                      updatingStatus ===
                      module.id;

                    return (
                      <div
                        key={
                          module.id
                        }
                        className="flex items-center justify-between gap-4 border border-slate-200 rounded-xl px-4 py-3 bg-white hover:shadow-sm transition"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold text-slate-600">
                              {module.sequence ||
                                index +
                                  1}
                            </span>
                          </div>

                          <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center overflow-hidden border border-slate-200 shrink-0">
                            {module.icon ? (
                              <img
                                src={getIconUrl(
                                  module.icon
                                )}
                                alt={
                                  module.name ||
                                  "Module icon"
                                }
                                className="w-8 h-8 object-contain"
                                onError={(
                                  e
                                ) => {
                                  e.currentTarget.style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <span className="text-blue-600 font-bold text-lg">
                                {module.name
                                  ?.charAt(
                                    0
                                  )
                                  ?.toUpperCase() ||
                                  "M"}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {
                                module.name
                              }
                            </p>

                            <p className="text-xs text-slate-500 mt-0.5">
                              Sequence:{" "}
                              {module.sequence ||
                                index +
                                  1}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                module
                              )
                            }
                            disabled={
                              isUpdating
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                              isActive
                                ? "bg-green-500"
                                : "bg-gray-300"
                            } ${
                              isUpdating
                                ? "opacity-50 cursor-not-allowed"
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

                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/dashboard/modules/edit?module=${encodeURIComponent(
                                  module.name
                                )}`
                              )
                            }
                            className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 cursor-pointer transition"
                            title="Edit Module"
                          >
                            <RiEditLine
                              size={20}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteModule(
                                module.name
                              )
                            }
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer transition"
                            title="Delete Module"
                          >
                            <RiDeleteBinLine
                              size={20}
                            />
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
