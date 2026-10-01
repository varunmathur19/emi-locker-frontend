"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import {
  addCompanySetting,
  getCompanySetting,
  updateCompanySetting,
} from "@/services/api";

export default function CompanySetting() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingKey, setEditingKey] = useState(null);
  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");

  const [companyLogo, setCompanyLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const loadCompanySetting = async () => {
    try {
      setLoading(true);

      const response = await getCompanySetting();

      if (!response?.success) {
        setSettings([]);
        setLogoPreview(null);
        return;
      }

      const data = response?.data;

      let settingsList = [];

      if (Array.isArray(data?.settings)) {
        settingsList = data.settings;
      } else if (Array.isArray(data)) {
        settingsList = data;
      } else if (data && typeof data === "object") {
        settingsList = Object.entries(data)
          .filter(([key]) => key !== "settings")
          .map(([key, value], index) => ({
            id: index,
            key,
            value,
          }));
      }

      setSettings(settingsList);

      const logoSetting = settingsList.find(
        (item) =>
          String(item?.key || "").toLowerCase() === "company_logo"
      );

      setLogoPreview(logoSetting?.value || null);
    } catch (error) {
      console.error("Get Company Setting Error:", error);

      toast.error(
        error?.response?.data?.message ||
          "Failed to fetch company setting"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanySetting();
  }, []);

  const handleEdit = (setting) => {
    const key = String(setting?.key || "").toLowerCase();

    setEditingKey(key);
    setSettingKey(setting?.key || "");
    setSettingValue(setting?.value || "");
    setCompanyLogo(null);

    if (key === "company_logo") {
      setLogoPreview(setting?.value || null);
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setSettingKey("");
    setSettingValue("");
    setCompanyLogo(null);

    const logoSetting = settings.find(
      (item) =>
        String(item?.key || "").toLowerCase() === "company_logo"
    );

    setLogoPreview(logoSetting?.value || null);
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "image/png") {
      toast.error("Only PNG images are allowed");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo size must be less than 2MB");
      event.target.value = "";
      return;
    }

    setCompanyLogo(file);

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  const handleUpdate = async (event) => {
    event.preventDefault();

    const cleanKey = settingKey.trim().toLowerCase();

    if (!cleanKey) {
      toast.error("Title is required");
      return;
    }

    if (cleanKey === "company_logo" && !companyLogo) {
      toast.error("Please select a new logo");
      return;
    }

    if (cleanKey !== "company_logo" && !settingValue.trim()) {
      toast.error("Value is required");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("key", cleanKey);

      if (cleanKey === "company_logo") {
        formData.append("icon", companyLogo);
      } else {
        formData.append("value", settingValue.trim());
      }

      const response = await updateCompanySetting(formData);

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to update company setting"
        );
        return;
      }

      toast.success(
        response?.message ||
          "Company setting updated successfully"
      );

      setEditingKey(null);
      setSettingKey("");
      setSettingValue("");
      setCompanyLogo(null);

      await loadCompanySetting();

      window.dispatchEvent(
        new Event("company_setting_updated")
      );
    } catch (error) {
      console.error(
        "Update Company Setting Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update company setting"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAddSetting = async (event) => {
    event.preventDefault();

    const cleanKey = settingKey.trim().toLowerCase();
    const cleanValue = settingValue.trim();

    if (!cleanKey) {
      toast.error("Title is required");
      return;
    }

    if (!cleanValue) {
      toast.error("Value is required");
      return;
    }

    try {
      setSaving(true);

      const formData = new FormData();

      formData.append("key", cleanKey);
      formData.append("value", cleanValue);

      const response = await addCompanySetting(formData);

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to save company setting"
        );
        return;
      }

      toast.success(
        response?.message ||
          "Company setting saved successfully"
      );

      setSettingKey("");
      setSettingValue("");

      await loadCompanySetting();

      window.dispatchEvent(
        new Event("company_setting_updated")
      );
    } catch (error) {
      console.error(
        "Add Company Setting Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to save company setting"
      );
    } finally {
      setSaving(false);
    }
  };

  const getLogoUrl = (logo) => {
    if (!logo) {
      return null;
    }

    if (logo.startsWith("blob:")) {
      return logo;
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_API_URL || ""
    ).replace(/\/api$/, "");

    if (logo.startsWith("http")) {
      return logo;
    }

    return `${baseUrl}${logo}`;
  };

  const companyNameSetting = settings.find(
    (item) =>
      String(item?.key || "").toLowerCase() ===
      "company_name"
  );

  const companyLogoSetting = settings.find(
    (item) =>
      String(item?.key || "").toLowerCase() ===
      "company_logo"
  );

  const otherSettings = settings.filter((item) => {
    const key = String(item?.key || "").toLowerCase();

    return (
      key !== "company_name" &&
      key !== "company_logo"
    );
  });

  if (loading) {
    return (
      <div className="text-sm text-gray-500">
        Loading company setting...
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h1 className="mb-6 text-2xl font-semibold text-gray-800">
          Company Setting
        </h1>

        <div className="space-y-4">
          {companyNameSetting && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {editingKey === "company_name" ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Company Name
                    </label>

                    <input
                      type="text"
                      value={settingValue}
                      onChange={(event) =>
                        setSettingValue(event.target.value)
                      }
                      placeholder="Enter company name"
                      className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-2 pt-6">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={saving}
                      className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Updating..." : "Update"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Company Name
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {companyNameSetting?.value || "-"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(companyNameSetting)
                    }
                    className="shrink-0 rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {companyLogoSetting && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              {editingKey === "company_logo" ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <div className="shrink-0">
                      <p className="mb-2 text-sm font-semibold text-gray-700">
                        Company Logo
                      </p>

                      <input
                        type="file"
                        accept="image/png"
                        onChange={handleLogoChange}
                        className="block w-full max-w-md rounded-lg border border-gray-300 p-2 text-sm"
                      />

                      <p className="mt-1 text-xs text-gray-500">
                        Only PNG image up to 2MB is allowed.
                      </p>
                    </div>

                    {logoPreview && (
                      <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <img
                          src={getLogoUrl(logoPreview)}
                          alt="Company Logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      disabled={saving || !companyLogo}
                      className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Updating..." : "Update"}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saving}
                      className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Company Logo
                      </p>
                    </div>

                    {companyLogoSetting?.value && (
                      <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <img
                          src={getLogoUrl(
                            companyLogoSetting.value
                          )}
                          alt="Company Logo"
                          className="h-full w-full object-contain"
                        />
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(companyLogoSetting)
                    }
                    className="shrink-0 rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-600"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>
          )}

          {otherSettings.map((setting) => {
            const key = String(setting?.key || "").toLowerCase();

            return (
              <div
                key={setting.id || key}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                {editingKey === key ? (
  <div className="flex items-end justify-between gap-4">
    <div className="grid flex-1 grid-cols-2 gap-4">
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Title
        </label>

        <input
          type="text"
          value={settingKey}
          onChange={(event) =>
            setSettingKey(event.target.value)
          }
          className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">
          Value
        </label>

        <input
          type="text"
          value={settingValue}
          onChange={(event) =>
            setSettingValue(event.target.value)
          }
          className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-500"
        />
      </div>
    </div>

    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={handleUpdate}
        disabled={saving}
        className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Updating..." : "Update"}
      </button>

      <button
        type="button"
        onClick={handleCancelEdit}
        disabled={saving}
        className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Cancel
      </button>
    </div>
  </div>
) : (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-semibold capitalize text-gray-700">
        {setting.key}
      </p>

      <p className="mt-1 text-sm text-gray-500">
        {setting.value || "-"}
      </p>
    </div>

    <button
      type="button"
      onClick={() => handleEdit(setting)}
      className="rounded-lg bg-blue-500 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600"
    >
      Edit
    </button>
  </div>
)}
              </div>
            );
          })}
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <h2 className="mb-5 text-lg font-semibold text-gray-800">
            Add New Setting
          </h2>

          <form
            onSubmit={handleAddSetting}
            className="max-w-xl space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Title
              </label>

              <input
                type="text"
                value={
                  editingKey === null
                    ? settingKey
                    : ""
                }
                onChange={(event) =>
                  setSettingKey(event.target.value)
                }
                placeholder="Enter title"
                disabled={editingKey !== null}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Value
              </label>

              <input
                type="text"
                value={
                  editingKey === null
                    ? settingValue
                    : ""
                }
                onChange={(event) =>
                  setSettingValue(event.target.value)
                }
                placeholder="Enter value"
                disabled={editingKey !== null}
                className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={
                saving || editingKey !== null
              }
              className="rounded-lg bg-blue-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving..." : "Add Setting"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}