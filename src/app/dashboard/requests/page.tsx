"use client";

import RequestsPageContent from "@/components/pages/dashboard/requests/RequestsPageContent";
import { Suspense } from "react";

export default function RequestsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RequestsPageContent />
    </Suspense>
  );
}