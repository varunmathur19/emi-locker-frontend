"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  RiArrowDownSLine,
  RiSearchLine,
} from "react-icons/ri";
import {
  getKeySettings,
  getCountries,
  addDevice,
} from "@/services/api";

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

const labelClass =
  "mb-2 block text-sm font-medium text-gray-700";

const fileInputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium file:text-gray-700";

const getArrayFromResponse = (response, key) => {
  if (Array.isArray(response)) return response;

  const values = [
    response?.data,
    response?.data?.data,
    response?.data?.[key],
    response?.[key],
    response?.data?.result,
    response?.result,
  ];

  return values.find(Array.isArray) || [];
};

const getCountryDialCode = (country) => {
  const value =
    country?.mobile_code ??
    country?.phone_code ??
    country?.phonecode ??
    country?.dial_code ??
    country?.calling_code ??
    country?.phoneCode ??
    "";

  if (!String(value).trim()) return "";

  const code = String(value).trim().replace(/\s+/g, "");

  return code.startsWith("+") ? code : `+${code}`;
};

const getCountryId = (country, index = 0) =>
  String(
    country?.country_id ??
      country?.id ??
      country?.iso2 ??
      country?.iso_code ??
      country?.country_code ??
      index
  );

const getCountryName = (country) =>
  country?.country_name ??
  country?.name ??
  country?.country ??
  "Unknown";

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

function SearchableCountryDropdown({
  countries,
  selectedCountryId,
  onChange,
  loading,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCountry = useMemo(
    () =>
      countries.find(
        (country, index) =>
          getCountryId(country, index) ===
          String(selectedCountryId)
      ),
    [countries, selectedCountryId]
  );

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return countries;

    return countries.filter((country) => {
      const name = getCountryName(country).toLowerCase();

      const isoCode = String(
        country?.country_code ??
          country?.isoCode ??
          country?.iso_code ??
          country?.iso2 ??
          ""
      ).toLowerCase();

      const dialCode = getCountryDialCode(country).toLowerCase();

      return (
        name.includes(query) ||
        isoCode.includes(query) ||
        dialCode.includes(query)
      );
    });
  }, [countries, search]);

  const handleSelect = (country, index) => {
    onChange(country, getCountryId(country, index));
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={loading || countries.length === 0}
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Select phone country code"
        aria-expanded={open}
        className="flex h-[42px] items-center gap-3 rounded-l-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selectedCountry?.emoji && (
            <span className="shrink-0 text-base">
              {selectedCountry.emoji}
            </span>
          )}

          <span className="truncate font-medium">
            {loading
              ? "Loading..."
              : selectedCountry
                ? getCountryDialCode(selectedCountry) || "Code"
                : "Code"}
          </span>
        </span>

        <RiArrowDownSLine
          size={18}
          className={`shrink-0 text-gray-500 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-[100] mt-1 w-[290px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-200 p-2">
            <div className="relative">
              <RiSearchLine
                size={18}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search country or code..."
                autoFocus
                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => {
                const originalIndex = countries.indexOf(country);
                const countryId = getCountryId(
                  country,
                  originalIndex
                );

                const isSelected =
                  countryId === String(selectedCountryId);

                return (
                  <button
                    key={countryId}
                    type="button"
                    onClick={() =>
                      handleSelect(country, originalIndex)
                    }
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-blue-50 ${
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700"
                    }`}
                  >
                    <span className="shrink-0 text-lg">
                      {country.emoji || "🌐"}
                    </span>

                    <span className="min-w-0 flex-1 truncate">
                      {getCountryName(country)}
                    </span>

                    <span className="shrink-0 text-gray-500">
                      {getCountryDialCode(country)}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-3 py-5 text-center text-sm text-gray-400">
                No country found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DeviceDetailForm({
  onCancel,
  onSuccess,
}) {
  const [formData, setFormData] = useState(initialFormData);

  const [brandImage, setBrandImage] = useState(null);
  const [customerImage, setCustomerImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [selectedCountryId, setSelectedCountryId] = useState("");

  const [keySettings, setKeySettings] = useState([]);
  const [keySettingsLoading, setKeySettingsLoading] = useState(true);

  // Load active key settings
  useEffect(() => {
    let isMounted = true;

    const fetchKeySettings = async () => {
      try {
        setKeySettingsLoading(true);

        const response = await getKeySettings();
        const settings = getArrayFromResponse(response, "settings");

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

  // Load countries and select India by default
  useEffect(() => {
    let isMounted = true;

    const fetchCountries = async () => {
      try {
        setCountriesLoading(true);

        const response = await getCountries();
        const countryList = getArrayFromResponse(
          response,
          "countries"
        );

        if (!isMounted) return;

        setCountries(countryList);

        const india = countryList.find((country) => {
          const isoCode = String(
            country?.country_code ??
              country?.isoCode ??
              country?.iso_code ??
              country?.iso2 ??
              ""
          )
            .trim()
            .toUpperCase();

          return (
            isoCode === "IN" ||
            getCountryName(country).toLowerCase() === "india"
          );
        });

        if (india) {
          const index = countryList.indexOf(india);
          setSelectedCountryId(getCountryId(india, index));
        } else if (countryList.length > 0) {
          setSelectedCountryId(getCountryId(countryList[0], 0));
        }
      } catch (error) {
        console.error("Failed to fetch countries:", error);

        if (isMounted) {
          setCountries([]);
          toast.error(
            error?.response?.data?.message ||
              "Failed to load countries."
          );
        }
      } finally {
        if (isMounted) {
          setCountriesLoading(false);
        }
      }
    };

    fetchCountries();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageChange = (event, setImage, label) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setImage(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error(`${label} must be an image.`);
      event.target.value = "";
      setImage(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(`${label} must be smaller than 5 MB.`);
      event.target.value = "";
      setImage(null);
      return;
    }

    setImage(file);
  };

  const keyTypeOptions = keySettings
    .map((item) => {
      const value = item.id ?? item.key_type ?? item.key_id;
      const label =
        item.name ?? item.key_name ?? item.key_type ?? item.title;

      if (
        value == null ||
        label == null ||
        String(label).trim() === ""
      ) {
        return null;
      }

      return {
        value: String(value),
        label: String(label),
      };
    })
    .filter(Boolean);

  const handleSubmit = async (event) => {
    event.preventDefault();

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

    const selectedCountry = countries.find(
      (country, index) =>
        getCountryId(country, index) ===
        String(selectedCountryId)
    );

    if (!selectedCountry) {
      toast.error("Please select a country code.");
      return;
    }

    const countryCode = getCountryDialCode(selectedCountry);

    if (!countryCode) {
      toast.error("Selected country has no calling code.");
      return;
    }

    try {
      setLoading(true);

      const payload = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        payload.append(key, String(value).trim());
      });

      // Send selected country calling code separately.
      payload.append("country_code", countryCode);

      // Field names supported by the backend upload middleware/controller.
      payload.append("brandImage", brandImage);

      if (customerImage) {
        payload.append("customerImage", customerImage);
      }

      // Integrated service API: POST /add-device
      const result = await addDevice(payload);

      if (result?.success === false) {
        throw new Error(
          result.message || "Failed to add device."
        );
      }

      toast.success(
        result?.message || "Device added successfully."
      );

      setFormData(initialFormData);
      setBrandImage(null);
      setCustomerImage(null);

      const india = countries.find((country) => {
        const isoCode = String(
          country?.country_code ??
            country?.isoCode ??
            country?.iso_code ??
            country?.iso2 ??
            ""
        )
          .trim()
          .toUpperCase();

        return (
          isoCode === "IN" ||
          getCountryName(country).toLowerCase() === "india"
        );
      });

      if (india) {
        setSelectedCountryId(
          getCountryId(india, countries.indexOf(india))
        );
      }

      event.target.reset();
      onSuccess?.(result);
    } catch (error) {
      console.error(
        "Add device error:",
        error?.response?.data || error
      );

      toast.error(
        error?.response?.data?.message ||
          error.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto w-full">
        <div className="overflow-visible rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Add Device
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Enter the device details below.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
            autoComplete="off"
          >
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {/* Brand Image */}
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
                  onChange={(event) =>
                    handleImageChange(
                      event,
                      setBrandImage,
                      "Brand image"
                    )
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
              <div className="min-w-0">
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
              <div className="min-w-0">
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

              {/* Phone Number with searchable country code */}
              <div className="min-w-0">
                <label htmlFor="phone_number" className={labelClass}>
                  Phone Number <span className="text-red-500">*</span>
                </label>

                <div className="flex w-full">
                  <SearchableCountryDropdown
                    countries={countries}
                    selectedCountryId={selectedCountryId}
                    loading={countriesLoading}
                    onChange={(_country, countryId) => {
                      setSelectedCountryId(countryId);
                    }}
                  />

                  <input
                    id="phone_number"
                    name="phone_number"
                    type="tel"
                    inputMode="tel"
                    value={formData.phone_number}
                    onChange={handleChange}
                    placeholder="Enter phone number"
                    className="h-[42px] min-w-0 flex-1 rounded-r-lg border border-l-0 border-gray-300 bg-white px-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    required
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Search and select a country code.
                </p>
              </div>

              {/* IMEI Number */}
              <div className="min-w-0">
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
                disabled={
                  keySettingsLoading ||
                  keyTypeOptions.length === 0
                }
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
              <div className="min-w-0">
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
            <div className="min-w-0">
              <label htmlFor="customerImage" className={labelClass}>
                Customer Image
              </label>

              <input
                id="customerImage"
                name="customerImage"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  handleImageChange(
                    event,
                    setCustomerImage,
                    "Customer image"
                  )
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

                  <div className="min-w-0">
                    <p className="truncate text-xs text-gray-600">
                      {customerImage.name}
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomerImage(null);
                        const input =
                          document.getElementById("customerImage");
                        if (input) input.value = "";
                      }}
                      className="mt-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      Remove image
                    </button>
                  </div>
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
