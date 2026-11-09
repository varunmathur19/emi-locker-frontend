
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import { getDeviceById ,getDeviceKyc ,uploadDeviceKyc  } from "@/services/api";

import {apiBaseUrl } from "@/utils/axios";

export default function UserDetail({ deviceId, onBack }) {
  const [device, setDevice] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState(null);
  

useEffect(() => {
  if (!deviceId) return;

  const fetchDevice = async () => {
    setLoading(true);

    try {
      // 1. Fetch Device Details
      const response = await getDeviceById(deviceId);

      console.log("DEVICE API RESPONSE:", response);

      const root = response?.data ?? response;

      setDevice(
        root?.data ?? root?.device ?? null
      );

    } catch (error) {
      console.error(
        "GET DEVICE ERROR:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
        "Failed to fetch device details."
      );

      setDevice(null);
      setLoading(false);
      return;
    }

    // 2. Fetch KYC Details separately
    try {
      const kycResponse = await getDeviceKyc(deviceId);

      console.log("KYC API RESPONSE:", kycResponse);

      const kycData =
        kycResponse?.data?.data ??
        kycResponse?.data ??
        kycResponse;

      setKyc(kycData);

    } catch (error) {
      console.error(
        "GET DEVICE KYC ERROR:",
        error?.response?.data || error
      );

      setKyc(null);

      toast.error(
        error?.response?.data?.message ||
        "Failed to fetch KYC documents."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchDevice();
}, [deviceId]);


const handleKycUpload = async (field, file) => {
  if (!file || !deviceId) return;

  const allowedTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
  "application/pdf",
  "application/x-pdf",
];

if (!allowedTypes.includes(file.type)) {
  toast.error("Only PNG, JPG, JPEG, WEBP and PDF files are allowed.");
  return;
}

if (file.size > 2 * 1024 * 1024) {
  toast.error("File size must be less than 2 MB.");
  return;
}

  if (file.size > 2 * 1024 * 1024) {
    toast.error("Image size must be less than 2 MB.");
    return;
  }

  try {
    setUploadingField(field);

    const formData = new FormData();
    formData.append(field, file);

    // Upload API
    const uploadResponse = await uploadDeviceKyc(
      deviceId,
      formData
    );

    if (!uploadResponse?.success) {
      throw new Error(uploadResponse?.message || "Upload failed.");
    }

    toast.success("KYC document uploaded successfully.");

    // Get updated KYC data
    const response = await getDeviceKyc(deviceId);

    if (response?.success) {
      setKyc(response.data);
    }

  } catch (error) {
    console.error("KYC UPLOAD ERROR:", error?.response?.data || error);

    toast.error(
      error?.response?.data?.message ||
      error.message ||
      "Failed to upload KYC document."
    );
  } finally {
    setUploadingField(null);
  }
};
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

  const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (/^https?:\/\//i.test(imagePath)) {
    return imagePath;
  }

  return `${imageBaseUrl}/${imagePath.replace(/^\/+/, "")}`;
};

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
        <div className="mt-8 border-t border-gray-200 pt-6">

  <h3 className="mb-2 text-lg font-semibold text-gray-800">
    Product Details
  </h3>


</div>
{/* User KYC Section */}
<div className="mt-8 border-t border-gray-200 pt-6">

  <h3 className="mb-2 text-lg font-semibold text-gray-800">
    User KYC
  </h3>

  <p className="mb-5 text-sm text-gray-500">
    Click on any document to upload or replace.
  </p>

  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

    {[
      { label: "User Photo", field: "user_photo" },
      { label: "Aadhaar Front", field: "aadhaar_front" },
      { label: "Aadhaar Back", field: "aadhaar_back" },
      { label: "PAN Front", field: "pan_front" },
      { label: "PAN Back", field: "pan_back" },
      { label: "Passbook", field: "passbook" },
      { label: "Signature", field: "signature" },
    ].map((item) => {
      const image = kyc?.[item.field];
      const isUploading = uploadingField === item.field;

      return (
        <div
          key={item.field}
          className="rounded-lg border border-gray-200 bg-white p-4"
        >
          <p className="mb-3 text-sm font-medium text-gray-600">
            {item.label}
          </p>

          <label className="group relative flex h-40 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 transition hover:border-blue-400 hover:bg-blue-50">

            {image ? (
  image.toLowerCase().endsWith(".pdf") ? (
    <div className="flex flex-col items-center gap-2">
      <span className="text-3xl text-red-500">PDF</span>
      <span className="text-xs text-gray-500">
        Document Uploaded
      </span>
    </div>
  ) : (
    <img
      src={getImageUrl(image)}
      alt={item.label}
      className="h-full w-full object-contain p-2"
    />
  )
) : (
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  Click to upload
                </p>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition group-hover:opacity-100">
              <span className="text-sm font-semibold text-white">
                {isUploading
                  ? "Uploading..."
                  :image
  ? "Replace Document"
  : "Upload Document"}
              </span>
            </div>

            <input
  type="file"
  accept="image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf,.pdf"
  className="hidden"
  disabled={uploadingField !== null}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  handleKycUpload(item.field, file);
                }

                e.target.value = "";
              }}
            />

          </label>

          <p className="mt-2 text-xs text-gray-400">
            Maximum file size: 2 MB
          </p>
        </div>
      );
    })}

  </div>
</div>

      </div>
    </div>
  );
}
