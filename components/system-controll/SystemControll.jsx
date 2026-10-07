"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getCompanySetting,
  updateCompanySetting,
} from "@/services/api";

export default function SystemControll() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingKey, setUpdatingKey] = useState(null);

  const loadCompanySettings = async () => {
    try {
      setLoading(true);

      const response = await getCompanySetting();

      // console.log(
      //   "Get Company Setting Response:",
      //   response
      // );

      const responseData =
        response?.data?.data ||
        response?.data ||
        [];

      const success =
        response?.success ??
        response?.data?.success;

      if (
        success &&
        Array.isArray(responseData)
      ) {
        setSettings(responseData);
      } else {
        setSettings([]);
      }
    } catch (error) {
      console.error(
        "Get Company Setting Error:",
        error
      );

      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (setting) => {
    try {
      setUpdatingKey(setting.key);

      const currentValue =
        Number(setting.value) === 1;

      const newValue = !currentValue;

      const formData = new FormData();

      formData.append("key", setting.key);
      formData.append("value", String(newValue));

      const response =
        await updateCompanySetting(formData);

      if (!response?.success) {
        toast.error(
          response?.message ||
            "Failed to update setting"
        );

        return;
      }

      setSettings((prevSettings) =>
        prevSettings.map((item) =>
          item.id === setting.id
            ? {
                ...item,
                value: newValue ? 1 : 0,
              }
            : item
        )
      );

      if (newValue) {
        toast.success(
          "Setting activated successfully"
        );
      } else {
        toast.error(
          "Setting deactivated successfully"
        );
      }
    } catch (error) {
      console.error(
        "Update Company Setting Error:",
        error
      );

      toast.error(
        error?.response?.data?.message ||
          "Failed to update setting"
      );
    } finally {
      setUpdatingKey(null);
    }
  };

  useEffect(() => {
    loadCompanySettings();
  }, []);

  return (
    <div className="">
      <h1 className="mb-6 text-2xl font-semibold text-gray-800">
        System Control
      </h1>

      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center">
          <p className="text-sm text-gray-500">
            Loading...
          </p>
        </div>
      ) : settings.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-700">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {settings.map((setting) => {
                const isActive =
                  Number(setting.value) === 1;

                const isUpdating =
                  updatingKey === setting.key;

                return (
                  <tr
                    key={setting.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-5 py-4 text-sm font-medium capitalize text-gray-800">
                      {setting.key?.replaceAll(
                        "_",
                        " "
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleToggle(setting)
                          }
                          disabled={isUpdating}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            isActive
                              ? "bg-green-500"
                              : "bg-gray-300"
                          } ${
                            isUpdating
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer"
                          }`}
                          title={
                            isActive
                              ? "Deactivate"
                              : "Activate"
                          }
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                              isActive
                                ? "translate-x-5"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>

                        <span
                          className={`min-w-[58px] text-xs font-semibold ${
                            isActive
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            No system settings found.
          </p>
        </div>
      )}
    </div>
  );
}