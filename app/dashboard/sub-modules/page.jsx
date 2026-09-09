"use client";

import { useEffect, useState } from "react";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiCloseLine,
  RiSaveLine,
  RiArrowDownSLine,
} from "react-icons/ri";
import { toast } from "react-toastify";
import {
  getModules,
  getSubModules,
  addSubModule,
  updateSubModule,
  deleteSubModule,
} from "@/services/api";

export default function SubModulePage() {
  const [modules, setModules] = useState([]);
  const [subModules, setSubModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [subModuleName, setSubModuleName] = useState("");
  const [subModuleIcon, setSubModuleIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editModule, setEditModule] = useState("");
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editStatus, setEditStatus] = useState(1);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadModules();
    loadSubModules();
  }, []);

  const loadModules = async () => {
    try {
      const response = await getModules();

      if (response?.success) {
        setModules(response.data || []);
      } else {
        setModules([]);
      }
    } catch (error) {
      console.error("GET MODULES ERROR:", error);
      toast.error("Failed to load modules");
    }
  };

  const loadSubModules = async () => {
    try {
      setLoading(true);

      const response = await getSubModules();

      if (response?.success) {
        setSubModules(response.data || []);
      } else {
        setSubModules([]);
      }
    } catch (error) {
      console.error("GET SUB MODULES ERROR:", error);
      toast.error("Failed to load sub modules");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubModule = async (e) => {
    e.preventDefault();

    if (!selectedModule) {
      toast.error("Please select module");
      return;
    }

    const name = subModuleName.trim();
    const icon = subModuleIcon.trim();

    if (!name) {
      toast.error("Please enter sub module name");
      return;
    }

    const alreadyExists = subModules.some(
      (item) =>
        Number(item.module_id) === Number(selectedModule) &&
        item.name?.trim().toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      toast.error("This sub module already exists");
      return;
    }

    try {
      setLoading(true);

      const response = await addSubModule({
        module_id: selectedModule,
        name,
        icon,
        status: 1,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to add sub module");
        return;
      }

      setSubModules((prev) => [...prev, response.data]);
      setSubModuleName("");
      setSubModuleIcon("");

      toast.success("Sub module added successfully");
    } catch (error) {
      console.error("ADD SUB MODULE ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Failed to add sub module"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubModule = (subModule) => {
    setEditId(subModule.id);
    setEditModule(String(subModule.module_id));
    setEditName(subModule.name || "");
    setEditIcon(subModule.icon || "");
    setEditStatus(Number(subModule.status));
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setEditModule("");
    setEditName("");
    setEditIcon("");
    setEditStatus(1);
  };

  const handleUpdateSubModule = async (e) => {
    e.preventDefault();

    if (!editModule) {
      toast.error("Please select module");
      return;
    }

    const name = editName.trim();
    const icon = editIcon.trim();

    if (!name) {
      toast.error("Please enter sub module name");
      return;
    }

    const alreadyExists = subModules.some(
      (item) =>
        Number(item.id) !== Number(editId) &&
        Number(item.module_id) === Number(editModule) &&
        item.name?.trim().toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      toast.error("This sub module already exists under this module");
      return;
    }

    try {
      setLoading(true);

      const response = await updateSubModule({
        id: editId,
        module_id: editModule,
        name,
        icon,
        status: editStatus,
      });

      if (!response?.success) {
        toast.error(response?.message || "Failed to update sub module");
        return;
      }

      setSubModules((prev) =>
        prev.map((item) =>
          Number(item.id) === Number(editId) ? response.data : item
        )
      );

      handleCancelEdit();

      toast.success("Sub module updated successfully");
    } catch (error) {
      console.error("UPDATE SUB MODULE ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update sub module"
      );
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (subModule) => {
    setDeleteModal({
      id: subModule.id,
      name: subModule.name,
    });
  };

  const closeDeleteModal = () => {
    if (deleteLoading) {
      return;
    }

    setDeleteModal(null);
  };

  const handleDeleteSubModule = async () => {
    if (!deleteModal?.id) {
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await deleteSubModule(deleteModal.id);

      if (!response?.success) {
        toast.error(response?.message || "Failed to delete sub module");
        return;
      }

      setSubModules((prev) =>
        prev.filter(
          (item) => Number(item.id) !== Number(deleteModal.id)
        )
      );

      if (Number(editId) === Number(deleteModal.id)) {
        handleCancelEdit();
      }

      setDeleteModal(null);
      toast.success("Sub module deleted successfully");
    } catch (error) {
      console.error("DELETE SUB MODULE ERROR:", error);
      toast.error(
        error?.response?.data?.message || "Failed to delete sub module"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedModuleName =
    modules.find(
      (module) => Number(module.id) === Number(filterModule)
    )?.name || "";

  const filteredSubModules = filterModule
    ? subModules.filter(
        (item) => Number(item.module_id) === Number(filterModule)
      )
    : subModules;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Sub Modules
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Create and manage sub modules inside modules
            </p>
          </div>
        </div>

        <form
          onSubmit={handleAddSubModule}
          className="border border-slate-200 rounded-xl p-5 bg-slate-50 mb-6"
        >
          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Add Sub Module
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select Module
              </label>

              <div className="relative">
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className="w-full appearance-none border border-slate-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Module</option>

                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {module.name}
                    </option>
                  ))}
                </select>

                <RiArrowDownSLine
                  size={20}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Sub Module Name
              </label>

              <input
                type="text"
                value={subModuleName}
                onChange={(e) => setSubModuleName(e.target.value)}
                placeholder="e.g. New Device"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Icon
              </label>

              <input
                type="text"
                value={subModuleIcon}
                onChange={(e) => setSubModuleIcon(e.target.value)}
                placeholder="e.g. RiDeviceLine"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-blue-500 text-white px-5 py-2.5 rounded-lg hover:bg-blue-600 transition font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RiAddLine size={20} />
              Add Sub Module
            </button>
          </div>
        </form>

        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-700">
                {selectedModuleName
                  ? `${selectedModuleName} Sub Modules`
                  : "Sub Module List"}
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                {filterModule
                  ? `Showing sub modules of ${selectedModuleName}`
                  : "Showing all sub modules"}
              </p>
            </div>

            <div className="relative w-full md:w-56">
              <select
                value={filterModule}
                onChange={(e) => {
                  setFilterModule(e.target.value);
                  handleCancelEdit();
                }}
                className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Modules</option>

                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>

              <RiArrowDownSLine
                size={20}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
            </div>
          </div>

          {loading && subModules.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              Loading sub modules...
            </div>
          ) : filteredSubModules.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              {filterModule
                ? `No sub modules found for ${selectedModuleName}`
                : "No sub modules found"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSubModules.map((subModule, index) => {
                const moduleName =
                  modules.find(
                    (module) =>
                      Number(module.id) === Number(subModule.module_id)
                  )?.name || "Unknown Module";

                return (
                  <div
                    key={subModule.id}
                    className="border border-slate-200 rounded-xl px-4 py-4 bg-white hover:shadow-sm transition"
                  >
                    {Number(editId) === Number(subModule.id) ? (
                      <form onSubmit={handleUpdateSubModule}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                              Module
                            </label>

                            <div className="relative">
                              <select
                                value={editModule}
                                onChange={(e) =>
                                  setEditModule(e.target.value)
                                }
                                className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Select Module</option>

                                {modules.map((module) => (
                                  <option
                                    key={module.id}
                                    value={module.id}
                                  >
                                    {module.name}
                                  </option>
                                ))}
                              </select>

                              <RiArrowDownSLine
                                size={20}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                              Sub Module Name
                            </label>

                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                              Icon
                            </label>

                            <input
                              type="text"
                              value={editIcon}
                              onChange={(e) => setEditIcon(e.target.value)}
                              placeholder="RiDeviceLine"
                              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                              Status
                            </label>

                            <div className="relative">
                              <select
                                value={editStatus}
                                onChange={(e) =>
                                  setEditStatus(Number(e.target.value))
                                }
                                className="w-full appearance-none border border-slate-300 rounded-lg px-3 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={1}>Active</option>
                                <option value={0}>Inactive</option>
                              </select>

                              <RiArrowDownSLine
                                size={20}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <RiCloseLine size={18} />
                            Cancel
                          </button>

                          <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition cursor-pointer disabled:opacity-50"
                          >
                            <RiSaveLine size={18} />
                            Update
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">
                              {subModule.name}
                            </p>

                            <p className="text-xs text-slate-500 mt-1">
                              Module: {moduleName}
                            </p>

                            {subModule.icon && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Icon: {subModule.icon}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                              Number(subModule.status) === 1
                                ? "bg-green-50 text-green-600"
                                : "bg-red-50 text-red-500"
                            }`}
                          >
                            {Number(subModule.status) === 1
                              ? "Active"
                              : "Inactive"}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleEditSubModule(subModule)
                            }
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer"
                          >
                            <RiEditLine size={20} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(subModule)}
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                          >
                            <RiDeleteBinLine size={20} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Delete Sub Module
              </h3>

              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RiCloseLine size={22} />
              </button>
            </div>

            <div className="px-6 py-6">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                <RiDeleteBinLine size={24} />
              </div>

              <h4 className="text-base font-semibold text-slate-800">
                Are you sure you want to delete this sub module?
              </h4>

              <p className="text-sm text-slate-500 mt-2">
                You are about to delete{" "}
                <span className="font-semibold text-slate-700">
                  "{deleteModal.name}"
                </span>
                . This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleteLoading}
                className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteSubModule}
                disabled={deleteLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RiDeleteBinLine size={18} />
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}