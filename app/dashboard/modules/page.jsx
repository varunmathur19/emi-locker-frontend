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
  deleteModule,
  updateModule
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
    const [moduleSequence, setModuleSequence] =
  useState("");

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
  response.modules
    .map((item, index) => ({
      id:
        item?.id ??
        index + 1,

      name:
        item?.name || "",

      icon:
        item?.icon || "",

      sequence:
        Number(
          item?.sequence ??
          index + 1
        ),

      // 1 = Active
      // 0 = Inactive
      status:
        Number(
          item?.status ?? 1
        ),
    }))
    .sort(
      (a, b) =>
        a.sequence -
        b.sequence
    );

setModules(
  formattedModules
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


  // =====================================================
  // ADD MODULE
  // =====================================================

const handleAddModule = async (e) => {

  e.preventDefault();

  // =====================================================
  // MODULE NAME
  // =====================================================

  const name =
    moduleName.trim();


  if (!name) {

    toast.error(
      "Please enter module name"
    );

    return;

  }


  // =====================================================
  // SEQUENCE
  // =====================================================

  const sequence =
    Number(moduleSequence);


  console.log(
    "========== ADD MODULE =========="
  );

  console.log(
    "MODULE NAME:",
    name
  );

  console.log(
    "MODULE SEQUENCE:",
    moduleSequence
  );

  console.log(
    "PARSED SEQUENCE:",
    sequence
  );

  console.log(
    "MODULE ICON:",
    moduleIcon
  );


  // =====================================================
  // SEQUENCE VALIDATION
  // =====================================================

  if (
    moduleSequence === "" ||
    moduleSequence === null ||
    moduleSequence === undefined ||
    !Number.isInteger(sequence) ||
    sequence < 1
  ) {

    toast.error(
      "Please enter valid sequence number"
    );

    return;

  }


  // =====================================================
  // ICON REQUIRED
  // =====================================================

  if (!moduleIcon) {

    toast.error(
      "Please select module icon"
    );

    return;

  }


  // =====================================================
  // PNG VALIDATION
  // =====================================================

  if (
    moduleIcon.type !==
    "image/png"
  ) {

    toast.error(
      "Only PNG images are allowed"
    );

    return;

  }


  // =====================================================
  // ICON SIZE VALIDATION
  // =====================================================

  const maxIconSize =
    20 * 1024;


  if (
    moduleIcon.size >
    maxIconSize
  ) {

    toast.error(
      "PNG icon size must not exceed 20 KB"
    );

    return;

  }


  // =====================================================
  // DUPLICATE MODULE NAME CHECK
  // =====================================================

  const alreadyExists =
    modules.some(
      (item) => {

        const existingName =
          String(
            item?.name || ""
          )
            .trim()
            .toLowerCase();

        return (
          existingName ===
          name.toLowerCase()
        );

      }
    );


  if (alreadyExists) {

    toast.error(
      `Module "${name}" already exists`
    );

    return;

  }


  // =====================================================
  // DUPLICATE SEQUENCE CHECK
  // =====================================================

  const sequenceExists =
    modules.some(
      (item) => {

        const existingSequence =
          Number(
            item?.sequence
          );

        return (
          existingSequence ===
          sequence
        );

      }
    );


  if (sequenceExists) {

    toast.error(
      `Sequence ${sequence} is already used`
    );

    return;

  }


  // =====================================================
  // API CALL
  // =====================================================

  try {

    setAdding(true);


    console.log(
      "========== CALLING ADD MODULE API =========="
    );

    console.log(
      "NAME:",
      name
    );

    console.log(
      "SEQUENCE:",
      sequence
    );

    console.log(
      "ICON:",
      moduleIcon.name
    );


    // ===================================================
    // IMPORTANT
    //
    // addModule order:
    //
    // 1. name
    // 2. sequence
    // 3. moduleIcon
    // ===================================================

    const response =
      await addModule(
        name,
        sequence,
        moduleIcon
      );


    console.log(
      "ADD MODULE API RESPONSE:",
      response
    );


    // =====================================================
    // API SUCCESS
    // =====================================================

    if (
      response?.success === true
    ) {


      // ===================================================
      // UPDATE MODULE LIST
      // ===================================================

      if (
        Array.isArray(
          response?.modules
        )
      ) {

        const formattedModules =
          response.modules
            .map(
              (item, index) => ({

                id:
                  item?.id ??
                  index + 1,

                name:
                  item?.name ||
                  "",

                icon:
                  item?.icon ||
                  "",

                sequence:
                  Number(
                    item?.sequence ??
                    index + 1
                  ),

              })
            )
            .sort(
              (a, b) =>
                a.sequence -
                b.sequence
            );


        setModules(
          formattedModules
        );

      } else {

        // =================================================
        // FALLBACK
        // =================================================

        setModules(
          (prev) => [

            ...prev,

            {

              id:
                Date.now(),

              name,

              icon:
                response?.icon ||
                "",

              sequence,

            },

          ].sort(
            (a, b) =>
              a.sequence -
              b.sequence
          )
        );

      }


      // =====================================================
      // RESET FORM
      // =====================================================

      setModuleName("");

      setModuleSequence("");

      setModuleIcon(null);


      // =====================================================
      // RESET FILE INPUT
      // =====================================================

      const fileInput =
        document.querySelector(
          'input[type="file"]'
        );


      if (fileInput) {

        fileInput.value = "";

      }


      // =====================================================
      // SUCCESS TOAST
      // =====================================================

      toast.success(
        `Module added successfully at sequence ${sequence}`
      );


      return;

    }


    // =====================================================
    // API RESPONSE FAILED
    // =====================================================

    toast.error(
      response?.message ||
      "Failed to add module"
    );


  } catch (error) {

    console.error(
      "========== ADD MODULE ERROR =========="
    );

    console.error(
      error
    );

    console.error(
      "STATUS:",
      error?.response?.status
    );

    console.error(
      "API RESPONSE:",
      error?.response?.data
    );


    // =====================================================
    // DUPLICATE MODULE
    // =====================================================

    if (
      error?.response?.status ===
      409
    ) {

      toast.error(
        error?.response?.data?.message ||
        `Module "${name}" already exists`
      );

      return;

    }


    // =====================================================
    // DUPLICATE SEQUENCE
    // =====================================================

    if (
      error?.response?.status ===
      422
    ) {

      toast.error(
        error?.response?.data?.message ||
        `Sequence ${sequence} is already used`
      );

      return;

    }


    // =====================================================
    // VALID SEQUENCE ERROR
    // =====================================================

    if (
      error?.message ===
      "Valid sequence number is required"
    ) {

      toast.error(
        "Please enter valid sequence number"
      );

      return;

    }


    // =====================================================
    // OTHER API ERROR
    // =====================================================

    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to add module"
    );


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
// TOGGLE MODULE STATUS


const handleToggleStatus = async (moduleItem) => {

  // ============================================
  // MODULE VALIDATION
  // ============================================

  if (!moduleItem?.name) {
    return;
  }


  // ============================================
  // CURRENT STATUS
  // 1 = Active
  // 0 = Deactive
  // ============================================

  const currentStatus =
    Number(moduleItem?.status ?? 1);


  // ============================================
  // NEW STATUS
  // ============================================

  const newStatus =
    currentStatus === 1
      ? 0
      : 1;


  try {

    // ============================================
    // UPDATE MODULE API
    // ONLY STATUS WILL CHANGE
    // ============================================

    const response =
      await updateModule(
        moduleItem.name, // oldModule
        "",              // newModule
        "",              // newSequence
        null,            // icon
        newStatus        // status
      );


    console.log(
      "STATUS UPDATE RESPONSE:",
      response
    );


    // ============================================
    // API ERROR
    // ============================================

    if (!response?.success) {

      toast.error(
        response?.message ||
        "Failed to update module status"
      );

      return;

    }


    // ============================================
    // UPDATE FRONTEND STATUS
    // ============================================

    setModules(
      (prev) =>
        prev.map(
          (item) => {

            if (
              item?.name
                ?.trim()
                .toLowerCase() ===
              moduleItem?.name
                ?.trim()
                .toLowerCase()
            ) {

              return {
                ...item,
                status: newStatus,
              };

            }

            return item;

          }
        )
    );


    // ============================================
    // SUCCESS TOAST
    // ============================================

    if (newStatus === 1) {

      // ACTIVE
      toast.success(
        `"${moduleItem.name}" is now Active`
      );

    } else {

      // DEACTIVE
      toast.error(
        `"${moduleItem.name}" is now Deactive`
      );

    }

  }
  catch (error) {

    // ============================================
    // ERROR
    // ============================================

    console.error(
      "TOGGLE MODULE STATUS ERROR:",
      error
    );


    toast.error(
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update module status"
    );

  }

};
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
  response.modules
    .map((item, index) => ({
      id:
        item?.id ??
        index + 1,

      name:
        item?.name || "",

      icon:
        item?.icon || "",

      sequence:
        Number(
          item?.sequence ??
          index + 1
        ),
    }))
    .sort(
      (a, b) =>
        a.sequence -
        b.sequence
    );

setModules(formattedModules);

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
    grid
    grid-cols-1
    md:grid-cols-2
    lg:flex
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
    w-full
    lg:flex-1
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
      MODULE SEQUENCE
  ================================================= */}

  <div className="w-full lg:w-32">

    <input
      type="number"
      min="1"
      value={moduleSequence}
      onChange={(e) =>
        setModuleSequence(
          e.target.value
        )
      }
      placeholder="Sequence"
      className="
        w-full
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

    <p className="text-xs text-slate-500 mt-1">
      Show order
    </p>

  </div>


  {/* =================================================
      MODULE ICON
  ================================================= */}

  <div className="w-full lg:flex-1">

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
     w-full
  lg:w-auto
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

        <div className="border border-slate-200 rounded-xl overflow-hidden">

  {/* =================================================
      TABLE HEADER
  ================================================= */}

  <div
    className="
      grid
      grid-cols-[60px_80px_minmax(150px,1fr)_100px_100px]
      items-center
      gap-3
      px-4
      py-3
      bg-slate-50
      border-b
      border-slate-200
      text-sm
      font-semibold
      text-slate-600
    "
  >

    {/* S.NO HEADER */}

    <div className="text-center">
      S.No.
    </div>


    {/* ICON HEADER */}

    <div className="text-center">
      Icon
    </div>


    {/* MODULE NAME HEADER */}

    <div>
      Module Name
    </div>


    {/* ACTIVE HEADER */}

    <div className="text-center">
      Active
    </div>


    {/* ACTION HEADER */}

    <div className="text-center">
      Actions
    </div>

  </div>


  {/* =================================================
      MODULE ROWS
  ================================================= */}

  {modules.map((module, index) => (

    <div
      key={module.id}
      className="
        grid
        grid-cols-[60px_80px_minmax(150px,1fr)_100px_100px]
        items-center
        gap-3
        px-4
        py-3
        bg-white
        border-b
        border-slate-100
        last:border-b-0
        hover:bg-slate-50
        transition
      "
    >

      {/* =================================================
          S.NO
      ================================================= */}

      <div className="text-center">

        <span
          className="
            inline-flex
            items-center
            justify-center
            w-8
            h-8
            rounded-lg
            bg-slate-100
            text-sm
            font-semibold
            text-slate-600
          "
        >
          {index + 1}
        </span>

      </div>


      {/* =================================================
          ICON
      ================================================= */}

      <div className="flex justify-center">

        <div
          className="
            w-11
            h-11
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
              alt={
                module.name ||
                "Module icon"
              }
              className="
                w-7
                h-7
                object-contain
              "
              onError={(e) => {
                e.currentTarget.style.display =
                  "none";
              }}
            />

          ) : (

            <span
              className="
                text-blue-600
                font-bold
                text-lg
              "
            >
              {module.name
                ?.charAt(0)
                ?.toUpperCase() || "M"}
            </span>

          )}

        </div>

      </div>


      {/* =================================================
          MODULE NAME
      ================================================= */}

      <div className="min-w-0">

        <p
          className="
            font-semibold
            text-slate-800
            truncate
          "
        >
          {module.name}
        </p>

        <p
          className="
            text-xs
            text-slate-500
            mt-0.5
          "
        >
          Sequence: {module.sequence}
        </p>

      </div>


      {/* =================================================
          ACTIVE
      ================================================= */}

     {/* =================================================
    ACTIVE / INACTIVE TOGGLE
================================================= */}

<div className="flex justify-center">

  <button
    type="button"
    onClick={() =>
      handleToggleStatus(module)
    }
    className={`
      relative
      inline-flex
      h-6
      w-11
      items-center
      rounded-full
      transition-colors
      duration-200
      cursor-pointer
      ${
        Number(module.status) === 1
          ? "bg-green-500"
          : "bg-gray-300"
      }
    `}
    title={
      Number(module.status) === 1
        ? "Active - Click to deactivate"
        : "Inactive - Click to activate"
    }
  >

    <span
      className={`
        inline-block
        h-5
        w-5
        transform
        rounded-full
        bg-white
        shadow
        transition-transform
        duration-200
        ${
          Number(module.status) === 1
            ? "translate-x-5"
            : "translate-x-0.5"
        }
      `}
    />

  </button>

</div>


      {/* =================================================
          ACTIONS
      ================================================= */}

      <div
        className="
          flex
          items-center
          justify-center
          gap-2
        "
      >

        {/* EDIT */}

        <button
          type="button"
          onClick={() =>
            router.push(
              `/dashboard/modules/edit?module=${encodeURIComponent(
                module.name
              )}`
            )
          }
          className="
            p-2
            rounded-lg
            text-blue-500
            hover:bg-blue-50
            cursor-pointer
            transition
          "
          title="Edit Module"
        >

          <RiEditLine
            size={20}
          />

        </button>


        {/* DELETE */}

        <button
          type="button"
          onClick={() =>
            handleDeleteModule(
              module.name
            )
          }
          className="
            p-2
            rounded-lg
            text-red-500
            hover:bg-red-50
            cursor-pointer
            transition
          "
          title="Delete Module"
        >

          <RiDeleteBinLine
            size={20}
          />

        </button>

      </div>

    </div>

  ))}

</div>

          )}

        </div>
 
      </div>

    </div>
    
    </>


  );

}