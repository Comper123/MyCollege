"use client";

import RoomsPageContent from "@/components/pages/dashboard/rooms/RoomsPageContent";
import { Suspense } from "react";

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-16">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>}>
      <RoomsPageContent />
    </Suspense>
  );
}