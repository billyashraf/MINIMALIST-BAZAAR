import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    blocked?: boolean;
  }

  interface Session {
    user: {
      id: string;
      role: string;
      blocked: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    blocked?: boolean;
  }
}
