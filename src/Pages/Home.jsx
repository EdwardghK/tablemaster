import React, { useEffect } from "react";
import { createPageUrl } from "@/utils";

export default function Home() {
  useEffect(() => {
    // Redirect to the Tables page on load
    window.location.href = createPageUrl("Tables");
  }, []);

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-amber-700 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-stone-600">Loading...</p>
      </div>
    </div>
  );
}