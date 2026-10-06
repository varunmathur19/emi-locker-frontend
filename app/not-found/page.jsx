"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  RiArrowLeftLine,
  RiHome4Line,
} from "react-icons/ri";

import { getCompanySetting } from "@/services/api";

export default function NotFoundPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkSuspendStatus = async () => {
      try {
        const response = await getCompanySetting();

        if (!isMounted) {
          return;
        }

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

        // Suspend OFF → user ko login page par bhejo
        if (!isSuspended) {
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

    checkSuspendStatus();

    const interval = setInterval(() => {
      checkSuspendStatus();
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-2xl text-center">

        {/* Not Found Image */}
        <div className="mb-6 flex justify-center">
          <img
            src="/not-found/not-found.svg"
            alt="Page Not Found"
            className="h-auto w-full max-w-[420px]"
          />
        </div>

        
      </div>
    </div>
  );
}