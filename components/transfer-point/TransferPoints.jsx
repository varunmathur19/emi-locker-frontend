"use client";

import { useEffect, useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import { getKeySettings } from "@/services/api";
import { getRoleId } from "@/utils/token";

const roleNames = {
1: "Admin",
2: "CNF",
3: "Super Distributor",
4: "Distributor",
5: "FOS",
6: "Retailer",
7: "Sub Retailer",
8: "Employee",
9: "Staff",
};

const nextRoleMap = {
1: 2,
2: 3,
3: 4,
4: 5,
5: 6,
6: 7,
7: 8,
8: 9,
};

export default function TransferPoint() {
const [keySettings, setKeySettings] = useState([]);
const [loading, setLoading] = useState(true);
const [selectedKey, setSelectedKey] = useState(null);

const [roleId, setRoleId] = useState(null);
const [walletBalance, setWalletBalance] = useState(0);
const [transferPoint, setTransferPoint] = useState("");
const [availableBalance, setAvailableBalance] = useState(0);
const [selectedTransferRole, setSelectedTransferRole] =
useState("");

const loadKeySettings = async () => {
try {
const response = await getKeySettings();

  console.log("KEY SETTINGS:", response);

  if (
    response?.success &&
    Array.isArray(response?.data)
  ) {
    const activeKeys = response.data.filter(
      (item) => Number(item?.status) === 1
    );

    setKeySettings(activeKeys);
  } else {
    setKeySettings([]);
  }
} catch (error) {
  console.error(
    "GET ACTIVE KEY SETTINGS ERROR:",
    error
  );

  setKeySettings([]);
} finally {
  setLoading(false);
}

};

useEffect(() => {
loadKeySettings();

const currentRole = Number(getRoleId());

if (Number.isFinite(currentRole)) {
  setRoleId(currentRole);
}

}, []);

const handleKeySelect = (id) => {
setSelectedKey(id);
setTransferPoint("");
setAvailableBalance(0);

const selectedKey = keySettings.find(
  (item) => item.id === id
);

if (selectedKey) {
  setWalletBalance(
    Number(selectedKey.balance || 0)
  );
} else {
  setWalletBalance(0);
}

};

const handleTransferPointChange = (e) => {
const value = e.target.value;

if (value === "" || Number(value) >= 0) {
  setTransferPoint(value);
}

};

const selectedKeyData = keySettings.find(
(item) => item.id === selectedKey
);

const transferPointName =
selectedKeyData?.name || "";

const nextRoleId = nextRoleMap[roleId];

const nextRoleName =
roleNames[nextRoleId] || "";

return ( <div className="min-h-screen"> <div className="rounded-xl bg-white p-6 shadow-sm">

 {/* Key Settings */}
    <div className="mb-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        Key Settings
      </h2>

      {loading ? (
        <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
          Loading key settings...
        </div>
      ) : keySettings.length === 0 ? (
        <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
          No active key settings found.
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {keySettings.map((item) => {
            const isSelected =
              selectedKey === item.id;

            const balance =
              Number(item.balance || 0);

            return (
              <button
                type="button"
                key={item.id}
                onClick={() =>
                  handleKeySelect(item.id)
                }
                className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition-all duration-200 ${
                  isSelected
                    ? "border-blue-500 bg-blue-500 text-white shadow-md"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {item.name || "Unnamed Key"}
                  </span>

                  <span
                    className={`rounded-md px-2 py-1 text-xs font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {balance.toLocaleString("en-IN")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>

    {/* Transfer Details */}
    <div className="border-t border-gray-200 pt-6">

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">

        {/* My Wallet Balance */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            My Wallet Balance
          </label>

          <input
            type="number"
            value={walletBalance}
            readOnly
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
          />
        </div>

        {/* Transfer Point */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Transfer Point
          </label>

          <input
            type="number"
            min="0"
            step="1"
            value={transferPoint}
            onChange={handleTransferPointChange}
            placeholder={
              transferPointName
                ? `Enter ${transferPointName}`
                : "Enter amount"
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Transfer To */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Transfer To
          </label>

          <div className="relative">
            <select
              value={selectedTransferRole}
              onChange={(e) =>
                setSelectedTransferRole(
                  e.target.value
                )
              }
              disabled={!nextRoleName}
              className="w-full appearance-none cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
            >
              <option value="">
                {nextRoleName
                  ? `Select ${nextRoleName}`
                  : "No role available"}
              </option>

              {nextRoleId && (
                <option value={nextRoleId}>
                  {nextRoleName}
                </option>
              )}
            </select>

            <IoMdArrowDropdown
              size={22}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
          </div>
        </div>

        {/* Available Balance */}
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Available Balance
          </label>

          <input
            type="number"
            value={availableBalance}
            readOnly
            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
          />
        </div>

      </div>

      {/* Transfer Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Transfer Points
        </button>
      </div>

    </div>
  </div>
</div>


);
}
