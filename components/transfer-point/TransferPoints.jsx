"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const ROLE_NAMES = {
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

const NEXT_ROLE_MAP = {
  0: 1,
  1: 2,
  2: 3,
  3: 4,
  4: 5,
  5: 6,
  6: 7,
  7: 8,
  8: 9,
  9: 2,
};

const REVERT_NEXT_ROLE_MAP = {
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

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong.";

const getArrayFromResponse = (response) => {
  const candidates = [
    response,
    response?.data,
    response?.users,
    response?.roles,
    response?.keys,
    response?.transactions,
    response?.data?.data,
    response?.data?.users,
    response?.data?.roles,
    response?.data?.keys,
    response?.data?.transactions,
  ];

  return candidates.find(Array.isArray) || [];
};

const getResponsePayload = (response) =>
  response?.data && !Array.isArray(response.data)
    ? response.data
    : response;

const normalizeUserResponse = (response) => {
  let data = response?.data ?? response;

  if (Array.isArray(data)) {
    data = data[0] ?? {};
  }

  if (data?.user && typeof data.user === "object") {
    data = data.user;
  } else if (data?.data && typeof data.data === "object") {
    data = Array.isArray(data.data) ? data.data[0] ?? {} : data.data;
  }

  return data && typeof data === "object" ? data : {};
};

const getUserName = (user) =>
  user?.name ||
  user?.organization_name ||
  user?.email ||
  `User ${user?.id ?? ""}`;

const filterUsers = (users, search) => {
  const query = String(search || "").trim().toLowerCase();

  if (!query) return users;

  return users.filter((user) =>
    [
      user?.name,
      user?.organization_name,
      user?.email,
      user?.phone,
      user?.mobile,
    ].some((value) =>
      String(value || "").toLowerCase().includes(query)
    )
  );
};

const toNonNegativeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const getUserKeyStats = (user, key) => {
  const emptyStats = { balance: 0, consumed: 0, available: 0 };
  if (!user || !key) return emptyStats;

  let wallet = user.wallet_balance;
  if (typeof wallet === "string") {
    try {
      wallet = JSON.parse(wallet);
    } catch {
      return emptyStats;
    }
  }
  if (wallet == null) return emptyStats;

  const keyId = String(key.id ?? "").trim();
  const keyName = String(key.name ?? "").trim().toLowerCase();

  const matchesKey = (entry) => {
    if (!entry || typeof entry !== "object") return false;
    const ids = [entry.key_id, entry.key_setting_id, entry.keySettingId]
      .filter((value) => value != null)
      .map(String);
    const names = [
      entry.key_name,
      entry.key_setting_name,
      entry.keySettingName,
      entry.name,
    ]
      .filter((value) => value != null)
      .map((value) => String(value).trim().toLowerCase());

    return (keyId && ids.includes(keyId)) || (keyName && names.includes(keyName));
  };

  let entry;
  if (Array.isArray(wallet)) {
    entry = wallet.find(matchesKey);
  } else if (typeof wallet === "object") {
    if (keyId && Object.prototype.hasOwnProperty.call(wallet, keyId)) {
      entry = wallet[keyId];
    } else {
      const matchedName = Object.keys(wallet).find(
        (name) => name.trim().toLowerCase() === keyName
      );
      entry =
        matchedName !== undefined
          ? wallet[matchedName]
          : Object.values(wallet).find(matchesKey);
    }
  } else {
    entry = wallet;
  }

  if (entry == null) return emptyStats;
  if (typeof entry !== "object") {
    const legacyBalance = toNonNegativeNumber(entry);
    return { balance: legacyBalance, consumed: 0, available: legacyBalance };
  }

  const available = toNonNegativeNumber(
    entry.available ??
      entry.available_balance ??
      entry.current_balance ??
      entry.wallet_balance ??
      entry.balance ??
      entry.amount ??
      entry.points ??
      0
  );

  const consumed = toNonNegativeNumber(
    entry.consumed ??
      entry.consumed_balance ??
      entry.consumed_points ??
      entry.used ??
      entry.used_points ??
      0
  );

  const balance = toNonNegativeNumber(
    entry.total_balance ??
      entry.balance ??
      entry.total ??
      entry.received ??
      entry.received_points ??
      (available + consumed)
  );

  return { balance, consumed, available };
};

const getUserKeyBalance = (user, key) =>
  getUserKeyStats(user, key).available;

const getKeySettingStats = (key) => ({
  balance: toNonNegativeNumber(key?.balance),
  consumed: toNonNegativeNumber(key?.consumed),
  available: toNonNegativeNumber(key?.available),
});

const formatPoints = (value) =>
  toNonNegativeNumber(value).toLocaleString("en-IN");

const getTransactionTypeName = (type) => {
  switch (Number(type)) {
    case TRANSACTION_TYPES.TRANSFER:
      return "Transfer Point";
    case TRANSACTION_TYPES.SCHEMA_TRANSFER:
      return "Schema Transfer";
    case TRANSACTION_TYPES.REVERT:
      return "Revert Point";
    default:
      return "Transaction";
  }
};

const getTransactionUserName = (transaction, side) => {
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

const getTransactionUserEmail = (transaction, side) =>
  side === "from"
    ? transaction?.from_user_email ||
      transaction?.from_email ||
      transaction?.sender_email ||
      transaction?.from_user?.email ||
      ""
    : transaction?.to_user_email ||
      transaction?.to_email ||
      transaction?.receiver_email ||
      transaction?.to_user?.email ||
      "";

const getTransactionUserId = (transaction, side) =>
  side === "from"
    ? transaction?.from_user_id ??
      transaction?.sender_id ??
      transaction?.from_id ??
      "-"
    : transaction?.to_user_id ??
      transaction?.receiver_id ??
      transaction?.to_id ??
      "-";

const getTransactionKeyName = (transaction) =>
  transaction?.key_setting_name ||
  transaction?.key_name ||
  transaction?.keySetting?.name ||
  transaction?.key_setting?.name ||
  "-";

const getTransactionPoints = (transaction) =>
  Number(
    transaction?.points ??
      transaction?.points_sent ??
      transaction?.amount ??
      transaction?.transfer_points ??
      0
  );

const formatTransactionDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransactionPartyId = (transaction, side) => {
  const value =
    side === "from"
      ? transaction?.from_user_id ??
        transaction?.sender_id ??
        transaction?.from_id
      : transaction?.to_user_id ??
        transaction?.receiver_id ??
        transaction?.to_id;

  return Number(value);
};


function UserDropdown({
  value,
  users = [],
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
    (user) => String(user?.id) === String(value)
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        disabled={disabled}
        className="flex h-[46px] w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm font-medium text-gray-700 shadow-sm outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
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
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="h-10 w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100"
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
                const selected = String(value) === String(user?.id);
                const name = getUserName(user);

                return (
                  <button
                    key={user?.id}
                    type="button"
                    onClick={() => onSelect(user?.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                      selected ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                        selected
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {String(name).charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-semibold ${
                          selected ? "text-blue-600" : "text-gray-700"
                        }`}
                      >
                        {name}
                      </p>

                      {user?.email && (
                        <p className="truncate text-xs text-gray-400">
                          {user.email}
                        </p>
                      )}
                    </div>

                    {selected && (
                      <span className="font-bold text-blue-600">✓</span>
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
  roles = [],
  open,
  setOpen,
  loading,
  disabled,
  placeholder,
  onSelect,
}) {
  const selectedRole = roles.find(
    (role) => Number(role?.role_id) === Number(value)
  );

  const selectedRoleName =
    selectedRole?.name || ROLE_NAMES[Number(value)] || "";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        disabled={disabled}
        className="flex h-[46px] w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm font-medium text-gray-700 shadow-sm outline-none transition hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
      >
        <span className="truncate">
          {loading ? "Loading roles..." : selectedRoleName || placeholder}
        </span>

        <IoMdArrowDropdown
          size={21}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
          {roles.length > 0 ? (
            roles.map((role) => {
              const roleId = Number(role?.role_id);
              const roleName =
                role?.name || ROLE_NAMES[roleId] || `Role ${roleId}`;
              const selected = Number(value) === roleId;

              return (
                <button
                  key={role?.id ?? role?.role_id}
                  type="button"
                  onClick={() => onSelect(role)}
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold transition ${
                    selected
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{roleName}</span>
                  {selected && <span>✓</span>}
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

  const transactionType = useMemo(() => {
    const value = searchParams.get("transaction_type");

    if (value === null) return TRANSACTION_TYPES.TRANSFER;

    const parsed = Number(value);

    return Object.values(TRANSACTION_TYPES).includes(parsed)
      ? parsed
      : TRANSACTION_TYPES.TRANSFER;
  }, [searchParams]);

  const isRevert = transactionType === TRANSACTION_TYPES.REVERT;
  const isSchemaTransfer =
    transactionType === TRANSACTION_TYPES.SCHEMA_TRANSFER;

  const [keySettings, setKeySettings] = useState([]);
  const [transferTargetRoleId, setTransferTargetRoleId] = useState(null);
  const [selectedKey, setSelectedKey] = useState("");
  const [currentUserData, setCurrentUserData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);

  const [roleId, setRoleId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [hierarchyRoleId, setHierarchyRoleId] = useState(null);

  const [transferPoint, setTransferPoint] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);

  const [transactionPin, setTransactionPin] = useState("");
  const [transactionPinLoading, setTransactionPinLoading] = useState(false);
  const [transactionPinEntry, setTransactionPinEntry] = useState("");
  const [showTransactionPin, setShowTransactionPin] = useState(false);

  const [transferUsers, setTransferUsers] = useState([]);
  const [selectedTransferUser, setSelectedTransferUser] = useState("");
  const [transferUserSearch, setTransferUserSearch] = useState("");
  const [transferUserDropdownOpen, setTransferUserDropdownOpen] =
    useState(false);
  const [loadingTransferUsers, setLoadingTransferUsers] = useState(false);

  const [selectedSchemaRole, setSelectedSchemaRole] = useState("");
  const [schemaUsers, setSchemaUsers] = useState([]);
  const [selectedSchemaUser, setSelectedSchemaUser] = useState("");
  const [schemaUserSearch, setSchemaUserSearch] = useState("");
  const [schemaRoleDropdownOpen, setSchemaRoleDropdownOpen] = useState(false);
  const [schemaUserDropdownOpen, setSchemaUserDropdownOpen] = useState(false);
  const [schemaKeyDropdownOpen, setSchemaKeyDropdownOpen] = useState(false);
  const [loadingSchemaUsers, setLoadingSchemaUsers] = useState(false);

  const [selectedFromRole, setSelectedFromRole] = useState("");
  const [revertUsers, setRevertUsers] = useState([]);
  const [selectedRevertUser, setSelectedRevertUser] = useState("");
  const [revertUserSearch, setRevertUserSearch] = useState("");
  const [fromRoleDropdownOpen, setFromRoleDropdownOpen] = useState(false);
  const [revertUserDropdownOpen, setRevertUserDropdownOpen] = useState(false);
  const [loadingRevertUsers, setLoadingRevertUsers] = useState(false);

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [recentTransactionsLoading, setRecentTransactionsLoading] =
    useState(false);

  const initializationRequestRef = useRef({
    transactionType: null,
    promise: null,
  });
  const recentTransactionTypeRef = useRef(null);

  const selectedKeyData = useMemo(
    () =>
      keySettings.find(
        (item) => String(item?.id) === String(selectedKey)
      ),
    [keySettings, selectedKey]
  );

  const selectedTransferUserData = useMemo(
    () =>
      transferUsers.find(
        (user) => String(user?.id) === String(selectedTransferUser)
      ),
    [transferUsers, selectedTransferUser]
  );

  const selectedSchemaUserData = useMemo(
    () =>
      schemaUsers.find(
        (user) => String(user?.id) === String(selectedSchemaUser)
      ),
    [schemaUsers, selectedSchemaUser]
  );

  const selectedRevertUserData = useMemo(
    () =>
      revertUsers.find(
        (user) => String(user?.id) === String(selectedRevertUser)
      ),
    [revertUsers, selectedRevertUser]
  );

  const selectedFromRoleData = useMemo(
    () =>
      roles.find(
        (role) => Number(role?.role_id) === Number(selectedFromRole)
      ),
    [roles, selectedFromRole]
  );

  const selectedSchemaRoleData = useMemo(
    () =>
      roles.find(
        (role) => Number(role?.role_id) === Number(selectedSchemaRole)
      ),
    [roles, selectedSchemaRole]
  );

  const availableRoleOptions = useMemo(
    () => roles.filter((role) => Number(role?.role_id) !== Number(roleId)),
    [roles, roleId]
  );

 const revertRoleOptions = useMemo(() => {
  const currentRole = Number(roleId);

  // Master Admin and Admin can select any active child role.
  if ([0, 1].includes(currentRole)) {
    return roles.filter((role) => {
      const targetRole = Number(role?.role_id);

      return (
        targetRole >= 2 &&
        targetRole <= 9 &&
        Number(role?.status ?? 1) === 1
      );
    });
  }

  // Other roles can select only their eligible next role.
  if (
    hierarchyRoleId === null ||
    hierarchyRoleId === undefined ||
    !Number.isInteger(Number(hierarchyRoleId))
  ) {
    return [];
  }

  const expectedRoleId =
    REVERT_NEXT_ROLE_MAP[Number(hierarchyRoleId)];

  if (expectedRoleId === undefined) return [];

  return roles.filter(
    (role) =>
      Number(role?.role_id) === Number(expectedRoleId) &&
      Number(role?.status ?? 1) === 1
  );
}, [roles, hierarchyRoleId, roleId]);

  const schemaRoleOptions = useMemo(
    () =>
      availableRoleOptions.filter((role) => {
        const currentRole = Number(roleId);
        const targetRole = Number(role?.role_id);

        if ([0, 1].includes(currentRole)) return true;
        if ([2, 3, 4, 5].includes(currentRole)) return targetRole !== 8;
        if ([6, 7].includes(currentRole)) return targetRole !== 9;

        return true;
      }),
    [availableRoleOptions, roleId]
  );

  const nextRoleId = useMemo(() => {
    if (roleId === null || roleId === undefined) return null;

    const currentRole = Number(roleId);

    if (!Number.isFinite(currentRole)) return null;

    if (currentRole === 9) {
      const targetRole = Number(transferTargetRoleId);

      return Number.isInteger(targetRole) && targetRole > 0
        ? targetRole
        : null;
    }

    if (currentRole === 0) return 1;

    let targetRole = NEXT_ROLE_MAP[currentRole];

    while (targetRole !== undefined && targetRole !== null) {
      const activeRole = roles.find(
        (role) =>
          Number(role?.role_id) === Number(targetRole) &&
          Number(role?.status ?? 1) === 1
      );

      if (activeRole) return Number(activeRole.role_id);

      targetRole = NEXT_ROLE_MAP[targetRole];
    }

    return null;
  }, [roleId, roles, transferTargetRoleId]);

  const nextRoleName = ROLE_NAMES[nextRoleId] || "";

  const selectedFromRoleName =
    selectedFromRoleData?.name ||
    ROLE_NAMES[Number(selectedFromRole)] ||
    "";

  const selectedSchemaRoleName =
    selectedSchemaRoleData?.name ||
    ROLE_NAMES[Number(selectedSchemaRole)] ||
    "";
  const loadTransactionPin = useCallback(async () => {
    setTransactionPinLoading(true);

    try {
      const loggedInUser = getUser();
      const userId = Number(loggedInUser?.id);
      const loggedInRoleId = Number(
        loggedInUser?.role_id ?? getRoleId()
      );

      if (!Number.isInteger(userId) || userId <= 0) {
        setTransactionPin("");
        setCurrentUserData(null);
        setHierarchyRoleId(null);
        setWalletBalance(0);
        return null;
      }

      const response = await getStaffDataById(userId);
      const data = normalizeUserResponse(response);

      const normalizedUser = {
        ...(loggedInUser || {}),
        ...(data || {}),
      };

      setCurrentUserData(normalizedUser);

      const pin = normalizedUser?.transaction_pin;
      setTransactionPin(
        pin === null || pin === undefined ? "" : String(pin)
      );

      if (loggedInRoleId === 9) {
        const parentId = Number(normalizedUser?.parent_id);

        if (Number.isInteger(parentId) && parentId > 0) {
          try {
            const parentResponse = await getStaffDataById(parentId);
            const parentData = normalizeUserResponse(parentResponse);

            const parentRoleId = Number(
              parentData?.role_id ??
                parentData?.user?.role_id
            );

            setHierarchyRoleId(
              Number.isInteger(parentRoleId) ? parentRoleId : null
            );
          } catch (parentError) {
            console.error(
              "GET STAFF PARENT ERROR:",
              getErrorMessage(parentError)
            );
            setHierarchyRoleId(null);
          }
        } else {
          setHierarchyRoleId(null);
        }
      } else {
        const currentHierarchyRoleId = Number(
          normalizedUser?.role_id ?? getRoleId()
        );

        setHierarchyRoleId(
          Number.isInteger(currentHierarchyRoleId)
            ? currentHierarchyRoleId
            : null
        );
      }

      return normalizedUser;
    } catch (error) {
      console.error(
        "GET CURRENT USER DATA ERROR:",
        getErrorMessage(error)
      );

      setTransactionPin("");
      setCurrentUserData(null);
      setHierarchyRoleId(null);
      setWalletBalance(0);

      return null;
    } finally {
      setTransactionPinLoading(false);
    }
  }, []);

  const loadKeySettings = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getKeySettings();

      // Show only active key settings (status = 1) and keep their wallet metrics.
      const keys = getArrayFromResponse(response)
        .filter((item) => Number(item?.status) === 1)
        .map((item) => ({
          ...item,
          balance: toNonNegativeNumber(item?.balance),
          consumed: toNonNegativeNumber(item?.consumed),
          available: toNonNegativeNumber(item?.available),
        }));

      setKeySettings(keys);

      if (keys.length === 0) {
        setSelectedKey("");
        setWalletBalance(0);
        setAvailableBalance(0);
        return [];
      }

      setSelectedKey((previous) => {
        const selectedKeyItem =
          keys.find(
            (item) => String(item?.id) === String(previous)
          ) || keys[0];

        return String(selectedKeyItem?.id ?? "");
      });

      return keys;
    } catch (error) {
      console.error(
        "GET KEY SETTINGS ERROR:",
        getErrorMessage(error)
      );

      setKeySettings([]);
      setSelectedKey("");
      setWalletBalance(0);
      setAvailableBalance(0);

      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRoles = useCallback(async () => {
    setLoadingRoles(true);

    try {
      const response = await getRoles();

      const activeRoles = getArrayFromResponse(response)
        .filter((role) => Number(role?.status ?? 1) === 1)
        .sort(
          (a, b) =>
            Number(a?.sequence ?? a?.role_id ?? 0) -
            Number(b?.sequence ?? b?.role_id ?? 0)
        );

      setRoles(activeRoles);
      return activeRoles;
    } catch (error) {
      console.error("GET ROLES ERROR:", getErrorMessage(error));
      setRoles([]);
      return [];
    } finally {
      setLoadingRoles(false);
    }
  }, []);

  const loadUsersByRole = useCallback(async (targetRoleId) => {
    const role = Number(targetRoleId);

    if (!Number.isInteger(role) || role < 0 || role > 9) {
      return [];
    }

    const limit = 1000;
    let page = 1;
    let totalPages = 1;

    const allUsers = [];
    const seenPages = new Set();

    do {
      if (seenPages.has(page)) break;
      seenPages.add(page);

      const response = await getAllStaffData(
        page,
        limit,
        role,
        "",
        ""
      );

      const payload = getResponsePayload(response);
      const pageUsers = getArrayFromResponse(response);

      allUsers.push(...pageUsers);

      const pagination =
        payload?.pagination ??
        payload?.data?.pagination ??
        payload?.meta ??
        payload?.data?.meta;

      if (pagination?.totalPages != null) {
        totalPages = Math.max(
          1,
          Number(pagination.totalPages) || 1
        );
      } else if (pagination?.lastPage != null) {
        totalPages = Math.max(
          1,
          Number(pagination.lastPage) || 1
        );
      } else if (pagination?.total != null) {
        totalPages = Math.max(
          1,
          Math.ceil(Number(pagination.total) / limit)
        );
      } else {
        totalPages = page;
      }

      page += 1;
    } while (page <= totalPages);

    const uniqueUsers = new Map();

    allUsers
      .filter((user) => Number(user?.role_id) === role)
      .forEach((user) => {
        if (user?.id != null) {
          uniqueUsers.set(String(user.id), user);
        }
      });

    return Array.from(uniqueUsers.values());
  }, []);

  const findNextActiveRole = useCallback((currentRoleId, activeRoles) => {
    const currentRole = Number(currentRoleId);

    if (currentRole === 9) return 2;
    if (currentRole === 0) return 1;

    let targetRole = NEXT_ROLE_MAP[currentRole];

    while (targetRole !== undefined && targetRole !== null) {
      const found = activeRoles.find(
        (role) =>
          Number(role?.role_id) === Number(targetRole) &&
          Number(role?.status ?? 1) === 1
      );

      if (found) return Number(found.role_id);

      targetRole = NEXT_ROLE_MAP[targetRole];
    }

    return null;
  }, []);

  const loadTransferUsers = useCallback(
    async (currentRoleId, activeRoles = []) => {
      setLoadingTransferUsers(true);

      try {
        const currentUserId = Number(getUser()?.id);
        const currentRole = Number(currentRoleId);

        let targetRoleId = null;
        let users = [];

        if (currentRole === 9) {
          const response = await getAllStaffData(
            1,
            1000,
            "",
            "",
            ""
          );

          const payload = getResponsePayload(response);

          targetRoleId = Number(
            payload?.transferTargetRoleId ??
              payload?.data?.transferTargetRoleId ??
              response?.transferTargetRoleId
          );

          if (
            !Number.isInteger(targetRoleId) ||
            targetRoleId <= 0 ||
            targetRoleId > 9
          ) {
            console.error(
              "STAFF TRANSFER TARGET ROLE MISSING:",
              { response, targetRoleId }
            );

            setTransferTargetRoleId(null);
            setTransferUsers([]);
            setSelectedTransferUser("");
            return;
          }

          setTransferTargetRoleId(targetRoleId);
          users = getArrayFromResponse(response);

          const pagination =
            payload?.pagination ??
            payload?.data?.pagination ??
            payload?.meta ??
            payload?.data?.meta;

          const totalPages = Math.max(
            1,
            Number(
              pagination?.totalPages ??
                pagination?.lastPage ??
                (pagination?.total != null
                  ? Math.ceil(Number(pagination.total) / 1000)
                  : 1)
            ) || 1
          );

          for (let page = 2; page <= totalPages; page += 1) {
            const pageResponse = await getAllStaffData(
              page,
              1000,
              "",
              "",
              ""
            );

            users = [
              ...users,
              ...getArrayFromResponse(pageResponse),
            ];
          }

          users = users.filter(
            (user) =>
              Number(user?.role_id) === targetRoleId &&
              Number(user?.id) !== currentUserId
          );
        } else {
          targetRoleId = findNextActiveRole(
            currentRole,
            activeRoles
          );

          setTransferTargetRoleId(null);

          if (targetRoleId === null) {
            setTransferUsers([]);
            setSelectedTransferUser("");
            return;
          }

          users = await loadUsersByRole(targetRoleId);

          users = users.filter(
            (user) => Number(user?.id) !== currentUserId
          );
        }

        const uniqueUsers = new Map();

        users.forEach((user) => {
          if (user?.id != null) {
            uniqueUsers.set(String(user.id), user);
          }
        });

        const finalUsers = Array.from(uniqueUsers.values());

        setTransferUsers(finalUsers);

        setSelectedTransferUser((previous) =>
          finalUsers.some(
            (user) => String(user?.id) === String(previous)
          )
            ? previous
            : ""
        );
      } catch (error) {
        console.error(
          "GET TRANSFER USERS ERROR:",
          error?.response?.data || error
        );

        setTransferTargetRoleId(null);
        setTransferUsers([]);
        setSelectedTransferUser("");
      } finally {
        setLoadingTransferUsers(false);
      }
    },
    [findNextActiveRole, loadUsersByRole]
  );

  const loadSchemaUsers = useCallback(
    async (targetRoleId) => {
      setLoadingSchemaUsers(true);
      setSchemaUsers([]);
      setSelectedSchemaUser("");

      try {
        const users = await loadUsersByRole(targetRoleId);
        setSchemaUsers(users);
      } catch (error) {
        console.error(
          "GET SCHEMA USERS ERROR:",
          getErrorMessage(error)
        );
        setSchemaUsers([]);
      } finally {
        setLoadingSchemaUsers(false);
      }
    },
    [loadUsersByRole]
  );

const loadRevertUsers = useCallback(
  async (targetRoleId) => {
    setLoadingRevertUsers(true);
    setRevertUsers([]);
    setSelectedRevertUser("");
    setAvailableBalance(0);

    try {
      const loggedInUser = getUser();
      const loggedInRoleId = Number(getRoleId());
      const selectedRoleId = Number(targetRoleId);

      const isPrivilegedRole = [0, 1].includes(loggedInRoleId);

      // Validate selected role.
      const isActiveRole = roles.some(
        (role) =>
          Number(role?.role_id) === selectedRoleId &&
          Number(role?.status ?? 1) === 1
      );

      if (!isActiveRole || selectedRoleId < 2 || selectedRoleId > 9) {
        toast.error("Please select a valid active role.");
        return;
      }

      // Non-admin users remain restricted to the next role in hierarchy.
      if (!isPrivilegedRole) {
        const expectedRoleId =
          REVERT_NEXT_ROLE_MAP[Number(hierarchyRoleId)];

        if (
          expectedRoleId === undefined ||
          selectedRoleId !== Number(expectedRoleId)
        ) {
          toast.error("This role is not allowed in your hierarchy.");
          return;
        }
      }

      const users = await loadUsersByRole(selectedRoleId);

      let eligibleUsers = users;

      if (!isPrivilegedRole) {
        const walletOwnerId =
          loggedInRoleId === 9
            ? Number(
                currentUserData?.parent_id ??
                  loggedInUser?.parent_id
              )
            : Number(loggedInUser?.id);

        if (
          !Number.isInteger(walletOwnerId) ||
          walletOwnerId <= 0
        ) {
          toast.error("Unable to determine the parent account.");
          return;
        }

        eligibleUsers = users.filter(
          (user) =>
            Number(user?.parent_id) === walletOwnerId &&
            Number(user?.role_id) === selectedRoleId
        );
      }

      setRevertUsers(eligibleUsers);

      if (eligibleUsers.length === 0) {
        toast.info("No eligible users found for the selected role.");
      }
    } catch (error) {
      console.error(
        "GET REVERT USERS ERROR:",
        getErrorMessage(error)
      );

      setRevertUsers([]);
      toast.error("Failed to load eligible revert users.");
    } finally {
      setLoadingRevertUsers(false);
    }
  },
  [
    roles,
    hierarchyRoleId,
    currentUserData,
    loadUsersByRole,
  ]
);

  const loadRecentTransactions = useCallback(async () => {
    setRecentTransactionsLoading(true);

    try {
      const response = await getWalletTransactions({
        page: 1,
        limit: 100,
        transaction_type: transactionType,
      });

      let transactions = getArrayFromResponse(response);

      const currentRoleId = Number(getRoleId());
      const currentUserId = Number(getUser()?.id);

      if (![0, 1, 9].includes(currentRoleId)) {
        transactions = transactions.filter((transaction) => {
          const fromUserId = getTransactionPartyId(
            transaction,
            "from"
          );

          const toUserId = getTransactionPartyId(
            transaction,
            "to"
          );

          return (
            fromUserId === currentUserId ||
            toUserId === currentUserId
          );
        });
      }

      transactions.sort((a, b) => {
        const dateA = new Date(a?.created_at || 0).getTime();
        const dateB = new Date(b?.created_at || 0).getTime();

        return dateB - dateA;
      });

      setRecentTransactions(transactions.slice(0, 5));
    } catch (error) {
      console.error(
        "GET RECENT TRANSACTIONS ERROR:",
        getErrorMessage(error)
      );

      setRecentTransactions([]);
    } finally {
      setRecentTransactionsLoading(false);
    }
  }, [transactionType]);

  useEffect(() => {
    let cancelled = false;

    const initializePage = async () => {
      setTransactionPinEntry("");

      const currentType = Number(transactionType);
      let request = initializationRequestRef.current;

      if (
        !request.promise ||
        request.transactionType !== currentType
      ) {
        const promise = Promise.all([
          loadTransactionPin(),
          loadKeySettings(),
          loadRoles(),
        ]);

        request = {
          transactionType: currentType,
          promise,
        };

        initializationRequestRef.current = request;

        promise
          .finally(() => {
            if (
              initializationRequestRef.current.promise === promise
            ) {
              initializationRequestRef.current = {
                transactionType: null,
                promise: null,
              };
            }
          })
          .catch(() => {});
      }

      const [, , activeRoles] = await request.promise;

      if (cancelled) return;

      const rawRoleId = getRoleId();

      if (
        rawRoleId === null ||
        rawRoleId === undefined ||
        String(rawRoleId).trim() === ""
      ) {
        console.error("Transfer Point: role ID is missing.");
        setRoleId(null);
        setTransferUsers([]);
        return;
      }

      const currentRole = Number(rawRoleId);

      if (!Number.isFinite(currentRole)) {
        console.error(
          "Transfer Point: invalid role ID:",
          rawRoleId
        );
        setRoleId(null);
        setTransferUsers([]);
        return;
      }

      setRoleId(currentRole);

      if (currentType === TRANSACTION_TYPES.SCHEMA_TRANSFER) {
        setTransferUsers([]);
        setSchemaUsers([]);
        setSelectedSchemaRole("");
        setSelectedSchemaUser("");
        setAvailableBalance(0);
        return;
      }

      if (currentType === TRANSACTION_TYPES.REVERT) {
        setTransferUsers([]);
        setSelectedFromRole("");
        setSelectedRevertUser("");
        setRevertUsers([]);
        return;
      }

      await loadTransferUsers(currentRole, activeRoles);
    };

    initializePage().catch((error) => {
      console.error(
        "TRANSFER PAGE INITIALIZATION ERROR:",
        getErrorMessage(error)
      );
    });

    return () => {
      cancelled = true;
    };
  }, [
    transactionType,
    loadTransactionPin,
    loadKeySettings,
    loadRoles,
    loadTransferUsers,
  ]);

  useEffect(() => {
    const currentType = Number(transactionType);

    if (recentTransactionTypeRef.current === currentType) return;

    recentTransactionTypeRef.current = currentType;
    loadRecentTransactions();
  }, [transactionType, loadRecentTransactions]);

  useEffect(() => {
    let selectedUser = null;

    if (isRevert) {
      selectedUser = selectedRevertUserData;
    } else if (isSchemaTransfer) {
      selectedUser = selectedSchemaUserData;
    } else {
      selectedUser = selectedTransferUserData;
    }

    if (!selectedUser || !selectedKeyData) {
      setAvailableBalance(0);
      return;
    }

    const balance = getUserKeyBalance(
      selectedUser,
      selectedKeyData
    );

    setAvailableBalance(
      Number.isFinite(balance) && balance >= 0 ? balance : 0
    );
  }, [
    isRevert,
    isSchemaTransfer,
    selectedRevertUserData,
    selectedSchemaUserData,
    selectedTransferUserData,
    selectedKeyData,
  ]);

  useEffect(() => {
    if (!selectedKeyData) {
      setWalletBalance(0);
      return;
    }

    setWalletBalance(getKeySettingStats(selectedKeyData).available);
  }, [selectedKeyData]);

  const handleKeySelect = (id) => {
    const keyId = String(id);

    setSelectedKey(keyId);
    setAvailableBalance(0);
    setTransferPoint("");
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

  const handleTransferUserSelect = (userId) => {
    setSelectedTransferUser(String(userId));
    setTransferUserSearch("");
    setTransferUserDropdownOpen(false);
    setAvailableBalance(0);
    setTransactionPinEntry("");
  };

  const handleSchemaRoleSelect = async (role) => {
    const targetRoleId = Number(role?.role_id);

    if (!Number.isFinite(targetRoleId)) return;

    setSelectedSchemaRole(String(targetRoleId));
    setSchemaUserSearch("");
    setSchemaUserDropdownOpen(false);
    setSchemaRoleDropdownOpen(false);
    setAvailableBalance(0);
    setTransactionPinEntry("");

    await loadSchemaUsers(targetRoleId);
  };

  const handleSchemaUserSelect = (userId) => {
    setSelectedSchemaUser(String(userId));
    setSchemaUserSearch("");
    setSchemaUserDropdownOpen(false);
    setAvailableBalance(0);
    setTransactionPinEntry("");
  };

 const handleFromRoleSelect = async (role) => {
  const targetRoleId = Number(role?.role_id);
  const loggedInRoleId = Number(getRoleId());

  const isPrivilegedRole = [0, 1].includes(loggedInRoleId);

  const isActiveRole = roles.some(
    (item) =>
      Number(item?.role_id) === targetRoleId &&
      Number(item?.status ?? 1) === 1
  );

  if (
    !Number.isInteger(targetRoleId) ||
    !isActiveRole ||
    targetRoleId < 2 ||
    targetRoleId > 9
  ) {
    toast.error("Please select a valid active role.");
    return;
  }

  if (!isPrivilegedRole) {
    const expectedRoleId =
      REVERT_NEXT_ROLE_MAP[Number(hierarchyRoleId)];

    if (
      expectedRoleId === undefined ||
      targetRoleId !== Number(expectedRoleId)
    ) {
      toast.error("This role is not allowed in your hierarchy.");
      return;
    }
  }

  setSelectedFromRole(String(targetRoleId));
  setRevertUserSearch("");
  setFromRoleDropdownOpen(false);
  setRevertUserDropdownOpen(false);
  setSelectedRevertUser("");
  setRevertUsers([]);
  setAvailableBalance(0);
  setTransferPoint("");
  setTransactionPinEntry("");

  await loadRevertUsers(targetRoleId);
};

  const handleRevertUserSelect = (userId) => {
    setSelectedRevertUser(String(userId));
    setRevertUserSearch("");
    setRevertUserDropdownOpen(false);
    setAvailableBalance(0);
    setTransactionPinEntry("");
  };

  const handleTransferPointChange = (event) => {
    const value = event.target.value;

    if (value === "" || Number(value) >= 0) {
      setTransferPoint(value);
    }
  };

  const handleTransactionPinChange = (event) => {
    setTransactionPinEntry(
      event.target.value.replace(/\D/g, "").slice(0, 4)
    );
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
    const loggedInRole = Number(getRoleId());

    if (!selectedKey) {
      toast.error("Please select a key setting.");
      return;
    }

    if (transactionPinEntry.length !== 4) {
      toast.error("Please enter a valid 4-digit transaction PIN.");
      return;
    }

   if (isRevert) {
  const isPrivilegedRole = [0, 1].includes(loggedInRole);

  if (!selectedFromRole) {
    toast.error("Please select a role.");
    return;
  }

  if (!selectedRevertUser) {
    toast.error("Please select a user.");
    return;
  }

  const selectedRoleId = Number(selectedFromRole);

  const selectedUser = revertUsers.find(
    (user) => String(user?.id) === String(selectedRevertUser)
  );

  // Ensure the selected role is active and valid.
  const isActiveRole = roles.some(
    (role) =>
      Number(role?.role_id) === selectedRoleId &&
      Number(role?.status ?? 1) === 1
  );

  if (
    !isActiveRole ||
    selectedRoleId < 2 ||
    selectedRoleId > 9
  ) {
    toast.error("Please select a valid active role.");
    return;
  }

  if (!selectedUser || Number(selectedUser?.role_id) !== selectedRoleId) {
    toast.error("Selected user does not belong to the selected role.");
    return;
  }

  // Master Admin and Admin can revert for any user in the selected role.
  // Other roles remain restricted to their direct hierarchy.
  if (!isPrivilegedRole) {
    const expectedRoleId =
      REVERT_NEXT_ROLE_MAP[Number(hierarchyRoleId)];

    const walletOwnerId =
      loggedInRole === 9
        ? Number(
            currentUserData?.parent_id ??
              getUser()?.parent_id
          )
        : Number(getUser()?.id);

    if (
      expectedRoleId === undefined ||
      selectedRoleId !== Number(expectedRoleId)
    ) {
      toast.error("Please select the eligible child role.");
      return;
    }

    if (
      !Number.isInteger(walletOwnerId) ||
      walletOwnerId <= 0 ||
      Number(selectedUser?.parent_id) !== walletOwnerId
    ) {
      toast.error("Selected user is outside your hierarchy.");
      return;
    }
  }
} else if (isSchemaTransfer) {
  if (!selectedSchemaRole) {
    toast.error("Please select a role.");
    return;
  }

  if (!selectedSchemaUser) {
    toast.error("Please select a user.");
    return;
  }
} else if (!selectedTransferUser) {
  toast.error("Please select a user.");
  return;
}

    const points = Number(transferPoint);

    if (!Number.isFinite(points) || points <= 0) {
      toast.error(
        isRevert
          ? "Please enter valid revert points."
          : "Please enter valid transfer points."
      );
      return;
    }

    if (isRevert) {
      const balance = Number(availableBalance ?? 0);

      if (!Number.isFinite(balance) || points > balance) {
        toast.error(
          `Insufficient balance. Available balance is ${(
            Number.isFinite(balance) ? balance : 0
          ).toLocaleString("en-IN")}.`
        );
        return;
      }
    } else if (![0, 1, 9].includes(loggedInRole)) {
      const balance = Number(walletBalance ?? 0);

      if (!Number.isFinite(balance) || points > balance) {
        toast.error(
          `Insufficient balance. Available balance is ${(
            Number.isFinite(balance) ? balance : 0
          ).toLocaleString("en-IN")}.`
        );
        return;
      }
    }

    const targetUserId = isRevert
      ? selectedRevertUser
      : isSchemaTransfer
        ? selectedSchemaUser
        : selectedTransferUser;

    const previousFromRole = selectedFromRole;
    const previousSchemaRole = selectedSchemaRole;

    try {
      setTransferLoading(true);

      const response = await transferWalletPoints(
        targetUserId,
        selectedKey,
        points,
        transactionType,
        transactionPinEntry
      );

      if (!response?.success) {
        toast.error(
          response?.message || "Failed to process points."
        );
        return;
      }

      toast.success(
        response.message ||
          (isRevert
            ? "Points reverted successfully."
            : isSchemaTransfer
              ? "Schema transferred successfully."
              : "Points transferred successfully.")
      );

      resetAllFields();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("wallet_balance_updated"));
      }

      await Promise.all([
        loadKeySettings(),
        loadRecentTransactions(),
        loadTransactionPin(),
      ]);

      const currentRole = Number(getRoleId());

      if (Number.isFinite(currentRole)) {
        if (isRevert && previousFromRole) {
          await loadRevertUsers(Number(previousFromRole));
        } else if (isSchemaTransfer && previousSchemaRole) {
          await loadSchemaUsers(Number(previousSchemaRole));
        } else if (!isRevert && !isSchemaTransfer) {
          await loadTransferUsers(currentRole, roles);
        }
      }
    } catch (error) {
      console.error(
        "TRANSFER WALLET POINTS ERROR:",
        getErrorMessage(error)
      );

      toast.error(
        getErrorMessage(error) || "Failed to transfer points."
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
        value={transactionPinLoading ? "" : transactionPin}
        readOnly
        placeholder={
          transactionPinLoading ? "Loading PIN..." : "Transaction PIN"
        }
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
          type={showTransactionPin ? "text" : "password"}
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={4}
          value={transactionPinEntry}
          onChange={handleTransactionPinChange}
          placeholder="Enter 4 digit PIN"
          disabled={transferLoading}
          className="h-[46px] w-full rounded-lg border border-gray-300 bg-white px-4 pr-12 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
        />

        <button
          type="button"
          onClick={() =>
            setShowTransactionPin((previous) => !previous)
          }
          disabled={transferLoading || !transactionPinEntry}
          aria-label={
            showTransactionPin
              ? "Hide transaction PIN"
              : "Show transaction PIN"
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-gray-700 disabled:cursor-not-allowed disabled:text-gray-300"
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
      ? !selectedFromRole || !selectedRevertUser
      : isSchemaTransfer
        ? !selectedSchemaRole || !selectedSchemaUser
        : !selectedTransferUser);

  return (
    <div className="min-h-screen">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {transactionPinField}
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
                      setSchemaKeyDropdownOpen((previous) => !previous)
                    }
                    disabled={
                      loading ||
                      transferLoading ||
                      keySettings.length === 0
                    }
                    className="flex h-[46px] w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 text-left text-sm font-medium text-gray-700 shadow-sm transition hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <span
                      className={
                        selectedKey
                          ? "truncate text-gray-700"
                          : "truncate text-gray-400"
                      }
                    >
                      {selectedKeyData?.name || "Select Key Setting"}
                    </span>

                    <IoMdArrowDropdown
                      size={21}
                      className={`shrink-0 text-gray-500 transition-transform ${
                        schemaKeyDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {schemaKeyDropdownOpen && (
                    <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
                      <div className="max-h-60 overflow-y-auto p-1">
                        {keySettings.length ? (
                          keySettings.map((item) => {
                            const selected =
                              String(selectedKey) === String(item?.id);

                            return (
                              <button
                                key={item?.id}
                                type="button"
                                onClick={() => {
                                  handleKeySelect(item?.id);
                                  setSchemaKeyDropdownOpen(false);
                                }}
                                className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition ${
                                  selected
                                    ? "bg-blue-50 font-semibold text-blue-600"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span>{item?.name || "Unnamed Key"}</span>
                                {selected && <span>✓</span>}
                              </button>
                            );
                          })
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
                  My Available Balance
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
                  onChange={handleTransferPointChange}
                  disabled={transferLoading || !selectedKey}
                  placeholder="Enter points"
                  className="h-[46px] w-full rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              {isRevert ? "Revert Point" : "Transfer Point"}
            </h2>

            {loading ? (
              <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
                Loading key settings...
              </div>
            ) : keySettings.length === 0 ? (
              <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
                No key settings found.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {keySettings.map((item) => {
                  const selected = String(selectedKey) === String(item?.id);
                  const stats = getKeySettingStats(item);

                  return (
                    <button
                      key={item?.id}
                      type="button"
                      onClick={() => handleKeySelect(item?.id)}
                      disabled={transferLoading}
                      className={`min-w-[230px] flex-1 cursor-pointer rounded-xl border p-4 text-left transition disabled:cursor-not-allowed ${
                        selected
                          ? "border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200"
                          : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <span className="break-words text-sm font-semibold text-gray-800">
                          {item?.name || "Unnamed Key"}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {selected ? "Selected" : "Select"}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="min-w-0 rounded-lg bg-gray-50 p-2">
                          <p className="mb-1 text-[11px] font-medium text-gray-500">
                            Balance
                          </p>
                          <p className="break-words text-sm font-bold text-gray-800">
                            {formatPoints(stats.balance)}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-lg bg-orange-50 p-2">
                          <p className="mb-1 text-[11px] font-medium text-orange-700">
                            Consumed
                          </p>
                          <p className="break-words text-sm font-bold text-orange-800">
                            {formatPoints(stats.consumed)}
                          </p>
                        </div>

                        <div className="min-w-0 rounded-lg bg-green-50 p-2">
                          <p className="mb-1 text-[11px] font-medium text-green-700">
                            Available
                          </p>
                          <p className="break-words text-sm font-bold text-green-800">
                            {formatPoints(stats.available)}
                          </p>
                        </div>
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
                roles={revertRoleOptions}
                open={fromRoleDropdownOpen}
                setOpen={setFromRoleDropdownOpen}
                loading={loadingRoles || transactionPinLoading}
                disabled={
                  loadingRoles ||
                  transactionPinLoading ||
                  transferLoading ||
                  revertRoleOptions.length === 0
                }
                placeholder={
                  transactionPinLoading
                    ? "Loading hierarchy..."
                    : revertRoleOptions.length
                      ? "Select Role"
                      : "No eligible role available"
                }
                onSelect={handleFromRoleSelect}
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
                setSearch={setRevertUserSearch}
                open={revertUserDropdownOpen}
                setOpen={setRevertUserDropdownOpen}
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
                onSelect={handleRevertUserSelect}
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
                onChange={handleTransferPointChange}
                disabled={transferLoading || !selectedRevertUser}
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
                setOpen={setSchemaRoleDropdownOpen}
                loading={loadingRoles}
                disabled={
                  !selectedKey ||
                  loadingRoles ||
                  transferLoading ||
                  schemaRoleOptions.length === 0
                }
                placeholder="Select Role"
                onSelect={handleSchemaRoleSelect}
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
                setSearch={setSchemaUserSearch}
                open={schemaUserDropdownOpen}
                setOpen={setSchemaUserDropdownOpen}
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
                onSelect={handleSchemaUserSelect}
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
                onChange={handleTransferPointChange}
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
                setSearch={setTransferUserSearch}
                open={transferUserDropdownOpen}
                setOpen={setTransferUserDropdownOpen}
                loading={loadingTransferUsers}
                disabled={
                  nextRoleId === null ||
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
                onSelect={handleTransferUserSelect}
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
            className="rounded-lg bg-blue-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:bg-gray-400"
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
                {[0, 1].includes(Number(roleId))
                  ? "Latest transactions"
                  : Number(roleId) === 9
                    ? "Your and creator's latest transactions"
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
    {recentTransactions.map((transaction) => {
      const points = getTransactionPoints(transaction);

      // Original transaction parties
      const originalFromName = getTransactionUserName(
        transaction,
        "from"
      );
      const originalToName = getTransactionUserName(
        transaction,
        "to"
      );

      const originalFromEmail = getTransactionUserEmail(
        transaction,
        "from"
      );
      const originalToEmail = getTransactionUserEmail(
        transaction,
        "to"
      );

      const originalFromUserId = getTransactionUserId(
        transaction,
        "from"
      );
      const originalToUserId = getTransactionUserId(
        transaction,
        "to"
      );

      // Transfer = 0, Schema Transfer = 1, Revert = 2
      const isRevertTransaction =
        Number(transaction?.transaction_type) ===
        TRANSACTION_TYPES.REVERT;

      // Normal transfer/schema: From = sender, To = receiver
      // Revert: From = user whose points were reverted,
      // To = admin who initiated the revert
      const fromName = isRevertTransaction
        ? originalToName
        : originalFromName;

      const toName = isRevertTransaction
        ? originalFromName
        : originalToName;

      const fromEmail = isRevertTransaction
        ? originalToEmail
        : originalFromEmail;

      const toEmail = isRevertTransaction
        ? originalFromEmail
        : originalToEmail;

      const fromUserId = isRevertTransaction
        ? originalToUserId
        : originalFromUserId;

      const toUserId = isRevertTransaction
        ? originalFromUserId
        : originalToUserId;

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
                    {getTransactionKeyName(transaction)}
                  </span>
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  {formatTransactionDate(transaction?.created_at)}
                </p>
              </div>

              <div className="shrink-0 rounded-lg bg-gray-50 px-4 py-2 sm:text-right">
                <p className="text-base font-bold text-gray-800">
                  {points.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-gray-400">Points</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* FROM: Sender, or user whose points were reverted */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  From (Sender)
                </p>

                <p className="break-words text-sm font-semibold text-gray-700">
                  {fromName || "N/A"}
                </p>

                {fromEmail && (
                  <p className="mt-1 break-all text-xs text-gray-400">
                    {fromEmail}
                  </p>
                )}

                <p className="mt-1 break-all text-xs text-gray-400">
                  ID: {fromUserId ?? "N/A"}
                </p>
              </div>

              {/* TO: Receiver, or admin who initiated the revert */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  To (Receiver)
                </p>

                <p className="break-words text-sm font-semibold text-gray-700">
                  {toName || "N/A"}
                </p>

                {toEmail && (
                  <p className="mt-1 break-all text-xs text-gray-400">
                    {toEmail}
                  </p>
                )}

                <p className="mt-1 break-all text-xs text-gray-400">
                  ID: {toUserId ?? "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    })}
  </div>
)}
        </div>
      </div>
    </div>
  );
}