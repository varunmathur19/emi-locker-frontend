
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import { getDeviceById ,  } from "@/services/api";
import {apiBaseUrl } from "@/utils/axios";

export default function UserDetail({ deviceId, onBack }) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    const fetchDevice = async () => {
      try {
        setLoading(true);

        const response = await getDeviceById(deviceId);
        const root = response?.data ?? response;

        setDevice(root?.data ?? root?.device ?? null);
      } catch (error) {
        console.error(
          "GET DEVICE BY ID ERROR:",
          error?.response?.data || error
        );

        toast.error(
          error?.response?.data?.message ||
            "Failed to fetch device details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [deviceId]);

  // Back Button
  const BackButton = () => (
    <button
      type="button"
      onClick={onBack}
      className="group inline-flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <FaArrowLeft className="text-sm transition-transform duration-200 group-hover:-translate-x-1" />
      <span>Back to Device List</span>
    </button>
  );

  // Loading State
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

          <p className="text-sm font-medium text-gray-600">
            Loading device details...
          </p>
        </div>
      </div>
    );
  }

  // Device Not Found
  if (!device) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <BackButton />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-base font-semibold text-gray-800">
            Device details not found
          </p>

          <p className="mt-2 text-sm text-gray-500">
            The requested device information could not be found.
          </p>
        </div>
      </div>
    );
  }

  // Check IMEI Availability
  const hasIMEI = Boolean(
    device.imei_1?.toString().trim() ||
    device.imei_2?.toString().trim()
  );

  // Device Details
  const details = [
    ["Device ID", device.id],
    ["Registration No.", device.registration_no],

    // Show Serial Number only when both IMEIs are unavailable
    ...(!hasIMEI
      ? [["Serial Number", device.serial_number]]
      : []),

    ["Enrollment", device.enrollment_name],
    ["Customer Name", device.customer_name],
    ["Phone Number", device.phone_number],

    // Show IMEI fields only when at least one IMEI is available
    ...(hasIMEI
      ? [
          ["IMEI 1", device.imei_1],
          ["IMEI 2", device.imei_2],
        ]
      : []),

    ["Guarantor Name", device.guarantor_name],
    ["Guarantor Number", device.guarantor_number],
    ["Retailer ID", device.retailer_id],
    ["Created At", device.created_at],
  ];

  // Signature Image URL
  // Signature Image URL
const imageBaseUrl = apiBaseUrl
  ?.replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const signatureUrl = device.signature
  ? /^https?:\/\//i.test(device.signature)
    ? device.signature
    : `${imageBaseUrl}/${device.signature.replace(/^\/+/, "")}`
  : null;

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Device Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Complete information about this device.
          </p>
        </div>

        <BackButton />
      </div>

      {/* Device Information */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-semibold text-gray-800">
          Device Information
        </h3>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {details.map(([label, value]) => (
            <div
              key={label}
              className="border-b border-gray-100 pb-3"
            >
              <p className="text-sm text-gray-500">
                {label}
              </p>

              <p className="mt-1 break-words font-medium text-gray-900">
                {value ?? "-"}
              </p>
            </div>
          ))}
        </div>

        {/* Signature */}
        {signatureUrl && (
          <div className="mt-6">
            <p className="mb-2 text-sm font-medium text-gray-600">
              Signature
            </p>

            <img
              src={signatureUrl}
              alt="Device Signature"
              className="h-24 rounded-lg border border-gray-200 bg-white object-contain p-2"
            />
          </div>
        )}
      </div>
    </div>
  );
}
