"use client";

import { useState } from "react";
import Link from "next/link";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
} from "react-icons/ri";
import { toast } from "react-toastify";

export default function SubModulePage() {

  const [selectedModule, setSelectedModule] =
    useState("");

  const [subModuleName, setSubModuleName] =
    useState("");

  const [modules] = useState([
    {
      id: 1,
      name: "Devices",
    },
  ]);

  const [subModules, setSubModules] = useState([
    {
      id: 1,
      module_id: 1,
      name: "New Device",
    },
    {
      id: 2,
      module_id: 1,
      name: "Old Device",
    },
  ]);


  const handleAddSubModule = (e) => {

    e.preventDefault();

    if (!selectedModule) {
      toast.error("Please select module");
      return;
    }

    const name = subModuleName.trim();

    if (!name) {
      toast.error("Please enter sub module name");
      return;
    }

    const alreadyExists = subModules.some(
      (item) =>
        Number(item.module_id) ===
          Number(selectedModule) &&
        item.name.toLowerCase() ===
          name.toLowerCase()
    );

    if (alreadyExists) {
      toast.error(
        "This sub module already exists"
      );

      return;
    }

    const newSubModule = {
      id: Date.now(),
      module_id: Number(selectedModule),
      name,
    };

    setSubModules((prev) => [
      ...prev,
      newSubModule,
    ]);

    setSubModuleName("");

    toast.success(
      "Sub module added successfully"
    );
  };


  const handleDeleteSubModule = (id) => {

    setSubModules((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );

    toast.success(
      "Sub module deleted"
    );
  };


  const selectedModuleName =
    modules.find(
      (module) =>
        Number(module.id) ===
        Number(selectedModule)
    )?.name || "";


  const filteredSubModules =
    selectedModule
      ? subModules.filter(
          (item) =>
            Number(item.module_id) ===
            Number(selectedModule)
        )
      : [];


  return (

    <div className="max-w-5xl mx-auto">

      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

          <div>

            <h1 className="text-2xl font-bold text-slate-800">
              Sub Modules
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Create sub modules inside modules
            </p>

          </div>


          <Link
            href="/dashboard/module"
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              bg-gray-700
              text-white
              px-4
              py-2.5
              rounded-lg
              hover:bg-gray-800
              transition
              font-semibold
            "
          >
            Manage Modules
          </Link>

        </div>


        {/* ADD SUB MODULE */}

        <form
          onSubmit={handleAddSubModule}
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
            Add Sub Module
          </h2>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* MODULE */}

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Select Module
              </label>

              <select
                value={selectedModule}
                onChange={(e) =>
                  setSelectedModule(
                    e.target.value
                  )
                }
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
              >

                <option value="">
                  Select Module
                </option>

                {modules.map((module) => (

                  <option
                    key={module.id}
                    value={module.id}
                  >
                    {module.name}
                  </option>

                ))}

              </select>

            </div>


            {/* SUB MODULE NAME */}

            <div>

              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Sub Module Name
              </label>

              <input
                type="text"
                value={subModuleName}
                onChange={(e) =>
                  setSubModuleName(
                    e.target.value
                  )
                }
                placeholder="e.g. New Device"
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

            </div>

          </div>


          <div className="mt-4 flex justify-end">

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

              Add Sub Module

            </button>

          </div>

        </form>


        {/* LIST */}

        <div>

          <h2 className="text-lg font-semibold text-slate-700 mb-4">

            {selectedModuleName
              ? `${selectedModuleName} Sub Modules`
              : "Sub Module List"}

          </h2>


          {!selectedModule ? (

            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">

              Select a module to see sub modules

            </div>

          ) : filteredSubModules.length === 0 ? (

            <div className="border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">

              No sub modules found

            </div>

          ) : (

            <div className="space-y-3">

              {filteredSubModules.map(
                (subModule, index) => (

                  <div
                    key={subModule.id}
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
                          {subModule.name}
                        </p>

                        <p className="text-xs text-slate-500">
                          {selectedModuleName}
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
                      >

                        <RiEditLine
                          size={20}
                        />

                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSubModule(
                            subModule.id
                          )
                        }
                        className="
                          p-2
                          rounded-lg
                          text-red-500
                          hover:bg-red-50
                          cursor-pointer
                        "
                      >

                        <RiDeleteBinLine
                          size={20}
                        />

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

  );
}