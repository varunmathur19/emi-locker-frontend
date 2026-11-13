
"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaArrowLeft } from "react-icons/fa";
import { getDeviceById ,getDeviceKyc ,uploadDeviceKyc ,createFinance ,updateFinancePaymentStatus } from "@/services/api";
import { FaAngleDown } from "react-icons/fa";

import {apiBaseUrl } from "@/utils/axios";

export default function UserDetail({ deviceId, onBack }) {
  const [device, setDevice] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState(null);
  const [financeDetails, setFinanceDetails] = useState([]);
  const [emiConfirm, setEmiConfirm] = useState(null);
  
  
const [financeForm, setFinanceForm] = useState({
  loan_number: "",
  finance_type: "",
  product_price: "",
  down_payment_amount: "",
  other_charge: "0",
  tenure_type: "monthly",
  tenure_value: "",
  interest_rate: "",
  due_date: "",
  device_brand: "",
  device_model: "",
});


const [financeSubmitting, setFinanceSubmitting] = useState(false);

const handleFinanceChange = (e) => {
  const { name, value } = e.target;

  setFinanceForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};
useEffect(() => {
  if (!deviceId) return;

  const fetchDevice = async () => {
    setLoading(true);

    try {
      // 1. Fetch Device Details
      const response = await getDeviceById(deviceId);

      console.log("DEVICE API RESPONSE:", response);

      const root = response?.data ?? response;

const deviceData = root?.data ?? root?.device ?? null;

setDevice(deviceData);

// Set finance details and EMI schedule from getDeviceById API
const existingFinance = deviceData?.finance_details || [];

setFinanceDetails(existingFinance);

if (existingFinance.length > 0) {
  const finance = existingFinance[0];

  setFinanceForm({
    loan_number: finance.loan_number || "",
    finance_type: finance.finance_type || "",
    product_price: finance.product_price ?? "",
    down_payment_amount: finance.down_payment_amount ?? "",
    other_charge: finance.other_charge ?? "0",
    tenure_type: finance.tenure_type || "monthly",
    tenure_value: finance.tenure_value ?? "",
    interest_rate: finance.interest_rate ?? "",
    due_date: finance.due_date
      ? new Date(finance.due_date).toISOString().split("T")[0]
      : "",
    device_brand: finance.device_brand || "",
    device_model: finance.device_model || "",
  });
}

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

const productPrice = Number(financeForm.product_price) || 0;
const downPayment = Number(financeForm.down_payment_amount) || 0;
const otherCharge = Number(financeForm.other_charge) || 0;
const interestRate = Number(financeForm.interest_rate) || 0;

const principal = Math.max(0, productPrice - downPayment);

const balanceAmount = principal + otherCharge;

const totalInterest = (principal * interestRate) / 100;

const totalEmiAmount = principal + totalInterest + otherCharge;



const numberOfEmi =
  financeForm.tenure_type === "yearly"
    ? (Number(financeForm.tenure_value) || 0) * 12
    : Number(financeForm.tenure_value) || 0;

const emiPerMonth =
  numberOfEmi > 0 ? totalEmiAmount / numberOfEmi : 0;

const formatAmount = (amount) => Number(amount.toFixed(2));
const fetchLatestDeviceFinance = async () => {
  try {
    const response = await getDeviceById(deviceId);

    const root = response?.data ?? response;
    const deviceData = root?.data ?? root?.device ?? null;

    if (!deviceData) return;

    setDevice(deviceData);

    const existingFinance = deviceData.finance_details || [];

    setFinanceDetails(existingFinance);

    if (existingFinance.length > 0) {
      const finance = existingFinance[0];

      setFinanceForm({
        loan_number: finance.loan_number || "",
        finance_type: finance.finance_type || "",
        product_price: finance.product_price ?? "",
        down_payment_amount: finance.down_payment_amount ?? "",
        other_charge: finance.other_charge ?? "0",
        tenure_type: finance.tenure_type || "monthly",
        tenure_value: finance.tenure_value ?? "",
        interest_rate: finance.interest_rate ?? "",
        due_date: finance.due_date
          ? String(finance.due_date).split("T")[0]
          : "",
        device_brand: finance.device_brand || "",
        device_model: finance.device_model || "",
      });
    }
  } catch (error) {
    console.error("REFRESH FINANCE ERROR:", error);
    toast.error("Failed to refresh finance details.");
  }
};
const handleFinanceSubmit = async (e) => {
  e.preventDefault();

  if (!deviceId) {
    toast.error("Device ID is missing.");
    return;
  }

  if (downPayment > productPrice) {
    toast.error("Down payment cannot exceed product price.");
    return;
  }

  if (!numberOfEmi || numberOfEmi <= 0) {
    toast.error("Please enter a valid EMI tenure.");
    return;
  }

  try {
    setFinanceSubmitting(true);

    const payload = {
      device_id: Number(deviceId),
      loan_number: financeForm.loan_number.trim(),
      finance_type: financeForm.finance_type,
      product_price: Number(financeForm.product_price),
      down_payment_amount: Number(financeForm.down_payment_amount),
      other_charge: Number(financeForm.other_charge),
      tenure_type: financeForm.tenure_type,
      tenure_value: Number(financeForm.tenure_value),
      interest_rate: Number(financeForm.interest_rate),
      due_date: financeForm.due_date,
      device_brand: financeForm.device_brand,
      device_model: financeForm.device_model,
    };

    // 1. Create Finance API
    const response = await createFinance(payload);

    if (!response?.success) {
      toast.error(response?.message || "Failed to create finance.");
      return;
    }

    toast.success(response.message || "Finance created successfully.");

    // 2. Fetch latest device and finance details
    await fetchLatestDeviceFinance();

  } catch (error) {
    console.error(
      "CREATE FINANCE ERROR:",
      error?.response?.data || error
    );

    toast.error(
      error?.response?.data?.message ||
      error.message ||
      "Failed to save finance."
    );
  } finally {
    setFinanceSubmitting(false);
  }
};
const handleEmiStatusUpdate = async (financeId, emiId, currentStatus) => {
  const newStatus = Number(currentStatus) === 1 ? 0 : 1;

  try {
    const response = await updateFinancePaymentStatus(
      financeId,
      emiId,
      newStatus
    );

    if (response.success) {
      setFinanceDetails((prev) =>
        prev.map((finance) => {
          if (Number(finance.id) !== Number(financeId)) {
            return finance;
          }

          const emiSchedule =
            typeof finance.emi_schedule === "string"
              ? JSON.parse(finance.emi_schedule || "[]")
              : finance.emi_schedule || [];

          const updatedSchedule = emiSchedule.map((emi) =>
            Number(emi.id) === Number(emiId)
              ? { ...emi, status: newStatus }
              : emi
          );

          return {
            ...finance,
            emi_schedule: updatedSchedule,
          };
        })
      );

      // Paid = Green Toast, Pending = Red Toast
      if (newStatus === 1) {
        toast.success("EMI marked as Paid");
      } else {
        toast.error("EMI marked as Pending");
      }
    }
  } catch (error) {
    toast.error(
      error.response?.data?.message || "Failed to update EMI status"
    );
  }
};


// Check if at least one EMI is Paid
const hasAnyPaidEmi = financeDetails.some((finance) => {
  const emiSchedule =
    typeof finance.emi_schedule === "string"
      ? JSON.parse(finance.emi_schedule || "[]")
      : finance.emi_schedule || [];

  return emiSchedule.some(
    (emi) => Number(emi.status) === 1
  );
});

const canEditFinance = !hasAnyPaidEmi;
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


        {/* EMI Schedule */}


<div className="mt-8 border-t border-gray-200 pt-6">
  <h3 className="mb-5 text-lg font-semibold text-gray-800">
    EMI Schedule
  </h3>

  {financeDetails.length === 0 ? (
    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
      No EMI schedule available. Create finance to generate EMI schedule.
    </div>
  ) : (
    <div className="space-y-6">
      {financeDetails.map((finance) => {
        const emiSchedule =
          typeof finance.emi_schedule === "string"
            ? JSON.parse(finance.emi_schedule || "[]")
            : finance.emi_schedule || [];

        const pendingEmi = emiSchedule.filter(
          (emi) => Number(emi.status) === 0
        ).length;
        const firstPendingIndex = emiSchedule.findIndex(
  (emi) => Number(emi.status) === 0
);

const paidEmi = emiSchedule.filter(
  (emi) => Number(emi.status) === 1
).length;

const paidAmount = emiSchedule
  .filter((emi) => Number(emi.status) === 1)
  .reduce((total, emi) => total + Number(emi.amount || 0), 0);

const remainingAmount = emiSchedule
  .filter((emi) => Number(emi.status) === 0)
  .reduce((total, emi) => total + Number(emi.amount || 0), 0);

        return (
          <div
            key={finance.id}
            className="overflow-hidden rounded-lg border border-gray-200"
          >
            {/* Finance Summary */}
          <div className="grid grid-cols-1 gap-4 bg-gray-50 p-4 sm:grid-cols-2 lg:grid-cols-4">

  <div>
    <p className="text-xs text-gray-500">Loan Number</p>
    <p className="font-semibold text-gray-800">
      {finance.loan_number || "-"}
    </p>
  </div>

  <div>
    <p className="text-xs text-gray-500">Finance Type</p>
    <p className="font-semibold text-gray-800">
      {finance.finance_type || "-"}
    </p>
  </div>

  <div>
    <p className="text-xs text-gray-500">Total EMI</p>
    <p className="font-semibold text-gray-800">
      {emiSchedule.length}
    </p>
  </div>

  <div>
    <p className="text-xs text-gray-500">Pending EMI</p>
    <p className="font-semibold text-orange-600">
      {pendingEmi}
    </p>
  </div>

  <div>
    <p className="text-xs text-gray-500">Total Amount</p>
    <p className="font-semibold text-gray-800">
      ₹{Number(finance.total_emi_amount || 0).toFixed(2)}
    </p>
  </div>

  <div>
    <p className="text-xs text-gray-500">EMI Per Month</p>
    <p className="font-semibold text-gray-800">
      ₹{Number(finance.emi_per_month || 0).toFixed(2)}
    </p>
  </div>

  <div>
    <p className="text-xs text-gray-500">Paid Amount</p>
    <p className="font-semibold text-green-600">
      ₹{paidAmount.toFixed(2)}
    </p>
  </div>

  <div>
    <p className="text-xs text-gray-500">Remaining Amount</p>
    <p className="font-semibold text-red-600">
      ₹{remainingAmount.toFixed(2)}
    </p>
  </div>

</div>

            {/* EMI Table */}
           {/* EMI Table */}
<div className="overflow-x-auto">
  <table className="w-full min-w-[850px] text-sm">
    <thead className="bg-gray-100">
      <tr>
        <th className="px-4 py-3 text-left font-semibold text-gray-700">
          EMI No.
        </th>
        <th className="px-4 py-3 text-left font-semibold text-gray-700">
          Due Date
        </th>
        <th className="px-4 py-3 text-left font-semibold text-gray-700">
          EMI Amount
        </th>
        <th className="px-4 py-3 text-left font-semibold text-gray-700">
          Status
        </th>
        <th className="px-4 py-3 text-left font-semibold text-gray-700">
          Created Date
        </th>
        <th className="px-4 py-3 text-center font-semibold text-gray-700">
          Actions
        </th>
      </tr>
    </thead>

    <tbody>
      {emiSchedule.length > 0 ? (
        emiSchedule.map((emi) => (
          <tr
            key={emi.id}
            className="border-t border-gray-200 transition hover:bg-gray-50"
          >
            {/* EMI Number */}
            <td className="px-4 py-3 font-medium text-gray-800">
              EMI {emi.id}
            </td>

            {/* Due Date */}
            <td className="px-4 py-3 text-gray-600">
              {emi.payment_date
                ? new Date(
                    `${emi.payment_date}T00:00:00`
                  ).toLocaleDateString("en-IN")
                : "-"}
            </td>

            {/* EMI Amount */}
            <td className="px-4 py-3 font-medium text-gray-800">
              ₹{Number(emi.amount || 0).toFixed(2)}
            </td>

            {/* Status */}
            <td className="px-4 py-3">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  Number(emi.status) === 1
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {Number(emi.status) === 1 ? "Paid" : "Pending"}
              </span>
            </td>

            {/* Created Date */}
            <td className="px-4 py-3 text-gray-600">
              {emi.created_date
                ? new Date(emi.created_date).toLocaleDateString("en-IN")
                : "-"}
            </td>

            {/* Actions */}
            <td className="px-4 py-3 text-center">
            <input
  type="checkbox"
  checked={Number(emi.status) === 1}
  disabled={
    Number(emi.status) === 0 &&
    emiSchedule.findIndex(
      (item) => Number(item.id) === Number(emi.id)
    ) !== firstPendingIndex
  }
 onChange={() =>
  setEmiConfirm({
    financeId: finance.id,
    emiId: emi.id,
    currentStatus: Number(emi.status),
  })
}
  className={`h-4 w-4 accent-green-600 ${
    Number(emi.status) === 0 &&
    emiSchedule.findIndex(
      (item) => Number(item.id) === Number(emi.id)
    ) !== firstPendingIndex
      ? "cursor-not-allowed opacity-40"
      : "cursor-pointer"
  }`}
  title={
    Number(emi.status) === 1
      ? "Mark as Pending"
      : emiSchedule.findIndex(
          (item) => Number(item.id) === Number(emi.id)
        ) !== firstPendingIndex
        ? "Previous EMI must be paid first"
        : "Mark as Paid"
  }
/>
            </td>
          </tr>
        ))
      ) : (
        <tr>
          <td
            colSpan={6}
            className="px-4 py-5 text-center text-gray-500"
          >
            No EMI installments found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
          </div>
        );
      })}
    </div>
  )}
</div>


{/* EMI Confirmation Modal */}
{emiConfirm && (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100">
          <span className="text-2xl font-bold text-blue-600">!</span>
        </div>

        <h2 className="text-lg font-bold text-gray-800">
          Confirm EMI Status
        </h2>
      </div>

      <p className="mb-6 text-sm text-gray-600">
        Are you sure you want to mark this EMI as{" "}
        <span className="font-semibold text-gray-800">
          {emiConfirm.currentStatus === 1 ? "Pending" : "Paid"}
        </span>
        ?
      </p>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setEmiConfirm(null)}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={async () => {
            await handleEmiStatusUpdate(
              emiConfirm.financeId,
              emiConfirm.emiId,
              emiConfirm.currentStatus
            );
            setEmiConfirm(null);
          }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Yes, Confirm
        </button>
      </div>

    </div>
  </div>
)}


      

{/* Product Details / Finance Form */}


<div className="mt-8 border-t border-gray-200 pt-6">
  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <h3 className="text-lg font-semibold text-gray-800">
      Product & Finance Details
    </h3>

    {financeDetails.length > 0 && (
      <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
        Finance Created
      </span>
    )}
  </div>

  <form onSubmit={handleFinanceSubmit}>
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

      {/* Loan Number */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Loan Number
        </label>
        <input
          type="text"
          name="loan_number"
          value={financeForm.loan_number}
          onChange={handleFinanceChange}
          placeholder="Enter loan number"
          required
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Finance Type */}
      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Finance Type
        </label>
        <select
          name="finance_type"
          value={financeForm.finance_type}
          onChange={handleFinanceChange}
          required
          disabled={!canEditFinance}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        >
          <option value="">Select finance type</option>
          <option value="IDFC First">IDFC First</option>
          <option value="TVS Credit">TVS Credit</option>
          <option value="Bajaj Finserv">Bajaj Finserv</option>
          <option value="Cholamandalam">Cholamandalam</option>
          <option value="Self Finance">Self Finance</option>
          <option value="Home Credit">Home Credit</option>
          <option value="Others">Others</option>
        </select>
        <FaAngleDown className="pointer-events-none absolute right-3 top-[42px] text-gray-500" />
      </div>

      {/* Product Price */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Product Price (₹)
        </label>
        <input
          name="product_price"
          value={financeForm.product_price}
          onChange={handleFinanceChange}
          placeholder="Enter product price"
          min="0.01"
          step="0.01"
          required
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Down Payment */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Down Payment Amount (₹)
        </label>
        <input
          name="down_payment_amount"
          value={financeForm.down_payment_amount}
          onChange={handleFinanceChange}
          placeholder="Enter down payment"
          min="0"
          step="0.01"
          required
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Other Charge */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Other Charge (₹)
        </label>
        <input
          name="other_charge"
          value={financeForm.other_charge}
          onChange={handleFinanceChange}
          placeholder="Enter other charge"
          min="0"
          step="0.01"
          required
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Balance Amount */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Balance Amount (₹)
        </label>
        <input
          type="number"
          value={formatAmount(balanceAmount)}
          readOnly
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5"
        />
      </div>

      {/* Tenure Type */}
      <div className="relative">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tenure Type
        </label>
        <select
          name="tenure_type"
          value={financeForm.tenure_type}
          onChange={handleFinanceChange}
          required
          disabled={!canEditFinance}
          className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <FaAngleDown className="pointer-events-none absolute right-3 top-[42px] text-gray-500" />
      </div>

      {/* Tenure Value */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {financeForm.tenure_type === "yearly"
            ? "Tenure (Years)"
            : "Tenure (Months)"}
        </label>
        <input
          type="number"
          name="tenure_value"
          value={financeForm.tenure_value}
          onChange={handleFinanceChange}
          placeholder="Enter tenure"
          min="1"
          max={financeForm.tenure_type === "yearly" ? "50" : "600"}
          required
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Number of EMI */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Number of EMI
        </label>
        <input
          type="number"
          value={numberOfEmi}
          readOnly
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5"
        />
      </div>

      {/* Interest Rate */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Interest Rate (%)
        </label>
        <input
          name="interest_rate"
          value={financeForm.interest_rate}
          onChange={handleFinanceChange}
          placeholder="Enter interest rate"
          min="0"
          step="0.01"
          required
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Total EMI Amount */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Total EMI Amount (₹)
        </label>
        <input
          type="number"
          value={formatAmount(totalEmiAmount)}
          readOnly
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5"
        />
      </div>

      {/* EMI Per Month */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          EMI Per Month (₹)
        </label>
        <input
          type="number"
          value={formatAmount(emiPerMonth)}
          readOnly
          disabled
          className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2.5"
        />
      </div>

      {/* Due Date */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <input
          type="date"
          name="due_date"
          value={financeForm.due_date}
          onChange={handleFinanceChange}
          required
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Device Brand */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Device Brand
        </label>
        <input
          type="text"
          name="device_brand"
          value={financeForm.device_brand}
          onChange={handleFinanceChange}
          placeholder="Enter device brand"
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>

      {/* Device Model */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Device Model
        </label>
        <input
          type="text"
          name="device_model"
          value={financeForm.device_model}
          onChange={handleFinanceChange}
          placeholder="Enter device model"
          disabled={!canEditFinance}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-80"
        />
      </div>
    </div>

    {/* Submit Button */}
    {canEditFinance && (
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={financeSubmitting}
          className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {financeSubmitting
            ? "Saving Finance..."
            : financeDetails.length > 0
              ? "Update Finance"
              : "Create Finance"}
        </button>
      </div>
    )}
  </form>
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
