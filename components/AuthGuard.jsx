"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, getRoleId } from "@/utils/token";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();

      if (!token) {
        router.replace("/");
        return;
      }

      const roleId = Number(getRoleId());

      console.log("AUTH ROLE ID:", roleId);

      setChecking(false);
    };

    checkAuth();
  }, [router]);

  if (checking) {
    return null;
  }

  return children;
}