"use client";

import { useEffect, useState } from "react";
import {
  getKeySettings,
  updateKeySetting,
} from "@/services/api";

export default function KeySetting() {
  const [keySettings, setKeySettings] = useState([]);

  useEffect(() => {
    fetchKeySettings();
  }, []);

  const fetchKeySettings = async () => {
    try {
      const response = await getKeySettings();

      console.log("KEY SETTINGS:", response);

      if (response?.success) {
        setKeySettings(response.data || []);
      } else {
        setKeySettings([]);
      }
    } catch (error) {
      console.error(
        "GET KEY SETTINGS ERROR:",
        error
      );

      setKeySettings([]);
    }
  };

  const handleStatusChange = async (item) => {
    try {
      const newStatus =
        Number(item.status) === 1 ? 0 : 1;

      const response = await updateKeySetting(item.id, {
        status: newStatus,
      });

      if (response?.success) {
        setKeySettings((prev) =>
          prev.map((setting) =>
            setting.id === item.id
              ? {
                  ...setting,
                  status: newStatus,
                }
              : setting
          )
        );
      }
    } catch (error) {
      console.error(
        "UPDATE KEY SETTING STATUS ERROR:",
        error
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-5 sm:p-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Key Setting
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage key settings and their active status.
          </p>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          {/* Table Header */}
          <div className="grid grid-cols-[120px_1fr_220px] items-center border-b border-slate-200 bg-slate-50 px-6 py-4">

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Root
            </div>

            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Name
            </div>

            <div className="text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
              Status
            </div>

          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100">

            {keySettings.map((item) => {
              const isActive =
                Number(item.status) === 1;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[120px_1fr_220px] items-center px-6 py-5 transition hover:bg-slate-50"
                >

                  {/* Root */}
                  <div>
                    <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-600">
                      Root {item.id}
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <span className="text-base font-semibold text-slate-800">
                      {item.name || "Unnamed"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="flex shrink-0 items-center justify-end gap-2">

                    <button
                      type="button"
                      onClick={() =>
                        handleStatusChange(item)
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        isActive
                          ? "bg-green-500"
                          : "bg-slate-300"
                      } cursor-pointer`}
                      title={
                        isActive
                          ? "Deactivate Key Setting"
                          : "Activate Key Setting"
                      }
                      aria-label={
                        isActive
                          ? "Deactivate key setting"
                          : "Activate key setting"
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

                </div>
              );
            })}

          </div>

          {/* Empty State */}
          {keySettings.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-slate-500">
              No key settings found.
            </div>
          )}

        </div>
      </div>
    </div>
  );
}