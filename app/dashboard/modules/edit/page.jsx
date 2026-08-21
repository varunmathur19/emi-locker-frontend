"use client";

import {
  updateModule,
} from "@/services/api";

import {
  toast,
} from "react-toastify";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

export default function EditModulePage() {

  const router = useRouter();
  const searchParams = useSearchParams();

  // =================================================
  // OLD MODULE FROM URL
  // =================================================

  const moduleName =
    searchParams.get("module") || "";

  // =================================================
  // STATES
  // =================================================

  const [module, setModule] =
    useState("");

  const [icon, setIcon] =
    useState(null);

  const [preview, setPreview] =
    useState("");

  const [loading, setLoading] =
    useState(false);


  // =================================================
  // SET OLD MODULE
  // =================================================

  useEffect(() => {

    setModule(moduleName);

  }, [moduleName]);


  // =================================================
  // HANDLE ICON
  // =================================================

  const handleIconChange = (e) => {

    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    // ===============================================
    // PNG ONLY
    // ===============================================

    if (file.type !== "image/png") {

      toast.error(
        "Only PNG images are allowed"
      );

      e.target.value = "";

      return;
    }


    // ===============================================
    // 2 MB LIMIT
    // ===============================================

    if (file.size > 2 * 1024 * 1024) {

      toast.error(
        "Image size must be less than 2 MB"
      );

      e.target.value = "";

      return;
    }


    setIcon(file);


    // ===============================================
    // PREVIEW
    // ===============================================

    const previewUrl =
      URL.createObjectURL(file);

    setPreview(previewUrl);

  };


  // =================================================
  // SUBMIT
  // =================================================

  const handleSubmit = async (e) => {

    e.preventDefault();


    // ===============================================
    // VALIDATION
    // ===============================================

    const oldModule =
      moduleName.trim();

    const newModule =
      module.trim();


    if (!oldModule) {

      toast.error(
        "Old module name not found"
      );

      return;
    }


    if (!newModule) {

      toast.error(
        "Please enter module name"
      );

      return;
    }


    if (!icon) {

      toast.error(
        "Please select a new PNG icon"
      );

      return;
    }


    // ===============================================
    // SUBMIT
    // ===============================================

    try {

      setLoading(true);


      const response =
        await updateModule(
          oldModule,
          newModule,
          icon
        );


      console.log(
        "UPDATE MODULE RESPONSE:",
        response
      );


      // =============================================
      // SUCCESS
      // =============================================

      if (response?.success) {

        toast.success(
          response?.message ||
          "Module updated successfully"
        );


        // =========================================
        // REDIRECT
        // =========================================

        router.push(
          "/dashboard/modules"
        );

        router.refresh();

      }
      else {

        toast.error(
          response?.message ||
          "Failed to update module"
        );

      }

    }
    catch (error) {

      console.error(
        "UPDATE MODULE ERROR:",
        error
      );


      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update module"
      );

    }
    finally {

      setLoading(false);

    }

  };


  // =================================================
  // UI
  // =================================================

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


          {/* ======================================
              OLD MODULE
          ======================================= */}

          <div>

            <label className="block mb-2 font-semibold">
              Old Module Name
            </label>

            <input
              type="text"
              value={moduleName}
              readOnly
              className="
                w-full
                border
                border-gray-300
                bg-gray-100
                rounded-md
                px-4
                py-3
                outline-none
                cursor-not-allowed
              "
            />

          </div>


          {/* ======================================
              NEW MODULE
          ======================================= */}

          <div>

            <label className="block mb-2 font-semibold">
              Edit Module Name
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
              placeholder="Enter new module name"
            />

          </div>


          {/* ======================================
              NEW ICON
          ======================================= */}

          <div>

            <label className="block mb-2 font-semibold">
              New Module Icon
            </label>

            <input
              type="file"
              accept="image/png"
              onChange={handleIconChange}
              className="
                w-full
                border
                border-gray-300
                rounded-md
                px-4
                py-3
                cursor-pointer
              "
            />


            <p className="text-sm text-gray-500 mt-2">
              Only PNG images are allowed. Maximum size: 2 MB.
            </p>


            {/* ==================================
                PREVIEW
            =================================== */}

            {preview && (

              <div className="mt-4">

                <p className="font-semibold mb-2">
                  Icon Preview
                </p>

                <div className="
                  w-24
                  h-24
                  border
                  border-gray-300
                  rounded-md
                  flex
                  items-center
                  justify-center
                  overflow-hidden
                  bg-gray-50
                ">

                  <img
                    src={preview}
                    alt="Module icon preview"
                    className="
                      max-w-full
                      max-h-full
                      object-contain
                    "
                  />

                </div>

              </div>

            )}

          </div>


          {/* ======================================
              BUTTONS
          ======================================= */}

          <div className="flex gap-3">

            <button
              type="submit"
              disabled={loading}
              className="
                bg-blue-500
                text-white
                px-5
                py-3
                rounded-md
                font-semibold
                hover:bg-blue-600
                cursor-pointer
                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >

              {loading
                ? "Updating..."
                : "Update Module"
              }

            </button>


            <button
              type="button"
              disabled={loading}
              onClick={() =>
                router.push(
                  "/dashboard/modules"
                )
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
                disabled:opacity-50
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