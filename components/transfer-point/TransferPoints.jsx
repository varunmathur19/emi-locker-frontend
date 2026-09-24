"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { IoMdArrowDropdown } from "react-icons/io";
import { RiSearchLine } from "react-icons/ri";

import {
  getKeySettings,
  getDropdownUsers,
  getAllStaffData,
  getRoles,
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

const TRANSACTION_TYPES = {
  TRANSFER: 0,
  SCHEMA_TRANSFER: 1,
  REVERT: 2,
};

const getUserName = (user) =>
  user?.name ||
  user?.organization_name ||
  user?.email ||
  `User ${user?.id}`;

const filterUsers = (users, search) => {
  const value = search.trim().toLowerCase();

  if (!value) {
    return users;
  }

  return users.filter((user) => {
    const name = String(user?.name || "").toLowerCase();
    const organization = String(
      user?.organization_name || ""
    ).toLowerCase();
    const email = String(user?.email || "").toLowerCase();
    const phone = String(user?.phone || "").toLowerCase();

    return (
      name.includes(value) ||
      organization.includes(value) ||
      email.includes(value) ||
      phone.includes(value)
    );
  });
};

const getUserKeyBalance = (user, key) => {
  if (!user || !key) {
    return 0;
  }

  let wallet = user?.wallet_balance;

  if (
    wallet === null ||
    wallet === undefined ||
    wallet === ""
  ) {
    return 0;
  }

  if (typeof wallet === "string") {
    try {
      wallet = JSON.parse(wallet);
    } catch {
      return 0;
    }
  }

  const keyId = String(key?.id || "")
    .trim()
    .toLowerCase();

  const keyName = String(key?.name || "")
    .trim()
    .toLowerCase();

  if (Array.isArray(wallet)) {
    const item = wallet.find((walletItem) => {
      const itemId = String(
        walletItem?.id ??
          walletItem?.key_id ??
          ""
      )
        .trim()
        .toLowerCase();

      const itemName = String(
        walletItem?.name ??
          walletItem?.key_name ??
          ""
      )
        .trim()
        .toLowerCase();

      return (
        (keyId && itemId === keyId) ||
        (keyName && itemName === keyName)
      );
    });

    return Number(
      item?.balance ??
        item?.amount ??
        0
    );
  }

  if (
    typeof wallet === "object" &&
    wallet !== null
  ) {
    if (
      key?.name &&
      wallet[key.name] !== undefined
    ) {
      const value = wallet[key.name];

      if (
        typeof value === "object" &&
        value !== null
      ) {
        return Number(
          value?.balance ??
            value?.amount ??
            0
        );
      }

      return Number(value || 0);
    }

    const matchedItem = Object.values(wallet).find(
      (item) => {
        if (
          !item ||
          typeof item !== "object"
        ) {
          return false;
        }

        const itemId = String(
          item?.id ??
            item?.key_id ??
            ""
        )
          .trim()
          .toLowerCase();

        const itemName = String(
          item?.name ??
            item?.key_name ??
            ""
        )
          .trim()
          .toLowerCase();

        return (
          (keyId && itemId === keyId) ||
          (keyName && itemName === keyName)
        );
      }
    );

    if (matchedItem) {
      return Number(
        matchedItem?.balance ??
          matchedItem?.amount ??
          0
      );
    }

    const matchedKey = Object.keys(wallet).find(
      (objectKey) =>
        String(objectKey)
          .trim()
          .toLowerCase() === keyName
    );

    if (matchedKey) {
      const value = wallet[matchedKey];

      if (
        typeof value === "object" &&
        value !== null
      ) {
        return Number(
          value?.balance ??
            value?.amount ??
            0
        );
      }

      return Number(value || 0);
    }
  }

  return 0;
};

function UserDropdown({
  value,
  users,
  search,
  setSearch,
  open,
  setOpen,
  loading,
  disabled,
  placeholder,
  searchPlaceholder,
  onSelect,
}) {
  const filteredUsers = useMemo(
    () => filterUsers(users, search),
    [users, search]
  );

  const selectedUser = users.find(
    (user) =>
      Number(user?.id) === Number(value)
  );

  const selectedUserName =
    getUserName(selectedUser);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => !prev)
        }
        disabled={disabled}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
      >
        <span className="truncate">
          {loading
            ? "Loading users..."
            : value && selectedUser
            ? selectedUserName
            : placeholder}
        </span>

        <IoMdArrowDropdown
          size={22}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 p-2">
            <div className="relative">
              <RiSearchLine
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder={searchPlaceholder}
                autoFocus
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Loading users...
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isSelected =
                  Number(value) ===
                  Number(user?.id);

                const userName =
                  getUserName(user);

                return (
                  <button
                    key={user?.id}
                    type="button"
                    onClick={() =>
                      onSelect(user?.id)
                    }
                    className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition ${
                      isSelected
                        ? "bg-blue-50"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        isSelected
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {String(userName)
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          isSelected
                            ? "text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {userName}
                      </p>

                      {user?.email && (
                        <p className="truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <span className="text-sm font-bold text-blue-600">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-4 py-6 text-center text-sm text-gray-400">
                No users found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransferPoint() {
  const searchParams = useSearchParams();

  const transactionTypeParam =
    searchParams.get("transaction_type");

  const transactionType =
    transactionTypeParam === null
      ? TRANSACTION_TYPES.TRANSFER
      : Number(transactionTypeParam);

  const isRevert =
    transactionType ===
    TRANSACTION_TYPES.REVERT;

  const isSchemaTransfer =
    transactionType ===
    TRANSACTION_TYPES.SCHEMA_TRANSFER;

  const [keySettings, setKeySettings] =
    useState([]);

  const [selectedKey, setSelectedKey] =
    useState(null);

  // Sender's own balance.
  // Normal transfer validation uses this balance.
  const [walletBalance, setWalletBalance] =
    useState(0);

  const [roleId, setRoleId] =
    useState(null);

  const [roles, setRoles] =
    useState([]);

  const [transferPoint, setTransferPoint] =
    useState("");

  // For normal transfer:
  // selected Transfer To user's selected-key balance.
  //
  // For revert:
  // selected revert user's selected-key balance.
  const [availableBalance, setAvailableBalance] =
    useState(0);

  const [selectedFromRole, setSelectedFromRole] =
    useState("");

  const [selectedTransferUser, setSelectedTransferUser] =
    useState("");

  const [selectedRevertUser, setSelectedRevertUser] =
    useState("");

  const [transferUsers, setTransferUsers] =
    useState([]);

  const [revertUsers, setRevertUsers] =
    useState([]);

  const [transferUserSearch, setTransferUserSearch] =
    useState("");

  const [revertUserSearch, setRevertUserSearch] =
    useState("");

  const [fromRoleDropdownOpen, setFromRoleDropdownOpen] =
    useState(false);

  const [transferUserDropdownOpen, setTransferUserDropdownOpen] =
    useState(false);

  const [revertUserDropdownOpen, setRevertUserDropdownOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [loadingRoles, setLoadingRoles] =
    useState(false);

  const [loadingTransferUsers, setLoadingTransferUsers] =
    useState(false);

  const [loadingRevertUsers, setLoadingRevertUsers] =
    useState(false);

  const [transferLoading, setTransferLoading] =
    useState(false);

  const [message, setMessage] =
    useState({
      type: "",
      text: "",
    });

  const selectedKeyData = useMemo(
    () =>
      keySettings.find(
        (item) =>
          Number(item?.id) ===
          Number(selectedKey)
      ),
    [keySettings, selectedKey]
  );

  const selectedTransferUserData =
    useMemo(
      () =>
        transferUsers.find(
          (user) =>
            Number(user?.id) ===
            Number(selectedTransferUser)
        ),
      [
        transferUsers,
        selectedTransferUser,
      ]
    );

  const selectedRevertUserData =
    useMemo(
      () =>
        revertUsers.find(
          (user) =>
            Number(user?.id) ===
            Number(selectedRevertUser)
        ),
      [
        revertUsers,
        selectedRevertUser,
      ]
    );

  const selectedFromRoleData =
    useMemo(
      () =>
        roles.find(
          (role) =>
            Number(role?.role_id) ===
            Number(selectedFromRole)
        ),
      [roles, selectedFromRole]
    );

  const nextRoleId =
    roleId !== null
      ? nextRoleMap[roleId]
      : null;

  const nextRoleName =
    roleNames[nextRoleId] || "";

  const selectedFromRoleName =
    selectedFromRoleData?.name ||
    roleNames[
      Number(selectedFromRole)
    ] ||
    "";

  const transferPointName =
    selectedKeyData?.name || "";

  const loadKeySettings = async () => {
    try {
      setLoading(true);

      const response =
        await getKeySettings();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        const activeKeys =
          response.data.filter(
            (item) =>
              Number(item?.status) === 1
          );

        setKeySettings(activeKeys);

        if (activeKeys.length > 0) {
          setSelectedKey((previous) => {
            const existing =
              activeKeys.find(
                (item) =>
                  Number(item?.id) ===
                  Number(previous)
              );

            const key =
              existing || activeKeys[0];

            setWalletBalance(
              Number(key?.balance || 0)
            );

            return key.id;
          });
        } else {
          setSelectedKey(null);
          setWalletBalance(0);
          setAvailableBalance(0);
        }
      } else {
        setKeySettings([]);
        setSelectedKey(null);
        setWalletBalance(0);
        setAvailableBalance(0);
      }
    } catch (error) {
      console.error(
        "GET ACTIVE KEY SETTINGS ERROR:",
        error
      );

      setKeySettings([]);
      setSelectedKey(null);
      setWalletBalance(0);
      setAvailableBalance(0);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const response =
        await getRoles();

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        const activeRoles =
          response.data
            .filter(
              (role) =>
                Number(
                  role?.status ?? 1
                ) === 1
            )
            .sort(
              (a, b) =>
                Number(
                  a?.sequence ??
                    a?.role_id ??
                    0
                ) -
                Number(
                  b?.sequence ??
                    b?.role_id ??
                    0
                )
            );

        setRoles(activeRoles);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error(
        "GET ROLES ERROR:",
        error
      );

      setRoles([]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadTransferUsers = async (
    currentRoleId
  ) => {
    try {
      const nextRoleId =
        nextRoleMap[currentRoleId];

      if (
        nextRoleId === undefined ||
        nextRoleId === null
      ) {
        setTransferUsers([]);
        return;
      }

      const user = getUser();

      const currentUserId =
        Number(user?.id);

      if (!currentUserId) {
        setTransferUsers([]);
        return;
      }

      setLoadingTransferUsers(true);

      const response =
        await getDropdownUsers(
          nextRoleId,
          currentUserId
        );

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        setTransferUsers(
          response.data
        );
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

  const loadRevertUsers = async (
    targetRoleId
  ) => {
    try {
      const role =
        Number(targetRoleId);

      if (!Number.isFinite(role)) {
        setRevertUsers([]);
        return;
      }

      setLoadingRevertUsers(true);
      setRevertUsers([]);

      const response =
        await getAllStaffData(
          1,
          1000,
          role,
          "",
          ""
        );

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        setRevertUsers(
          response.data
        );
      } else {
        setRevertUsers([]);
      }
    } catch (error) {
      console.error(
        "GET REVERT USERS ERROR:",
        error
      );

      setRevertUsers([]);
    } finally {
      setLoadingRevertUsers(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await loadKeySettings();
      await loadRoles();

      const currentRole =
        Number(getRoleId());

      if (!Number.isFinite(currentRole)) {
        return;
      }

      setRoleId(currentRole);

      if (!isRevert) {
        await loadTransferUsers(
          currentRole
        );
      }
    };

    loadData();
  }, [transactionType]);

  /*
   * IMPORTANT:
   *
   * Normal Transfer:
   *   Available Balance = selected Transfer To user's
   *   selected key balance.
   *
   * Revert:
   *   Available Balance = selected revert user's
   *   selected key balance.
   *
   * If no user or key is selected:
   *   Available Balance = 0
   */
  useEffect(() => {
    const selectedUser = isRevert
      ? selectedRevertUserData
      : selectedTransferUserData;

    if (
      !selectedUser ||
      !selectedKeyData
    ) {
      setAvailableBalance(0);
      return;
    }

    const balance =
      getUserKeyBalance(
        selectedUser,
        selectedKeyData
      );

    setAvailableBalance(
      Number.isFinite(balance)
        ? balance
        : 0
    );
  }, [
    isRevert,
    selectedRevertUserData,
    selectedTransferUserData,
    selectedKeyData,
  ]);

  const handleKeySelect = (id) => {
    setSelectedKey(id);
    setTransferPoint("");

    setMessage({
      type: "",
      text: "",
    });

    const key =
      keySettings.find(
        (item) =>
          Number(item?.id) ===
          Number(id)
      );

    // Sender's own balance.
    setWalletBalance(
      Number(key?.balance || 0)
    );

    // Reset temporarily.
    // useEffect will calculate selected
    // target user's balance for this key.
    setAvailableBalance(0);
  };

  const handleTransferUserSelect = (
    userId
  ) => {
    setSelectedTransferUser(
      String(userId)
    );

    setTransferPoint("");
    setTransferUserSearch("");
    setTransferUserDropdownOpen(false);

    setMessage({
      type: "",
      text: "",
    });

    // Immediately reset.
    // The balance effect will calculate
    // the selected target user's balance.
    setAvailableBalance(0);
  };

  const handleFromRoleSelect = async (
    role
  ) => {
    const targetRoleId =
      Number(role?.role_id);

    if (!Number.isFinite(targetRoleId)) {
      return;
    }

    setSelectedFromRole(
      String(targetRoleId)
    );

    setSelectedRevertUser("");
    setRevertUsers([]);
    setRevertUserSearch("");
    setAvailableBalance(0);
    setTransferPoint("");
    setFromRoleDropdownOpen(false);

    setMessage({
      type: "",
      text: "",
    });

    await loadRevertUsers(
      targetRoleId
    );
  };

  const handleRevertUserSelect = (
    userId
  ) => {
    setSelectedRevertUser(
      String(userId)
    );

    setRevertUserSearch("");
    setRevertUserDropdownOpen(false);
    setTransferPoint("");
    setAvailableBalance(0);

    setMessage({
      type: "",
      text: "",
    });
  };

  const handleTransferPointChange = (
    event
  ) => {
    const value =
      event.target.value;

    if (
      value === "" ||
      Number(value) >= 0
    ) {
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

    if (isRevert) {
      if (!selectedFromRole) {
        setMessage({
          type: "error",
          text: "Please select a role",
        });
        return;
      }

      if (!selectedRevertUser) {
        setMessage({
          type: "error",
          text: "Please select a user",
        });
        return;
      }
    } else {
      if (!selectedTransferUser) {
        setMessage({
          type: "error",
          text: "Please select a user",
        });
        return;
      }
    }

    const points =
      Number(transferPoint);

    if (
      !Number.isFinite(points) ||
      points <= 0
    ) {
      setMessage({
        type: "error",
        text: isRevert
          ? "Please enter valid revert points"
          : "Please enter valid transfer points",
      });
      return;
    }

    /*
     * IMPORTANT:
     *
     * Normal Transfer:
     * Validate points against SENDER balance.
     *
     * Revert:
     * Validate points against SELECTED USER balance.
     */
    const balance = isRevert
      ? availableBalance
      : walletBalance;

    if (points > balance) {
      setMessage({
        type: "error",
        text: `Insufficient balance. Available balance is ${Number(
          balance || 0
        ).toLocaleString("en-IN")}`,
      });
      return;
    }

    try {
      setTransferLoading(true);

      const targetUserId =
        isRevert
          ? selectedRevertUser
          : selectedTransferUser;

      const response =
        await transferWalletPoints(
          targetUserId,
          selectedKey,
          points,
          transactionType
        );

      if (!response?.success) {
        setMessage({
          type: "error",
          text:
            response?.message ||
            (isRevert
              ? "Failed to revert points"
              : "Failed to transfer points"),
        });

        return;
      }

      setMessage({
        type: "success",
        text:
          response?.message ||
          (isRevert
            ? "Points reverted successfully"
            : "Points transferred successfully"),
      });

      setTransferPoint("");

      /*
       * Notify Sidebar to refresh wallet balance.
       */
      if (
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(
          new Event(
            "wallet_balance_updated"
          )
        );
      }

      /*
       * Update balances from backend response
       * immediately if available.
       */
      if (response?.data) {
        if (
          response.data
            .from_balance_after !==
          undefined
        ) {
          setWalletBalance(
            Number(
              response.data
                .from_balance_after
            )
          );
        }

        if (
          response.data
            .to_balance_after !==
          undefined
        ) {
          setAvailableBalance(
            Number(
              response.data
                .to_balance_after
            )
          );
        }
      }

      /*
       * Refresh latest key settings.
       */
      await loadKeySettings();

      const currentRole =
        Number(getRoleId());

      if (
        Number.isFinite(currentRole)
      ) {
        if (isRevert) {
          if (selectedFromRole) {
            await loadRevertUsers(
              Number(selectedFromRole)
            );
          }
        } else {
          await loadTransferUsers(
            currentRole
          );
        }
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
          (isRevert
            ? "Failed to revert points"
            : "Failed to transfer points"),
      });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">
            {isRevert
              ? "Revert Point"
              : isSchemaTransfer
              ? "Schema Transfer Point"
              : "Transfer Point"}
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
                const selected =
                  Number(selectedKey) ===
                  Number(item?.id);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleKeySelect(
                        item.id
                      )
                    }
                    disabled={
                      transferLoading
                    }
                    className={`cursor-pointer rounded-lg border px-4 py-3 text-left transition disabled:cursor-not-allowed ${
                      selected
                        ? "border-blue-500 bg-blue-500 text-white shadow-md"
                        : "border-gray-300 bg-white text-gray-700 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">
                        {item?.name ||
                          "Unnamed Key"}
                      </span>

                      <span
                        className={`rounded-md px-2 py-1 text-xs font-bold ${
                          selected
                            ? "bg-white/20 text-white"
                            : "bg-blue-50 text-blue-600"
                        }`}
                      >
                        {Number(
                          item?.balance || 0
                        ).toLocaleString(
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
          {isRevert ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  From Role
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setFromRoleDropdownOpen(
                        (prev) => !prev
                      )
                    }
                    disabled={
                      loadingRoles ||
                      transferLoading ||
                      roles.length === 0
                    }
                    className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                  >
                    <span className="truncate">
                      {loadingRoles
                        ? "Loading roles..."
                        : selectedFromRoleName ||
                          "Select Role"}
                    </span>

                    <IoMdArrowDropdown
                      size={22}
                      className={`transition-transform ${
                        fromRoleDropdownOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {fromRoleDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                      {roles.map((role) => {
                        const roleValue =
                          Number(
                            role?.role_id
                          );

                        const roleName =
                          role?.name ||
                          roleNames[
                            roleValue
                          ] ||
                          `Role ${roleValue}`;

                        const selected =
                          Number(
                            selectedFromRole
                          ) ===
                          roleValue;

                        return (
                          <button
                            key={
                              role?.id ??
                              role?.role_id
                            }
                            type="button"
                            onClick={() =>
                              handleFromRoleSelect(
                                role
                              )
                            }
                            className={`flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left text-sm font-semibold ${
                              selected
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>
                              {roleName}
                            </span>

                            {selected && (
                              <span className="font-bold text-blue-600">
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Select User
                </label>

                <UserDropdown
                  value={
                    selectedRevertUser
                  }
                  users={revertUsers}
                  search={
                    revertUserSearch
                  }
                  setSearch={
                    setRevertUserSearch
                  }
                  open={
                    revertUserDropdownOpen
                  }
                  setOpen={
                    setRevertUserDropdownOpen
                  }
                  loading={
                    loadingRevertUsers
                  }
                  disabled={
                    !selectedFromRole ||
                    loadingRevertUsers ||
                    transferLoading ||
                    revertUsers.length === 0
                  }
                  placeholder={
                    selectedFromRole
                      ? `Select ${selectedFromRoleName}`
                      : "Select Role First"
                  }
                  searchPlaceholder={`Search ${selectedFromRoleName}...`}
                  onSelect={
                    handleRevertUserSelect
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Available Balance
                </label>

                <input
                  type="number"
                  value={
                    availableBalance
                  }
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Revert Point
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    transferPoint
                  }
                  onChange={
                    handleTransferPointChange
                  }
                  disabled={
                    transferLoading ||
                    !selectedRevertUser
                  }
                  placeholder={
                    transferPointName
                      ? `Enter ${transferPointName}`
                      : "Enter points"
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  {isSchemaTransfer
                    ? "Schema Transfer Point"
                    : "Transfer Point"}
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    transferPoint
                  }
                  onChange={
                    handleTransferPointChange
                  }
                  disabled={
                    transferLoading
                  }
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

                <UserDropdown
                  value={
                    selectedTransferUser
                  }
                  users={
                    transferUsers
                  }
                  search={
                    transferUserSearch
                  }
                  setSearch={
                    setTransferUserSearch
                  }
                  open={
                    transferUserDropdownOpen
                  }
                  setOpen={
                    setTransferUserDropdownOpen
                  }
                  loading={
                    loadingTransferUsers
                  }
                  disabled={
                    !nextRoleName ||
                    loadingTransferUsers ||
                    transferLoading ||
                    transferUsers.length === 0
                  }
                  placeholder={
                    nextRoleName
                      ? `Select ${nextRoleName}`
                      : "No user available"
                  }
                  searchPlaceholder={`Search ${nextRoleName}...`}
                  onSelect={
                    handleTransferUserSelect
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Available Balance
                </label>

                {/* 
                  Normal Transfer:
                  This shows SELECTED TARGET USER's
                  selected key balance.
                  
                  No target user selected:
                  value = 0
                */}
                <input
                  type="number"
                  value={
                    availableBalance
                  }
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
                />
              </div>
            </div>
          )}

          {message.text && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm font-medium ${
                message.type ===
                "success"
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
              onClick={
                handleTransfer
              }
              disabled={
                transferLoading ||
                loading ||
                !selectedKey ||
                !transferPoint ||
                (isRevert
                  ? !selectedRevertUser
                  : !selectedTransferUser)
              }
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {transferLoading
                ? isRevert
                  ? "Reverting..."
                  : "Transferring..."
                : isRevert
                ? "Revert Points"
                : isSchemaTransfer
                ? "Schema Transfer"
                : "Transfer Points"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}