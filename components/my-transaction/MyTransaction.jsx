
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
    RiArrowDownLine,
    RiArrowUpLine,
    RiCloseLine,
    RiExchangeLine,
    RiEyeLine,
} from "react-icons/ri";

import { getWalletTransactions } from "@/services/api";

export default function MyTransaction() {
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [selectedTransaction, setSelectedTransaction] =
        useState(null);

    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const getTransactions = async () => {
        try {
            setLoading(true);

            const response = await getWalletTransactions({
                page: pagination.page,
                limit: pagination.limit,
            });

            if (!response?.success) {
                setTransactions([]);

                toast.error(
                    response?.message ||
                        "Failed to fetch transactions"
                );

                return;
            }

            setTransactions(
                Array.isArray(response?.data)
                    ? response.data
                    : []
            );

            const backendPagination =
                response?.pagination || {};

            setPagination((prev) => ({
                ...prev,

                page:
                    Number(
                        backendPagination?.page
                    ) || 1,

                limit:
                    Number(
                        backendPagination?.limit
                    ) || prev.limit,

                total:
                    Number(
                        backendPagination?.total
                    ) || 0,

                totalPages:
                    Number(
                        backendPagination?.totalPages ??
                            backendPagination?.total_pages
                    ) || 0,
            }));
        } catch (error) {
            console.error(
                "GET TRANSACTIONS ERROR:",
                error
            );

            setTransactions([]);

            toast.error(
                error?.response?.data?.message ||
                    error?.message ||
                    "Failed to fetch transactions"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getTransactions();
    }, [pagination.page]);

    useEffect(() => {
        if (selectedTransaction) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [selectedTransaction]);

    const getTransactionType = (type) => {
        switch (Number(type)) {
            case 1:
                return "Schema Transfer Point";

            case 2:
                return "Revert Point";

            case 0:
            default:
                return "Transfer Point";
        }
    };

    const getTransactionIcon = (type) => {
        switch (Number(type)) {
            case 1:
                return <RiArrowDownLine size={22} />;

            case 2:
                return <RiExchangeLine size={22} />;

            case 0:
            default:
                return <RiArrowUpLine size={22} />;
        }
    };

    const getTransactionIconClass = (type) => {
        switch (Number(type)) {
            case 1:
                return "bg-green-100 text-green-600";

            case 2:
                return "bg-orange-100 text-orange-600";

            case 0:
            default:
                return "bg-blue-100 text-blue-600";
        }
    };

    const getTransactionTextClass = (type) => {
        switch (Number(type)) {
            case 1:
                return "text-green-600";

            case 2:
                return "text-orange-600";

            case 0:
            default:
                return "text-blue-600";
        }
    };

    const formatPoints = (points) => {
        const value = Number(points);

        if (Number.isNaN(value)) {
            return "0.00";
        }

        return value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const formatDate = (date) => {
        if (!date) {
            return "-";
        }

        const formattedDate = new Date(date);

        if (Number.isNaN(formattedDate.getTime())) {
            return "-";
        }

        return formattedDate.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handlePrevious = () => {
        if (pagination.page <= 1) {
            return;
        }

        setPagination((prev) => ({
            ...prev,
            page: prev.page - 1,
        }));
    };

    const handleNext = () => {
        if (
            pagination.page >=
            pagination.totalPages
        ) {
            return;
        }

        setPagination((prev) => ({
            ...prev,
            page: prev.page + 1,
        }));
    };

    const closeModal = () => {
        setSelectedTransaction(null);
    };

    const isFirstPage = pagination.page <= 1;

    const isLastPage =
        pagination.totalPages === 0 ||
        pagination.page >= pagination.totalPages;

    const startRecord =
        pagination.total === 0
            ? 0
            : (pagination.page - 1) *
                  pagination.limit +
              1;

    const endRecord = Math.min(
        pagination.page * pagination.limit,
        pagination.total
    );

    return (
        <>
            <div className="w-full p-4">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-xl font-semibold text-gray-800">
                        My Transactions
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        View your wallet transaction history
                    </p>
                </div>

                {/* Loading */}
                {loading ? (
                    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                        <p className="text-sm text-gray-500">
                            Loading transactions...
                        </p>
                    </div>
                ) : transactions.length === 0 ? (
                    /* Empty State */
                    <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white">
                        <p className="text-sm text-gray-500">
                            No transactions found
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Transaction List */}
                        <div className="space-y-3">
                            {transactions.map(
                                (transaction) => {
                                    const type = Number(
                                        transaction?.transaction_type
                                    );

                                    return (
                                        <div
                                            key={
                                                transaction?.id
                                            }
                                            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                                        >
                                            {/* Main Information */}
                                            <div className="flex items-center justify-between gap-4">
                                                {/* Left */}
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div
                                                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${getTransactionIconClass(
                                                            type
                                                        )}`}
                                                    >
                                                        {getTransactionIcon(
                                                            type
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <h3 className="truncate text-sm font-semibold text-gray-800">
                                                            {transaction?.key_setting_name ||
                                                                transaction?.key_name ||
                                                                `Key Setting #${transaction?.key_setting_id}`}
                                                        </h3>

                                                        <p
                                                            className={`mt-1 text-xs font-medium ${getTransactionTextClass(
                                                                type
                                                            )}`}
                                                        >
                                                            {getTransactionType(
                                                                type
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Points */}
                                                <div className="shrink-0 text-right">
                                                    <p
                                                        className={`text-base font-semibold ${getTransactionTextClass(
                                                            type
                                                        )}`}
                                                    >
                                                        {formatPoints(
                                                            transaction?.points_sent
                                                        )}
                                                    </p>

                                                    <p className="mt-1 text-xs text-gray-400">
                                                        Points
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Main Details */}
                                            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        From
                                                    </p>

                                                    <p className="mt-1 truncate text-sm font-medium text-gray-700">
                                                        {transaction?.from_user_name ||
                                                            transaction?.from_user_email ||
                                                            `User #${transaction?.from_user_id}`}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        To
                                                    </p>

                                                    <p className="mt-1 truncate text-sm font-medium text-gray-700">
                                                        {transaction?.to_user_name ||
                                                            transaction?.to_user_email ||
                                                            `User #${transaction?.to_user_id}`}
                                                    </p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-gray-400">
                                                        Date
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {formatDate(
                                                            transaction?.created_at
                                                        )}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* View Details */}
                                            <div className="mt-4 flex justify-end border-t border-gray-100 pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedTransaction(
                                                            transaction
                                                        )
                                                    }
                                                    className="flex cursor-pointer items-center gap-2 rounded-sm bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                                                >
                                                    <RiEyeLine
                                                        size={
                                                            17
                                                        }
                                                    />

                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="mt-6 flex flex-col items-center justify-center gap-3">
                                {/* Record Count */}
                                <p className="text-sm text-gray-500">
                                    Showing{" "}
                                    <span className="font-medium text-gray-700">
                                        {
                                            startRecord
                                        }
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-medium text-gray-700">
                                        {endRecord}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium text-gray-700">
                                        {
                                            pagination.total
                                        }
                                    </span>{" "}
                                    transactions
                                </p>

                                {/* Pagination */}
                                <div className="flex items-center gap-2">
                                    {/* Previous */}
                                    <button
                                        type="button"
                                        onClick={
                                            handlePrevious
                                        }
                                        disabled={
                                            isFirstPage
                                        }
                                        className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                                            isFirstPage
                                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                                : "cursor-pointer border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                    >
                                        Previous
                                    </button>

                                    {/* Current Page */}
                                    <div className="flex h-9 min-w-9 items-center justify-center rounded-sm bg-blue-600 px-3 text-sm font-semibold text-white">
                                        {
                                            pagination.page
                                        }
                                    </div>

                                    {/* Next */}
                                    <button
                                        type="button"
                                        onClick={
                                            handleNext
                                        }
                                        disabled={
                                            isLastPage
                                        }
                                        className={`rounded-sm border px-4 py-2 text-sm font-medium transition ${
                                            isLastPage
                                                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                                                : "cursor-pointer border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                                        }`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Transaction Details Modal */}
            {selectedTransaction && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                    onClick={closeModal}
                >
                    <div
                        className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">
                                    Transaction Details
                                </h2>

                                <p className="mt-1 text-xs text-gray-500">
                                    Transaction #
                                    {
                                        selectedTransaction?.id
                                    }
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                                <RiCloseLine
                                    size={22}
                                />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="max-h-[75vh] overflow-y-auto p-5">
                            {(() => {
                                const transaction =
                                    selectedTransaction;

                                const type = Number(
                                    transaction?.transaction_type
                                );

                                return (
                                    <>
                                        {/* Transaction Summary */}
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`flex h-11 w-11 items-center justify-center rounded-full ${getTransactionIconClass(
                                                            type
                                                        )}`}
                                                    >
                                                        {getTransactionIcon(
                                                            type
                                                        )}
                                                    </div>

                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {transaction?.key_setting_name ||
                                                                transaction?.key_name ||
                                                                `Key Setting #${transaction?.key_setting_id}`}
                                                        </p>

                                                        <p
                                                            className={`mt-1 text-xs font-medium ${getTransactionTextClass(
                                                                type
                                                            )}`}
                                                        >
                                                            {getTransactionType(
                                                                type
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <p
                                                        className={`text-lg font-bold ${getTransactionTextClass(
                                                            type
                                                        )}`}
                                                    >
                                                        {formatPoints(
                                                            transaction?.points_sent
                                                        )}
                                                    </p>

                                                    <p className="text-xs text-gray-400">
                                                        Points
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* User Information */}
                                        <div className="mt-4">
                                            <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                                User Information
                                            </h3>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        From User
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {transaction?.from_user_name ||
                                                            "-"}
                                                    </p>

                                                    {/* <p className="mt-1 text-xs text-gray-500">
                                                        ID:{" "}
                                                        {transaction?.from_user_id ??
                                                            "-"}
                                                    </p> */}

                                                    {transaction?.from_user_email && (
                                                        <p className="mt-1 truncate text-xs text-gray-500">
                                                            {
                                                                transaction.from_user_email
                                                            }
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        To User
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {transaction?.to_user_name ||
                                                            "-"}
                                                    </p>

                                                    {/* <p className="mt-1 text-xs text-gray-500">
                                                        ID:{" "}
                                                        {transaction?.to_user_id ??
                                                            "-"}
                                                    </p> */}

                                                    {transaction?.to_user_email && (
                                                        <p className="mt-1 truncate text-xs text-gray-500">
                                                            {
                                                                transaction.to_user_email
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transaction Information */}
                                        <div className="mt-5">
                                            <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                                Transaction Information
                                            </h3>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        Transaction ID
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {transaction?.id ??
                                                            "-"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        Transaction Type
                                                    </p>

                                                    <p
                                                        className={`mt-1 text-sm font-medium ${getTransactionTextClass(
                                                            type
                                                        )}`}
                                                    >
                                                        {getTransactionType(
                                                            type
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        Key Setting
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {transaction?.key_setting_name ||
                                                            transaction?.key_name ||
                                                            `Key Setting #${transaction?.key_setting_id}`}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        Key Setting ID
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {transaction?.key_setting_id ??
                                                            "-"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        Points
                                                    </p>

                                                    <p className="mt-1 text-sm font-semibold text-gray-700">
                                                        {formatPoints(
                                                            transaction?.points_sent
                                                        )}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-gray-200 p-3">
                                                    <p className="text-xs text-gray-400">
                                                        Created By
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {transaction?.created_by ??
                                                            "-"}
                                                    </p>
                                                </div>

                                                <div className="rounded-lg border border-gray-200 p-3 sm:col-span-2">
                                                    <p className="text-xs text-gray-400">
                                                        Date
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-gray-700">
                                                        {formatDate(
                                                            transaction?.created_at
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Balance Information */}
                                        <div className="mt-5">
                                            <h3 className="mb-3 text-sm font-semibold text-gray-800">
                                                Balance Information
                                            </h3>

                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                {/* From Balance */}
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        From Balance
                                                    </p>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-400">
                                                                Before
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-gray-700">
                                                                {formatPoints(
                                                                    transaction?.from_balance_before
                                                                )}
                                                            </p>
                                                        </div>

                                                        <span className="text-gray-400">
                                                            →
                                                        </span>

                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400">
                                                                After
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-gray-700">
                                                                {formatPoints(
                                                                    transaction?.from_balance_after
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* To Balance */}
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                                    <p className="text-xs font-medium text-gray-500">
                                                        To Balance
                                                    </p>

                                                    <div className="mt-3 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-400">
                                                                Before
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-gray-700">
                                                                {formatPoints(
                                                                    transaction?.to_balance_before
                                                                )}
                                                            </p>
                                                        </div>

                                                        <span className="text-gray-400">
                                                            →
                                                        </span>

                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-400">
                                                                After
                                                            </p>

                                                            <p className="mt-1 text-sm font-semibold text-gray-700">
                                                                {formatPoints(
                                                                    transaction?.to_balance_after
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex justify-end border-t border-gray-200 px-5 py-4">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="cursor-pointer rounded-sm bg-blue-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
