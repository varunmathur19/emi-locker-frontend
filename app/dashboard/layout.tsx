"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">

      <Sidebar sidebarOpen={sidebarOpen} />


      <div
        className={`
          flex-1
          min-w-0
          flex
          flex-col
          transition-all
          duration-300
         ${sidebarOpen ? "md:ml-68 ml-0" : "ml-16"}
        `}
      >

        <Navbar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />


        <main className="flex-1 min-w-0 overflow-y-auto p-5 pt-20">
          <AuthGuard>
          {children}
          </AuthGuard>
        </main>


      </div>


    </div>
  );
}