"use client";

import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  getProfiles,
  updateProfile,
} from "@/services/api";

export default function ProfilePage() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // =========================
  // GET PROFILES
  // =========================
  const loadProfiles = async () => {
    try {
      setLoading(true);

      const response = await getProfiles();

      console.log("GET PROFILES RESPONSE:", response);

      if (!response) {
        setProfiles([]);
        return;
      }

      // API se direct data lena
      const profileData = Array.isArray(response?.data)
        ? response.data
        : [];

      console.log("PROFILE DATA:", profileData);

      setProfiles(profileData);
    } catch (error) {
      console.error("GET PROFILES ERROR:", error);

      toast.error(
        error?.message || "Failed to get profiles"
      );

      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // LOAD DATA
  // =========================
  useEffect(() => {
    loadProfiles();
  }, []);

  // =========================
  // UPDATE PROFILE STATUS
  // =========================
  const handleToggleStatus = async (profile) => {
    if (!profile?.id || updatingStatus !== null) {
      return;
    }

    const currentStatus = Number(profile?.status || 0);

    const newStatus =
      currentStatus === 1 ? 0 : 1;

    try {
      setUpdatingStatus(profile.id);

      const response = await updateProfile(
        profile.id,
        {
          status: newStatus,
        }
      );

      console.log(
        "UPDATE PROFILE RESPONSE:",
        response
      );

      if (response?.success) {
        toast.success(
          newStatus === 1
            ? "Profile activated successfully"
            : "Profile deactivated successfully"
        );

        // Fresh data GET
        await loadProfiles();
      } else {
        toast.error(
          response?.message ||
            "Failed to update profile"
        );
      }
    } catch (error) {
      console.error(
        "UPDATE PROFILE ERROR:",
        error
      );

      toast.error(
        error?.message ||
          "Failed to update profile"
      );
    } finally {
      setUpdatingStatus(null);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="mx-auto max-w-5xl">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">

        {/* HEADER */}
        <h2 className="mb-4 text-lg font-semibold text-slate-700">
          Profile List
        </h2>

        {/* LOADING */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Loading profiles...
          </div>
        ) : profiles.length === 0 ? (
          /* EMPTY */
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No profiles found
          </div>
        ) : (
          /* PROFILE LIST */
          <div className="space-y-3">
            {profiles.map((profile, index) => {
              const isActive =
                Number(profile?.status) === 1;

              const isUpdating =
                updatingStatus === profile?.id;

              return (
                <div
                  key={profile?.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:shadow-sm"
                >
                  {/* LEFT SIDE */}
                  <div className="flex min-w-0 items-center gap-4">

                    {/* NUMBER */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 font-bold text-blue-600">
                      {index + 1}
                    </div>

                    {/* NAME */}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-800">
                        {profile?.name || "-"}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="flex shrink-0 items-center gap-2">

                    {/* TOGGLE */}
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleStatus(profile)
                      }
                      disabled={
                        isUpdating ||
                        updatingStatus !== null
                      }
                      title={
                        isActive
                          ? "Deactivate Profile"
                          : "Activate Profile"
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                        isActive
                          ? "bg-green-500"
                          : "bg-slate-300"
                      } ${
                        isUpdating ||
                        updatingStatus !== null
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          isActive
                            ? "translate-x-5"
                            : "translate-x-0.5"
                        }`}
                      />
                    </button>

                    {/* STATUS */}
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
        )}
      </div>
    </div>
  );
}