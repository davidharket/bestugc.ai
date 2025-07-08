// pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';

// Extend the built-in session and user types to include our custom fields
declare module 'next-auth' {
  interface Session {
    user?: {
      id?: string | null;
      plan?: string | null;
      credits?: number | null;
    } & NextAuthUser;
  }
  
}

export const authOptions: NextAuthOptions = {
  // Use Prisma as the database adapter for NextAuth
  adapter: PrismaAdapter(prisma),

  // Configure one or more authentication providers
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // You can add more providers here (e.g., GitHub, Apple, etc.)
  ],

  // Define custom pages for sign-in, errors, etc.
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request', 
    error: '/auth/error', // A page to handle sign-in errors
  },

  // Use a database session strategy for persistent logins
  session: {
    strategy: 'database',
  },

  // Callbacks are used to control what happens when an action is performed.
  callbacks: {
    /**
     * The session callback is called whenever a session is checked.
     * We use it here to add our custom properties (id, plan, credits) to the session object
     * so they are available on the client-side.
     */

    async session({ session, user }) {
      if (session.user) {
        // This is the correct way to merge the data
        session.user.id = user.id; // user.id comes from the database User model
        session.user.credits = user.credits;
        session.user.plan = user.plan;
      }
      return session;
    },
  },

  // A secret is required for session encryption and for production environments.
  // Falls back to the standard NEXTAUTH_SECRET if SESSION_SECRET is not set.
  secret: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET,
};

// Export the NextAuth handler with the configured options
export default NextAuth(authOptions);

