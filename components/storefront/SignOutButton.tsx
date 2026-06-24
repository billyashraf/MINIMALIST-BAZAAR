"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-sm text-gray-700 hover:text-gray-900 transition-colors px-3 py-1.5"
    >
      Sign out
    </button>
  );
}
