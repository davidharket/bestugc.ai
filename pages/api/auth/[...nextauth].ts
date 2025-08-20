// pages/api/auth/[...nextauth].ts

import NextAuth, { NextAuthOptions, User as NextAuthUser } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '../../../lib/prisma';
import { processAffiliateSignup } from '../../../lib/affiliate-utils';
import { 
  checkIPRateLimit, 
  incrementIPRateLimit, 
  checkEmailDomainRateLimit, 
  incrementEmailDomainRateLimit,
  getClientIP 
} from '../../../lib/rate-limit';
import { 
  logSecurityEvent, 
  generateDeviceFingerprint, 
  trackDeviceFingerprint,
  isDeviceSuspicious,
  handleFailedLogin,
  handleSuccessfulLogin,
  isAccountLocked
} from '../../../lib/security-utils';
import { verifyCaptcha } from '../../../lib/captcha-utils';
import { 
  validateAndLimitSessions, 
  logSessionActivity,
  detectSuspiciousSessionActivity
} from '../../../lib/session-utils';
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
        name: { label: 'Name', type: 'text' },
        captchaToken: { label: 'CAPTCHA Token', type: 'text' }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const ipAddress = getClientIP(req);
        const userAgent = req?.headers?.['user-agent'];
        const deviceFingerprint = generateDeviceFingerprint(req);

        // Check if account is locked
        if (await isAccountLocked(credentials.email)) {
          await logSecurityEvent({
            ipAddress,
            userAgent,
            action: 'LOGIN_BLOCKED_LOCKED_ACCOUNT',
            details: { email: credentials.email },
            severity: 'WARNING',
          });
          throw new Error('Account is temporarily locked due to multiple failed login attempts');
        }

        // Check IP rate limiting for login attempts
        const ipRateLimit = await checkIPRateLimit(ipAddress, 'login_attempts');
        if (!ipRateLimit.allowed) {
          await logSecurityEvent({
            ipAddress,
            userAgent,
            action: 'LOGIN_RATE_LIMITED',
            details: { email: credentials.email },
            severity: 'WARNING',
          });
          throw new Error('Too many login attempts from this IP address. Please try again later.');
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
            plan: true,
            isEmailVerified: true
          }
        });

        if (existingUser) {
          // Email verification check removed - allow login without verification

          // Sign in existing user
          const isValidPassword = await bcrypt.compare(credentials.password, existingUser.password || '');
          
          if (!isValidPassword) {
            // Increment IP rate limit for failed login
            await incrementIPRateLimit(ipAddress, 'login_attempts');
            
            // Handle failed login (increment counter, potentially lock account)
            const lockResult = await handleFailedLogin(credentials.email, ipAddress);
            
            await logSecurityEvent({
              userId: existingUser.id,
              ipAddress,
              userAgent,
              action: 'LOGIN_FAILED',
              details: { 
                email: credentials.email,
                attemptsRemaining: lockResult.attemptsRemaining,
                accountLocked: lockResult.accountLocked
              },
              severity: 'WARNING',
            });
            
            return null;
          }

          // Successful login
          await handleSuccessfulLogin(credentials.email);
          
          await logSecurityEvent({
            userId: existingUser.id,
            ipAddress,
            userAgent,
            action: 'LOGIN_SUCCESS',
            details: { email: credentials.email },
            severity: 'INFO',
          });

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

          // Verify CAPTCHA for signup (only if CAPTCHA is configured)
          const captchaEnabled = process.env.RECAPTCHA_SECRET_KEY;
          if (captchaEnabled) {
            if (!credentials.captchaToken || !(await verifyCaptcha(credentials.captchaToken))) {
              await logSecurityEvent({
                ipAddress,
                userAgent,
                action: 'SIGNUP_CAPTCHA_FAILED',
                details: { email: credentials.email },
                severity: 'WARNING',
              });
              throw new Error('CAPTCHA verification failed. Please try again.');
            }
          }

          // Check IP rate limiting for account creation
          const accountCreationLimit = await checkIPRateLimit(ipAddress, 'account_creation');
          if (!accountCreationLimit.allowed) {
            await logSecurityEvent({
              ipAddress,
              userAgent,
              action: 'SIGNUP_RATE_LIMITED',
              details: { email: credentials.email },
              severity: 'WARNING',
            });
            throw new Error('Too many accounts created from this IP address. Please try again later.');
          }

          // Check email domain rate limiting
          const emailDomain = credentials.email.split('@')[1];
          const emailDomainLimit = await checkEmailDomainRateLimit(emailDomain, 'email_signup');
          if (!emailDomainLimit.allowed) {
            await logSecurityEvent({
              ipAddress,
              userAgent,
              action: 'SIGNUP_EMAIL_DOMAIN_LIMITED',
              details: { email: credentials.email, domain: emailDomain },
              severity: 'WARNING',
            });
            throw new Error('Too many signups from this email domain. Please try again later.');
          }

          // Track device fingerprint (but don't block for now)
          await trackDeviceFingerprint(deviceFingerprint, ipAddress, userAgent);
          
          // Log if device appears suspicious but don't block signup
          if (await isDeviceSuspicious(deviceFingerprint)) {
            await logSecurityEvent({
              ipAddress,
              userAgent,
              action: 'SIGNUP_SUSPICIOUS_DEVICE_LOGGED',
              details: { 
                email: credentials.email, 
                deviceFingerprint: deviceFingerprint.substring(0, 16) + '...' 
              },
              severity: 'INFO', // Changed from WARNING to INFO
            });
            // Note: Not blocking signup for suspicious devices during testing
          }
          
          // Create user without email verification
          const hashedPassword = await bcrypt.hash(credentials.password, 12);
          const newUser = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
              name: credentials.name,
              credits: 30, // Initial credits
              plan: 'FREE',
              ipAddress,
              deviceFingerprint,
              isEmailVerified: true // Mark as verified to skip verification
            }
          });

          // Increment rate limits
          await incrementIPRateLimit(ipAddress, 'account_creation');
          await incrementEmailDomainRateLimit(emailDomain, 'email_signup');

          await logSecurityEvent({
            userId: newUser.id,
            ipAddress,
            userAgent,
            action: 'ACCOUNT_CREATED',
            details: { 
              email: credentials.email,
              deviceFingerprint: deviceFingerprint.substring(0, 16) + '...'
            },
            severity: 'INFO',
          });

          // Affiliate processing
          await processAffiliateSignup(newUser.id, ipAddress);
          
          // Return the new user object to authenticate them immediately
          return {
            id: newUser.id,
            email: newUser.email,
            name: newUser.name,
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
     * The signIn callback is called when a user signs in.
     * We use it to handle affiliate attribution for new users.
     */
    async signIn({ user, account, profile, email, credentials }) {
      // Only process for new user signups
      if (account?.provider === 'google' && user?.email) {
        // Check if this is a new user by looking for existing user
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email }
        });

        // If it's a new Google user, try to process affiliate signup
        if (!existingUser) {
          // We can't easily access cookies in the signIn callback,
          // so we'll handle this in a separate API endpoint after successful sign-in
          // For now, just allow the sign-in to proceed
        }
      }
      
      return true;
    },

    /**
     * The jwt callback is called whenever a JWT token is created/updated.
     * We use it to add custom properties to the JWT token.
     */
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.name = user.name; // Ensure name is included
        token.credits = user.credits;
        token.plan = user.plan;
      }

      // For OAuth users, we need to get the latest user data from database
      if (account?.provider === 'google') {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, name: true, credits: true, plan: true }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name; // Include name from database
          token.credits = dbUser.credits;
          token.plan = dbUser.plan;
        }
      }

      // For credentials users, ensure we have the latest data from database
      if (account?.provider === 'credentials' || (!account && token.email)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email! },
          select: { id: true, name: true, credits: true, plan: true }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.name = dbUser.name; // Ensure name is always fresh from database
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
        session.user.name = token.name as string; // Ensure name is included in session
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

