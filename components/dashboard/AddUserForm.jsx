"use client";

export default function AddUserForm({
  open,
  onClose,
  title,
}) {

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">

      <div className="bg-white w-[900px] max-h-[90vh] overflow-y-auto rounded-lg shadow-lg p-8">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            {title}
          </h2>

          <button
            onClick={onClose}
            className="text-3xl cursor-pointer"
          >
            <i className="ri-close-line"></i>
          </button>

        </div>

        <form className="grid grid-cols-2 gap-5">

          {/* Organization */}

          <div>
            <label className="block mb-2 font-medium">
              Organization Name
            </label>

            <input
              type="text"
              placeholder="Organization Name"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Role */}

          <div>
            <label className="block mb-2 font-medium">
              Role
            </label>

            <input
              type="text"
              value={title.replace("Add ", "")}
              readOnly
              className="w-full border rounded-md p-3 bg-gray-100"
            />
          </div>

          {/* Name */}

          <div>
            <label className="block mb-2 font-medium">
              Name
            </label>

            <input
              type="text"
              placeholder="Enter Name"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Email */}

          <div>
            <label className="block mb-2 font-medium">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter Email"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Phone */}

          <div>
            <label className="block mb-2 font-medium">
              Phone
            </label>

            <input
              type="text"
              placeholder="Enter Phone"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Password */}

          <div>
            <label className="block mb-2 font-medium">
              Password
            </label>

            <input
              type="password"
              placeholder="Enter Password"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Confirm Password */}

          <div>
            <label className="block mb-2 font-medium">
              Confirm Password
            </label>

            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Company Address */}

          <div>
            <label className="block mb-2 font-medium">
              Company Address
            </label>

            <input
              type="text"
              placeholder="Company Address"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Country */}

          <div>
            <label className="block mb-2 font-medium">
              Country
            </label>

            <input
              type="text"
              placeholder="Country"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* State */}

          <div>
            <label className="block mb-2 font-medium">
              State
            </label>

            <input
              type="text"
              placeholder="State"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* City */}

          <div>
            <label className="block mb-2 font-medium">
              City
            </label>

            <input
              type="text"
              placeholder="City"
              className="w-full border rounded-md p-3 outline-none"
            />
          </div>

          {/* Buttons */}

          <div className="col-span-2 flex justify-end gap-4 mt-5">

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-md bg-gray-300 hover:bg-gray-400 cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-md bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
            >
              Save
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}