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
  const value = String(search || "").trim().toLowerCase();

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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() =>
          setOpen((prev) => !prev)
        }
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
      >
        <span className="truncate">
          {loading
            ? "Loading users..."
            : selectedUser
            ? getUserName(selectedUser)
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
                onChange={(e) =>
                  setSearch(e.target.value)
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
                const selected =
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
          setOpen((prev) => !prev)
        }
        disabled={disabled}
        className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-3 text-left text-sm font-semibold text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
      >
        <span className="truncate">
          {loading
            ? "Loading roles..."
            : selectedRoleName || placeholder}
        </span>

        <IoMdArrowDropdown
          size={22}
          className={`shrink-0 text-gray-500 transition-transform ${
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
                  className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold ${
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

  const [message, setMessage] =
    useState({
      type: "",
      text: "",
    });

  const [transferUsers, setTransferUsers] =
    useState([]);

  const [selectedTransferUser, setSelectedTransferUser] =
    useState("");

  const [transferUserSearch, setTransferUserSearch] =
    useState("");

  const [transferUserDropdownOpen, setTransferUserDropdownOpen] =
    useState(false);

  const [loadingTransferUsers, setLoadingTransferUsers] =
    useState(false);

  const [selectedSchemaRole, setSelectedSchemaRole] =
    useState("");

  const [schemaUsers, setSchemaUsers] =
    useState([]);

  const [selectedSchemaUser, setSelectedSchemaUser] =
    useState("");

  const [schemaUserSearch, setSchemaUserSearch] =
    useState("");

  const [schemaRoleDropdownOpen, setSchemaRoleDropdownOpen] =
    useState(false);

  const [schemaUserDropdownOpen, setSchemaUserDropdownOpen] =
    useState(false);

  const [loadingSchemaUsers, setLoadingSchemaUsers] =
    useState(false);

  const [selectedFromRole, setSelectedFromRole] =
    useState("");

  const [revertUsers, setRevertUsers] =
    useState([]);

  const [selectedRevertUser, setSelectedRevertUser] =
    useState("");

  const [revertUserSearch, setRevertUserSearch] =
    useState("");

  const [fromRoleDropdownOpen, setFromRoleDropdownOpen] =
    useState(false);

  const [revertUserDropdownOpen, setRevertUserDropdownOpen] =
    useState(false);

  const [loadingRevertUsers, setLoadingRevertUsers] =
    useState(false);

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

  const selectedSchemaUserData =
    useMemo(
      () =>
        schemaUsers.find(
          (user) =>
            Number(user?.id) ===
            Number(selectedSchemaUser)
        ),
      [
        schemaUsers,
        selectedSchemaUser,
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

  const selectedSchemaRoleData =
    useMemo(
      () =>
        roles.find(
          (role) =>
            Number(role?.role_id) ===
            Number(selectedSchemaRole)
        ),
      [roles, selectedSchemaRole]
    );

  const nextRoleId =
    roleId !== null
      ? nextRoleMap[roleId]
      : null;

  const nextRoleName =
    roleNames[nextRoleId] || "";

  const schemaRoleOptions = roles;

  const selectedFromRoleName =
    selectedFromRoleData?.name ||
    roleNames[
      Number(selectedFromRole)
    ] ||
    "";

  const selectedSchemaRoleName =
    selectedSchemaRoleData?.name ||
    roleNames[
      Number(selectedSchemaRole)
    ] ||
    "";

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
      const targetRoleId =
        nextRoleMap[currentRoleId];

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
        await getDropdownUsers(
          targetRoleId,
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
        Array.isArray(response?.data?.users)
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

      if (
        !Number.isFinite(role)
      ) {
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
        Array.isArray(response?.data?.users)
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

      await loadKeySettings();
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
        currentRole
      );
    };

    loadData();
  }, [transactionType]);

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

    setWalletBalance(
      Number(key?.balance || 0)
    );

    setAvailableBalance(0);

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

    setTransferPoint("");
    setTransferUserSearch("");
    setTransferUserDropdownOpen(false);

    setMessage({
      type: "",
      text: "",
    });

    setAvailableBalance(0);
  };

  const handleSchemaRoleSelect = async (
    role
  ) => {
    const selectedRoleId =
      Number(role?.role_id);

    if (
      !Number.isFinite(
        selectedRoleId
      )
    ) {
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
    setTransferPoint("");
    setSchemaRoleDropdownOpen(false);

    setMessage({
      type: "",
      text: "",
    });

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
    setTransferPoint("");
    setAvailableBalance(0);

    setMessage({
      type: "",
      text: "",
    });
  };

  const handleFromRoleSelect = async (
    role
  ) => {
    const targetRoleId =
      Number(role?.role_id);

    if (
      !Number.isFinite(
        targetRoleId
      )
    ) {
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

  const resetAllFields = () => {
    setSelectedKey("");
    setWalletBalance(0);
    setAvailableBalance(0);
    setTransferPoint("");

    setSelectedTransferUser("");
    setTransferUserSearch("");
    setTransferUserDropdownOpen(false);
    setTransferUsers([]);

    setSelectedSchemaRole("");
    setSchemaUsers([]);
    setSelectedSchemaUser("");
    setSchemaUserSearch("");
    setSchemaRoleDropdownOpen(false);
    setSchemaUserDropdownOpen(false);

    setSelectedFromRole("");
    setRevertUsers([]);
    setSelectedRevertUser("");
    setRevertUserSearch("");
    setFromRoleDropdownOpen(false);
    setRevertUserDropdownOpen(false);
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
    } else if (isSchemaTransfer) {
      if (!selectedSchemaRole) {
        setMessage({
          type: "error",
          text: "Please select a role",
        });
        return;
      }

      if (!selectedSchemaUser) {
        setMessage({
          type: "error",
          text: "Please select a user",
        });
        return;
      }
    } else if (!selectedTransferUser) {
      setMessage({
        type: "error",
        text: "Please select a user",
      });
      return;
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
          transactionType
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

      const successMessage =
        response?.message ||
        (isRevert
          ? "Points reverted successfully"
          : isSchemaTransfer
          ? "Schema transferred successfully"
          : "Points transferred successfully");

      resetAllFields();

      setMessage({
        type: "success",
        text: successMessage,
      });

      if (
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(
          new Event(
            "wallet_balance_updated"
          )
        );
      }

      await loadKeySettings();

      const currentRole =
        Number(getRoleId());

      if (
        Number.isFinite(currentRole)
      ) {
        if (isRevert) {
          if (selectedFromRole) {
            await loadRevertUsers(
              Number(
                selectedFromRole
              )
            );
          }
        } else if (
          isSchemaTransfer
        ) {
          if (selectedSchemaRole) {
            await loadSchemaUsers(
              Number(
                selectedSchemaRole
              )
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
          error?.response?.data
            ?.message ||
          "Failed to transfer points",
      });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="rounded-xl bg-white p-6 shadow-sm">
        {isSchemaTransfer ? (
          <div className="mb-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Schema Transfer Point
                </label>

                <div className="relative">
                  <select
                    value={selectedKey || ""}
                    onChange={(e) =>
                      handleKeySelect(
                        e.target.value
                      )
                    }
                    disabled={
                      loading ||
                      transferLoading ||
                      keySettings.length === 0
                    }
                    className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm font-semibold text-gray-700 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                  >
                    <option value="">
                      Select Key Setting
                    </option>

                    {keySettings.map(
                      (item) => (
                        <option
                          key={item?.id}
                          value={item?.id}
                        >
                          {item?.name}
                        </option>
                      )
                    )}
                  </select>

                  <IoMdArrowDropdown
                    size={22}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  />
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
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
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
            ) : keySettings.length ===
              0 ? (
              <div className="rounded-lg border border-gray-200 p-5 text-sm text-gray-500">
                No active key settings found.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {keySettings.map(
                  (item) => {
                    const selected =
                      Number(
                        selectedKey
                      ) ===
                      Number(
                        item?.id
                      );

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
                        className={`rounded-lg border px-4 py-3 text-left transition disabled:cursor-not-allowed ${
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
                              item?.balance ||
                                0
                            ).toLocaleString(
                              "en-IN"
                            )}
                          </span>
                        </div>
                      </button>
                    );
                  }
                )}
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-200 pt-6">
          {isRevert ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  From Role
                </label>

                <RoleDropdown
                  value={
                    selectedFromRole
                  }
                  roles={roles}
                  open={
                    fromRoleDropdownOpen
                  }
                  setOpen={
                    setFromRoleDropdownOpen
                  }
                  loading={
                    loadingRoles
                  }
                  disabled={
                    loadingRoles ||
                    transferLoading ||
                    roles.length === 0
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
                  placeholder="Enter points"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>
            </div>
          ) : isSchemaTransfer ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Transfer Point
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
                    !selectedKey
                  }
                  placeholder="Enter points"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Role
                </label>

                <RoleDropdown
                  value={
                    selectedSchemaRole
                  }
                  roles={
                    schemaRoleOptions
                  }
                  open={
                    schemaRoleDropdownOpen
                  }
                  setOpen={
                    setSchemaRoleDropdownOpen
                  }
                  loading={
                    loadingRoles
                  }
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
                  value={
                    selectedSchemaUser
                  }
                  users={
                    schemaUsers
                  }
                  search={
                    schemaUserSearch
                  }
                  setSearch={
                    setSchemaUserSearch
                  }
                  open={
                    schemaUserDropdownOpen
                  }
                  setOpen={
                    setSchemaUserDropdownOpen
                  }
                  loading={
                    loadingSchemaUsers
                  }
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
                  value={
                    availableBalance
                  }
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Transfer Point
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
                  placeholder="Enter amount"
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
                    transferLoading
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
                  : isSchemaTransfer
                  ? !selectedSchemaRole ||
                    !selectedSchemaUser
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