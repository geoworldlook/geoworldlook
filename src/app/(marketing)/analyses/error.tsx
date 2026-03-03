"use client"

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AnalysesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-white">Something went wrong!</h2>
      <p className="text-gray-400 max-w-md">
        Failed to load the spatial analyses. Please check your Supabase connection and try again.
      </p>
      <Button 
        onClick={() => reset()}
        className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
      >
        Try again
      </Button>
    </div>
  );
}
