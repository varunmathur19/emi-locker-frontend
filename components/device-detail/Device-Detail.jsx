
"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaPlus ,FaEye } from "react-icons/fa6";
import { getDevices } from "@/services/api";
import DeviceDetailForm from "./form";
import { createPortal } from "react-dom";
import { RxCross2 } from "react-icons/rx";

const PAGE_SIZE = 10;
const SKELETON_ROWS = 6;

const TABLE_HEADERS = [
  "S. No.",
  "Serial Number",
  "Brand",
  "Customer Image",
  "Customer Name",
  "Enrollment",
  "Phone",
  "Registration No.",
  "IMEI 1",
  "IMEI 2",
  "Signature",
  "Status",
  "Retailer",
  "FOS",
  "Distributor",
  "Guarantor Name",
  "Guarantor Number",
  "Actions",
];

function SkeletonLine({ className = "" }) {
  return (
    <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />
  );
}

function DeviceTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[3000px] text-left text-sm">
          <thead className="bg-gray-100">
            <tr>
              {TABLE_HEADERS.map((header) => (
                <th key={header} className="whitespace-nowrap px-4 py-4">
                  <SkeletonLine className="h-3 w-20" />
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
              <tr key={index}>
                {TABLE_HEADERS.map((header, cellIndex) => (
                  <td key={`${header}-${cellIndex}`} className="px-4 py-4">
                    <SkeletonLine
                      className={`h-4 ${
                        cellIndex === 2 || cellIndex === 4 || cellIndex === 13
                          ? "h-10 w-12"
                          : cellIndex >= 16 && cellIndex <= 18
                            ? "w-28"
                            : "w-20"
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonLine className="h-4 w-48" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonLine key={index} className="h-9 w-10 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TotalDevicesSkeleton() {
  return (
    <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <SkeletonLine className="h-4 w-24" />
      <SkeletonLine className="mt-3 h-8 w-16" />
    </div>
  );
}

function PersonCell({ name, companyName, blankIfMissing = false }) {
  if (!name && blankIfMissing) {
    return <td className="px-4 py-4">-</td>;
  }

  return (
    <td className="px-4 py-4">
      <div className="flex min-w-36 flex-col gap-1">
        <span
          className="whitespace-nowrap font-medium text-gray-800"
          title={name || ""}
        >
          {name || "-"}
        </span>

        <span
          className="max-w-52 truncate text-xs text-gray-500"
          title={companyName || ""}
        >
          {companyName || "-"}
        </span>
      </div>
    </td>
  );
}

function ImageCell({ path, alt, getImageUrl, className = "" }) {
  const [imageError, setImageError] = useState(false);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [path]);

  if (!path || imageError) {
    return (
      <td className="px-4 py-4 text-gray-400">
        -
      </td>
    );
  }

  const imageUrl = getImageUrl(path);

  return (
    <>
      <td className="px-4 py-4">
        <div className="flex h-14 w-16 items-center justify-center">
          <img
            src={imageUrl}
            alt={alt}
            loading="lazy"
            onError={() => setImageError(true)}
            onClick={() => setShowImage(true)}
            className={`h-12 max-w-16 cursor-pointer rounded-lg border border-gray-200 bg-white object-cover shadow-sm transition-transform duration-200 hover:scale-110 hover:shadow-md ${className}`}
          />
        </div>
      </td>

      {showImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowImage(false)}
          >
            <button
              type="button"
              onClick={() => setShowImage(false)}
              className="absolute right-6 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-3xl text-white transition hover:bg-white/30"
              aria-label="Close image preview"
            >
              <RxCross2 />
            </button>

            <img
              src={imageUrl}
              alt={alt || "Image Preview"}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-[90vw] rounded-md object-contain shadow-2xl"
            />
          </div>,
          document.body
        )}
    </>
  );
}

function TextCell({ children, className = "" }) {
  return (
    <td className={`whitespace-nowrap px-4 py-4 text-gray-600 ${className}`}>
      {children === null || children === undefined || children === ""
        ? "-"
        : children}
    </td>
  );
}

function StatusBadge({ status }) {
  const isActive = String(status || "").toLowerCase() === "active";

  return (
    <span
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {status || "-"}
    </span>
  );
}

export function DeviceDetail() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalDevices, setTotalDevices] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Fetch device data
  const fetchDevices = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await getDevices({
        page,
        limit: PAGE_SIZE,
      });

      const root = response?.data ?? response;

      const payload = Array.isArray(root)
        ? { data: root }
        : Array.isArray(root?.data)
          ? root
          : Array.isArray(root?.devices)
            ? { ...root, data: root.devices }
            : Array.isArray(root?.result?.data)
              ? root.result
              : null;

      if (!payload) {
        throw new Error("Invalid devices response received from the server.");
      }

      const deviceList = payload.data;

      const pagination =
        payload.pagination ??
        root?.pagination ??
        response?.pagination ??
        {};

      const total = Number(
        pagination.total ??
          payload.total ??
          payload.count ??
          deviceList.length
      );

      const pages = Number(
        pagination.totalPages ??
          Math.ceil(total / PAGE_SIZE)
      );

      setDevices(deviceList);
      setTotalDevices(total);
      setTotalPages(pages);

      setCurrentPage(
        Number(pagination.page) > 0
          ? Number(pagination.page)
          : page
      );
    } catch (err) {
      console.error("GET DEVICES ERROR:", err?.response?.data || err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load devices.";

      setError(message);
      setDevices([]);
      setTotalDevices(0);
      setTotalPages(0);

      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices(currentPage);
  }, [currentPage, fetchDevices]);

  // Image URL
  const getImageUrl = useCallback((imagePath) => {
    if (!imagePath) return "";

    const path = String(imagePath).trim();

    if (/^https?:\/\//i.test(path)) {
      return path;
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5000/api"
    ).replace(/\/+$/, "");

    const serverUrl = baseUrl.replace(/\/api$/i, "");
    const cleanPath = path.replace(/^\/+/, "");

    return `${serverUrl}/${cleanPath}`;
  }, []);

  const handleRefresh = () => {
    fetchDevices(currentPage);
  };

  const handleAddSuccess = () => {
    setShowAddForm(false);

    if (currentPage === 1) {
      fetchDevices(1);
    } else {
      setCurrentPage(1);
    }
  };

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end === totalPages) {
      start = Math.max(1, totalPages - 4);
    }

    return Array.from(
      { length: end - start + 1 },
      (_, index) => start + index
    );
  };

  if (showAddForm) {
    return (
      <DeviceDetailForm
        onCancel={() => setShowAddForm(false)}
        onSuccess={handleAddSuccess}
      />
    );
  }

  const startRecord =
    totalDevices === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;

  const endRecord = Math.min(currentPage * PAGE_SIZE, totalDevices);

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Device Details
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View all registered devices.
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            <FaPlus />
            Add Device
          </button>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Total Devices */}
      {loading ? (
        <TotalDevicesSkeleton />
      ) : (
        !error && (
          <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-500">Total Devices</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {totalDevices}
            </p>
          </div>
        )
      )}

      {/* Loading */}
      {loading && <DeviceTableSkeleton />}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">{error}</p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && devices.length === 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-800">
            No devices found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            No device records are currently available.
          </p>
        </div>
      )}

      {/* Device Table */}
      {!loading && !error && devices.length > 0 && (
        <div className="mb-10 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[3000px] text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  {TABLE_HEADERS.map((header) => (
                    <th key={header} className="whitespace-nowrap px-4 py-4">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {devices.map((device, index) => (
                  <tr
                    key={device.id ?? index}
                    className="transition hover:bg-gray-50"
                  >
                    {/* 1. S. No. */}
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                      {(currentPage - 1) * PAGE_SIZE + index + 1}
                    </td>

                    {/* 2. Serial Number */}
                    <TextCell>{device.serial_number}</TextCell>

                    {/* 3. Brand */}
                    <ImageCell
                      path={device.brand}
                      alt="Brand"
                      getImageUrl={getImageUrl}
                    />

                    {/* 4. Customer Image */}
                    <ImageCell
                      path={device.customer_image}
                      alt={device.customer_name || "Customer"}
                      getImageUrl={getImageUrl}
                      className="object-cover"
                    />

                    {/* 5. Customer Name */}
                    <TextCell className="font-medium text-gray-800">
                      {device.customer_name}
                    </TextCell>

                    {/* 6. Enrollment */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                        {device.enrollment_name || "-"}
                      </span>
                    </td>

                    {/* 7. Phone */}
                    <TextCell>
                      {device.phone_number
                        ? `${String(
                            device.country_code ??
                              device.calling_code ??
                              device.dial_code ??
                              ""
                          )
                            .trim()
                            .replace(/\s+/g, "")
                            .replace(/^(?!\+)/, "+")} ${String(
                            device.phone_number
                          ).trim()}`.trim()
                        : "-"}
                    </TextCell>

                    {/* 8. Registration Number */}
                    <TextCell>
                      {device.registration_no ?? "-"}
                    </TextCell>

                    {/* 9. IMEI 1 */}
                    <TextCell>{device.imei_1}</TextCell>

                    {/* 10. IMEI 2 */}
                    <TextCell>{device.imei_2}</TextCell>


                    {/* 12. Signature */}
                    <ImageCell
                      path={device.signature}
                      alt="Device signature"
                      getImageUrl={getImageUrl}
                    />

                    {/* 13. Status */}
                    <td className="whitespace-nowrap px-4 py-4">
                      <StatusBadge status={device.device_status} />
                    </td>

                    {/* 14. Retailer */}
                    <PersonCell
                      name={device.retailer_name}
                      companyName={device.retailer_company_name}
                    />

                    {/* 15. FOS */}
                    <PersonCell
                      name={device.fos_name}
                      companyName={device.fos_company_name}
                      blankIfMissing
                    />

                    {/* 16. Distributor */}
                    <PersonCell
                      name={device.distributor_name}
                      companyName={device.distributor_company_name}
                      blankIfMissing
                    />

              

                    {/* 18. Guarantor Name */}
                    <TextCell>{device.guarantor_name}</TextCell>

                    {/* 19. Guarantor Number */}
                    <TextCell>{device.guarantor_number}</TextCell>

                    {/* 20. Actions */}
                   <td className="px-4 py-4">
  <span
    title="View Device"
    className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100 hover:text-blue-700"
  >
    <FaEye size={16} />
  </span>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {startRecord}-{endRecord}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-800">
                {totalDevices}
              </span>{" "}
              devices
            </p>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={loading || currentPage <= 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>

                {getPageNumbers().map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    disabled={loading || page === currentPage}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                      page === currentPage
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    } disabled:cursor-default`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                  disabled={loading || currentPage >= totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceDetail;
