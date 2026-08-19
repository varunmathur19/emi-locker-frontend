"use client";

import { useState } from "react";
import Link from "next/link";
import { RiAddLine, RiDeleteBinLine, RiEditLine } from "react-icons/ri";
import { toast } from "react-toastify";

export default function ModulePage() {
  const [moduleName, setModuleName] = useState("");

  const [modules, setModules] = useState([
    {
      id: 1,
      name: "Devices",
    },
  ]);

  const handleAddModule = (e) => {
    e.preventDefault();

    const name = moduleName.trim();

    if (!name) {
      toast.error("Please enter module name");
      return;
    }

    const alreadyExists = modules.some(
      (module) =>
        module.name.toLowerCase() === name.toLowerCase()
    );

    if (alreadyExists) {
      toast.error("Module already exists");
      return;
    }

    const newModule = {
      id: Date.now(),
      name,
    };

    setModules((prev) => [...prev, newModule]);

    setModuleName("");

    toast.success("Module added successfully");
  };

  const handleDeleteModule = (id) => {
    setModules((prev) =>
      prev.filter((module) => module.id !== id)
    );

    toast.success("Module deleted");
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Modules
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Create and manage dashboard modules
            </p>
          </div>

          <Link
            href="/dashboard/sub-module"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-blue-500
              text-white
              px-4
              py-2.5
              rounded-lg
              hover:bg-blue-600
              transition
              font-semibold
            "
          >
            Manage Sub Modules
          </Link>

        </div>


        {/* ADD MODULE */}
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

          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Add Module
          </h2>

          <div className="flex flex-col md:flex-row gap-3">

            <input
              type="text"
              value={moduleName}
              onChange={(e) =>
                setModuleName(e.target.value)
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

            <button
              type="submit"
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
              "
            >
              <RiAddLine size={20} />
              Add Module
            </button>

          </div>

        </form>


        {/* MODULE LIST */}
        <div>

          <h2 className="text-lg font-semibold text-slate-700 mb-4">
            Module List
          </h2>

          {modules.length === 0 ? (

            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
              No modules found
            </div>

          ) : (

            <div className="space-y-3">

              {modules.map((module, index) => (

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

                  <div className="flex items-center gap-4">

                    <div
                      className="
                        w-10
                        h-10
                        rounded-lg
                        bg-blue-50
                        text-blue-600
                        flex
                        items-center
                        justify-center
                        font-bold
                      "
                    >
                      {index + 1}
                    </div>

                    <div>
                      <p className="font-semibold text-slate-800">
                        {module.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        Module
                      </p>
                    </div>

                  </div>


                  <div className="flex items-center gap-2">

                    <button
                      type="button"
                      className="
                        p-2
                        rounded-lg
                        text-blue-600
                        hover:bg-blue-50
                        cursor-pointer
                      "
                      title="Edit Module"
                    >
                      <RiEditLine size={20} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteModule(module.id)
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

              ))}

            </div>

          )}

        </div>

      </div>
    </div>
  );
}