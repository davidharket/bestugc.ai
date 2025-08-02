// pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';
import bcrypt from 'bcryptjs';

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
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        name: { label: 'Name', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            credits: true,
            plan: true
          }
        });

        if (existingUser) {
          // Sign in existing user
          const isValidPassword = await bcrypt.compare(credentials.password, existingUser.password || '');
          if (!isValidPassword) {
            return null;
          }
          return {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
            credits: existingUser.credits,
            plan: existingUser.plan
          };
        } else {
          // Create new user (sign up)
          if (!credentials.name) {
            throw new Error('Name is required for registration');
          }
          
          const hashedPassword = await bcrypt.hash(credentials.password, 12);
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              name: credentials.name,
              credits: 30, // Initial credits
              plan: 'FREE'
            }
          });
          
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
            credits: newUser.credits,
            plan: newUser.plan
          };
        }
      }
    })
  ],

  // Define custom pages for sign-in, errors, etc.
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request', 
    error: '/auth/error', // A page to handle sign-in errors
  },

  // Use JWT session strategy to support both OAuth and credentials
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks are used to control what happens when an action is performed.
  callbacks: {
    /**
     * The jwt callback is called whenever a JWT token is created/updated.
     * We use it to add custom properties to the JWT token.
     */
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.credits = user.credits;
        token.plan = user.plan;
      }

      // For OAuth users, we need to get the latest user data from database
      if (account?.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, credits: true, plan: true }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.credits = dbUser.credits;
          token.plan = dbUser.plan;
        }
      }

      return token;
    },

    /**
     * The session callback is called whenever a session is checked.
     * We use it here to add our custom properties from the JWT token to the session object
     * so they are available on the client-side.
     */
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.credits = token.credits as number;
        session.user.plan = token.plan as string;
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

