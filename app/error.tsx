"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
          <p className="text-8xl font-bold text-gray-100 select-none mb-6">500</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 text-sm mb-8 max-w-xs">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
