
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/utils/token";

export default function AuthGuard({ children }) {
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/");
    }
  }, [router]);

  return children;
}
