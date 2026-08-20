"use client";
import {
  updateModule,
} from "@/services/api";

import { toast } from "react-toastify";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditModulePage() {

  const router = useRouter();
  const searchParams = useSearchParams();

  const moduleName =
    searchParams.get("module") || "";

  const [module, setModule] = useState("");

  useEffect(() => {
    setModule(moduleName);
  }, [moduleName]);

 const handleSubmit = async (e) => {

  e.preventDefault();

  const newModule = module.trim();

  if (!newModule) {

    toast.error("Please enter module name");

    return;
  }

  if (!moduleName) {

    toast.error("Old module name not found");

    return;
  }

  if (
    moduleName.trim().toLowerCase() ===
    newModule.toLowerCase()
  ) {

    toast.info("No changes made");

    return;
  }

  try {

    const response = await updateModule(
      moduleName,
      newModule
    );

    console.log(
      "UPDATE MODULE RESPONSE:",
      response
    );

    if (response?.success) {

      toast.success(
        response?.message ||
        "Module updated successfully"
      );

      router.push("/dashboard/modules");

    } else {

      toast.error(
        response?.message ||
        "Failed to update module"
      );

    }

  } catch (error) {

    console.error(
      "UPDATE MODULE ERROR:",
      error
    );

    toast.error(
      error?.response?.data?.message ||
      "Failed to update module"
    );

  }

};

  return (
    <div className="max-w-2xl mx-auto">

      <div className="bg-white rounded-lg shadow p-6">

        <h1 className="text-2xl font-bold mb-6">
          Edit Module
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >

          {/* MODULE NAME */}

          <div>

            <label className="block mb-2 font-semibold">
              Module Name
            </label>

            <input
              type="text"
              value={module}
              onChange={(e) =>
                setModule(e.target.value)
              }
              className="
                w-full
                border
                border-gray-300
                rounded-md
                px-4
                py-3
                outline-none
                focus:ring-2
                focus:ring-blue-400
              "
              placeholder="Enter module name"
            />

          </div>


          {/* ICON */}

      

          {/* BUTTONS */}

          <div className="flex gap-3">

            <button
              type="submit"
              className="
                bg-blue-500
                text-white
                px-5
                py-3
                rounded-md
                font-semibold
                hover:bg-blue-600
                cursor-pointer
              "
            >
              Update Module
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/dashboard/modules")
              }
              className="
                bg-gray-500
                text-white
                px-5
                py-3
                rounded-md
                font-semibold
                hover:bg-gray-600
                cursor-pointer
              "
            >
              Cancel
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}