"use client";

import { useEffect, useState } from "react";
import { IoMdArrowDropdown } from "react-icons/io";
import {
  getKeySettings,
  getDropdownUsers,
  transferWalletPoints,
} from "@/services/api";
import { getRoleId, getUser } from "@/utils/token";

const roleNames = {
  0: "Master Admin",
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
  0: 1,
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

  const [selectedTransferUser, setSelectedTransferUser] =
    useState("");

  const [transferUsers, setTransferUsers] = useState([]);
  const [loadingTransferUsers, setLoadingTransferUsers] =
    useState(false);

  const [transferLoading, setTransferLoading] =
    useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const loadKeySettings = async () => {
    try {
      const response = await getKeySettings();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        const activeKeys = response.data.filter(
          (item) => Number(item?.status) === 1
        );

        setKeySettings(activeKeys);

        if (selectedKey !== null) {
          const selectedKeyData = activeKeys.find(
            (item) =>
              Number(item.id) === Number(selectedKey)
          );

          setWalletBalance(
            Number(selectedKeyData?.balance || 0)
          );
        }
      } else {
        setKeySettings([]);
        setWalletBalance(0);
      }
    } catch (error) {
      console.error(
        "GET ACTIVE KEY SETTINGS ERROR:",
        error
      );

      setKeySettings([]);
      setWalletBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const loadTransferUsers = async (currentRoleId) => {
    try {
      const nextRoleId = nextRoleMap[currentRoleId];

      if (
        nextRoleId === undefined ||
        nextRoleId === null
      ) {
        setTransferUsers([]);
        return;
      }

      const user = getUser();
      const currentUserId = Number(user?.id);

      if (!currentUserId) {
        setTransferUsers([]);
        return;
      }

      setLoadingTransferUsers(true);

      const response = await getDropdownUsers(
        nextRoleId,
        currentUserId
      );

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        setTransferUsers(response.data);
      } else {
        setTransferUsers([]);
      }
    } catch (error) {
      console.error(
        "GET TRANSFER USERS ERROR:",
        error
      );

      setTransferUsers([]);
    } finally {
      setLoadingTransferUsers(false);
    }
  };

  const getUserKeyBalance = (user, keyName) => {
    if (!user || !keyName) {
      return 0;
    }

    let userWallet = user.wallet_balance || [];

    if (typeof userWallet === "string") {
      try {
        userWallet = JSON.parse(userWallet);
      } catch (error) {
        userWallet = [];
      }
    }

    if (!Array.isArray(userWallet)) {
      return 0;
    }

    const walletItem = userWallet.find(
      (item) =>
        String(item?.name || "")
          .trim()
          .toLowerCase() ===
        String(keyName || "")
          .trim()
          .toLowerCase()
    );

    return Number(walletItem?.balance || 0);
  };

  useEffect(() => {
    const loadData = async () => {
      await loadKeySettings();

      const currentRole = Number(getRoleId());

      if (Number.isFinite(currentRole)) {
        setRoleId(currentRole);
        await loadTransferUsers(currentRole);
      }
    };

    loadData();
  }, []);

  const selectedKeyData = keySettings.find(
    (item) =>
      Number(item.id) === Number(selectedKey)
  );

  const handleKeySelect = (id) => {
    setSelectedKey(id);
    setTransferPoint("");

    setMessage({
      type: "",
      text: "",
    });

    const selectedKeyItem = keySettings.find(
      (item) =>
        Number(item.id) === Number(id)
    );

    setWalletBalance(
      Number(selectedKeyItem?.balance || 0)
    );

    if (
      selectedTransferUser &&
      selectedKeyItem
    ) {
      const selectedUser = transferUsers.find(
        (user) =>
          Number(user.id) ===
          Number(selectedTransferUser)
      );

      const receiverBalance = getUserKeyBalance(
        selectedUser,
        selectedKeyItem.name
      );

      setAvailableBalance(receiverBalance);
    } else {
      setAvailableBalance(0);
    }
  };

  const handleTransferUserChange = (userId) => {
    setSelectedTransferUser(userId);

    setMessage({
      type: "",
      text: "",
    });

    if (!userId) {
      setAvailableBalance(0);
      return;
    }

    if (!selectedKeyData) {
      setAvailableBalance(0);
      return;
    }

    const selectedUser = transferUsers.find(
      (user) =>
        Number(user.id) === Number(userId)
    );

    const receiverBalance = getUserKeyBalance(
      selectedUser,
      selectedKeyData.name
    );

    setAvailableBalance(receiverBalance);
  };

  const handleTransferPointChange = (e) => {
    const value = e.target.value;

    if (value === "" || Number(value) >= 0) {
      setTransferPoint(value);

      setMessage({
        type: "",
        text: "",
      });
    }
  };

  const handleTransfer = async () => {
    setMessage({
      type: "",
      text: "",
    });

    if (!selectedKey) {
      setMessage({
        type: "error",
        text: "Please select a key setting",
      });
      return;
    }

    if (!selectedTransferUser) {
      setMessage({
        type: "error",
        text: "Please select a user",
      });
      return;
    }

    const points = Number(transferPoint);

    if (
      !Number.isFinite(points) ||
      points <= 0
    ) {
      setMessage({
        type: "error",
        text: "Please enter valid transfer points",
      });
      return;
    }

    if (points > walletBalance) {
      setMessage({
        type: "error",
        text: `Insufficient wallet balance. Available balance is ${walletBalance.toLocaleString(
          "en-IN"
        )}`,
      });
      return;
    }

    try {
      setTransferLoading(true);

      const response = await transferWalletPoints(
        selectedTransferUser,
        selectedKey,
        points
      );

      if (!response?.success) {
        setMessage({
          type: "error",
          text:
            response?.message ||
            "Failed to transfer points",
        });
        return;
      }

      setMessage({
        type: "success",
        text:
          response?.message ||
          "Points transferred successfully",
      });

      setTransferPoint("");

      if (response?.data) {
        setWalletBalance(
          Number(
            response.data.from_balance_after || 0
          )
        );

        setAvailableBalance(
          Number(
            response.data.to_balance_after || 0
          )
        );
      }

      await loadKeySettings();

      const currentRole = Number(getRoleId());

      if (Number.isFinite(currentRole)) {
        await loadTransferUsers(currentRole);
      }
    } catch (error) {
      console.error(
        "TRANSFER WALLET POINTS ERROR:",
        error
      );

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to transfer points",
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const transferPointName =
    selectedKeyData?.name || "";

  const nextRoleId =
    roleId !== null
      ? nextRoleMap[roleId]
      : null;

  const nextRoleName =
    roleNames[nextRoleId] || "";

  return (
    <div className="min-h-screen">
      <div className="rounded-xl bg-white p-6 shadow-sm">
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
                  Number(selectedKey) ===
                  Number(item.id);

                const balance = Number(
                  item.balance || 0
                );

                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() =>
                      handleKeySelect(item.id)
                    }
                    disabled={transferLoading}
                    className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed ${
                      isSelected
                        ? "border-blue-500 bg-blue-500 text-white shadow-md"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {item.name ||
                          "Unnamed Key"}
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 text-xs font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {balance.toLocaleString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
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
                disabled={transferLoading}
                placeholder={
                  transferPointName
                    ? `Enter ${transferPointName}`
                    : "Enter amount"
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Transfer To
              </label>

              <div className="relative">
                <select
                  value={selectedTransferUser}
                  onChange={(e) =>
                    handleTransferUserChange(
                      e.target.value
                    )
                  }
                  disabled={
                    !nextRoleName ||
                    loadingTransferUsers ||
                    transferLoading
                  }
                  className="w-full appearance-none cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                >
                  <option value="">
                    {loadingTransferUsers
                      ? "Loading users..."
                      : nextRoleName
                      ? `Select ${nextRoleName}`
                      : "No user available"}
                  </option>

                  {transferUsers.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.name ||
                        user.organization_name ||
                        user.email ||
                        `User ${user.id}`}
                    </option>
                  ))}
                </select>

                <IoMdArrowDropdown
                  size={22}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                />
              </div>
            </div>

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

          {message.text && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleTransfer}
              disabled={
                transferLoading ||
                loading ||
                !selectedKey ||
                !selectedTransferUser ||
                !transferPoint
              }
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {transferLoading
                ? "Transferring..."
                : "Transfer Points"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}