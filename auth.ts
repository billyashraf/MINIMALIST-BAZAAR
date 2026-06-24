import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcryptjs from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email }).select("+password");
        if (!user) return null;

        const valid = await bcryptjs.compare(parsed.data.password, user.password);
        if (!valid) return null;

        if (user.blocked) return null;

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          blocked: false,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      // On sign-in, seed the token from the freshly-authorized user
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.blocked = false;
        return token;
      }

      // On every subsequent auth() call, refresh role + blocked from DB
      // so that promote/demote/block changes take effect without re-login
      if (token.id) {
        await connectDB();
        const fresh = await User.findById(token.id).select("role blocked");
        if (fresh) {
          token.role = fresh.role;
          token.blocked = fresh.blocked;
        }
      }

      return token;
    },
  },
  session: { strategy: "jwt" },
});
