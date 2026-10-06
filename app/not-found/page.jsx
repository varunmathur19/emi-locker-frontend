"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCompanySetting } from "@/services/api";

export default function NotFoundPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSuspendStatus = async () => {
      try {
        const response = await getCompanySetting();

        if (!isMounted) return;

        let settings = [];

        if (Array.isArray(response?.data)) {
          settings = response.data;
        } else if (Array.isArray(response?.data?.data)) {
          settings = response.data.data;
        } else if (response?.data) {
          settings = [response.data];
        }

        const suspendSetting = settings.find(
          (item) =>
            String(item?.key || "")
              .trim()
              .toLowerCase() === "suspend" &&
            Number(item?.role_id) === 0
        );

        const isSuspended =
          String(suspendSetting?.value) === "1";

        // -----------------------------------
        // Suspend OFF
        // Login page par redirect
        // -----------------------------------
        if (!isSuspended) {
          // Auth/session data remove
          localStorage.clear();

          router.replace("/");
        }
      } catch (error) {
        console.error(
          "Suspend status check error:",
          error
        );
      }
    };

    // Page open hote hi ek baar check
    checkSuspendStatus();

    // Har 10 seconds mein check
    const interval = setInterval(() => {
      checkSuspendStatus();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800">
          404
        </h1>

        <p className="mt-4 text-xl text-gray-600">
          Page Not Found
        </p>
      </div>
    </div>
  );
}