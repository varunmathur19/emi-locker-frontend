
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  RiArrowDownLine,
  RiArrowUpLine,
  RiCloseLine,
  RiExchangeLine,
  RiEyeLine,
  RiFileList3Line,
  RiInformationLine,
  RiTimeLine,
  RiUser3Line,
  RiWallet3Line,
} from "react-icons/ri";
import { FaArrowRightLong } from "react-icons/fa6";

import { getWalletTransactions } from "@/services/api";

const PAGE_LIMIT = 10;

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

const TRANSACTION_TYPES = {
  0: "Transfer Point",
  1: "Schema Transfer Point",
  2: "Revert Point",
};

const getRoleName = (roleId) => {
  if (roleId === null || roleId === undefined || roleId === "") {
    return "";
  }

  return ROLE_NAMES[Number(roleId)] || "User";
};

const getUserDisplayName = (name, email, id) => {
  if (name) return name;
  if (email) return email;
  if (id !== null && id !== undefined && id !== "") {
    return `User #${id}`;
  }

  return "-";
};

const formatPoints = (points) => {
  const value = Number(points);

  if (!Number.isFinite(value)) return "0.00";

  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (date) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return parsedDate.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getTransactionType = (type) =>
  TRANSACTION_TYPES[Number(type)] || "Transfer Point";

const getTransactionIcon = (type) => {
  switch (Number(type)) {
    case 1:
      return <RiArrowDownLine size={20} />;
    case 2:
      return <RiExchangeLine size={20} />;
    default:
      return <RiArrowUpLine size={20} />;
  }
};

const getTransactionIconClass = (type) => {
  switch (Number(type)) {
    case 1:
      return "bg-green-50 text-green-600 border-green-100";
    case 2:
      return "bg-orange-50 text-orange-600 border-orange-100";
    default:
      return "bg-blue-50 text-blue-600 border-blue-100";
  }
};

const getTransactionTextClass = (type) => {
  switch (Number(type)) {
    case 1:
      return "text-green-600";
    case 2:
      return "text-orange-600";
    default:
      return "text-blue-600";
  }
};

const getTransactionBadgeClass = (type) => {
  switch (Number(type)) {
    case 1:
      return "bg-green-50 text-green-600 border-green-100";
    case 2:
      return "bg-orange-50 text-orange-600 border-orange-100";
    default:
      return "bg-blue-50 text-blue-600 border-blue-100";
  }
};

/*
 * Adds the user's role beside their name.
 * Example: Varun (Staff), Aditya (Retailer).
 */
const getUserWithRole = (user) => {
  const name = getUserDisplayName(user?.name, user?.email, user?.id);
  const role = getRoleName(user?.roleId);

  return {
    ...user,
    displayName: name,
    roleName: role,
    displayWithRole: role ? `${name} (${role})` : name,
  };
};

/*
 * Revert Point:
 * Display the parties in reverse order so the receiver of the
 * reverted points appears as From and the sender appears as To.
 *
 * This changes the display only, not the database transaction.
 */
const getTransactionParties = (transaction) => {
  const from = {
    name: transaction?.from_user_name,
    email: transaction?.from_user_email,
    id: transaction?.from_user_id,
    roleId: transaction?.from_user_role_id,
    balanceBefore: transaction?.from_balance_before,
    balanceAfter: transaction?.from_balance_after,
  };

  const to = {
    name: transaction?.to_user_name,
    email: transaction?.to_user_email,
    id: transaction?.to_user_id,
    roleId: transaction?.to_user_role_id,
    balanceBefore: transaction?.to_balance_before,
    balanceAfter: transaction?.to_balance_after,
  };

  const parties =
    Number(transaction?.transaction_type) === 2
      ? { from: to, to: from }
      : { from, to };

  return {
    from: getUserWithRole(parties.from),
    to: getUserWithRole(parties.to),
  };
};

export default function MyTransaction() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [currentRole, setCurrentRole] = useState(null);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 0,
  });

  // Read the logged-in user's role.
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");

      if (!storedUser) {
        setCurrentRole(null);
        return;
      }

      const user = JSON.parse(storedUser);
      const roleId = Number(
        user?.role_id ?? user?.roleId ?? user?.role
      );

      setCurrentRole(Number.isFinite(roleId) ? roleId : null);
    } catch (error) {
      console.error("GET CURRENT USER ROLE ERROR:", error);
      setCurrentRole(null);
    }
  }, []);

  const isAdminRole = currentRole === 0 || currentRole === 1;

  // Fetch transactions whenever the page or limit changes.
  const getTransactions = useCallback(async () => {
    setLoading(true);

    try {
      const response = await getWalletTransactions({
        page: pagination.page,
        limit: pagination.limit,
      });

      if (!response?.success) {
        setTransactions([]);
        setPagination((prev) => ({
          ...prev,
          total: 0,
          totalPages: 0,
        }));

        toast.error(
          response?.message || "Failed to fetch transactions"
        );
        return;
      }

      const data = Array.isArray(response.data)
        ? response.data
        : [];

      const backendPagination = response.pagination || {};
      const total = Math.max(
        Number(backendPagination.total) || 0,
        0
      );
      const limit = Math.max(
        Number(backendPagination.limit) || pagination.limit,
        1
      );
      const page = Math.max(
        Number(backendPagination.page) || pagination.page,
        1
      );
      const totalPages =
        Number(backendPagination.totalPages) ||
        Math.ceil(total / limit);

      setTransactions(data);
      setPagination({
        page,
        limit,
        total,
        totalPages,
      });
    } catch (error) {
      console.error("GET TRANSACTIONS ERROR:", error);

      setTransactions([]);
      setPagination((prev) => ({
        ...prev,
        total: 0,
        totalPages: 0,
      }));

      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to fetch transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    getTransactions();
  }, [getTransactions]);

  // Lock background scrolling while the details modal is open.
  useEffect(() => {
    if (!selectedTransaction) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSelectedTransaction(null);
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [selectedTransaction]);

  const handlePrevious = () => {
    if (loading || pagination.page <= 1) return;

    setPagination((prev) => ({
      ...prev,
      page: prev.page - 1,
    }));
  };

  const handleNext = () => {
    if (loading || pagination.page >= pagination.totalPages) {
      return;
    }

    setPagination((prev) => ({
      ...prev,
      page: prev.page + 1,
    }));
  };

  const closeModal = () => setSelectedTransaction(null);

  const isFirstPage = pagination.page <= 1;
  const isLastPage =
    pagination.totalPages === 0 ||
    pagination.page >= pagination.totalPages;

  const startRecord =
    pagination.total === 0
      ? 0
      : (pagination.page - 1) * pagination.limit + 1;

  const endRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <>
      <div className="w-full p-4 sm:p-1">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <RiFileList3Line size={20} />
              </div>

              <h1 className="text-xl font-semibold text-gray-800">
                My Transactions
              </h1>
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Track your wallet transaction history and point transfers.
            </p>
          </div>

          {isAdminRole && !loading && pagination.total > 0 && (
            <div className="flex w-fit items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <RiWallet3Line size={19} />
              </div>

              <div>
                <p className="text-xs text-gray-400">
                  Total Transactions
                </p>
                <p className="mt-0.5 text-base font-semibold text-gray-800">
                  {pagination.total.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Loading and empty states */}
        {loading ? (
          <div className="rounded-xl border border-gray-200 bg-white p-10 shadow-sm">
            <div className="flex flex-col items-center justify-center">
              <div className="h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
              <p className="mt-4 text-sm font-medium text-gray-600">
                Loading transactions...
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Please wait while we fetch your transaction history.
              </p>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-5 py-14 shadow-sm">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <RiFileList3Line size={27} />
              </div>

              <h2 className="mt-4 text-base font-semibold text-gray-800">
                No Transactions Found
              </h2>

              <p className="mt-1 max-w-sm text-sm text-gray-500">
                There are no wallet transactions available to display at the moment.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Transaction cards */}
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const type = Number(transaction?.transaction_type);
                const parties = getTransactionParties(transaction);

                return (
                  <div
                    key={transaction?.id}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition duration-200 hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="p-2 sm:p-3">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${getTransactionIconClass(type)}`}
                          >
                            {getTransactionIcon(type)}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold text-gray-800">
                              {transaction?.key_setting_name ||
                                transaction?.key_name ||
                                `Key Setting #${transaction?.key_setting_id}`}
                            </h3>

                            <span
                              className={`mt-1.5 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${getTransactionBadgeClass(type)}`}
                            >
                              {getTransactionType(type)}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-lg bg-gray-50 px-4 py-2.5 text-left sm:min-w-[125px] sm:text-right">
                          <p className="text-[11px] text-gray-400">
                            Points
                          </p>
                          <p
                            className={`mt-0.5 text-base font-bold ${getTransactionTextClass(type)}`}
                          >
                            {formatPoints(transaction?.points_sent)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-2 md:grid-cols-3">
                        <UserInfo
                          label="From"
                          user={parties.from}
                        //   icon={<RiArrowDownLine size={15} />}
                        />

                        <UserInfo
                          label="To"
                          user={parties.to}
                        //   icon={<RiArrowUpLine size={15} />}
                        />

                        <UserInfo
                          label="Date"
                          value={formatDate(transaction?.created_at)}
                          icon={<RiTimeLine size={15} />}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/70 px-4 py-2 sm:px-5">
                      <p className="text-xs text-gray-400">
                        Transaction #{transaction?.id}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedTransaction(transaction)}
                        className="flex cursor-pointer items-center gap-1 rounded-sm border border-blue-600 bg-blue-600 px-2 py-2 text-sm font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      >
                        <RiEyeLine size={16} />
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-6 rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-xs text-gray-500">
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {startRecord}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-gray-700">
                    {endRecord}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-700">
                    {pagination.total}
                  </span>{" "}
                  transactions
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={isFirstPage || loading}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                      isFirstPage || loading
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    Previous
                  </button>

                  <div className="flex h-9 min-w-9 items-center justify-center rounded-sm bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm">
                    {pagination.page}
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isLastPage || loading}
                    className={`rounded-lg border px-3.5 py-2 text-xs font-medium transition ${
                      isLastPage || loading
                        ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
                        : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Transaction details modal */}
      {selectedTransaction && (
        <TransactionModal
          transaction={selectedTransaction}
          onClose={closeModal}
        />
      )}
    </>
  );
}

function UserInfo({ label, user, value, icon }) {
  return (
    <div className="min-w-0 rounded-lg bg-gray-50 p-3">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <p className="text-[11px] font-medium uppercase tracking-wide">
          {label}
        </p>
      </div>

      {user ? (
        <div className="mt-1.5 min-w-0">
          <p className="truncate text-sm font-medium text-gray-700">
            {user.displayName}
          </p>

          {user.roleName && (
            <span className="mt-1 inline-flex max-w-full rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
              {user.roleName}
            </span>
          )}
        </div>
      ) : (
        <p className="mt-1.5 truncate text-sm font-medium text-gray-700">
          {value}
        </p>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  valueClass = "text-gray-700",
  roleName,
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>

      <p className={`mt-2 break-words text-sm font-semibold ${valueClass}`}>
        {value ?? "-"}
      </p>

      {roleName && (
        <span className="mt-1.5 inline-flex rounded-md border border-blue-100 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
          {roleName}
        </span>
      )}
    </div>
  );
}

function BalanceCard({ title, before, after }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-semibold text-gray-600">{title}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-gray-400">Before</p>
          <p className="mt-1 text-sm font-semibold text-gray-700">
            {before}
          </p>
        </div>

        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
          <FaArrowRightLong size={13} />
        </div>

        <div className="text-right">
          <p className="text-[11px] text-gray-400">After</p>
          <p className="mt-1 text-sm font-semibold text-gray-700">
            {after}
          </p>
        </div>
      </div>
    </div>
  );
}

function TransactionModal({ transaction, onClose }) {
  const type = Number(transaction?.transaction_type);
  const parties = getTransactionParties(transaction);

  const keySetting =
    transaction?.key_setting_name ||
    transaction?.key_name ||
    `Key Setting #${transaction?.key_setting_id}`;

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="transaction-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full border ${getTransactionIconClass(type)}`}
            >
              {getTransactionIcon(type)}
            </div>

            <div>
              <h2
                id="transaction-modal-title"
                className="text-base font-semibold text-gray-800"
              >
                Transaction Details
              </h2>
              <p className="mt-0.5 text-xs text-gray-400">
                Transaction #{transaction?.id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close transaction details"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <RiCloseLine size={22} />
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {/* Summary */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-gray-500">Key Setting</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {keySetting}
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${getTransactionBadgeClass(type)}`}
                >
                  {getTransactionType(type)}
                </span>
              </div>

              <div className="rounded-lg bg-white px-4 py-3 shadow-sm sm:min-w-[150px] sm:text-right">
                <p className="text-[11px] text-gray-400">Points</p>
                <p
                  className={`mt-0.5 text-xl font-bold ${getTransactionTextClass(type)}`}
                >
                  {formatPoints(transaction?.points_sent)}
                </p>
              </div>
            </div>
          </div>

          {/* User information */}
          <section className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <RiUser3Line size={17} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                User Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem
                label="From User"
                value={parties.from.displayName}
                roleName={parties.from.roleName}
              />

              <DetailItem
                label="To User"
                value={parties.to.displayName}
                roleName={parties.to.roleName}
              />

              {parties.from.email && (
                <DetailItem
                  label="From Email"
                  value={parties.from.email}
                />
              )}

              {parties.to.email && (
                <DetailItem
                  label="To Email"
                  value={parties.to.email}
                />
              )}
            </div>
          </section>

          {/* Transaction information */}
          <section className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <RiInformationLine size={17} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Transaction Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem
                label="Transaction ID"
                value={transaction?.id}
              />

              <DetailItem
                label="Transaction Type"
                value={getTransactionType(type)}
                valueClass={getTransactionTextClass(type)}
              />

              <DetailItem label="Key Setting" value={keySetting} />

              <DetailItem
                label="Points"
                value={formatPoints(transaction?.points_sent)}
              />

              <DetailItem
                label="Created By"
                value={
                  transaction?.actor_name ||
                  transaction?.created_by ||
                  "-"
                }
              />

              <DetailItem
                label="Transaction Date"
                value={formatDate(transaction?.created_at)}
              />
            </div>
          </section>

          {/* Balance information: use the same displayed parties as above. */}
          <section className="mt-5">
            <div className="mb-3 flex items-center gap-2">
              <RiWallet3Line size={17} className="text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Balance Information
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BalanceCard
                title={`From Balance${parties.from.roleName ? ` (${parties.from.roleName})` : ""}`}
                before={formatPoints(parties.from.balanceBefore)}
                after={formatPoints(parties.from.balanceAfter)}
              />

              <BalanceCard
                title={`To Balance${parties.to.roleName ? ` (${parties.to.roleName})` : ""}`}
                before={formatPoints(parties.to.balanceBefore)}
                after={formatPoints(parties.to.balanceAfter)}
              />
            </div>
          </section>
        </div>

        <div className="flex items-center justify-end border-t border-gray-200 bg-gray-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm bg-blue-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
