import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) ?? "customer";
        session.user.blocked = (token.blocked as boolean) ?? false;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user as { blocked?: boolean } | undefined;

      // Blocked users are treated as logged-out everywhere
      if (user?.blocked) {
        return Response.redirect(new URL("/login", nextUrl));
      }

      const isLoggedIn = !!auth?.user;
      const isProtected =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/seller");
      const isAuthPage =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");

      if (isProtected && !isLoggedIn) return false;
      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
  providers: [],
};
