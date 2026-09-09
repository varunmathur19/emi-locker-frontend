"use client";

import { updateModule, getModules } from "@/services/api";
import { toast } from "react-toastify";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditModulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleSlug = searchParams.get("module") || "";

  const [moduleId, setModuleId] = useState(null);
  const [moduleName, setModuleName] = useState("");
  const [moduleSlugValue, setModuleSlugValue] = useState("");
  const [moduleIcon, setModuleIcon] = useState("");
  const [moduleSequence, setModuleSequence] = useState("");
  const [moduleStatus, setModuleStatus] = useState(1);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const loadModule = async () => {
      try {
        setLoading(true);

        const response = await getModules();

        if (
          !response?.success ||
          !Array.isArray(response?.data)
        ) {
          toast.error("Failed to load modules");
          return;
        }

        const foundModule = response.data.find(
          (item) =>
            String(item?.slug || "").toLowerCase() ===
            moduleSlug.toLowerCase()
        );

        if (!foundModule) {
          toast.error("Module not found");
          router.push("/dashboard/modules");
          return;
        }

        setModuleId(foundModule.id);
        setModuleName(foundModule.name || "");
        setModuleSlugValue(foundModule.slug || "");
        setModuleIcon(foundModule.icon || "");
        setModuleSequence(
          String(foundModule.sequence ?? "")
        );
        setModuleStatus(
          Number(foundModule.status ?? 1)
        );
      } catch (error) {
        console.error("GET MODULE ERROR:", error);

        toast.error(
          error?.response?.data?.message ||
            error?.message ||
            "Failed to load module"
        );
      } finally {
        setLoading(false);
      }
    };

    if (moduleSlug) {
      loadModule();
    }
  }, [moduleSlug, router]);

  const generateSlug = (value) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const name = moduleName.trim();
    const slug = moduleSlugValue.trim();
    const icon = moduleIcon.trim();
    const sequence = Number(moduleSequence);
    const status = Number(moduleStatus);

    if (!moduleId) {
      toast.error("Module not found");
      return;
    }

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
      !Number.isInteger(sequence) ||
      sequence < 1
    ) {
      toast.error("Please enter valid sequence number");
      return;
    }

    if (![0, 1].includes(status)) {
      toast.error("Invalid module status");
      return;
    }

    try {
      setUpdating(true);

      const response = await updateModule({
        id: moduleId,
        name,
        slug,
        icon,
        sequence,
        status,
      });

      if (response?.success === true) {
        toast.success(
          response?.message ||
            "Module updated successfully"
        );

        router.push("/dashboard/modules");
        router.refresh();
      } else {
        toast.error(
          response?.message ||
            "Failed to update module"
        );
      }
    } catch (error) {
      console.error("UPDATE MODULE ERROR:", error);

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update module"
      );
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg bg-white p-6 shadow">
          <p className="text-center text-gray-500">
            Loading module...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-lg bg-white p-6 shadow">
        <h1 className="mb-6 text-2xl font-bold">
          Edit Module
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="mb-2 block font-semibold">
              Module Name
            </label>

            <input
              type="text"
              value={moduleName}
              onChange={(e) =>
                setModuleName(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter module name"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Module Slug
            </label>

            <input
              type="text"
              value={moduleSlugValue}
              onChange={(e) =>
                setModuleSlugValue(
                  generateSlug(e.target.value)
                )
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter module slug"
            />

            <p className="mt-2 text-sm text-gray-500">
              Name and slug can be different.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Module Icon
            </label>

            <input
              type="text"
              value={moduleIcon}
              onChange={(e) =>
                setModuleIcon(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g. RiUserLine"
            />
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Module Sequence
            </label>

            <input
              type="number"
              min="1"
              value={moduleSequence}
              onChange={(e) =>
                setModuleSequence(e.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter sequence number"
            />

            <p className="mt-2 text-sm text-gray-500">
              Sequence determines the module display order.
            </p>
          </div>

          <div>
            <label className="mb-2 block font-semibold">
              Status
            </label>

            <select
              value={moduleStatus}
              onChange={(e) =>
                setModuleStatus(Number(e.target.value))
              }
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={updating}
              className="cursor-pointer rounded-md bg-blue-500 px-5 py-3 font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {updating
                ? "Updating..."
                : "Update Module"}
            </button>

            <button
              type="button"
              disabled={updating}
              onClick={() =>
                router.push("/dashboard/modules")
              }
              className="cursor-pointer rounded-md bg-gray-500 px-5 py-3 font-semibold text-white hover:bg-gray-600 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}