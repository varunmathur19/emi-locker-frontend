"use client";

import {
  useEffect,
  useState,
} from "react";
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
  deleteModule
} from "@/services/api";
const getIconUrl = (icon) => {
  if (!icon) return "";

  // Agar backend already complete URL de raha hai
  if (
    icon.startsWith("http://") ||
    icon.startsWith("https://")
  ) {
    return icon;
  }

  // Backend ka base URL
  const baseURL =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

  return `${baseURL}/${icon.replace(/^\/+/, "")}`;
};

export default function ModulePage() {
   const router = useRouter();

  const [moduleName, setModuleName] =
    useState("");

    const [moduleIcon, setModuleIcon] =
  useState(null);

const [iconPreview, setIconPreview] =
  useState("");

  const [modules, setModules] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [adding, setAdding] =
    useState(false);

    const [deleteModal, setDeleteModal] = useState({
  open: false,
  moduleName: "",
});

  // =====================================================
  // GET MODULES
  // =====================================================



  useEffect(() => {

    const loadModules = async () => {

      try {

        setLoading(true);

        const response =
          await getModules();

        console.log(
          "GET MODULES RESPONSE:",
          response
        );

        if (
          response?.success &&
          Array.isArray(response?.modules)
        ) {

          const formattedModules =
  response.modules.map(
    (item, index) => ({
      id: index + 1,
      name: item?.name || "",
      icon: item?.icon || "",
    })
  );

setModules(formattedModules);

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


  // =====================================================
  // ADD MODULE
  // =====================================================

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


    // ================================================
    // FRONTEND DUPLICATE CHECK
    // ================================================

    const alreadyExists =
      modules.some(
        (module) =>
          module.name
            .toLowerCase() ===
          name.toLowerCase()
      );

    if (alreadyExists) {

      toast.error(
        "Module already exists"
      );

      return;

    }


    try {

      setAdding(true);


      // ================================================
      // API CALL
      // POST /api/add-module
      //
      // BODY:
      // {
      //   module: "Sub Retailer"
      // }
      // ================================================

      const response =
  await addModule(
    name,
    moduleIcon
  );

      console.log(
        "ADD MODULE RESPONSE:",
        response
      );


      // ================================================
      // SUCCESS
      // ================================================

      if (response?.success) {

        // API se updated complete array milega
        if (
          Array.isArray(
            response?.modules
          )
        ) {

         const formattedModules =
  response.modules.map(
    (item, index) => ({
      id: index + 1,
      name: item?.name || "",
      icon: item?.icon || "",
    })
  );

setModules(formattedModules);

        } else {

          // fallback
          setModules(
            (prev) => [
              ...prev,
              {
                id: Date.now(),
                name,
              },
            ]
          );

        }


        setModuleName("");

        toast.success(
          "Module added successfully"
        );

      } else {

        toast.error(
          response?.message ||
          "Failed to add module"
        );

      }

    } catch (error) {

      console.error(
        "Add Module Error:",
        error
      );


      // ================================================
      // BACKEND 409 DUPLICATE
      // ================================================

      if (
        error?.response?.status === 409
      ) {

        toast.error(
          "Module already exists"
        );

      } else {

        toast.error(
          error?.response?.data?.message ||
          "Failed to add module"
        );

      }

    } finally {

      setAdding(false);

    }

  };

const handleModuleIconChange = (e) => {

  const file =
    e.target.files?.[0];

  if (!file) {
    setModuleIcon(null);
    return;
  }


  // ================================================
  // PNG ONLY
  // ================================================

  if (file.type !== "image/png") {

    toast.error(
      "Only PNG images are allowed"
    );

    e.target.value = "";
    setModuleIcon(null);

    return;
  }


  // ================================================
  // MAX 20 KB
  // ================================================

  const maxSize =
    20 * 1024; // 20 KB

  if (file.size > maxSize) {

    toast.error(
      "PNG icon size must not exceed 20 KB"
    );

    e.target.value = "";
    setModuleIcon(null);

    return;
  }


  // ================================================
  // SET ICON
  // ================================================

  setModuleIcon(file);

  console.log(
    "MODULE ICON:",
    file.name,
    file.size,
    "bytes"
  );

};


 // =====================================================
// DELETE MODULE
// =====================================================

// =====================================================
// DELETE MODULE
// =====================================================

// =====================================================
// DELETE MODULE
// =====================================================

// =====================================================
// DELETE MODULE
// =====================================================

// =====================================================
// OPEN DELETE MODAL
// =====================================================

const handleDeleteModule = (moduleName) => {

  setDeleteModal({
    open: true,
    moduleName,
  });

};


// =====================================================
// CONFIRM DELETE MODULE
// =====================================================

const confirmDeleteModule = async () => {

  const moduleName =
    deleteModal.moduleName;

  if (!moduleName) {
    return;
  }

  try {

    const response =
      await deleteModule(moduleName);

    console.log(
      "DELETE MODULE RESPONSE:",
      response
    );


    if (response?.success === true) {

      if (
        Array.isArray(
          response?.modules
        )
      ) {

        const formattedModules =
          response.modules.map(
            (item, index) => ({

              id: index + 1,

              name:
                item?.name || "",

              icon:
                item?.icon || "",

            })
          );

        setModules(
          formattedModules
        );

      } else {

        setModules(
          (prev) =>
            prev.filter(
              (item) =>
                item.name
                  .trim()
                  .toLowerCase() !==
                moduleName
                  .trim()
                  .toLowerCase()
            )
        );

      }


      // CLOSE MODAL

      setDeleteModal({
        open: false,
        moduleName: "",
      });


      toast.success(
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
      error?.response?.data?.message ||
      "Failed to delete module"
    );

  }

};

  // =====================================================
  // UI
  // =====================================================

  return (

    <>
    {deleteModal.open && (

  <div
    className="
      fixed
      inset-0
      z-50
      flex
      items-center
      justify-center
      bg-black/50
      px-4
    "
  >

    {/* MODAL */}

    <div
      className="
        w-full
        max-w-md
        bg-white
        rounded-2xl
        shadow-2xl
        p-6
        animate-in
        fade-in
        zoom-in
        duration-200
      "
    >

      {/* TITLE */}

      <h2
        className="
          text-xl
          font-bold
          text-slate-800
          mb-3
        "
      >
        Are you sure?
      </h2>


      {/* MESSAGE */}

      <p
        className="
          text-sm
          text-slate-600
          leading-6
        "
      >
        Are you sure you want to delete this module?
      </p>


      {/* MODULE NAME */}

      <p
        className="
          mt-2
          font-semibold
          text-slate-800
        "
      >
        {deleteModal.moduleName}
      </p>


      {/* BUTTONS */}

      <div
        className="
          flex
          justify-end
          gap-3
          mt-6
        "
      >

        {/* CANCEL */}

        <button
          type="button"
          onClick={() =>
            setDeleteModal({
              open: false,
              moduleName: "",
            })
          }
          className="
            px-5
            py-2.5
            rounded-lg
            border
            border-slate-300
            text-slate-700
            font-semibold
            hover:bg-slate-100
            transition
            cursor-pointer
          "
        >
          Cancel
        </button>


        {/* DELETE */}

        <button
          type="button"
          onClick={confirmDeleteModule}
          className="
            px-5
            py-2.5
            rounded-lg
            bg-red-500
            text-white
            font-semibold
            hover:bg-red-600
            transition
            cursor-pointer
          "
        >
          Delete
        </button>

      </div>

    </div>

  </div>

)}
    <div className="max-w-5xl mx-auto">

      <div
        className="
          bg-white
          rounded-2xl
          shadow-xl
          border
          border-slate-100
          p-6
        "
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-4
            mb-6
          "
        >



        

        </div>


        {/* =================================================
            ADD MODULE
        ================================================= */}

        <form
          onSubmit={handleAddModule}
          className="
            border
            border-slate-200
            rounded-xl
            p-5
            bg-slate-50
            mb-6
          "
        >

          <h2
            className="
              text-lg
              font-semibold
              text-slate-700
              mb-4
            "
          >
            Add Module
          </h2>

<div
  className="
    flex
    flex-col
    md:flex-row
    gap-3
  "
>

  {/* =================================================
      MODULE NAME
  ================================================= */}

  <input
    type="text"
    value={moduleName}
    onChange={(e) =>
      setModuleName(
        e.target.value
      )
    }
    placeholder="Enter module name e.g. Devices"
    className="
      flex-1
      border
      border-slate-300
      rounded-lg
      px-4
      py-2.5
      text-sm
      bg-white
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
    "
  />


  {/* =================================================
      MODULE ICON
  ================================================= */}

  <div className="flex-1">

    <input
      type="file"
      accept="image/png"
      onChange={handleModuleIconChange}
      className="
        w-full
        border
        border-slate-300
        rounded-lg
        px-4
        py-2.5
        text-sm
        bg-white
        cursor-pointer
        focus:outline-none
        focus:ring-2
        focus:ring-blue-500
      "
    />

    <p className="text-xs text-slate-500 mt-1">
      PNG only, maximum 20 KB
    </p>

  </div>


  {/* =================================================
      ADD MODULE BUTTON
  ================================================= */}

  <button
    type="submit"
    disabled={adding}
    className="
      flex
      items-center
      justify-center
      gap-2
      bg-blue-500
      text-white
      px-5
      py-2.5
      rounded-lg
      hover:bg-blue-600
      transition
      font-semibold
      cursor-pointer
      disabled:opacity-50
      disabled:cursor-not-allowed
    "
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


        {/* =================================================
            MODULE LIST
        ================================================= */}

        <div>

          <h2
            className="
              text-lg
              font-semibold
              text-slate-700
              mb-4
            "
          >
            Module List
          </h2>


          {/* LOADING */}

          {loading ? (

            <div
              className="
                border
                border-slate-200
                rounded-xl
                p-8
                text-center
                text-slate-500
              "
            >
              Loading modules...
            </div>

          ) : modules.length === 0 ? (

            /* EMPTY */

            <div
              className="
                border
                border-dashed
                border-slate-300
                rounded-xl
                p-8
                text-center
                text-slate-500
              "
            >
              No modules found
            </div>

          ) : (

            /* LIST */

            <div
              className="
                space-y-3
              "
            >

              {modules.map(
                (module, index) => (

                  <div
                    key={module.id}
                    className="
                      flex
                      items-center
                      justify-between
                      border
                      border-slate-200
                      rounded-xl
                      px-4
                      py-4
                      bg-white
                      hover:shadow-sm
                      transition
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-4
                      "
                    >

      <div
  className="
    w-12
    h-12
    rounded-lg
    bg-blue-50
    flex
    items-center
    justify-center
    overflow-hidden
    border
    border-slate-200
  "
>
{module.icon ? (
  <img
    src={getIconUrl(module.icon)}
    alt={module.name || "Module icon"}
    className="
      w-6
      h-6
      object-contain
      p-0.5
    "
  />
) : (
  <span
    className="
      text-blue-600
      font-bold
      text-lg
    "
  >
    {index + 1}
  </span>
)}
</div>


                      <div>

                        <p
                          className="
                            font-semibold
                            text-slate-800
                          "
                        >
                          {module.name}
                        </p>

                        <p
                          className="
                            text-xs
                            text-slate-500
                          "
                        >
                          Module
                        </p>

                      </div>

                    </div>


                    <div
                      className="
                        flex
                        items-center
                        gap-2
                      "
                    >

                      {/* EDIT */}

                  <button
  type="button"
  onClick={() =>
    router.push(
      `/dashboard/modules/edit?module=${encodeURIComponent(module.name)}`
    )
  }
  className="
    p-2
    rounded-lg
    text-blue-500
    hover:bg-blue-50
    cursor-pointer
  "
  title="Edit Module"
>
  <RiEditLine size={20} />
</button>


                      {/* DELETE */}
<button
  type="button"
  onClick={() =>
    handleDeleteModule(module.name)
  }
  className="
    p-2
    rounded-lg
    text-red-500
    hover:bg-red-50
    cursor-pointer
  "
  title="Delete Module"
>
  <RiDeleteBinLine size={20} />
</button>

                    </div>

                  </div>

                )
              )}

            </div>

          )}

        </div>

      </div>

    </div>
    
    </>


  );

}