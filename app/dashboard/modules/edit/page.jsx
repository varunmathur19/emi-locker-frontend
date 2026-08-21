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

  const router =
    useRouter();

  const searchParams =
    useSearchParams();


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

  const [moduleSequence, setModuleSequence] =
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

    setModule(
      moduleName
    );

  }, [moduleName]);


  // =================================================
  // HANDLE ICON
  // =================================================

  const handleIconChange = (e) => {

    const file =
      e.target.files?.[0];


    if (!file) {

      setIcon(null);

      setPreview("");

      return;

    }


    // ===============================================
    // PNG ONLY
    // ===============================================

    if (
      file.type !==
      "image/png"
    ) {

      toast.error(
        "Only PNG images are allowed"
      );

      e.target.value = "";

      setIcon(null);

      setPreview("");

      return;

    }


    // ===============================================
    // 20 KB LIMIT
    // ===============================================

    const maxSize =
      20 * 1024;


    if (
      file.size >
      maxSize
    ) {

      toast.error(
        "PNG icon size must not exceed 20 KB"
      );

      e.target.value = "";

      setIcon(null);

      setPreview("");

      return;

    }


    // ===============================================
    // SET ICON
    // ===============================================

    setIcon(file);


    // ===============================================
    // PREVIEW
    // ===============================================

    const previewUrl =
      URL.createObjectURL(file);

    setPreview(
      previewUrl
    );

  };


  // =================================================
  // SUBMIT
  // =================================================

  const handleSubmit =
    async (e) => {

      e.preventDefault();


      // =============================================
      // OLD MODULE
      // =============================================

      const oldModule =
        moduleName.trim();


      if (!oldModule) {

        toast.error(
          "Old module name not found"
        );

        return;

      }


      // =============================================
      // NEW MODULE
      // =============================================

      const newModule =
        module.trim();


      // =============================================
      // CHECK NAME CHANGE
      // =============================================

      const hasNameChange =
        newModule !== "" &&
        newModule.toLowerCase() !==
          oldModule.toLowerCase();


      // =============================================
      // CHECK SEQUENCE CHANGE
      // =============================================

      const hasSequenceChange =
        moduleSequence !== "" &&
        moduleSequence !== null &&
        moduleSequence !== undefined;


      // =============================================
      // CHECK ICON CHANGE
      // =============================================

      const hasIconChange =
        !!icon;


      // =============================================
      // AT LEAST ONE FIELD REQUIRED
      // =============================================

      if (
        !hasNameChange &&
        !hasSequenceChange &&
        !hasIconChange
      ) {

        toast.error(
          "Please update at least one field"
        );

        return;

      }


      // =============================================
      // SEQUENCE
      // =============================================

      let sequence = "";


      if (hasSequenceChange) {

        sequence =
          Number(
            moduleSequence
          );


        if (
          !Number.isInteger(sequence) ||
          sequence < 1
        ) {

          toast.error(
            "Please enter valid sequence number"
          );

          return;

        }

      }


      // =============================================
      // ICON VALIDATION
      // ONLY WHEN ICON IS SELECTED
      // =============================================

      if (hasIconChange) {

        if (
          icon.type !==
          "image/png"
        ) {

          toast.error(
            "Only PNG images are allowed"
          );

          return;

        }


        if (
          icon.size >
          20 * 1024
        ) {

          toast.error(
            "PNG icon size must not exceed 20 KB"
          );

          return;

        }

      }


      // =============================================
      // API CALL
      // =============================================

      try {

        setLoading(true);


        console.log(
          "========== UPDATE MODULE =========="
        );


        console.log(
          "OLD MODULE:",
          oldModule
        );


        console.log(
          "NAME UPDATED:",
          hasNameChange
        );


        console.log(
          "NEW MODULE:",
          hasNameChange
            ? newModule
            : "NO CHANGE"
        );


        console.log(
          "SEQUENCE UPDATED:",
          hasSequenceChange
        );


        console.log(
          "NEW SEQUENCE:",
          hasSequenceChange
            ? sequence
            : "NO CHANGE"
        );


        console.log(
          "ICON UPDATED:",
          hasIconChange
        );


        console.log(
          "ICON:",
          hasIconChange
            ? icon
            : "NO CHANGE"
        );


        // =========================================
        // API
        // =========================================

        const response =
          await updateModule(

            oldModule,

            hasNameChange
              ? newModule
              : "",

            hasSequenceChange
              ? sequence
              : "",

            hasIconChange
              ? icon
              : null

          );


        console.log(
          "UPDATE MODULE RESPONSE:",
          response
        );


        // =========================================
        // SUCCESS
        // =========================================

        if (
          response?.success
        ) {

          toast.success(
            response?.message ||
            "Module updated successfully"
          );


          // =======================================
          // REDIRECT
          // =======================================

          router.push(
            "/dashboard/modules"
          );

          router.refresh();

          return;

        }


        // =========================================
        // API FAILED
        // =========================================

        toast.error(
          response?.message ||
          "Failed to update module"
        );

      }
      catch (error) {

        console.error(
          "UPDATE MODULE ERROR:",
          error
        );


        // =========================================
        // DUPLICATE MODULE
        // =========================================

        if (
          error?.response?.status ===
          409
        ) {

          toast.error(
            error?.response?.data?.message ||
            "Module already exists"
          );

          return;

        }


        // =========================================
        // DUPLICATE SEQUENCE
        // =========================================

        if (
          error?.response?.status ===
          422
        ) {

          toast.error(
            error?.response?.data?.message ||
            "Sequence is already used"
          );

          return;

        }


        // =========================================
        // OTHER ERROR
        // =========================================

        toast.error(
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update module"
        );

      }
      finally {

        setLoading(
          false
        );

      }

    };


  // =================================================
  // UI
  // =================================================

  return (

    <div
      className="
        max-w-2xl
        mx-auto
      "
    >

      <div
        className="
          bg-white
          rounded-lg
          shadow
          p-6
        "
      >

        <h1
          className="
            text-2xl
            font-bold
            mb-6
          "
        >
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

            <label
              className="
                block
                mb-2
                font-semibold
              "
            >
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

            <label
              className="
                block
                mb-2
                font-semibold
              "
            >
              Edit Module Name
            </label>


            <input
              type="text"
              value={module}
              onChange={(e) =>
                setModule(
                  e.target.value
                )
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
              NEW SEQUENCE
          ======================================= */}

          <div>

            <label
              className="
                block
                mb-2
                font-semibold
              "
            >
              Module Sequence
            </label>


            <input
              type="number"
              min="1"
              value={moduleSequence}
              onChange={(e) =>
                setModuleSequence(
                  e.target.value
                )
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
              placeholder="Enter sequence number"
            />


            <p
              className="
                text-sm
                text-gray-500
                mt-2
              "
            >
              Sequence determines the module display order.
            </p>

          </div>


          {/* ======================================
              NEW ICON
          ======================================= */}

          <div>

            <label
              className="
                block
                mb-2
                font-semibold
              "
            >
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


            <p
              className="
                text-sm
                text-gray-500
                mt-2
              "
            >
              PNG icon is optional.
              Maximum size: 20 KB.
            </p>


            {/* ==================================
                PREVIEW
            =================================== */}

            {preview && (

              <div
                className="
                  mt-4
                "
              >

                <p
                  className="
                    font-semibold
                    mb-2
                  "
                >
                  Icon Preview
                </p>


                <div
                  className="
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
                  "
                >

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
          ====================================== */}

          <div
            className="
              flex
              gap-3
            "
          >

            {/* UPDATE */}

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


            {/* CANCEL */}

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