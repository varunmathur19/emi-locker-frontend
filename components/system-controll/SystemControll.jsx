"use client";

import { useEffect, useState } from "react";
import { getCompanySetting } from "@/services/api";

export default function SystemControll() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCompanySettings = async () => {
    try {
      setLoading(true);

      const response = await getCompanySetting();

      if (response?.success && Array.isArray(response?.data)) {
        setSettings(response.data);
      } else {
        setSettings([]);
      }
    } catch (error) {
      console.error("Get Company Setting Error:", error);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanySettings();
  }, []);

  return (
    <div className="p-6">
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
              {settings.map((setting) => (
                <tr
                  key={setting.id}
                  className="border-b border-gray-200 last:border-b-0"
                >
                  <td className="px-5 py-4 text-sm font-medium capitalize text-gray-800">
                    {setting.key?.replaceAll("_", " ")}
                  </td>

                  <td className="px-5 py-4 text-sm text-gray-700">
                    {setting.value}
                  </td>

                
                </tr>
              ))}
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