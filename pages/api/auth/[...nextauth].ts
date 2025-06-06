import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import AppleProvider from 'next-auth/providers/apple'
import EmailProvider from 'next-auth/providers/email'
import { PrismaClient } from "@prisma/client"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import nodemailer from 'nodemailer'
// Import PrismaAdapter and prisma instance if you plan to use it
// import { PrismaAdapter } from "@next-auth/prisma-adapter"
// const prisma = new PrismaClient()

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier: email, url, provider }) {
        if (process.env.NODE_ENV !== 'production') {
          console.log(`\n📧 Magic Link for ${email}:\n${url}\n`);
          // In development, we log the link to the console.
          // NextAuth will handle the redirect to verifyRequest page automatically if this promise resolves.
          return;
        } else {
          // Production: Send email using a real SMTP server
          // This part requires EMAIL_SERVER_... and EMAIL_FROM to be set up.
          const { host, port, auth } = provider.server;
          const transport = nodemailer.createTransport({ host, port, auth });
          await transport.sendMail({
            to: email,
            from: provider.from,
            subject: `Sign in to YourApp`, // Customize your subject
            text: `Sign in to YourApp by clicking this link:\n${url}\n`,
            html: `<p>Sign in to YourApp by clicking this link: <a href="${url}">Sign In</a></p>`,
          });
        }
      },
    }),
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
    verifyRequest: '/auth/verify-request', // Recommended for EmailProvider
    // signOut: '/auth/signout', // (Optional) Path to a custom sign-out page
    // error: '/auth/error', // (Optional) Path to a custom error page
    // newUser: '/auth/new-user' // (Optional) New users will be directed here on first sign-in
  },
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        // @ts-ignore // User from adapter might not have plan/credits directly typed yet
        token.plan = user.plan;
        // @ts-ignore
        token.credits = user.credits;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.plan = token.plan || 'FREE'; // Default to FREE if not set
        session.user.credits = typeof token.credits === 'number' ? token.credits : 30; // Default credits
        // session.user.name and session.user.image should be populated by the adapter.
      }
      return session;
    },
  },
  secret: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET, // Fallback to NEXTAUTH_SECRET
}

export default NextAuth(authOptions) 