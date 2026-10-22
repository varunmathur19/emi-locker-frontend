
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { getDevices } from "@/services/api";
import DeviceDetailForm from "./form";

export function DeviceDetail() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const hasFetched = useRef(false);

  // Extract the devices array from common API response structures.
  const extractDevices = (response) => {
    const candidates = [
      response,
      response?.data,
      response?.data?.data,
      response?.data?.devices,
      response?.data?.result,
      response?.data?.results,
      response?.data?.data?.data,
      response?.data?.data?.devices,
      response?.data?.data?.result,
      response?.data?.data?.results,
      response?.devices,
      response?.result,
      response?.results,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return null;
  };

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getDevices();

      // Debug the real response if the structure is unexpected.
      console.log("GET DEVICES RAW RESPONSE:", response);

      const payload = response?.data ?? response;

      if (payload?.success === false) {
        throw new Error(
          payload?.message || "Failed to fetch devices."
        );
      }

      const result = extractDevices(response);

      if (!result) {
        console.error(
          "Unexpected GET DEVICES response structure:",
          response
        );

        throw new Error(
          "Devices array not found in API response. Check the GET DEVICES RAW RESPONSE in the browser console."
        );
      }

      setDevices(result);
    } catch (err) {
      console.error(
        "GET DEVICES ERROR:",
        err?.response?.data || err
      );

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to load devices.";

      setError(message);
      toast.error(message);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;

    hasFetched.current = true;
    fetchDevices();
  }, [fetchDevices]);

  const getImageUrl = (imagePath) => {
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
  };

  // Missing FOS or Distributor details should remain blank.
  const renderPerson = (name, companyName, blankIfMissing = false) => {
    if (!name && blankIfMissing) {
      return null;
    }

    return (
      <div className="flex min-w-36 flex-col gap-1">
        <span
          className="whitespace-nowrap font-medium text-gray-800"
          title={name || ""}
        >
          {name || (blankIfMissing ? "" : "-")}
        </span>

        {companyName ? (
          <span
            className="max-w-52 truncate text-xs text-gray-500"
            title={companyName}
          >
            {companyName}
          </span>
        ) : !blankIfMissing ? (
          <span className="max-w-52 truncate text-xs text-gray-500">
            -
          </span>
        ) : null}
      </div>
    );
  };

  if (showAddForm) {
    return (
      <DeviceDetailForm
        onCancel={() => setShowAddForm(false)}
        onSuccess={() => {
          setShowAddForm(false);
          fetchDevices();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="whitespace-nowrap text-xl font-bold text-gray-900 sm:text-2xl">
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
            className="cursor-pointer whitespace-nowrap rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            + Add Device
          </button>

          <button
            type="button"
            onClick={fetchDevices}
            disabled={loading}
            className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* Device Count */}
      {!loading && !error && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total Devices</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {devices.length}
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="mt-4 text-sm text-gray-500">
            Fetching device details...
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="font-medium text-red-700">{error}</p>

          <button
            type="button"
            onClick={fetchDevices}
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
        <div className="mb-10 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[2200px] text-left text-sm">
              <thead className="bg-gray-100 text-xs uppercase tracking-wider text-gray-600">
                <tr>
                  <th className="whitespace-nowrap px-4 py-4">S. No.</th>
                  <th className="whitespace-nowrap px-4 py-4">Brand</th>
                  <th className="whitespace-nowrap px-4 py-4">Enrollment</th>
                  <th className="whitespace-nowrap px-4 py-4">Customer Image</th>
                  <th className="whitespace-nowrap px-4 py-4">Customer Name</th>
                  <th className="whitespace-nowrap px-4 py-4">Registration No.</th>
                  <th className="whitespace-nowrap px-4 py-4">Phone</th>
                  <th className="whitespace-nowrap px-4 py-4">IMEI</th>
                  <th className="whitespace-nowrap px-4 py-4">Key Type</th>
                  <th className="whitespace-nowrap px-4 py-4">Status</th>
                  <th className="whitespace-nowrap px-4 py-4">FL Version</th>
                  <th className="whitespace-nowrap px-4 py-4">Retailer</th>
                  <th className="whitespace-nowrap px-4 py-4">FOS</th>
                  <th className="whitespace-nowrap px-4 py-4">Distributor</th>
                  <th className="whitespace-nowrap px-4 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {devices.map((device, index) => (
                  <tr
                    key={device.id ?? index}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-900">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      {device.brand ? (
                        <img
                          src={getImageUrl(device.brand)}
                          alt="Brand logo"
                          className="h-10 w-16 rounded border border-gray-200 bg-white object-contain p-1"
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                        {device.enrollment_type || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      {device.customer_image ? (
                        <div className="group relative flex h-14 w-14 items-center justify-center">
                          <img
                            src={getImageUrl(device.customer_image)}
                            alt={device.customer_name || "Customer"}
                            className="relative z-0 h-12 w-12 cursor-zoom-in rounded-lg border border-gray-200 object-cover shadow-sm transition-all duration-300 group-hover:z-50 group-hover:scale-[2.5] group-hover:rounded-sm group-hover:border-blue-400 group-hover:shadow-xl"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 font-medium text-gray-800">
                      {device.customer_name || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {device.registration_no || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {device.phone_number || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {device.imei_1 || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {device.key_type || "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          String(device.device_status).toLowerCase() === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {device.device_status || "-"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {device.fl_version || "-"}
                    </td>

                    <td className="px-4 py-4">
                      {renderPerson(
                        device.retailer_name,
                        device.retailer_company_name
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {renderPerson(
                        device.fos_name,
                        device.fos_company_name,
                        true
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {renderPerson(
                        device.distributor_name,
                        device.distributor_company_name,
                        true
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      -
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
            Showing {devices.length} device
            {devices.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}
    </div>
  );
}

export default DeviceDetail;
