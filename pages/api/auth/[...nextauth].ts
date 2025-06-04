import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AppleProvider from 'next-auth/providers/apple'
import { PrismaClient } from "@prisma/client"
// Import PrismaAdapter and prisma instance if you plan to use it
// import { PrismaAdapter } from "@next-auth/prisma-adapter"
// const prisma = new PrismaClient()

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  // adapter: PrismaAdapter(prisma), // Uncomment if using Prisma for session/user management
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    }),
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID || '',
      clientSecret: process.env.APPLE_CLIENT_SECRET || '', // Note: Apple provider needs more config for clientSecret
    }),
  ],
  pages: {
    signIn: '/auth/signin', // Path to your custom sign-in page
    // signOut: '/auth/signout', // (Optional) Path to a custom sign-out page
    // error: '/auth/error', // (Optional) Path to a custom error page
    // verifyRequest: '/auth/verify-request', // (Optional) E.g. for email magic links
    // newUser: '/auth/new-user' // (Optional) New users will be directed here on first sign-in
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in
      if (account && user) {
        // Persist the user in your database or link account
        // This is a simplified example; you might need more robust logic here
        // especially for creating a user if they don't exist.
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!dbUser && user.email) { // If user doesn't exist, create them (basic example)
            // Ensure you have a way to create users if they sign in via OAuth for the first time
            // This might involve collecting more details or having default values.
            // For now, we are assuming the user is found or this part is handled elsewhere.
            console.warn(`User with email ${user.email} not found, JWT token might be incomplete regarding DB data.`)
        }

        if (dbUser) {
          token.id = dbUser.id;
          token.plan = dbUser.plan;
          token.credits = dbUser.credits;
        } else if (user.id) { // Fallback to provider ID if no DB user found/created
            token.id = user.id;
            // plan and credits will be undefined here, session callback will set defaults
        }
        return token;
      }

      // Subsequent calls, token exists, ensure data is fresh or present
      if (token.id && (typeof token.plan === 'undefined' || typeof token.credits === 'undefined')) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.plan = dbUser.plan;
          token.credits = dbUser.credits;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.plan = token.plan || 'FREE'; // Default to FREE if not set
        session.user.credits = typeof token.credits === 'number' ? token.credits : 30; // Default credits
      }
      return session;
    },
  },
  secret: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET, // Fallback to NEXTAUTH_SECRET
}

export default NextAuth(authOptions) 