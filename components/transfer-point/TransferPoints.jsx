"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { IoMdArrowDropdown } from "react-icons/io";
import {
  RiSearchLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";
import { toast } from "react-toastify";

import {
  getKeySettings,
  getAllStaffData,
  getRoles,
  getWalletTransactions,
  transferWalletPoints,
  getStaffDataById,
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
  const value = String(search || "")
    .trim()
    .toLowerCase();

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

const getTransactionTypeName = (type) => {
  const value = Number(type);

  if (value === TRANSACTION_TYPES.TRANSFER) {
    return "Transfer Point";
  }

  if (
    value ===
    TRANSACTION_TYPES.SCHEMA_TRANSFER
  ) {
    return "Schema Transfer";
  }

  if (value === TRANSACTION_TYPES.REVERT) {
    return "Revert Point";
  }

  return "Transaction";
};

const getTransactionUserName = (
  transaction,
  side
) => {
  if (side === "from") {
    return (
      transaction?.from_user_name ||
      transaction?.from_name ||
      transaction?.sender_name ||
      transaction?.from_user?.name ||
      transaction?.from_user?.organization_name ||
      transaction?.from_email ||
      transaction?.sender_email ||
      transaction?.from_user_id ||
      "-"
    );
  }

  return (
    transaction?.to_user_name ||
    transaction?.to_name ||
    transaction?.receiver_name ||
    transaction?.to_user?.name ||
    transaction?.to_user?.organization_name ||
    transaction?.to_email ||
    transaction?.receiver_email ||
    transaction?.to_user_id ||
    "-"
  );
};

const getTransactionUserEmail = (
  transaction,
  side
) => {
  if (side === "from") {
    return (
      transaction?.from_user_email ||
      transaction?.from_email ||
      transaction?.sender_email ||
      transaction?.from_user?.email ||
      ""
    );
  }

  return (
    transaction?.to_user_email ||
    transaction?.to_email ||
    transaction?.receiver_email ||
    transaction?.to_user?.email ||
    ""
  );
};

const getTransactionUserId = (
  transaction,
  side
) => {
  if (side === "from") {
    return (
      transaction?.from_user_id ??
      transaction?.sender_id ??
      transaction?.from_id ??
      "-"
    );
  }

  return (
    transaction?.to_user_id ??
    transaction?.receiver_id ??
    transaction?.to_id ??
    "-"
  );
};

const getTransactionKeyName = (
  transaction
) =>
  transaction?.key_setting_name ||
  transaction?.key_name ||
  transaction?.keySetting?.name ||
  transaction?.key_setting?.name ||
  "-";

const getTransactionPoints = (
  transaction
) =>
  Number(
    transaction?.points ??
      transaction?.points_sent ??
      transaction?.amount ??
      transaction?.transfer_points ??
      0
  );

const formatTransactionDate = (
  value
) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        disabled={disabled}
        className="flex h-[46px] w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className="truncate">
          {loading
            ? "Loading users..."
            : selectedUser
            ? getUserName(selectedUser)
            : placeholder}
        </span>

        <IoMdArrowDropdown
          size={21}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${
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
                className="h-[40px] w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
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
                const selected =
                  Number(value) === Number(user?.id);

                const userName =
                  getUserName(user);

                return (
                  <button
                    key={user?.id}
                    type="button"
                    onClick={() =>
                      onSelect(user?.id)
                    }
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      selected
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        selected
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
                          selected
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

                    {selected && (
                      <span className="font-bold text-blue-600">
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

function RoleDropdown({
  value,
  roles,
  open,
  setOpen,
  loading,
  disabled,
  placeholder,
  onSelect,
}) {
  const selectedRole = roles.find(
    (role) =>
      Number(role?.role_id) === Number(value)
  );

  const selectedRoleName =
    selectedRole?.name ||
    roleNames[Number(value)] ||
    "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((previous) => !previous)
        }
        disabled={disabled}
        className="flex h-[46px] w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm font-medium text-gray-700 shadow-sm outline-none transition-all hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className="truncate">
          {loading
            ? "Loading roles..."
            : selectedRoleName || placeholder}
        </span>

        <IoMdArrowDropdown
          size={21}
          className={`shrink-0 text-gray-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
          {roles.length > 0 ? (
            roles.map((role) => {
              const roleId = Number(
                role?.role_id
              );

              const roleName =
                role?.name ||
                roleNames[roleId] ||
                `Role ${roleId}`;

              const selected =
                Number(value) === roleId;

              return (
                <button
                  key={
                    role?.id ??
                    role?.role_id
                  }
                  type="button"
                  onClick={() =>
                    onSelect(role)
                  }
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition ${
                    selected
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{roleName}</span>

                  {selected && (
                    <span className="font-bold">
                      ✓
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-6 text-center text-sm text-gray-400">
              No roles found
            </div>
          )}
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

  const [
    showTransactionPin,
    setShowTransactionPin,
  ] = useState(false);

  const [
    schemaKeyDropdownOpen,
    setSchemaKeyDropdownOpen,
  ] = useState(false);

  const [selectedKey, setSelectedKey] =
    useState("");

  const [walletBalance, setWalletBalance] =
    useState(0);

  const [availableBalance, setAvailableBalance] =
    useState(0);

  const [roleId, setRoleId] =
    useState(null);

  const [roles, setRoles] =
    useState([]);

  const [transferPoint, setTransferPoint] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [loadingRoles, setLoadingRoles] =
    useState(false);

  const [transferLoading, setTransferLoading] =
    useState(false);

  const [transactionPin, setTransactionPin] =
    useState("");

  const [
    transactionPinLoading,
    setTransactionPinLoading,
  ] = useState(false);

  const [
    transactionPinEntry,
    setTransactionPinEntry,
  ] = useState("");

  const [transferUsers, setTransferUsers] =
    useState([]);

  const [
    selectedTransferUser,
    setSelectedTransferUser,
  ] = useState("");

  const [
    transferUserSearch,
    setTransferUserSearch,
  ] = useState("");

  const [
    transferUserDropdownOpen,
    setTransferUserDropdownOpen,
  ] = useState(false);

  const [
    loadingTransferUsers,
    setLoadingTransferUsers,
  ] = useState(false);

  const [
    selectedSchemaRole,
    setSelectedSchemaRole,
  ] = useState("");

  const [schemaUsers, setSchemaUsers] =
    useState([]);

  const [
    selectedSchemaUser,
    setSelectedSchemaUser,
  ] = useState("");

  const [
    schemaUserSearch,
    setSchemaUserSearch,
  ] = useState("");

  const [
    schemaRoleDropdownOpen,
    setSchemaRoleDropdownOpen,
  ] = useState(false);

  const [
    schemaUserDropdownOpen,
    setSchemaUserDropdownOpen,
  ] = useState(false);

  const [
    loadingSchemaUsers,
    setLoadingSchemaUsers,
  ] = useState(false);

  const [
    selectedFromRole,
    setSelectedFromRole,
  ] = useState("");

  const [revertUsers, setRevertUsers] =
    useState([]);

  const [
    selectedRevertUser,
    setSelectedRevertUser,
  ] = useState("");

  const [
    revertUserSearch,
    setRevertUserSearch,
  ] = useState("");

  const [
    fromRoleDropdownOpen,
    setFromRoleDropdownOpen,
  ] = useState(false);

  const [
    revertUserDropdownOpen,
    setRevertUserDropdownOpen,
  ] = useState(false);

  const [
    loadingRevertUsers,
    setLoadingRevertUsers,
  ] = useState(false);

  const [
    recentTransactions,
    setRecentTransactions,
  ] = useState([]);

  const [
    recentTransactionsLoading,
    setRecentTransactionsLoading,
  ] = useState(false);

  const selectedKeyData = useMemo(
    () =>
      keySettings.find(
        (item) =>
          Number(item?.id) ===
          Number(selectedKey)
      ),
    [keySettings, selectedKey]
  );

  const selectedTransferUserData = useMemo(
    () =>
      transferUsers.find(
        (user) =>
          Number(user?.id) ===
          Number(selectedTransferUser)
      ),
    [transferUsers, selectedTransferUser]
  );

  const selectedSchemaUserData = useMemo(
    () =>
      schemaUsers.find(
        (user) =>
          Number(user?.id) ===
          Number(selectedSchemaUser)
      ),
    [schemaUsers, selectedSchemaUser]
  );

  const selectedRevertUserData = useMemo(
    () =>
      revertUsers.find(
        (user) =>
          Number(user?.id) ===
          Number(selectedRevertUser)
      ),
    [revertUsers, selectedRevertUser]
  );

  const selectedFromRoleData = useMemo(
    () =>
      roles.find(
        (role) =>
          Number(role?.role_id) ===
          Number(selectedFromRole)
      ),
    [roles, selectedFromRole]
  );

  const selectedSchemaRoleData = useMemo(
    () =>
      roles.find(
        (role) =>
          Number(role?.role_id) ===
          Number(selectedSchemaRole)
      ),
    [roles, selectedSchemaRole]
  );

  const availableRoleOptions = useMemo(
    () =>
      roles.filter(
        (role) =>
          Number(role?.role_id) !==
          Number(roleId)
      ),
    [roles, roleId]
  );

  /*
   * Schema Transfer role visibility:
   *
   * Master Admin / Admin:
   * - Show all active roles
   *
   * CNF / Super Distributor / Distributor / FOS:
   * - Hide Employee
   *
   * Retailer / Sub Retailer:
   * - Hide Staff
   */
  const schemaRoleOptions = useMemo(() => {
    return availableRoleOptions.filter(
      (role) => {
        const currentRole = Number(roleId);
        const targetRole = Number(
          role?.role_id
        );

        if (
          currentRole === 0 ||
          currentRole === 1
        ) {
          return true;
        }

        if (
          [2, 3, 4, 5].includes(currentRole)
        ) {
          return targetRole !== 8;
        }

        if (
          [6, 7].includes(currentRole)
        ) {
          return targetRole !== 9;
        }

        return true;
      }
    );
  }, [availableRoleOptions, roleId]);

  const nextRoleId = useMemo(() => {
    if (
      roleId === null ||
      roleId === undefined
    ) {
      return null;
    }

    const currentRole = Number(roleId);

    if (!Number.isFinite(currentRole)) {
      return null;
    }

    if (currentRole === 0) {
      return 1;
    }

    let nextRole =
      nextRoleMap[currentRole];

    while (
      nextRole !== undefined &&
      nextRole !== null
    ) {
      const activeRole = roles.find(
        (role) =>
          Number(role?.role_id) ===
            Number(nextRole) &&
          Number(role?.status ?? 1) === 1
      );

      if (activeRole) {
        return Number(
          activeRole.role_id
        );
      }

      nextRole =
        nextRoleMap[nextRole];
    }

    return null;
  }, [roleId, roles]);

  const nextRoleName =
    Number(roleId) === 0
      ? "Admin"
      : roleNames[nextRoleId] || "";

  const selectedFromRoleName =
    selectedFromRoleData?.name ||
    roleNames[Number(selectedFromRole)] ||
    "";

  const selectedSchemaRoleName =
    selectedSchemaRoleData?.name ||
    roleNames[Number(selectedSchemaRole)] ||
    "";

  const loadTransactionPin = async () => {
    try {
      setTransactionPinLoading(true);
      setTransactionPin("");

      const user = getUser();
      const userId = Number(user?.id);

      if (
        !Number.isFinite(userId) ||
        userId <= 0
      ) {
        return;
      }

      const response =
        await getStaffDataById(userId);

      const data =
        response?.data ?? response;

      let staffData = data;

      if (Array.isArray(data)) {
        staffData = data[0] || {};
      } else if (
        data?.data &&
        typeof data.data === "object"
      ) {
        staffData = Array.isArray(data.data)
          ? data.data[0] || {}
          : data.data;
      }

      const pin =
        staffData?.transaction_pin ??
        response?.transaction_pin ??
        "";

      setTransactionPin(
        pin === null ||
          pin === undefined
          ? ""
          : String(pin)
      );
    } catch (error) {
      console.error(
        "GET TRANSACTION PIN ERROR:",
        error
      );

      setTransactionPin("");
    } finally {
      setTransactionPinLoading(false);
    }
  };

  const loadRecentTransactions = async () => {
    try {
      setRecentTransactionsLoading(true);

      const response =
        await getWalletTransactions({
          page: 1,
          limit: 100,
          transaction_type: transactionType,
        });

      let transactions = [];

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        transactions = response.data;
      } else if (
        response?.success &&
        Array.isArray(response?.data?.data)
      ) {
        transactions =
          response.data.data;
      } else if (
        response?.success &&
        Array.isArray(
          response?.data?.transactions
        )
      ) {
        transactions =
          response.data.transactions;
      }

      const currentRoleId =
        Number(getRoleId());

      const currentUser = getUser();

      const currentUserId =
        Number(currentUser?.id);

      const isAdminRole =
        currentRoleId === 0 ||
        currentRoleId === 1;

      if (!isAdminRole) {
        transactions =
          transactions.filter(
            (transaction) => {
              const fromUserId = Number(
                transaction?.from_user_id ??
                  transaction?.sender_id ??
                  transaction?.from_id
              );

              const toUserId = Number(
                transaction?.to_user_id ??
                  transaction?.receiver_id ??
                  transaction?.to_id
              );

              return (
                fromUserId ===
                  currentUserId ||
                toUserId ===
                  currentUserId
              );
            }
          );
      }

      transactions.sort(
        (a, b) =>
          new Date(
            b?.created_at || 0
          ).getTime() -
          new Date(
            a?.created_at || 0
          ).getTime()
      );

      setRecentTransactions(
        transactions.slice(0, 5)
      );
    } catch (error) {
      console.error(
        "GET RECENT TRANSACTIONS ERROR:",
        error
      );

      setRecentTransactions([]);
    } finally {
      setRecentTransactionsLoading(false);
    }
  };

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

        if (activeKeys.length === 0) {
          setSelectedKey("");
          setWalletBalance(0);
          setAvailableBalance(0);
          return;
        }

        if (isSchemaTransfer) {
          setSelectedKey("");
          setWalletBalance(0);
          setAvailableBalance(0);
          return;
        }

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
        setKeySettings([]);
        setSelectedKey("");
        setWalletBalance(0);
        setAvailableBalance(0);
      }
    } catch (error) {
      console.error(
        "GET KEY SETTINGS ERROR:",
        error
      );

      setKeySettings([]);
      setSelectedKey("");
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
                Number(role?.status ?? 1) === 1
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

        return activeRoles;
      }

      setRoles([]);
      return [];
    } catch (error) {
      console.error(
        "GET ROLES ERROR:",
        error
      );

      setRoles([]);
      return [];
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadTransferUsers = async (
    currentRoleId,
    activeRoles = roles
  ) => {
    try {
      const currentRole =
        Number(currentRoleId);

      if (!Number.isFinite(currentRole)) {
        setTransferUsers([]);
        return;
      }

      let targetRoleId;

      if (currentRole === 0) {
        targetRoleId = 1;
      } else {
        let nextRole =
          nextRoleMap[currentRole];

        while (
          nextRole !== undefined &&
          nextRole !== null
        ) {
          const activeTargetRole =
            activeRoles.find(
              (role) =>
                Number(role?.role_id) ===
                  Number(nextRole) &&
                Number(role?.status ?? 1) === 1
            );

          if (activeTargetRole) {
            targetRoleId = Number(
              activeTargetRole.role_id
            );
            break;
          }

          nextRole =
            nextRoleMap[nextRole];
        }
      }

      if (
        targetRoleId === undefined ||
        targetRoleId === null
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
        await getAllStaffData(
          1,
          1000,
          targetRoleId,
          "",
          ""
        );

      let users = [];

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        users = response.data;
      } else if (
        response?.success &&
        Array.isArray(response?.data?.data)
      ) {
        users = response.data.data;
      } else if (
        response?.success &&
        Array.isArray(
          response?.data?.users
        )
      ) {
        users = response.data.users;
      }

      const filteredUsers =
        users.filter(
          (item) =>
            Number(item?.role_id) ===
              Number(targetRoleId) &&
            Number(item?.id) !==
              Number(currentUserId)
        );

      setTransferUsers(
        filteredUsers
      );
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

  const loadSchemaUsers = async (
    selectedRoleId
  ) => {
    try {
      const targetRoleId =
        Number(selectedRoleId);

      if (
        !Number.isFinite(targetRoleId)
      ) {
        setSchemaUsers([]);
        return;
      }

      setLoadingSchemaUsers(true);
      setSchemaUsers([]);

      const response =
        await getAllStaffData(
          1,
          1000,
          targetRoleId,
          "",
          ""
        );

      let users = [];

      if (
        response?.success &&
        Array.isArray(response?.data)
      ) {
        users = response.data;
      } else if (
        response?.success &&
        Array.isArray(response?.data?.data)
      ) {
        users = response.data.data;
      } else if (
        response?.success &&
        Array.isArray(
          response?.data?.users
        )
      ) {
        users = response.data.users;
      }

      setSchemaUsers(users);
    } catch (error) {
      console.error(
        "GET SCHEMA USERS ERROR:",
        error
      );

      setSchemaUsers([]);
    } finally {
      setLoadingSchemaUsers(false);
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
      } else if (
        response?.success &&
        Array.isArray(response?.data?.data)
      ) {
        setRevertUsers(
          response.data.data
        );
      } else if (
        response?.success &&
        Array.isArray(
          response?.data?.users
        )
      ) {
        setRevertUsers(
          response.data.users
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
      const currentRole =
        Number(getRoleId());

      if (
        !Number.isFinite(currentRole)
      ) {
        return;
      }

      setRoleId(currentRole);
      setTransactionPin("");
      setTransactionPinEntry("");

      await Promise.all([
        loadTransactionPin(),
        loadKeySettings(),
      ]);

      const activeRoles =
        await loadRoles();

      if (isSchemaTransfer) {
        setTransferUsers([]);
        setSchemaUsers([]);
        setSelectedSchemaRole("");
        setSelectedSchemaUser("");
        setAvailableBalance(0);
        return;
      }

      if (isRevert) {
        return;
      }

      await loadTransferUsers(
        currentRole,
        activeRoles
      );
    };

    loadData();
  }, [transactionType]);

  useEffect(() => {
    if (
      isSchemaTransfer ||
      isRevert ||
      roleId === null
    ) {
      return;
    }

    loadTransferUsers(
      roleId,
      roles
    );
  }, [
    roleId,
    roles,
    isSchemaTransfer,
    isRevert,
  ]);

  useEffect(() => {
    loadRecentTransactions();
  }, [transactionType, roleId]);

  useEffect(() => {
    let selectedUser = null;

    if (isRevert) {
      selectedUser =
        selectedRevertUserData;
    } else if (isSchemaTransfer) {
      selectedUser =
        selectedSchemaUserData;
    } else {
      selectedUser =
        selectedTransferUserData;
    }

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
    isSchemaTransfer,
    selectedRevertUserData,
    selectedSchemaUserData,
    selectedTransferUserData,
    selectedKeyData,
  ]);

  const handleKeySelect = (id) => {
    setSelectedKey(id);
    setTransferPoint("");

    const key =
      keySettings.find(
        (item) =>
          Number(item?.id) ===
          Number(id)
      );

    setWalletBalance(
      Number(key?.balance || 0)
    );

    setAvailableBalance(0);
    setTransactionPinEntry("");

    if (isSchemaTransfer) {
      setSelectedSchemaRole("");
      setSelectedSchemaUser("");
      setSchemaUsers([]);
      setSchemaUserSearch("");
      setSchemaRoleDropdownOpen(false);
      setSchemaUserDropdownOpen(false);
    }
  };

  const handleTransferUserSelect = (
    userId
  ) => {
    setSelectedTransferUser(
      String(userId)
    );

    setTransferUserSearch("");
    setTransferUserDropdownOpen(false);
    setAvailableBalance(0);
    setTransactionPinEntry("");
  };

  const handleSchemaRoleSelect = async (
    role
  ) => {
    const selectedRoleId =
      Number(role?.role_id);

    if (!Number.isFinite(selectedRoleId)) {
      return;
    }

    setSelectedSchemaRole(
      String(selectedRoleId)
    );

    setSelectedSchemaUser("");
    setSchemaUsers([]);
    setSchemaUserSearch("");
    setSchemaUserDropdownOpen(false);
    setAvailableBalance(0);
    setTransactionPinEntry("");
    setSchemaRoleDropdownOpen(false);

    await loadSchemaUsers(
      selectedRoleId
    );
  };

  const handleSchemaUserSelect = (
    userId
  ) => {
    setSelectedSchemaUser(
      String(userId)
    );

    setSchemaUserSearch("");
    setSchemaUserDropdownOpen(false);
    setAvailableBalance(0);
    setTransactionPinEntry("");
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
    setTransactionPinEntry("");
    setFromRoleDropdownOpen(false);

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
    setAvailableBalance(0);
    setTransactionPinEntry("");
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
    }
  };

  const handleTransactionPinChange = (
    event
  ) => {
    const value = event.target.value
      .replace(/\D/g, "")
      .slice(0, 4);

    setTransactionPinEntry(value);
  };

  const resetAllFields = () => {
    setAvailableBalance(0);
    setTransferPoint("");
    setTransactionPinEntry("");

    setSelectedTransferUser("");
    setTransferUserSearch("");
    setTransferUserDropdownOpen(false);

    setSelectedSchemaRole("");
    setSelectedSchemaUser("");
    setSchemaUserSearch("");
    setSchemaRoleDropdownOpen(false);
    setSchemaUserDropdownOpen(false);
    setSchemaUsers([]);
    setSchemaKeyDropdownOpen(false);

    setSelectedFromRole("");
    setSelectedRevertUser("");
    setRevertUserSearch("");
    setFromRoleDropdownOpen(false);
    setRevertUserDropdownOpen(false);
    setRevertUsers([]);
  };

  const handleTransfer = async () => {
    if (!selectedKey) {
      toast.error(
        "Please select a key setting"
      );
      return;
    }

    if (!transactionPinEntry.trim()) {
      toast.error(
        "Please enter transaction PIN"
      );
      return;
    }

    if (transactionPinEntry.length !== 4) {
      toast.error(
        "Transaction PIN must be 4 digits"
      );
      return;
    }

    if (isRevert) {
      if (!selectedFromRole) {
        toast.error("Please select a role");
        return;
      }

      if (!selectedRevertUser) {
        toast.error("Please select a user");
        return;
      }
    } else if (isSchemaTransfer) {
      if (!selectedSchemaRole) {
        toast.error("Please select a role");
        return;
      }

      if (!selectedSchemaUser) {
        toast.error("Please select a user");
        return;
      }
    } else if (!selectedTransferUser) {
      toast.error("Please select a user");
      return;
    }

    const points =
      Number(transferPoint);

    if (
      !Number.isFinite(points) ||
      points <= 0
    ) {
      toast.error(
        isRevert
          ? "Please enter valid revert points"
          : "Please enter valid transfer points"
      );
      return;
    }

    const balance = isRevert
      ? availableBalance
      : walletBalance;

    if (points > balance) {
      toast.error(
        `Insufficient balance. Available balance is ${Number(
          balance || 0
        ).toLocaleString("en-IN")}`
      );
      return;
    }

    try {
      setTransferLoading(true);

      let targetUserId = "";

      if (isRevert) {
        targetUserId =
          selectedRevertUser;
      } else if (isSchemaTransfer) {
        targetUserId =
          selectedSchemaUser;
      } else {
        targetUserId =
          selectedTransferUser;
      }

      const response =
        await transferWalletPoints(
          targetUserId,
          selectedKey,
          points,
          transactionType,
          transactionPinEntry
        );

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to transfer points"
        );
        return;
      }

      const successMessage =
        response?.message ||
        (isRevert
          ? "Points reverted successfully"
          : isSchemaTransfer
          ? "Schema transferred successfully"
          : "Points transferred successfully");

      const currentRole =
        Number(getRoleId());

      const previousFromRole =
        selectedFromRole;

      const previousSchemaRole =
        selectedSchemaRole;

      resetAllFields();

      toast.success(successMessage);

      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new Event(
            "wallet_balance_updated"
          )
        );
      }

      await loadKeySettings();

      if (Number.isFinite(currentRole)) {
        if (isRevert) {
          if (previousFromRole) {
            await loadRevertUsers(
              Number(previousFromRole)
            );
          }
        } else if (isSchemaTransfer) {
          if (previousSchemaRole) {
            await loadSchemaUsers(
              Number(previousSchemaRole)
            );
          }
        } else {
          await loadTransferUsers(
            currentRole,
            roles
          );
        }
      }

      await loadRecentTransactions();
      await loadTransactionPin();
    } catch (error) {
      console.error(
        "TRANSFER WALLET POINTS ERROR:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to transfer points"
      );
    } finally {
      setTransferLoading(false);
    }
  };

  const transactionPinField = (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        Transaction PIN
      </label>

      <input
        type="text"
        value={
          transactionPinLoading
            ? ""
            : transactionPin
        }
        readOnly
        placeholder="Transaction PIN"
        className="h-[46px] w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none"
      />
    </div>
  );

  const transactionPinEntryField = (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        Transaction PIN
      </label>

      <div className="relative">
        <input
          type={
            showTransactionPin
              ? "text"
              : "password"
          }
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={transactionPinEntry}
          onChange={
            handleTransactionPinChange
          }
          placeholder="Enter 4 digit PIN"
          disabled={transferLoading}
          className="h-[46px] w-full rounded-lg border border-gray-300 bg-white px-4 pr-12 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />

        <button
          type="button"
          onClick={() =>
            setShowTransactionPin(
              (previous) => !previous
            )
          }
          disabled={
            transferLoading ||
            !transactionPinEntry
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
          aria-label={
            showTransactionPin
              ? "Hide transaction PIN"
              : "Show transaction PIN"
          }
        >
          {showTransactionPin ? (
            <RiEyeOffLine size={20} />
          ) : (
            <RiEyeLine size={20} />
          )}
        </button>
      </div>
    </div>
  );

  const isSubmitDisabled =
    transferLoading ||
    loading ||
    !selectedKey ||
    !transferPoint ||
    transactionPinEntry.length !== 4 ||
    (isRevert
      ? !selectedRevertUser
      : isSchemaTransfer
      ? !selectedSchemaRole ||
        !selectedSchemaUser
      : !selectedTransferUser);

  return (
    <div className="min-h-screen">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {transactionPinField}
          </div>
        </div>

        {isSchemaTransfer ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Device Type
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() =>
                      setSchemaKeyDropdownOpen(
                        (previous) =>
                          !previous
                      )
                    }
                    disabled={
                      loading ||
                      transferLoading ||
                      keySettings.length === 0
                    }
                    className="flex h-[46px] w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <span
                      className={
                        selectedKey
                          ? "truncate text-gray-700"
                          : "truncate text-gray-400"
                      }
                    >
                      {selectedKey
                        ? keySettings.find(
                            (item) =>
                              String(
                                item?.id
                              ) ===
                              String(
                                selectedKey
                              )
                          )?.name ||
                          "Select Key Setting"
                        : "Select Key Setting"}
                    </span>

                    <IoMdArrowDropdown
                      size={21}
                      className={`shrink-0 text-gray-500 transition-transform duration-200 ${
                        schemaKeyDropdownOpen
                          ? "rotate-180"
                          : ""
                      }`}
                    />
                  </button>

                  {schemaKeyDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {keySettings.length > 0 ? (
                          keySettings.map(
                            (item) => {
                              const selected =
                                String(
                                  selectedKey
                                ) ===
                                String(
                                  item?.id
                                );

                              return (
                                <button
                                  key={
                                    item?.id
                                  }
                                  type="button"
                                  onClick={() => {
                                    handleKeySelect(
                                      item?.id
                                    );

                                    setSchemaKeyDropdownOpen(
                                      false
                                    );
                                  }}
                                  className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition ${
                                    selected
                                      ? "bg-blue-50 font-semibold text-blue-600"
                                      : "text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <span>
                                    {item?.name}
                                  </span>

                                  {selected && (
                                    <span className="font-bold text-blue-600">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              );
                            }
                          )
                        ) : (
                          <div className="px-3 py-3 text-sm text-gray-400">
                            No key settings available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  My Wallet Balance
                </label>

                <input
                  type="number"
                  value={walletBalance}
                  readOnly
                  className="h-[46px] w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none"
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
                  onChange={
                    handleTransferPointChange
                  }
                  disabled={
                    transferLoading ||
                    !selectedKey
                  }
                  placeholder="Enter points"
                  className="h-[46px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {isRevert
                ? "Revert Point"
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
                      key={item?.id}
                      type="button"
                      onClick={() =>
                        handleKeySelect(
                          item?.id
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
        )}

        {isRevert ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                From Role
              </label>

              <RoleDropdown
                value={selectedFromRole}
                roles={availableRoleOptions}
                open={fromRoleDropdownOpen}
                setOpen={
                  setFromRoleDropdownOpen
                }
                loading={loadingRoles}
                disabled={
                  loadingRoles ||
                  transferLoading ||
                  availableRoleOptions.length === 0
                }
                placeholder="Select Role"
                onSelect={
                  handleFromRoleSelect
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Select User
              </label>

              <UserDropdown
                value={selectedRevertUser}
                users={revertUsers}
                search={revertUserSearch}
                setSearch={
                  setRevertUserSearch
                }
                open={revertUserDropdownOpen}
                setOpen={
                  setRevertUserDropdownOpen
                }
                loading={loadingRevertUsers}
                disabled={
                  !selectedFromRole ||
                  loadingRevertUsers ||
                  transferLoading
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
                value={availableBalance}
                readOnly
                className="h-[46px] w-full rounded-lg border border-gray-300 bg-gray-50 px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none"
              />
            </div>

            {transactionPinEntryField}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Revert Point
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={transferPoint}
                onChange={
                  handleTransferPointChange
                }
                disabled={
                  transferLoading ||
                  !selectedRevertUser
                }
                placeholder="Enter points"
                className="h-[46px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>
          </div>
        ) : isSchemaTransfer ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Role
              </label>

              <RoleDropdown
                value={selectedSchemaRole}
                roles={schemaRoleOptions}
                open={schemaRoleDropdownOpen}
                setOpen={
                  setSchemaRoleDropdownOpen
                }
                loading={loadingRoles}
                disabled={
                  !selectedKey ||
                  loadingRoles ||
                  transferLoading ||
                  schemaRoleOptions.length === 0
                }
                placeholder="Select Role"
                onSelect={
                  handleSchemaRoleSelect
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Transfer To
              </label>

              <UserDropdown
                value={selectedSchemaUser}
                users={schemaUsers}
                search={schemaUserSearch}
                setSearch={
                  setSchemaUserSearch
                }
                open={schemaUserDropdownOpen}
                setOpen={
                  setSchemaUserDropdownOpen
                }
                loading={loadingSchemaUsers}
                disabled={
                  !selectedSchemaRole ||
                  loadingSchemaUsers ||
                  transferLoading
                }
                placeholder={
                  loadingSchemaUsers
                    ? "Loading users..."
                    : selectedSchemaRole
                    ? `Select ${selectedSchemaRoleName}`
                    : "Select Role First"
                }
                searchPlaceholder={
                  selectedSchemaRoleName
                    ? `Search ${selectedSchemaRoleName}...`
                    : "Search user..."
                }
                onSelect={
                  handleSchemaUserSelect
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Available Balance
              </label>

              <input
                type="number"
                value={availableBalance}
                readOnly
                className="h-[46px] w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none"
              />
            </div>

            {transactionPinEntryField}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Transfer Point
              </label>

              <input
                type="number"
                min="0"
                step="1"
                value={transferPoint}
                onChange={
                  handleTransferPointChange
                }
                disabled={transferLoading}
                placeholder="Enter amount"
                className="h-[46px] w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Transfer To
              </label>

              <UserDropdown
                value={selectedTransferUser}
                users={transferUsers}
                search={transferUserSearch}
                setSearch={
                  setTransferUserSearch
                }
                open={transferUserDropdownOpen}
                setOpen={
                  setTransferUserDropdownOpen
                }
                loading={loadingTransferUsers}
                disabled={
                  !nextRoleId ||
                  loadingTransferUsers ||
                  transferLoading
                }
                placeholder={
                  nextRoleName
                    ? `Select ${nextRoleName}`
                    : "No user available"
                }
                searchPlaceholder={
                  nextRoleName
                    ? `Search ${nextRoleName}...`
                    : "Search user..."
                }
                onSelect={
                  handleTransferUserSelect
                }
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Available Balance
              </label>

              <input
                type="number"
                value={availableBalance}
                readOnly
                className="h-[46px] w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm outline-none"
              />
            </div>

            {transactionPinEntryField}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={handleTransfer}
            disabled={isSubmitDisabled}
            className="cursor-pointer rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-gray-400"
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

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Transactions
              </h2>

              <p className="mt-1 text-xs text-gray-400">
                {Number(roleId) === 0 ||
                Number(roleId) === 1
                  ? "Latest transactions"
                  : "Your latest transactions"}
              </p>
            </div>

            <span className="rounded-md bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-500">
              Last 5
            </span>
          </div>

          {recentTransactionsLoading ? (
            <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
              Loading recent transactions...
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
              No recent transactions found.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map(
                (transaction) => {
                  const points =
                    getTransactionPoints(
                      transaction
                    );

                  const fromName =
                    getTransactionUserName(
                      transaction,
                      "from"
                    );

                  const toName =
                    getTransactionUserName(
                      transaction,
                      "to"
                    );

                  const fromEmail =
                    getTransactionUserEmail(
                      transaction,
                      "from"
                    );

                  const toEmail =
                    getTransactionUserEmail(
                      transaction,
                      "to"
                    );

                  const fromUserId =
                    getTransactionUserId(
                      transaction,
                      "from"
                    );

                  const toUserId =
                    getTransactionUserId(
                      transaction,
                      "to"
                    );

                  return (
                    <div
                      key={
                        transaction?.id ??
                        `${fromUserId}-${toUserId}-${transaction?.created_at}`
                      }
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                                {getTransactionTypeName(
                                  transaction?.transaction_type
                                )}
                              </span>

                              <span className="break-words text-sm font-semibold text-gray-800">
                                {getTransactionKeyName(
                                  transaction
                                )}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-gray-400">
                              {formatTransactionDate(
                                transaction?.created_at
                              )}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-lg bg-gray-50 px-4 py-2 text-left sm:text-right">
                            <p className="text-base font-bold text-gray-800">
                              {points.toLocaleString(
                                "en-IN"
                              )}
                            </p>

                            <p className="text-xs text-gray-400">
                              Points
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                              From
                            </p>

                            <p className="break-words text-sm font-semibold text-gray-700">
                              {fromName}
                            </p>

                            {fromEmail && (
                              <p className="mt-1 break-all text-xs text-gray-400">
                                {fromEmail}
                              </p>
                            )}

                            <p className="mt-1 break-all text-xs text-gray-400">
                              ID: {fromUserId}
                            </p>
                          </div>

                          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                              To
                            </p>

                            <p className="break-words text-sm font-semibold text-gray-700">
                              {toName}
                            </p>

                            {toEmail && (
                              <p className="mt-1 break-all text-xs text-gray-400">
                                {toEmail}
                              </p>
                            )}

                            <p className="mt-1 break-all text-xs text-gray-400">
                              ID: {toUserId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}