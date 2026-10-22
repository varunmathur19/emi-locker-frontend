"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { RiArrowDownSLine } from "react-icons/ri";
import { getKeySettings } from "@/services/api";

const initialFormData = {
  enrollment_type: "",
  customer_name: "",
  registration_no: "",
  phone_number: "",
  imei_1: "",
  key_type: "",
  device_status: "",
  fl_version: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

const fileInputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium file:text-gray-700";

function FormSelect({
  id,
  name,
  label,
  value,
  onChange,
  options = [],
  placeholder = "Select an option",
  disabled = false,
  required = true,
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`${inputClass} appearance-none pr-10 disabled:cursor-not-allowed disabled:bg-gray-100`}
        >
          <option value="">{placeholder}</option>

          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <RiArrowDownSLine
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-gray-500"
        />
      </div>
    </div>
  );
}

export default function DeviceDetailForm({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState(initialFormData);
  const [brandImage, setBrandImage] = useState(null);
  const [customerImage, setCustomerImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [keySettings, setKeySettings] = useState([]);
  const [keySettingsLoading, setKeySettingsLoading] = useState(true);

  // Fetch active key settings
  useEffect(() => {
    let isMounted = true;

    const fetchKeySettings = async () => {
      try {
        setKeySettingsLoading(true);

        const response = await getKeySettings();

        const settings = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.data?.data)
              ? response.data.data
              : Array.isArray(response?.settings)
                ? response.settings
                : [];

        const activeSettings = settings.filter((item) => {
          const status = item?.status;

          return (
            status === 1 ||
            status === true ||
            String(status).trim() === "1" ||
            String(status).trim().toLowerCase() === "true"
          );
        });

        if (isMounted) {
          setKeySettings(activeSettings);
        }
      } catch (error) {
        console.error("Failed to fetch key settings:", error);

        if (isMounted) {
          setKeySettings([]);
          toast.error("Failed to load key types.");
        }
      } finally {
        if (isMounted) {
          setKeySettingsLoading(false);
        }
      }
    };

    fetchKeySettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle text and dropdown changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate and upload selected image
  const handleImageChange = (e, setImage, label) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(`${label} must be an image.`);
      e.target.value = "";
      setImage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} must be smaller than 5 MB.`);
      e.target.value = "";
      setImage(null);
      return;
    }

    setImage(file);
  };

  // Submit device details
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!brandImage) {
      toast.error("Brand image is required.");
      return;
    }

    const requiredFields = [
      ["enrollment_type", "Enrollment Type"],
      ["customer_name", "Customer Name"],
      ["registration_no", "Registration Number"],
      ["phone_number", "Phone Number"],
      ["imei_1", "IMEI Number"],
      ["key_type", "Key Type"],
      ["device_status", "Device Status"],
      ["fl_version", "FL Version"],
    ];

    for (const [field, label] of requiredFields) {
      if (!String(formData[field] ?? "").trim()) {
        toast.error(`${label} is required.`);
        return;
      }
    }

    try {
      setLoading(true);

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, String(value).trim());
      });

      // Brand image
      payload.append("brandImage", brandImage);

      // Customer image is optional
      if (customerImage) {
        payload.append("customerImage", customerImage);
      }

      const apiBaseUrl = (
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
      ).replace(/\/+$/, "");

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : null;

      const response = await fetch(`${apiBaseUrl}/add-device`, {
        method: "POST",
        credentials: "include",
        headers: token
          ? { Authorization: `Bearer ${token}` }
          : {},
        body: payload,
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.message || "Failed to add device.");
      }

      toast.success(result.message || "Device added successfully.");

      setFormData(initialFormData);
      setBrandImage(null);
      setCustomerImage(null);
      e.target.reset();

      onSuccess?.(result);
    } catch (error) {
      console.error("Add device error:", error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Convert API key settings into dropdown options
  const keyTypeOptions = keySettings
    .map((item) => {
      const value = item.id ?? item.key_type ?? item.key_id;
      const label =
        item.name ?? item.key_name ?? item.key_type ?? item.title;

      if (value == null || label == null || String(label).trim() === "") {
        return null;
      }

      return {
        value: String(value),
        label: String(label),
      };
    })
    .filter(Boolean);

  return (
    <div className="w-full">
      <div className="mx-auto w-full">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          {/* Header */}
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Add Device
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enter the device details below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Brand Image - First Field */}
              <div className="min-w-0">
                <label htmlFor="brandImage" className={labelClass}>
                  Brand Image <span className="text-red-500">*</span>
                </label>

                <input
                  id="brandImage"
                  name="brandImage"
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) =>
                    handleImageChange(e, setBrandImage, "Brand image")
                  }
                  className={fileInputClass}
                />

                {brandImage && (
                  <div className="mt-2 flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(brandImage)}
                      alt="Brand preview"
                      className="h-14 w-14 rounded-lg border border-gray-200 object-contain p-1"
                    />

                    <div className="min-w-0">
                      <p className="truncate text-xs text-gray-600">
                        {brandImage.name}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setBrandImage(null);
                          const input = document.getElementById("brandImage");
                          if (input) input.value = "";
                        }}
                        className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        Remove image
                      </button>
                    </div>
                  </div>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  Image format only, maximum size 5 MB.
                </p>
              </div>

              {/* Enrollment Type */}
              <FormSelect
                id="enrollment_type"
                name="enrollment_type"
                label="Enrollment Type"
                value={formData.enrollment_type}
                onChange={handleChange}
                placeholder="Select enrollment type"
                options={[
                  { value: "old", label: "Old" },
                  { value: "new", label: "New" },
                ]}
              />

              {/* Customer Name */}
              <div>
                <label htmlFor="customer_name" className={labelClass}>
                  Customer Name
                </label>

                <input
                  id="customer_name"
                  name="customer_name"
                  type="text"
                  value={formData.customer_name}
                  onChange={handleChange}
                  placeholder="Enter customer name"
                  className={inputClass}
                  required
                />
              </div>

              {/* Registration Number */}
              <div>
                <label htmlFor="registration_no" className={labelClass}>
                  Registration Number
                </label>

                <input
                  id="registration_no"
                  name="registration_no"
                  type="text"
                  value={formData.registration_no}
                  onChange={handleChange}
                  placeholder="Enter registration number"
                  className={inputClass}
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phone_number" className={labelClass}>
                  Phone Number
                </label>

                <input
                  id="phone_number"
                  name="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={inputClass}
                  required
                />
              </div>

              {/* IMEI Number */}
              <div>
                <label htmlFor="imei_1" className={labelClass}>
                  IMEI Number
                </label>

                <input
                  id="imei_1"
                  name="imei_1"
                  type="text"
                  value={formData.imei_1}
                  onChange={handleChange}
                  placeholder="Enter IMEI number"
                  className={inputClass}
                  required
                />
              </div>

              

              {/* Key Type */}
              <FormSelect
                id="key_type"
                name="key_type"
                label="Key Type"
                value={formData.key_type}
                onChange={handleChange}
                placeholder={
                  keySettingsLoading
                    ? "Loading key types..."
                    : keyTypeOptions.length
                      ? "Select key type"
                      : "No active key types available"
                }
                options={keyTypeOptions}
                disabled={keySettingsLoading || keyTypeOptions.length === 0}
              />

              {/* Device Status */}
              <FormSelect
                id="device_status"
                name="device_status"
                label="Device Status"
                value={formData.device_status}
                onChange={handleChange}
                placeholder="Select device status"
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                  { value: "locked", label: "Locked" },
                  { value: "unlocked", label: "Unlocked" },
                ]}
              />

              {/* FL Version */}
              <div>
                <label htmlFor="fl_version" className={labelClass}>
                  FL Version
                </label>

                <input
                  id="fl_version"
                  name="fl_version"
                  type="text"
                  value={formData.fl_version}
                  onChange={handleChange}
                  placeholder="Enter FL version"
                  className={inputClass}
                  required
                />
              </div>
            </div>

            {/* Customer Image */}
            <div>
              <label htmlFor="customerImage" className={labelClass}>
                Customer Image
              </label>

              <input
                id="customerImage"
                name="customerImage"
                type="file"
                accept="image/*"
                onChange={(e) =>
                  handleImageChange(e, setCustomerImage, "Customer image")
                }
                className={fileInputClass}
              />

              {customerImage && (
                <div className="mt-2 flex items-center gap-3">
                  <img
                    src={URL.createObjectURL(customerImage)}
                    alt="Customer preview"
                    className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
                  />

                  <p className="truncate text-xs text-gray-600">
                    {customerImage.name}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="cursor-pointer rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Adding..." : "Add Device"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}