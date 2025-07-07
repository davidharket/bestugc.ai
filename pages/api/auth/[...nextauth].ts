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
  
  interface User extends NextAuthUser {
    plan?: string | null;
    credits?: number | null;
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
        // Add the standard user ID to the session
        session.user.id = user.id;

        // Fetch the user from our database to get the latest custom fields
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        
        if (dbUser) {
          session.user.plan = dbUser.plan;
          session.user.credits = dbUser.credits;
        }
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

